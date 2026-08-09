const { getEcosystemAdapters } = require('../ecosystem');

module.exports = {
  name: 'discover',
  description: 'Discover installed Yasin ecosystem services',
  async execute() {
    const adapters = getEcosystemAdapters();
    const results = [];

    for (const adapter of adapters) {
      results.push(await adapter.detect());
    }

    return { services: results };
  }
};
