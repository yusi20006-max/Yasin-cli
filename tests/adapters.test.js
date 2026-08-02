const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../src/config/ConfigManager');
const ServiceManager = require('../src/services/ServiceManager');
const CoreAdapter = require('../src/adapters/CoreAdapter');
const AgentAdapter = require('../src/adapters/AgentAdapter');
const HubAdapter = require('../src/adapters/HubAdapter');
const RelayAdapter = require('../src/adapters/RelayAdapter');

describe('Ecosystem Adapters', () => {
  let tempConfigPath;
  let configManager;
  let serviceManager;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-test-adapters-'));
    tempConfigPath = path.join(tempDir, 'config.json');
    configManager = new ConfigManager(tempConfigPath);
    serviceManager = new ServiceManager(configManager);
  });

  afterEach(() => {
    try {
      const list = serviceManager.listServices();
      list.forEach(s => {
        if (s.status === 'running') {
          serviceManager.stopService(s.id);
        }
      });
    } catch (e) {}

    try {
      const logDir = path.join(path.dirname(tempConfigPath), 'logs');
      if (fs.existsSync(logDir)) {
        fs.readdirSync(logDir).forEach(f => {
          fs.unlinkSync(path.join(logDir, f));
        });
        fs.rmdirSync(logDir);
      }
      const stateFile = path.join(path.dirname(tempConfigPath), 'services-state.json');
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        fs.rmdirSync(path.dirname(tempConfigPath));
      }
    } catch (e) {
      // ignore
    }
  });

  it('should initialize and register CoreAdapter service', () => {
    const adapter = new CoreAdapter(configManager, serviceManager);
    expect(adapter.serviceId).toBe('yasin-core');
    expect(adapter.version()).toBe('1.0.0-mock-core');

    const status = adapter.status();
    expect(status.id).toBe('yasin-core');
    expect(status.status).toBe('stopped');

    const report = adapter.doctor();
    expect(report.status).toBe('degraded');
    expect(report.checks.length).toBeGreaterThan(0);
  });

  it('should initialize and register AgentAdapter service', () => {
    const adapter = new AgentAdapter(configManager, serviceManager);
    expect(adapter.serviceId).toBe('yasin-agent');
    expect(adapter.version()).toBe('1.0.0-mock-agent');

    const status = adapter.status();
    expect(status.id).toBe('yasin-agent');
    expect(status.status).toBe('stopped');

    const report = adapter.doctor();
    expect(report.status).toBe('degraded');
  });

  it('should initialize and register HubAdapter service', () => {
    const adapter = new HubAdapter(configManager, serviceManager);
    expect(adapter.serviceId).toBe('yasin-hub');
    expect(adapter.version()).toBe('1.0.0-mock-hub');

    const status = adapter.status();
    expect(status.id).toBe('yasin-hub');
    expect(status.status).toBe('stopped');

    const report = adapter.doctor();
    expect(report.status).toBe('degraded');
  });

  it('should initialize and register RelayAdapter service', () => {
    const adapter = new RelayAdapter(configManager, serviceManager);
    expect(adapter.serviceId).toBe('yasin-relay');
    expect(adapter.version()).toBe('1.0.0-mock-relay');

    const status = adapter.status();
    expect(status.id).toBe('yasin-relay');
    expect(status.status).toBe('stopped');

    const report = adapter.doctor();
    expect(report.status).toBe('degraded');
  });

  it('should handle start, stop, and restart via CoreAdapter', async () => {
    const adapter = new CoreAdapter(configManager, serviceManager);
    const details = adapter.start();
    expect(details.status).toBe('running');
    expect(details.pid).toBeGreaterThan(0);

    let status = adapter.status();
    expect(status.status).toBe('running');

    let doc = adapter.doctor();
    expect(doc.status).toBe('healthy');

    const stopped = adapter.stop();
    expect(stopped).toBe(true);

    status = adapter.status();
    expect(status.status).toBe('stopped');
  });

  it('should manage configuration via CoreAdapter', () => {
    const adapter = new CoreAdapter(configManager, serviceManager);
    adapter.config('set', 'port', 8080);
    expect(adapter.config('get', 'port')).toBe(8080);

    const fullConfig = adapter.config('list');
    expect(fullConfig.port).toBe(8080);

    adapter.config('delete', 'port');
    expect(adapter.config('get', 'port')).toBeUndefined();
  });
});
