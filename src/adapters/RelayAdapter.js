const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class RelayAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    const python = process.env.YASIN_PYTHON || 'python3';
    super(configManager, serviceManager, {
      serviceId: 'yasin-relay',
      configKey: 'relay',
      envPrefix: 'YASIN_RELAY',
      serviceName: 'YasinRelay',
      mode: 'daemon',
      defaultCommand: python,
      defaultArgs: ['-m', 'yasinrelay.cli', 'run', '--schedule'],
      defaultVersionCommand: python,
      defaultVersionCommandArgs: ['-c', 'import yasinrelay; print(yasinrelay.__version__)']
    });
  }
}

module.exports = RelayAdapter;
