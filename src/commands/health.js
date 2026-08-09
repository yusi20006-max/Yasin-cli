const { getEcosystemAdapters } = require('../ecosystem');

module.exports = {
  name: 'health',
  description: 'Check health of Yasin ecosystem services',
  async execute() {
    const adapters = getEcosystemAdapters();
    const results = [];

    for (const adapter of adapters) {
      results.push(await adapter.doctor());
    }

    const healthy = results.every((result) => result.status === 'healthy' || result.status === 'ready');
    return { healthy, services: results };
  }
};
