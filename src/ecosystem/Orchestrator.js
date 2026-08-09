class EcosystemOrchestrator {
  constructor(adapters, dependencies = {}) {
    this.adapters = adapters;
    this.dependencies = dependencies;
  }

  getAdapter(id) {
    return this.adapters.find((adapter) => adapter.serviceId === id || adapter.serviceId.replace('yasin-', '') === id) || null;
  }

  resolveOrder(targets) {
    const requested = new Set(targets);
    const visiting = new Set();
    const visited = new Set();
    const order = [];

    const visit = (id) => {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error(`Dependency cycle detected at "${id}".`);
      visiting.add(id);
      for (const dependency of this.dependencies[id] || []) visit(dependency);
      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    requested.forEach(visit);
    return order;
  }

  start(target = 'all') {
    const targets = target === 'all' ? this.adapters.map((a) => a.serviceId) : [this.normalizeId(target)];
    const order = this.resolveOrder(targets);
    const results = [];

    for (const id of order) {
      const adapter = this.getAdapter(id);
      if (!adapter) throw new Error(`Unknown ecosystem service "${id}".`);
      if (!adapter.capabilities().start) {
        results.push({ id: adapter.serviceId, status: 'skipped', reason: 'start is not supported' });
        continue;
      }
      results.push({ id: adapter.serviceId, status: 'ok', result: adapter.start() });
    }
    return { action: 'start', order, services: results };
  }

  stop(target = 'all') {
    const targets = target === 'all' ? this.adapters.map((a) => a.serviceId) : [this.normalizeId(target)];
    const order = this.resolveOrder(targets).reverse();
    const results = [];

    for (const id of order) {
      const adapter = this.getAdapter(id);
      if (!adapter) throw new Error(`Unknown ecosystem service "${id}".`);
      if (!adapter.capabilities().stop) {
        results.push({ id: adapter.serviceId, status: 'skipped', reason: 'stop is not supported' });
        continue;
      }
      results.push({ id: adapter.serviceId, status: 'ok', result: adapter.stop() });
    }
    return { action: 'stop', order, services: results };
  }

  restart(target = 'all') {
    this.stop(target);
    return this.start(target);
  }

  normalizeId(id) {
    return id.startsWith('yasin-') ? id : `yasin-${id}`;
  }
}

module.exports = EcosystemOrchestrator;
