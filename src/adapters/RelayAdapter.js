class RelayAdapter {
  constructor(configManager, serviceManager) {
    this.configManager = configManager;
    this.serviceManager = serviceManager;
    this.serviceId = 'yasin-relay';
    this.ensureRegistered();
  }

  ensureRegistered() {
    const services = this.configManager.get('services') || {};
    if (!services[this.serviceId]) {
      this.serviceManager.registerService(
        this.serviceId,
        'YasinRelay Service',
        'node',
        ['-e', 'setInterval(() => console.log("YasinRelay running..."), 5000);']
      );
    }
  }

  status() {
    const services = this.serviceManager.listServices();
    const service = services.find(s => s.id === this.serviceId);
    return service || { id: this.serviceId, status: 'stopped', pid: null };
  }

  doctor() {
    const status = this.status();
    const checks = [
      { name: 'Relay Service Registered', status: 'PASS' },
      { name: 'Relay Service State', status: status.status === 'running' ? 'PASS' : 'WARN' }
    ];
    return {
      status: status.status === 'running' ? 'healthy' : 'degraded',
      checks
    };
  }

  start() {
    return this.serviceManager.startService(this.serviceId);
  }

  stop() {
    return this.serviceManager.stopService(this.serviceId);
  }

  restart() {
    try {
      this.stop();
    } catch (e) {
      // ignore
    }
    return this.start();
  }

  version() {
    return '1.0.0-mock-relay';
  }

  config(action, key, value) {
    const prefix = 'relay';
    if (action === 'get') {
      return this.configManager.get(`${prefix}.${key}`);
    } else if (action === 'set') {
      this.configManager.set(`${prefix}.${key}`, value);
      return value;
    } else if (action === 'delete') {
      this.configManager.delete(`${prefix}.${key}`);
      return true;
    } else if (action === 'list') {
      return this.configManager.get(prefix) || {};
    }
  }
}

module.exports = RelayAdapter;
