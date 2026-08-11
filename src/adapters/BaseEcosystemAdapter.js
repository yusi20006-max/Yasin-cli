const child_process = require('child_process');

class BaseEcosystemAdapter {
  constructor(configManager, serviceManager, definition) {
    this.configManager = configManager;
    this.serviceManager = serviceManager;
    this.definition = definition;
    this.serviceId = definition.serviceId;
    this.configKey = definition.configKey;
    this.envPrefix = definition.envPrefix;
    this.serviceName = definition.serviceName;
    this.mode = definition.mode || 'daemon';
    this.defaultCommand = definition.defaultCommand || null;
    this.defaultArgs = definition.defaultArgs || [];
    this.defaultVersionCommand = definition.defaultVersionCommand || null;
    this.ensureRegistered();
  }

  getConfiguredService() {
    return this.configManager.get(`services.${this.serviceId}`) || {};
  }

  resolveDefinition() {
    const configured = this.getConfiguredService();
    const command = configured.command || process.env[`${this.envPrefix}_COMMAND`] || this.defaultCommand;
    const args = Array.isArray(configured.args) ? configured.args : [...this.defaultArgs];
    const versionArgs = Array.isArray(configured.versionArgs) ? configured.versionArgs : [...args, '--version'];
    const versionCommand = configured.versionCommand || this.defaultVersionCommand || command;
    const versionCommandArgs = Array.isArray(configured.versionCommandArgs)
      ? configured.versionCommandArgs
      : (versionCommand === command ? versionArgs : []);
    const env = configured.env && typeof configured.env === 'object' ? configured.env : {};
    const workingDirectory = configured.workingDirectory || process.env[`${this.envPrefix}_WORKDIR`];
    const mode = configured.mode || this.mode;
    return { command, args, versionArgs, versionCommand, versionCommandArgs, env, workingDirectory, mode };
  }

  getEffectiveMode() {
    return this.getConfiguredService().mode || this.mode;
  }

  ensureRegistered() {
    const definition = this.resolveDefinition();
    const services = this.configManager.get('services') || {};
    const existing = services[this.serviceId];
    if (existing && (existing.command || existing.versionCommand)) return;
    if (!definition.command && !definition.versionCommand) return;
    this.serviceManager.registerService(
      this.serviceId,
      this.serviceName,
      definition.command,
      definition.args,
      definition.env,
      definition.workingDirectory,
      definition.versionArgs,
      definition.mode,
      definition.versionCommand,
      definition.versionCommandArgs
    );
  }

  getService() {
    this.ensureRegistered();
    const services = this.configManager.get('services') || {};
    return services[this.serviceId] || null;
  }

  capabilities() {
    const mode = this.getEffectiveMode();
    return {
      start: mode === 'daemon',
      stop: mode === 'daemon',
      restart: mode === 'daemon',
      run: mode === 'oneshot',
      version: true,
      status: mode === 'daemon',
      doctor: true,
      health: true,
      config: true
    };
  }

  status() {
    const service = this.getService();
    if (!service) return { id: this.serviceId, name: this.serviceName, status: 'not-configured', pid: null, configured: false };
    if (service.mode !== 'daemon') {
      return { id: this.serviceId, name: this.serviceName, status: 'on-demand', pid: null, configured: true, mode: service.mode };
    }
    const found = this.serviceManager.listServices().find(item => item.id === this.serviceId);
    return found || { id: this.serviceId, name: this.serviceName, status: 'stopped', pid: null, configured: true };
  }

  detect() {
    const service = this.getService();
    return {
      id: this.serviceId,
      mode: service ? service.mode || this.mode : this.mode,
      configured: Boolean(service && (service.command || service.versionCommand)),
      command: service ? service.command || null : null,
      workingDirectory: service ? service.workingDirectory || null : null,
      versionCommand: service ? service.versionCommand || null : null
    };
  }

  isInstalled() {
    const service = this.getService();
    return Boolean(service && (service.command || service.versionCommand));
  }

  version() {
    const service = this.getService();
    if (!service || !service.versionCommand) return { version: null, status: 'not-configured' };
    try {
      const output = child_process.execFileSync(service.versionCommand, service.versionCommandArgs || [], {
        cwd: service.workingDirectory || undefined,
        env: { ...process.env, ...(service.env || {}) },
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim();
      return { version: output || null, status: output ? 'ok' : 'unknown' };
    } catch (error) {
      return { version: null, status: 'unknown', error: error.message };
    }
  }

  doctor() {
    const detection = this.detect();
    const status = this.status();
    const version = this.version();
    const mode = detection.mode;
    const checks = [
      { name: `${this.serviceName} configured`, status: detection.configured ? 'PASS' : 'FAIL' },
      { name: `${this.serviceName} mode`, status: detection.configured ? 'PASS' : 'WARN' },
      { name: `${this.serviceName} process state`, status: mode !== 'daemon' ? 'PASS' : status.status === 'running' ? 'PASS' : status.status === 'stopped' ? 'WARN' : 'FAIL' },
      { name: `${this.serviceName} version`, status: version.status === 'ok' ? 'PASS' : 'WARN' }
    ];
    const failed = checks.some(check => check.status === 'FAIL');
    const warned = checks.some(check => check.status === 'WARN');
    return { status: failed ? 'unhealthy' : warned ? 'degraded' : 'healthy', checks, detection, version, capabilities: this.capabilities() };
  }

  health() {
    const diagnosis = this.doctor();
    return {
      status: diagnosis.status === 'healthy' ? 'healthy' : diagnosis.status === 'degraded' ? 'degraded' : 'unhealthy',
      service: this.serviceId,
      checks: diagnosis.checks,
      detection: diagnosis.detection,
      version: diagnosis.version,
      capabilities: diagnosis.capabilities
    };
  }

  start() {
    this.ensureRegistered();
    if (this.getEffectiveMode() !== 'daemon') throw new Error(`${this.serviceName} is ${this.getEffectiveMode()}-only; use its run operation instead of start/stop.`);
    return this.serviceManager.startService(this.serviceId);
  }

  stop() {
    if (this.getEffectiveMode() !== 'daemon') throw new Error(`${this.serviceName} is ${this.getEffectiveMode()}-only and has no managed background process.`);
    return this.serviceManager.stopService(this.serviceId);
  }

  restart() {
    if (this.getEffectiveMode() !== 'daemon') throw new Error(`${this.serviceName} is ${this.getEffectiveMode()}-only and cannot be restarted as a daemon.`);
    this.stop();
    return this.start();
  }

  run() {
    const service = this.getService();
    if (!service || !service.command) throw new Error(`${this.serviceName} has no executable command configured.`);
    if (this.getEffectiveMode() !== 'oneshot') throw new Error(`${this.serviceName} is not an on-demand service.`);
    return child_process.spawnSync(service.command, [...(service.args || [])], {
      cwd: service.workingDirectory || undefined,
      env: { ...process.env, ...(service.env || {}) },
      encoding: 'utf8',
      shell: false
    });
  }

  config(action, key, value) {
    const prefix = this.configKey;
    if (action === 'get') return this.configManager.get(`${prefix}.${key}`);
    if (action === 'set') {
      this.configManager.set(`${prefix}.${key}`, value);
      return value;
    }
    if (action === 'delete') {
      this.configManager.delete(`${prefix}.${key}`);
      return true;
    }
    if (action === 'list') return this.configManager.get(prefix) || {};
    throw new Error(`Unsupported config action: ${action}`);
  }
}

module.exports = BaseEcosystemAdapter;
