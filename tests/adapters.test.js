const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../src/config/ConfigManager');
const ServiceManager = require('../src/services/ServiceManager');
const CoreAdapter = require('../src/adapters/CoreAdapter');
const AgentAdapter = require('../src/adapters/AgentAdapter');
const HubAdapter = require('../src/adapters/HubAdapter');
const RelayAdapter = require('../src/adapters/RelayAdapter');

const nodeCommand = process.execPath;
const nodeArgs = ['-e', 'setInterval(() => {}, 1000)'];
const versionArgs = ['--version'];

function configure(config, id, name) {
  config.set(`services.${id}`, { id, name, command: nodeCommand, args: nodeArgs, versionArgs, env: {} });
}

describe('Ecosystem Adapters', () => {
  let config;
  let manager;
  let configPath;

  beforeEach(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-adapter-'));
    configPath = path.join(dir, 'config.json');
    config = new ConfigManager(configPath);
    manager = new ServiceManager(config);
  });

  afterEach(() => {
    try {
      manager.listServices().forEach(service => {
        if (service.status === 'running') manager.stopService(service.id);
      });
    } catch (e) {}
    try { fs.rmSync(path.dirname(configPath), { recursive: true, force: true }); } catch (e) {}
  });

  test('no configured service means no mock registration', () => {
    const adapter = new CoreAdapter(config, manager);
    expect(adapter.status().status).toBe('not-found');
    expect(adapter.version().status).toBe('not-found');
  });

  test('configured Core service uses real process lifecycle and version detection', () => {
    configure(config, 'yasin-core', 'Yasin-Core Service');
    const adapter = new CoreAdapter(config, manager);
    expect(adapter.version().status).toBe('ok');
    const started = adapter.start();
    expect(started.status).toBe('running');
    expect(started.pid).toBeGreaterThan(0);
    expect(adapter.status().status).toBe('running');
    expect(adapter.stop()).toBe(true);
    expect(adapter.status().status).toBe('stopped');
  });

  test('Agent, Hub and Relay share the real adapter contract', () => {
    const defs = [
      ['yasin-agent', 'Yasin-Agent Service', AgentAdapter],
      ['yasin-hub', 'YasinHub Service', HubAdapter],
      ['yasin-relay', 'YasinRelay Service', RelayAdapter]
    ];
    defs.forEach(([id, name, Adapter]) => {
      configure(config, id, name);
      const adapter = new Adapter(config, manager);
      expect(adapter.serviceId).toBe(id);
      expect(adapter.detect().configured).toBe(true);
      expect(adapter.version().status).toBe('ok');
    });
  });
});
