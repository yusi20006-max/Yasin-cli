const HealthCommand = require('../src/commands/health');

describe('HealthCommand', () => {
  test('delegates to canonical health operation', () => {
    const operation = { execute: jest.fn(() => ({ ok: true, code: 0, data: { healthy: true } })) };
    const command = new HealthCommand(operation);

    const result = command.execute(['all'], { json: true });

    expect(operation.execute).toHaveBeenCalledWith('health', 'all', [], { json: true });
    expect(result.ok).toBe(true);
  });

  test('retains adapter-array compatibility', () => {
    const adapter = { serviceId: 'yasin-core', health: jest.fn(() => ({ healthy: true })) };
    const command = new HealthCommand([adapter]);
    const result = command.execute([], { json: true });

    expect(result.ok).toBe(true);
    expect(result.data.healthy).toBe(true);
    expect(adapter.health).toHaveBeenCalled();
  });
});
