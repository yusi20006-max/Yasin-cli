const LifecycleCommand = require('../src/commands/lifecycle');

describe('LifecycleCommand unified boundary', () => {
  test('delegates lifecycle action to the unified operation backend', () => {
    const backend = { execute: jest.fn(() => ({ ok: true, code: 0, data: { action: 'restart' } })) };
    const command = new LifecycleCommand('restart', backend);

    const result = command.execute(['yasin-relay'], { json: true });

    expect(backend.execute).toHaveBeenCalledWith('restart', 'yasin-relay', [], { json: true });
    expect(result.ok).toBe(true);
  });

  test('defaults lifecycle target to all', () => {
    const backend = { execute: jest.fn(() => ({ ok: true, code: 0, data: {} })) };
    const command = new LifecycleCommand('start', backend);

    command.execute([], { json: true });

    expect(backend.execute).toHaveBeenCalledWith('start', 'all', [], { json: true });
  });
});
