const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class HubAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    super(configManager, serviceManager, {
      serviceId: 'yasin-hub',
      configKey: 'hub',
      envPrefix: 'YASIN_HUB',
      serviceName: 'YasinHub Service'
    });
  }
}

module.exports = HubAdapter;
