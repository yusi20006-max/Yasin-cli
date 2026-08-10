const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');

class LifecycleCommand extends Command {
  constructor(action, adapters) {
    super({
      name: action,
      description: `${action} Yasin ecosystem services`,
      args: [{ name: 'service', required: false, description: 'Service id or all' }],
      supportsJson: true
    });
    this.action = action;
    this.adapters = adapters || [];
  }

  execute(args, options = {}) {
    const target = args[0] || 'all';
    const adapter = target === 'all'
      ? null
      : this.adapters.find(item => item.serviceId === target);

    if (target !== 'all' && !adapter) {
      throw new Error(`Unknown ecosystem service: ${target}`);
    }

    const selected = adapter ? [adapter] : this.adapters;
    const services = selected.map(item => {
      const capabilities = typeof item.capabilities === 'function' ? item.capabilities() : {};
      if (!capabilities[this.action]) {
        return { id: item.serviceId, status: 'skipped', reason: `Unsupported action: ${this.action}` };
      }

      try {
        const value = typeof item[this.action] === 'function'
          ? item[this.action]()
          : undefined;
        return { id: item.serviceId, status: 'ok', ...(value && typeof value === 'object' ? value : {}) };
      } catch (error) {
        return { id: item.serviceId, status: 'error', error: { message: error.message } };
      }
    });

    const failed = services.some(item => item.status === 'error');
    const payload = { services };
    const result = failed
      ? AutomationResult.failure(4, `${this.action} failed for one or more services`, payload)
      : AutomationResult.success(payload);

    if (!options.json) {
      console.log(JSON.stringify(payload, null, 2));
    }

    return result;
  }
}

module.exports = LifecycleCommand;
