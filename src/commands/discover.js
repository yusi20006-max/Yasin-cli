const Command = require('../core/Command');

class DiscoverCommand extends Command {
  constructor(adapters) {
    super({ name: 'discover', description: 'Discover installed Yasin ecosystem services' });
    this.adapters = adapters;
  }

  execute() {
    const services = this.adapters.map((adapter) => adapter.detect());
    console.log(JSON.stringify({ services }, null, 2));
    return { services };
  }
}

module.exports = DiscoverCommand;
