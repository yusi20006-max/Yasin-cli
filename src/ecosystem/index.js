const CoreAdapter = require('../adapters/CoreAdapter');
const AgentAdapter = require('../adapters/AgentAdapter');
const HubAdapter = require('../adapters/HubAdapter');
const RelayAdapter = require('../adapters/RelayAdapter');

function createEcosystemAdapters(configManager, serviceManager) {
  return [
    new CoreAdapter(configManager, serviceManager),
    new AgentAdapter(configManager, serviceManager),
    new HubAdapter(configManager, serviceManager),
    new RelayAdapter(configManager, serviceManager)
  ];
}

module.exports = { createEcosystemAdapters };
