const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class CoreAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    super(configManager, serviceManager, {
      serviceId: 'yasin-core',
      configKey: 'core',
      envPrefix: 'YASIN_CORE',
      serviceName: 'Yasin-Core Service'
    });
  }
}

module.exports = CoreAdapter;
