const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');

class HealthCommand extends Command {
  constructor(adapters) {
    super({
      name: 'health',
      description: 'Check health of Yasin ecosystem services',
      supportsJson: true
    });
    this.adapters = adapters;
  }

  execute(args, options = {}) {
    const services = this.adapters.map((adapter) => adapter.doctor());
    const healthy = services.every((result) => result.status === 'healthy');
    const result = AutomationResult.success({ healthy, services });

    if (!options.json) {
      console.log(JSON.stringify(result.data, null, 2));
    }

    return result;
  }
}

module.exports = HealthCommand;
