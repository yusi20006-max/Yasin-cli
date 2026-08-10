const ServiceStatusOperation = require('../src/core/ServiceStatusOperation');

describe('ServiceStatusOperation', () => {
  test('aggregates status for all resolved services', () => {
    const adapters = [
      { serviceId: 'yasin-core', status: jest.fn(() => ({ running: true })) },
      { serviceId: 'yasin-relay', status: jest.fn(() => ({ running: false })) }
    ];
    const operation = new ServiceStatusOperation({ resolve: () => adapters });
    const result = operation.execute('all');

    expect(result.ok).toBe(true);
    expect(result.data.operation).toBe('status');
    expect(result.data.results).toHaveLength(2);
  });

  test('normalizes unsupported status implementations', () => {
    const operation = new ServiceStatusOperation({ resolve: () => [{ serviceId: 'yasin-core' }] });
    const result = operation.execute('yasin-core');

    expect(result.ok).toBe(true);
    expect(result.data.results[0].status).toBe('unsupported');
  });

  test('normalizes status exceptions without breaking aggregation', () => {
    const adapter = { serviceId: 'yasin-core', status: jest.fn(() => { throw new Error('status failed'); }) };
    const result = new ServiceStatusOperation({ resolve: () => [adapter] }).execute('yasin-core');

    expect(result.ok).toBe(true);
    expect(result.data.results[0].status).toBe('error');
    expect(result.data.results[0].error.message).toBe('status failed');
  });
});
