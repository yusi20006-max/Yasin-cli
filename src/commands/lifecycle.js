const Command = require('../core/Command');

class LifecycleCommand extends Command {
  constructor(action, adapters) {
    super({
      name: action,
      description: `${action} Yasin ecosystem services`,
      args: [{ name: 'service', required: false, description: 'Service id or all' }]
    });
    this.action = action;
    this.adapters = adapters;
  }

  execute(args) {
    const target = args[0] || 'all';
    const selected = target === 'all'
      ? this.adapters
      : this.adapters.filter((adapter) => adapter.serviceId === target || adapter.serviceId.replace('yasin-', '') === target);

    if (selected.length === 0) throw new Error(`Unknown ecosystem service "${target}".`);

    const results = [];
    for (const adapter of selected) {
      const capabilities = adapter.capabilities();
      if (!capabilities[this.action]) {
        results.push({ id: adapter.serviceId, status: 'skipped', reason: `${this.action} is not supported` });
        continue;
      }
      const result = adapter[this.action]();
      results.push({ id: adapter.serviceId, status: 'ok', result });
    }

    console.log(JSON.stringify({ action: this.action, services: results }, null, 2));
    return { action: this.action, services: results };
  }
}

module.exports = LifecycleCommand;
