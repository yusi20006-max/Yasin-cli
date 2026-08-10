const ServiceHealthOperation = require('../src/core/ServiceHealthOperation');

describe('ServiceHealthOperation', () => {
  test('aggregates health across all services', () => {
    const adapters = [
      { serviceId: 'yasin-core', health: jest.fn(() => ({ healthy: true })) },
      { serviceId: 'yasin-relay', health: jest.fn(() => ({ healthy: true })) }
    ];
    const operation = new ServiceHealthOperation({ resolve: () => adapters });
    const result = operation.execute('health', 'all');

    expect(result.ok).toBe(true);
    expect(result.data.results).toHaveLength(2);
    expect(adapters[0].health).toHaveBeenCalled();
  });

  test('uses doctor when requested', () => {
    const adapter = { serviceId: 'yasin-core', doctor: jest.fn(() => ({ status: 'healthy' })) };
    const operation = new ServiceHealthOperation({ resolve: () => [adapter] });
    const result = operation.execute('doctor', 'yasin-core');

    expect(result.ok).toBe(true);
    expect(adapter.doctor).toHaveBeenCalled();
  });

  test('normalizes adapter errors', () => {
    const adapter = { serviceId: 'yasin-core', health: jest.fn(() => { throw new Error('down'); }) };
    const operation = new ServiceHealthOperation({ resolve: () => [adapter] });
    const result = operation.execute('health', 'yasin-core');

    expect(result.ok).toBe(false);
    expect(result.error.message).toContain('health failed');
  });
});
