const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');

class HealthCommand extends Command {
  constructor(adaptersOrOperation) {
    super({
      name: 'health',
      description: 'Check health of Yasin ecosystem services',
      supportsJson: true
    });
    this.adaptersOrOperation = adaptersOrOperation;
  }

  execute(args, options = {}) {
    const operation = this.adaptersOrOperation && typeof this.adaptersOrOperation.execute === 'function'
      ? this.adaptersOrOperation
      : null;

    let result;
    if (operation) {
      result = operation.execute('health', args[0] || 'all', args.slice(1), options);
    } else {
      const adapters = Array.isArray(this.adaptersOrOperation) ? this.adaptersOrOperation : [];
      const services = adapters.map((adapter) => {
        try {
          const value = typeof adapter.health === 'function' ? adapter.health(args.slice(1), options) : adapter.doctor();
          return { service: adapter.serviceId, status: 'ok', data: value };
        } catch (error) {
          return { service: adapter.serviceId, status: 'error', error: { message: error.message } };
        }
      });
      const healthy = services.every((item) => item.status === 'ok');
      result = AutomationResult.success({ healthy, services });
    }

    return result;
  }
}

module.exports = HealthCommand;
