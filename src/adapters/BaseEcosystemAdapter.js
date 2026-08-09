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
    this.ensureRegistered();
  }

  getConfiguredService() {
    return this.configManager.get(`services.${this.serviceId}`) || {};
  }

  resolveDefinition() {
    const configured = this.getConfiguredService();
    const command = configured.command || process.env[`${this.envPrefix}_COMMAND`];
    const args = Array.isArray(configured.args) ? configured.args : [];
    const versionArgs = Array.isArray(configured.versionArgs) ? configured.versionArgs : [...args, '--version'];
    const env = configured.env && typeof configured.env === 'object' ? configured.env : {};
    const workingDirectory = configured.workingDirectory || process.env[`${this.envPrefix}_WORKDIR`];
    return { command, args, versionArgs, env, workingDirectory };
  }

  ensureRegistered() {
    const definition = this.resolveDefinition();
    const services = this.configManager.get('services') || {};
    const existing = services[this.serviceId];
    if (existing && existing.command) return;
    if (!definition.command) return;
    this.serviceManager.registerService(this.serviceId, this.serviceName, definition.command, definition.args, definition.env, definition.workingDirectory, definition.versionArgs);
  }

  getService() {
    this.ensureRegistered();
    const services = this.configManager.get('services') || {};
    return services[this.serviceId] || null;
  }

  status() {
    const service = this.getService();
    if (!service) return { id: this.serviceId, name: this.serviceName, status: 'not-found', pid: null, configured: false };
    const found = this.serviceManager.listServices().find(item => item.id === this.serviceId);
    return found || { id: this.serviceId, name: this.serviceName, status: 'stopped', pid: null, configured: true };
  }

  detect() {
    const service = this.getService();
    return {
      id: this.serviceId,
      configured: Boolean(service && service.command),
      command: service ? service.command : null,
      workingDirectory: service ? service.workingDirectory || null : null
    };
  }

  isInstalled() {
    return Boolean(this.getService());
  }

  version() {
    const service = this.getService();
    if (!service || !service.command) return { version: null, status: 'not-found' };
    try {
      const versionArgs = Array.isArray(service.versionArgs) ? service.versionArgs : [...(service.args || []), '--version'];
      const output = child_process.execFileSync(service.command, versionArgs, {
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
    const checks = [
      { name: `${this.serviceName} configured`, status: detection.configured ? 'PASS' : 'FAIL' },
      { name: `${this.serviceName} process state`, status: status.status === 'running' ? 'PASS' : status.status === 'stopped' ? 'WARN' : 'FAIL' },
      { name: `${this.serviceName} version`, status: version.status === 'ok' ? 'PASS' : 'WARN' }
    ];
    const failed = checks.some(check => check.status === 'FAIL');
    const warned = checks.some(check => check.status === 'WARN');
    return { status: failed ? 'unhealthy' : warned ? 'degraded' : 'healthy', checks, detection, version };
  }

  start() {
    this.ensureRegistered();
    return this.serviceManager.startService(this.serviceId);
  }

  stop() {
    return this.serviceManager.stopService(this.serviceId);
  }

  restart() {
    this.stop();
    return this.start();
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
