const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');

class DiscoverCommand extends Command {
  constructor(adapters) {
    super({
      name: 'discover',
      description: 'Discover installed Yasin ecosystem services',
      supportsJson: true
    });
    this.adapters = adapters;
  }

  execute(args, options = {}) {
    const services = this.adapters.map((adapter) => adapter.detect());
    const result = AutomationResult.success({ services });

    if (!options.json) {
      console.log(JSON.stringify(result.data, null, 2));
    }

    return result;
  }
}

module.exports = DiscoverCommand;
