const Command = require('../core/Command');

class HealthCommand extends Command {
  constructor(adapters, hubGateway = null) {
    super({ name: 'health', description: 'Check health of Yasin ecosystem services' });
    this.adapters = adapters;
    this.hubGateway = hubGateway;
  }

  execute() {
    const services = this.adapters.map((adapter) => adapter.doctor());
    if (!this.hubGateway) {
      const healthy = services.every((result) => result.status === 'healthy');
      console.log(JSON.stringify({ healthy, services }, null, 2));
      return { healthy, services };
    }
    return this.hubGateway.hubHealth().then((hub) => {
      const hubEntry = hub.reachable
        ? { id: 'yasinhub', status: 'healthy', hub: hub.status }
        : { id: 'yasinhub', status: 'unhealthy', error: hub.error };
      const merged = [...services, hubEntry];
      const healthy = merged.every((result) => result.status === 'healthy');
      console.log(JSON.stringify({ healthy, services: merged }, null, 2));
      return { healthy, services: merged };
    });
  }
}

module.exports = HealthCommand;
