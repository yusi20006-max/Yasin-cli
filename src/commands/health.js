const Command = require('../core/Command');

class HealthCommand extends Command {
  constructor(adapters) {
    super({ name: 'health', description: 'Check health of Yasin ecosystem services' });
    this.adapters = adapters;
  }

  execute() {
    const services = this.adapters.map((adapter) => adapter.doctor());
    const healthy = services.every((result) => result.status === 'healthy');
    console.log(JSON.stringify({ healthy, services }, null, 2));
    return { healthy, services };
  }
}

module.exports = HealthCommand;
