const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class RelayAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    super(configManager, serviceManager, {
      serviceId: 'yasin-relay',
      configKey: 'relay',
      envPrefix: 'YASIN_RELAY',
      serviceName: 'YasinRelay Service'
    });
  }
}

module.exports = RelayAdapter;
