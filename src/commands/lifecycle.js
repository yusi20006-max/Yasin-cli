const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');

class LifecycleCommand extends Command {
  constructor(action, target) {
    super({
      name: action,
      description: `${action} Yasin ecosystem services`,
      args: [{ name: 'service', required: false, description: 'Service id or all' }],
      supportsJson: true
    });
    this.action = action;
    this.target = target;
  }

  execute(args, options = {}) {
    const service = args[0] || 'all';
    let result;

    if (this.target && typeof this.target.execute === 'function') {
      result = this.target.execute(this.action, service, [], options);
    } else if (this.target && typeof this.target[this.action] === 'function') {
      const data = this.target[this.action](service);
      result = AutomationResult.success(data);
    } else {
      throw new Error(`No service operation backend configured for ${this.action}`);
    }

    if (!result || typeof result !== 'object' || typeof result.ok !== 'boolean') {
      result = AutomationResult.success(result);
    }

    if (!options.json) {
      console.log(JSON.stringify(result.data, null, 2));
    }

    return result;
  }
}

module.exports = LifecycleCommand;
