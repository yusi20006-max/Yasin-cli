const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class AgentAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    super(configManager, serviceManager, {
      serviceId: 'yasin-agent',
      configKey: 'agent',
      envPrefix: 'YASIN_AGENT',
      serviceName: 'Yasin-Agent Service'
    });
  }
}

module.exports = AgentAdapter;
