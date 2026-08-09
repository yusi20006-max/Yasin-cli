const CoreAdapter = require('../src/adapters/CoreAdapter');
const AgentAdapter = require('../src/adapters/AgentAdapter');
const HubAdapter = require('../src/adapters/HubAdapter');
const RelayAdapter = require('../src/adapters/RelayAdapter');

function makeContext() {
  const config = { services: {} };
  return {
    configManager: {
      configDir: require('os').tmpdir(),
      get: key => key ? key.split('.').reduce((v, part) => v && v[part], config) : config,
      set: (key, value) => { config[key] = value; }
    },
    serviceManager: {
      registerService: jest.fn()
    }
  };
}

describe('Yasin ecosystem adapter contracts', () => {
  test('Core is a library package with version probing but no daemon lifecycle', () => {
    const { configManager, serviceManager } = makeContext();
    const adapter = new CoreAdapter(configManager, serviceManager);
    expect(adapter.capabilities().start).toBe(false);
    expect(adapter.capabilities().version).toBe(true);
    expect(serviceManager.registerService).toHaveBeenCalled();
    const registration = serviceManager.registerService.mock.calls[0];
    expect(registration[0]).toBe('yasin-core');
    expect(registration[2]).toBeNull();
  });

  test('Agent is an on-demand command', () => {
    const { configManager, serviceManager } = makeContext();
    const adapter = new AgentAdapter(configManager, serviceManager);
    expect(adapter.capabilities().run).toBe(true);
    expect(adapter.capabilities().start).toBe(false);
    const registration = serviceManager.registerService.mock.calls[0];
    expect(registration[2]).toBe(process.env.YASIN_PYTHON || 'python3');
    expect(registration[3]).toEqual(['-m', 'agent_platform.cli', 'agent', 'run', 'news_bot']);
  });

  test('Hub is an on-demand status command', () => {
    const { configManager, serviceManager } = makeContext();
    const adapter = new HubAdapter(configManager, serviceManager);
    expect(adapter.capabilities().run).toBe(true);
    const registration = serviceManager.registerService.mock.calls[0];
    expect(registration[3]).toEqual(['-m', 'yasinhub.cli', 'status']);
  });

  test('Relay is the managed daemon', () => {
    const { configManager, serviceManager } = makeContext();
    const adapter = new RelayAdapter(configManager, serviceManager);
    expect(adapter.capabilities().start).toBe(true);
    expect(adapter.capabilities().stop).toBe(true);
    const registration = serviceManager.registerService.mock.calls[0];
    expect(registration[3]).toEqual(['-m', 'yasinrelay.cli', 'run', '--schedule']);
  });
});
