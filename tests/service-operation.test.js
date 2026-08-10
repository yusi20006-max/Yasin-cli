const ServiceOperation = require('../src/core/ServiceOperation');

function adapter(id, value) {
  return {
    serviceId: id,
    status: jest.fn(() => value),
    health: jest.fn(() => ({ healthy: true }))
  };
}

describe('ServiceOperation', () => {
  test('dispatches an operation to one resolved service', () => {
    const core = adapter('yasin-core', { status: 'running' });
    const resolver = { resolve: jest.fn(() => [core]) };
    const operation = new ServiceOperation(resolver);

    const result = operation.execute('status', 'yasin-core');

    expect(resolver.resolve).toHaveBeenCalledWith('yasin-core');
    expect(core.status).toHaveBeenCalledWith([], {});
    expect(result.ok).toBe(true);
    expect(result.data.results[0].service).toBe('yasin-core');
  });

  test('dispatches all to every resolved adapter', () => {
    const core = adapter('yasin-core', { status: 'running' });
    const relay = adapter('yasin-relay', { status: 'stopped' });
    const operation = new ServiceOperation({ resolve: () => [core, relay] });

    const result = operation.execute('status', 'all');

    expect(core.status).toHaveBeenCalled();
    expect(relay.status).toHaveBeenCalled();
    expect(result.data.results).toHaveLength(2);
  });

  test('rejects unsupported operations', () => {
    const operation = new ServiceOperation({ resolve: () => [adapter('yasin-core')] });
    expect(() => operation.execute('restart', 'yasin-core')).toThrow('does not support operation');
  });
});
