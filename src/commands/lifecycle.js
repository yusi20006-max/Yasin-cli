const Command = require('../core/Command');

class LifecycleCommand extends Command {
  constructor(action, orchestrator) {
    super({
      name: action,
      description: `${action} Yasin ecosystem services`,
      args: [{ name: 'service', required: false, description: 'Service id or all' }]
    });
    this.action = action;
    this.orchestrator = orchestrator;
  }

  execute(args) {
    const target = args[0] || 'all';
    const result = this.orchestrator[this.action](target);
    console.log(JSON.stringify(result, null, 2));
    return result;
  }
}

module.exports = LifecycleCommand;
