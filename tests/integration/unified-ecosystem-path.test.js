const ServiceResolver = require('../../src/core/ServiceResolver');
const ServiceOperation = require('../../src/core/ServiceOperation');
const ServiceHealthOperation = require('../../src/core/ServiceHealthOperation');
const ServiceStatusOperation = require('../../src/core/ServiceStatusOperation');
const LifecycleCommand = require('../../src/commands/lifecycle');

function makeAdapter(serviceId) {
  return {
    serviceId,
    start: jest.fn(() => ({ running: true })),
    stop: jest.fn(() => ({ running: false })),
    restart: jest.fn(() => ({ restarted: true })),
    status: jest.fn(() => ({ running: true })),
    health: jest.fn(() => ({ healthy: true })),
    doctor: jest.fn(() => ({ healthy: true }))
  };
}

describe('unified ecosystem integration path', () => {
  test('lifecycle command reaches the canonical adapter through resolver and operation', () => {
    const core = makeAdapter('yasin-core');
    const resolver = new ServiceResolver([core]);
    const operation = new ServiceOperation(resolver);
    const command = new LifecycleCommand('restart', operation);

    const result = command.execute(['yasin-core'], { json: true });

    expect(result.ok).toBe(true);
    expect(core.restart).toHaveBeenCalledWith([], { json: true });
    expect(result.data.results[0].service).toBe('yasin-core');
  });

  test('status and health use the same canonical resolver', () => {
    const core = makeAdapter('yasin-core');
    const relay = makeAdapter('yasin-relay');
    const resolver = new ServiceResolver([core, relay]);

    const status = new ServiceStatusOperation(resolver).execute('all');
    const health = new ServiceHealthOperation(resolver).execute('health', 'all');

    expect(status.ok).toBe(true);
    expect(health.ok).toBe(true);
    expect(status.data.results.map(item => item.service)).toEqual(['yasin-core', 'yasin-relay']);
    expect(health.data.results.map(item => item.service)).toEqual(['yasin-core', 'yasin-relay']);
  });
});
