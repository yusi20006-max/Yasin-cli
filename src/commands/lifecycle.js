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

    // Canonical path: ServiceOperation / another unified operation backend.
    if (this.target && !Array.isArray(this.target) && typeof this.target.execute === 'function') {
      result = this.target.execute(this.action, service, args.slice(1), options);
    } else if (this.target && !Array.isArray(this.target) && typeof this.target[this.action] === 'function') {
      result = AutomationResult.success(this.target[this.action](service));
    } else if (Array.isArray(this.target)) {
      // Backward-compatible adapter path retained for callers/tests that inject
      // adapters directly. The canonical bootstrap no longer uses this path.
      const adapters = service === 'all'
        ? this.target
        : this.target.filter(adapter => adapter.serviceId === service);

      if (service !== 'all' && adapters.length === 0) {
        throw new Error(`Unknown ecosystem service: ${service}`);
      }

      const services = adapters.map(adapter => {
        const capabilities = typeof adapter.capabilities === 'function' ? adapter.capabilities() : {};
        if (capabilities[this.action] === false || typeof adapter[this.action] !== 'function') {
          return { service: adapter.serviceId, status: 'skipped' };
        }
        try {
          const data = adapter[this.action](args.slice(1), options);
          return { service: adapter.serviceId, status: 'ok', ...(data && typeof data === 'object' ? data : { data }) };
        } catch (error) {
          return { service: adapter.serviceId, status: 'error', error: { message: error.message } };
        }
      });
      result = AutomationResult.success({ services });
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
