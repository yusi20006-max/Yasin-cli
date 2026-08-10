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
      const method = operation === 'doctor'
        ? (typeof adapter.doctor === 'function' ? adapter.doctor : adapter.health)
        : (typeof adapter.health === 'function' ? adapter.health : adapter.doctor);
      if (typeof method !== 'function') {
        return { service: adapter.serviceId, status: 'unsupported' };
      }
      try {
        const data = method.call(adapter, args, options);
        const explicitUnhealthy = data && (
          data.healthy === false
          || data.status === 'unhealthy'
          || data.status === 'error'
          || data.status === 'down'
        );
        return {
          service: adapter.serviceId,
          status: explicitUnhealthy ? 'error' : 'ok',
          data
        };
      } catch (error) {
        return { service: adapter.serviceId, status: 'error', error: { message: error.message } };
      }
    });

    const healthy = results.every(item => item.status === 'ok');
    const data = { operation, service, healthy, results };

    return healthy
      ? AutomationResult.success(data)
      : AutomationResult.failure(ExitCodes.GENERAL_ERROR, `${operation} failed for one or more services`, data);
  }
}

module.exports = ServiceHealthOperation;
