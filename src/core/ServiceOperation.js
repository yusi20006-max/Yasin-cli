const AutomationResult = require('../output/AutomationResult');

class ServiceOperation {
  constructor(resolver) {
    if (!resolver || typeof resolver.resolve !== 'function') {
      throw new TypeError('ServiceOperation requires a ServiceResolver');
    }
    this.resolver = resolver;
  }

  execute(operation, service = 'all', args = [], options = {}) {
    const adapters = this.resolver.resolve(service);
    const results = adapters.map(adapter => {
      if (typeof adapter[operation] !== 'function') {
        throw new Error(`Service "${adapter.serviceId}" does not support operation "${operation}"`);
      }
      return { service: adapter.serviceId, result: adapter[operation](args, options) };
    });

    return AutomationResult.success({ operation, service, results });
  }
}

module.exports = ServiceOperation;
