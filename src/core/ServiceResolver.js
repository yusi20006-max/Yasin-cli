class ServiceResolver {
  constructor(adapters = []) {
    this.adapters = new Map();
    adapters.forEach(adapter => this.register(adapter));
  }

  register(adapter) {
    if (!adapter || !adapter.serviceId) throw new TypeError('ServiceResolver requires adapters with serviceId');
    this.adapters.set(adapter.serviceId, adapter);
    return adapter;
  }

  has(serviceId) { return this.adapters.has(serviceId); }

  resolve(serviceId = 'all') {
    if (serviceId === 'all') return [...this.adapters.values()];
    const adapter = this.adapters.get(serviceId);
    if (!adapter) throw new Error(`Unknown service: ${serviceId}`);
    return [adapter];
  }

  ids() { return [...this.adapters.keys()]; }
}

module.exports = ServiceResolver;
