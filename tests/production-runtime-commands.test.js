const DiscoverCommand = require('../src/commands/discover');
const HealthCommand = require('../src/commands/health');
const LogsCommand = require('../src/commands/logs');

describe('production runtime commands', () => {
  test('discover reports all adapter detections', () => {
    const adapters = [
      { detect: () => ({ id: 'core', configured: true }) },
      { detect: () => ({ id: 'agent', configured: false }) }
    ];
    const command = new DiscoverCommand(adapters);
    const result = command.execute();
    expect(result.ok).toBe(true);
    expect(result.data.services).toHaveLength(2);
    expect(result.data.services[0].id).toBe('core');
  });

  test('health reports unhealthy when an adapter is unhealthy', () => {
    const adapters = [
      { doctor: () => ({ id: 'core', status: 'healthy' }) },
      { doctor: () => ({ id: 'relay', status: 'unhealthy' }) }
    ];
    const command = new HealthCommand(adapters);
    const result = command.execute();
    expect(result.ok).toBe(false);
    expect(result.data.healthy).toBe(false);
    expect(result.data.services).toHaveLength(2);
    expect(result.error.type).toBe('RUNTIME_ERROR');
  });

  test('logs delegates to ServiceManager', () => {
    const serviceManager = { getServiceLogs: jest.fn(() => 'line') };
    const command = new LogsCommand(serviceManager);
    const result = command.execute(['relay', '10']);
    expect(result).toBe('line');
    expect(serviceManager.getServiceLogs).toHaveBeenCalledWith('relay', 10);
  });
});
