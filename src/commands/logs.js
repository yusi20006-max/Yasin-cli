const { getServiceManager } = require('../services');

module.exports = {
  name: 'logs',
  description: 'Show logs for a managed Yasin service',
  async execute(args = []) {
    const serviceId = args[0];
    if (!serviceId) {
      throw new Error('Usage: yasin logs <service>');
    }

    const manager = getServiceManager();
    if (typeof manager.logs !== 'function') {
      throw new Error('ServiceManager does not expose logs()');
    }

    return manager.logs(serviceId);
  }
};
