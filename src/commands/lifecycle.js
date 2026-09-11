const Command = require('../core/Command');

class LifecycleCommand extends Command {
  constructor(action, orchestrator, hubGateway = null) {
    super({
      name: action,
      description: `${action} Yasin ecosystem services`,
      args: [{ name: 'service', required: false, description: 'Service id or all' }]
    });
    this.action = action;
    this.orchestrator = orchestrator;
    this.hubGateway = hubGateway;
  }

  execute(args) {
    const target = args[0] || 'all';
    // Hub-managed services are owned by YasinHub (sole Control Plane):
    // route them to the Hub API instead of local process management.
    // The CLI never spawns, signals, or kills these services itself.
    if (this.hubGateway && target !== 'all' && this.hubGateway.isHubManaged(target)) {
      return this.hubGateway[this.action](target).then((result) => {
        console.log(JSON.stringify(result, null, 2));
        if (!result.ok) process.exitCode = result.exitCode;
        return result;
      });
    }
    const result = this.orchestrator[this.action](target);
    console.log(JSON.stringify(result, null, 2));
    return result;
  }
}

module.exports = LifecycleCommand;
