const AutomationResult = require('../output/AutomationResult');

class ServiceStatusOperation {
  constructor(resolver) {
    if (!resolver || typeof resolver.resolve !== 'function') {
      throw new TypeError('ServiceStatusOperation requires a ServiceResolver');
    }
    this.resolver = resolver;
  }

  execute(service = 'all', args = [], options = {}) {
    const adapters = this.resolver.resolve(service);
    const results = adapters.map(adapter => {
      if (typeof adapter.status !== 'function') {
        return { service: adapter.serviceId, status: 'unsupported' };
      }
      try {
        return { service: adapter.serviceId, status: 'ok', data: adapter.status(args, options) };
      } catch (error) {
        return { service: adapter.serviceId, status: 'error', error: { message: error.message } };
      }
    });

    return AutomationResult.success({ operation: 'status', service, results });
  }
}

module.exports = ServiceStatusOperation;
