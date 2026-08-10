const ServiceCommandFactory = require('../src/core/ServiceCommandFactory');

describe('ServiceCommandFactory', () => {
  test('uses the first positional argument as service and forwards remaining args', () => {
    const operation = { execute: jest.fn(() => ({ ok: true, code: 0 })) };
    const factory = new ServiceCommandFactory({ resolve: jest.fn() });
    factory.operation = operation;

    const result = factory.execute('logs', ['yasin-core', '25'], { json: true });

    expect(operation.execute).toHaveBeenCalledWith('logs', 'yasin-core', ['25'], { json: true });
    expect(result.ok).toBe(true);
  });

  test('defaults service to all', () => {
    const operation = { execute: jest.fn(() => ({ ok: true, code: 0 })) };
    const factory = new ServiceCommandFactory({ resolve: jest.fn() });
    factory.operation = operation;

    factory.execute('health', [], {});

    expect(operation.execute).toHaveBeenCalledWith('health', 'all', [], {});
  });
});
