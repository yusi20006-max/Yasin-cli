const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class CoreAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    const python = process.env.YASIN_PYTHON || 'python3';
    super(configManager, serviceManager, {
      serviceId: 'yasin-core',
      configKey: 'core',
      envPrefix: 'YASIN_CORE',
      serviceName: 'Yasin-Core',
      mode: 'library',
      defaultVersionCommand: python,
      defaultVersionCommandArgs: ['-c', 'from yasin_core.version import VERSION; print(VERSION)']
    });
  }
}

module.exports = CoreAdapter;
