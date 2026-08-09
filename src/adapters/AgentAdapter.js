const BaseEcosystemAdapter = require('./BaseEcosystemAdapter');

class AgentAdapter extends BaseEcosystemAdapter {
  constructor(configManager, serviceManager) {
    const python = process.env.YASIN_PYTHON || 'python3';
    super(configManager, serviceManager, {
      serviceId: 'yasin-agent',
      configKey: 'agent',
      envPrefix: 'YASIN_AGENT',
      serviceName: 'Yasin-Agent',
      mode: 'oneshot',
      defaultCommand: python,
      defaultArgs: ['-m', 'agent_platform.cli', 'agent', 'run', 'news_bot'],
      defaultVersionCommand: python,
      defaultVersionCommandArgs: ['-c', 'import agent_platform; print(agent_platform.__version__)']
    });
  }
}

module.exports = AgentAdapter;
