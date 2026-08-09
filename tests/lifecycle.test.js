const LifecycleCommand = require('../src/commands/lifecycle');

describe('ecosystem lifecycle command', () => {
  test('starts all supported daemon adapters and skips unsupported services', () => {
    const calls = [];
    const adapters = [
      {
        serviceId: 'yasin-core',
        capabilities: () => ({ start: false }),
        start: () => calls.push('core')
      },
      {
        serviceId: 'yasin-relay',
        capabilities: () => ({ start: true }),
        start: () => { calls.push('relay'); return { pid: 123 }; }
      }
    ];

    const command = new LifecycleCommand('start', adapters);
    const result = command.execute(['all']);

    expect(calls).toEqual(['relay']);
    expect(result.services[0].status).toBe('skipped');
    expect(result.services[1].status).toBe('ok');
  });

  test('rejects unknown service', () => {
    const command = new LifecycleCommand('stop', []);
    expect(() => command.execute(['unknown'])).toThrow('Unknown ecosystem service');
  });
});
