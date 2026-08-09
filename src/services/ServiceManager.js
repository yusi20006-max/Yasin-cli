const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

class ServiceManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.statePath = path.join(this.configManager.configDir, 'services-state.json');
    this.logDir = path.join(this.configManager.configDir, 'logs');
    if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
    this.states = this.loadStates();
  }

  loadStates() {
    if (!fs.existsSync(this.statePath)) return {};
    try { return JSON.parse(fs.readFileSync(this.statePath, 'utf8')); } catch (e) { return {}; }
  }

  saveStates() {
    try {
      const dir = path.dirname(this.statePath);
      if (fs.existsSync(dir)) fs.writeFileSync(this.statePath, JSON.stringify(this.states, null, 2), 'utf8');
    } catch (e) {}
  }

  isProcessRunning(pid) {
    if (!pid) return false;
    try { process.kill(pid, 0); return true; } catch (e) { return false; }
  }

  getProcessIdentity(pid) {
    if (!pid) return null;
    try {
      if (process.platform === 'linux') return { executable: fs.readlinkSync(`/proc/${pid}/exe`) };
      if (process.platform === 'darwin') {
        const executable = child_process.execFileSync('ps', ['-p', String(pid), '-o', 'comm='], { encoding: 'utf8', timeout: 3000 }).trim();
        return { executable: executable || null };
      }
      if (process.platform === 'win32') {
        const output = child_process.execFileSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', timeout: 3000, windowsHide: true }).trim();
        if (!output || output.startsWith('INFO:')) return null;
        const match = output.match(/^"([^"]+)"/);
        return { executable: match ? match[1] : null };
      }
    } catch (e) { return null; }
    return null;
  }

  isProcessOwned(state, service) {
    if (!state || !state.pid || !service || !this.isProcessRunning(state.pid)) return false;
    const identity = this.getProcessIdentity(state.pid);
    if (!identity || !identity.executable || !service.command) return true;
    const expected = path.basename(service.command).toLowerCase();
    const actual = path.basename(identity.executable).toLowerCase();
    return actual === expected || actual === `${expected}.exe`;
  }

  registerService(id, name, command, args = [], env = {}, workingDirectory = null, versionArgs = null) {
    const services = this.configManager.get('services') || {};
    services[id] = {
      id,
      name,
      command,
      args,
      env,
      ...(workingDirectory ? { workingDirectory } : {}),
      ...(Array.isArray(versionArgs) ? { versionArgs } : {})
    };
    this.configManager.set('services', services);
  }

  unregisterService(id) {
    const services = this.configManager.get('services') || {};
    if (!services[id]) return false;
    this.stopService(id);
    delete services[id];
    this.configManager.set('services', services);
    delete this.states[id];
    this.saveStates();
    return true;
  }

  startService(id) {
    const services = this.configManager.get('services') || {};
    const service = services[id];
    if (!service || !service.command) throw new Error(`Service "${id}" is not configured with an executable command.`);

    const state = this.states[id] || {};
    if (state.pid && this.isProcessOwned(state, service)) throw new Error(`Service "${id}" is already running with PID ${state.pid}.`);

    const logFile = path.join(this.logDir, `${id}.log`);
    const out = fs.openSync(logFile, 'a');
    let child;
    try {
      child = child_process.spawn(service.command, [...(service.args || [])], {
        detached: true,
        stdio: ['ignore', out, out],
        env: { ...process.env, ...(service.env || {}) },
        cwd: service.workingDirectory || undefined,
        shell: false,
        windowsHide: true
      });
    } catch (spawnError) {
      fs.closeSync(out);
      this.states[id] = { pid: null, status: 'failed', endTime: Date.now(), error: spawnError.message };
      this.saveStates();
      throw new Error(`Failed to spawn service "${id}": ${spawnError.message}`);
    }

    const pid = child.pid;
    if (!pid) {
      fs.closeSync(out);
      this.states[id] = { pid: null, status: 'failed', endTime: Date.now() };
      this.saveStates();
      throw new Error(`Failed to retrieve PID for spawned service "${id}".`);
    }

    this.states[id] = {
      pid,
      status: 'running',
      startTime: Date.now(),
      command: service.command,
      args: [...(service.args || [])],
      workingDirectory: service.workingDirectory || null
    };
    this.saveStates();

    const markStopped = (status = 'stopped', error = null) => {
      const current = this.states[id];
      if (!current || current.pid !== pid) return;
      this.states[id] = { ...current, pid: null, status, endTime: Date.now(), ...(error ? { error } : {}) };
      this.saveStates();
    };

    child.on('error', err => {
      try { fs.appendFileSync(logFile, `Execution error: ${err.message}\n`, 'utf8'); } catch (e) {}
      markStopped('failed', err.message);
    });
    child.on('exit', code => markStopped(code === 0 ? 'stopped' : 'failed', code === 0 ? null : `Process exited with code ${code}`));
    child.unref();
    return { id, pid, status: 'running' };
  }

  stopService(id) {
    const services = this.configManager.get('services') || {};
    const service = services[id];
    const state = this.states[id];
    if (!state || !state.pid) {
      this.states[id] = { status: 'stopped', pid: null };
      this.saveStates();
      return false;
    }
    if (!this.isProcessOwned(state, service)) {
      this.states[id] = { ...state, pid: null, status: 'unknown', endTime: Date.now() };
      this.saveStates();
      return false;
    }

    let terminated = false;
    try {
      if (process.platform === 'win32') {
        child_process.execFileSync('taskkill', ['/pid', String(state.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      } else {
        process.kill(state.pid, 'SIGTERM');
      }
      terminated = true;
    } catch (e) {
      try { process.kill(state.pid, 'SIGKILL'); terminated = true; } catch (err) { terminated = false; }
    }

    this.states[id] = { pid: null, status: terminated ? 'stopped' : 'failed', endTime: Date.now() };
    this.saveStates();
    return terminated;
  }

  listServices() {
    const services = this.configManager.get('services') || {};
    const list = [];
    Object.keys(services).forEach(id => {
      const service = services[id];
      const state = this.states[id] || { status: 'stopped', pid: null };
      let currentStatus = state.status || 'stopped';
      let currentPid = state.pid || null;
      if (currentPid && !this.isProcessOwned(state, service)) {
        currentStatus = this.isProcessRunning(currentPid) ? 'unknown' : 'stopped';
        currentPid = null;
        this.states[id] = { ...state, status: currentStatus, pid: null };
      }
      list.push({
        id,
        name: service.name,
        command: service.command,
        args: service.args,
        workingDirectory: service.workingDirectory || null,
        status: currentStatus,
        pid: currentPid,
        startTime: state.startTime || null
      });
    });
    this.saveStates();
    return list;
  }

  getServiceLogs(id, linesCount = 50) {
    const logFile = path.join(this.logDir, `${id}.log`);
    if (!fs.existsSync(logFile)) return `No logs found for service "${id}".`;
    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n');
      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
      return lines.slice(-linesCount).join('\n');
    } catch (e) { return `Error reading logs: ${e.message}`; }
  }
}

module.exports = ServiceManager;
