const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

class ServiceManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.statePath = path.join(this.configManager.configDir, 'services-state.json');
    this.logDir = path.join(this.configManager.configDir, 'logs');

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.states = this.loadStates();
  }

  loadStates() {
    if (!fs.existsSync(this.statePath)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(this.statePath, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  saveStates() {
    try {
      const dir = path.dirname(this.statePath);
      if (fs.existsSync(dir)) {
        fs.writeFileSync(this.statePath, JSON.stringify(this.states, null, 2), 'utf8');
      }
    } catch (e) {
      // ignore state path saving error if folder was deleted during teardown
    }
  }

  isProcessRunning(pid) {
    if (!pid) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch (e) {
      return false;
    }
  }

  registerService(id, name, command, args = [], env = {}) {
    const services = this.configManager.get('services') || {};
    services[id] = { id, name, command, args, env };
    this.configManager.set('services', services);
  }

  unregisterService(id) {
    const services = this.configManager.get('services') || {};
    if (services[id]) {
      this.stopService(id);
      delete services[id];
      this.configManager.set('services', services);
      if (this.states[id]) {
        delete this.states[id];
        this.saveStates();
      }
      return true;
    }
    return false;
  }

  startService(id) {
    const services = this.configManager.get('services') || {};
    const service = services[id];
    if (!service) {
      throw new Error(`Service "${id}" is not registered.`);
    }

    const state = this.states[id] || {};
    if (state.pid && this.isProcessRunning(state.pid)) {
      throw new Error(`Service "${id}" is already running with PID ${state.pid}.`);
    }

    const logFile = path.join(this.logDir, `${id}.log`);
    const out = fs.openSync(logFile, 'a');

    let cmd = service.command;
    let cmdArgs = [...(service.args || [])];
    const isWin = process.platform === 'win32';

    let child;
    try {
      child = child_process.spawn(cmd, cmdArgs, {
        detached: true,
        stdio: ['ignore', out, out],
        env: { ...process.env, ...(service.env || {}) },
        shell: isWin
      });
    } catch (spawnError) {
      fs.writeSync(out, `Spawn Exception: ${spawnError.message}\n`);
      fs.closeSync(out);
      this.states[id] = {
        pid: null,
        status: 'stopped',
        endTime: Date.now()
      };
      this.saveStates();
      throw new Error(`Failed to spawn service "${id}": ${spawnError.message}`);
    }

    // Attach listener for asynchronous errors (e.g., command not found ENOENT)
    child.on('error', (err) => {
      try {
        const errorLog = `Asynchronous execution error: ${err.message}\n`;
        fs.appendFileSync(logFile, errorLog, 'utf8');
      } catch (logErr) {}

      // Clean up internal states when child fails to start or crashes immediately
      this.states[id] = {
        pid: null,
        status: 'stopped',
        endTime: Date.now()
      };
      this.saveStates();
    });

    const pid = child.pid;
    if (pid) {
      child.unref();
      this.states[id] = {
        pid,
        status: 'running',
        startTime: Date.now()
      };
      this.saveStates();
      return { id, pid, status: 'running' };
    } else {
      this.states[id] = {
        pid: null,
        status: 'stopped',
        endTime: Date.now()
      };
      this.saveStates();
      throw new Error(`Failed to retrieve PID for spawned service "${id}".`);
    }
  }

  stopService(id) {
    const state = this.states[id];
    if (!state || !state.pid) {
      this.states[id] = { status: 'stopped', pid: null };
      this.saveStates();
      return false;
    }

    const pid = state.pid;
    let killed = false;

    if (this.isProcessRunning(pid)) {
      if (process.platform === 'win32') {
        try {
          child_process.execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
          killed = true;
        } catch (e) {
          try {
            process.kill(pid, 'SIGKILL');
            killed = true;
          } catch (err) {}
        }
      } else {
        try {
          process.kill(pid, 'SIGTERM');
          killed = true;
        } catch (e) {
          try {
            process.kill(pid, 'SIGKILL');
            killed = true;
          } catch (err) {}
        }
      }
    } else {
      killed = true;
    }

    this.states[id] = {
      pid: null,
      status: 'stopped',
      endTime: Date.now()
    };
    this.saveStates();

    return killed;
  }

  listServices() {
    const services = this.configManager.get('services') || {};
    const list = [];

    Object.keys(services).forEach(id => {
      const service = services[id];
      const state = this.states[id] || { status: 'stopped', pid: null };

      let currentStatus = state.status || 'stopped';
      let currentPid = state.pid || null;

      if (currentPid && !this.isProcessRunning(currentPid)) {
        currentStatus = 'stopped';
        currentPid = null;
        this.states[id] = { ...state, status: 'stopped', pid: null };
      }

      list.push({
        id,
        name: service.name,
        command: service.command,
        args: service.args,
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
    if (!fs.existsSync(logFile)) {
      return `No logs found for service "${id}".`;
    }

    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n');
      if (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
      // Return last linesCount lines
      return lines.slice(-linesCount).join('\n');
    } catch (e) {
      return `Error reading logs: ${e.message}`;
    }
  }
}

module.exports = ServiceManager;
