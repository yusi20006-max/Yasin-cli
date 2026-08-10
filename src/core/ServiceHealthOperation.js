const AutomationResult = require('../output/AutomationResult');
const ExitCodes = require('../output/ExitCodes');

class ServiceHealthOperation {
  constructor(resolver) {
    if (!resolver || typeof resolver.resolve !== 'function') {
      throw new TypeError('ServiceHealthOperation requires a ServiceResolver');
    }
    this.resolver = resolver;
  }

  execute(operation = 'health', service = 'all', args = [], options = {}) {
    if (!['health', 'doctor'].includes(operation)) {
      throw new Error(`Unsupported health operation: ${operation}`);
    }

    const adapters = this.resolver.resolve(service);
    const results = adapters.map(adapter => {
      const method = operation === 'doctor' && typeof adapter.doctor === 'function'
        ? adapter.doctor
        : adapter.health;
      if (typeof method !== 'function') {
        return { service: adapter.serviceId, status: 'unsupported' };
      }
      try {
        return { service: adapter.serviceId, status: 'ok', data: method.call(adapter, args, options) };
      } catch (error) {
        return { service: adapter.serviceId, status: 'error', error: { message: error.message } };
      }
    });

    const failed = results.some(item => item.status === 'error');
    return failed
      ? AutomationResult.failure(ExitCodes.GENERAL_ERROR, `${operation} failed for one or more services`, { operation, service, results })
      : AutomationResult.success({ operation, service, results });
  }
}

module.exports = ServiceHealthOperation;
