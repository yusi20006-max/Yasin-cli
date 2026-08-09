const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class HubAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    const python = process.env.YASIN_PYTHON || 'python3';
    super(configManager, serviceManager, {
      serviceId: 'yasin-hub',
      configKey: 'hub',
      envPrefix: 'YASIN_HUB',
      serviceName: 'YasinHub',
      mode: 'oneshot',
      defaultCommand: python,
      defaultArgs: ['-m', 'yasinhub.cli', 'status'],
      defaultVersionCommand: python,
      defaultVersionCommandArgs: ['-c', 'import yasinhub; print(yasinhub.__version__)']
    });
  }
}

module.exports = HubAdapter;
