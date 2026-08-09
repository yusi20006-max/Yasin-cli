const EcosystemOrchestrator = require('../src/ecosystem/Orchestrator');
const ProfileManager = require('../src/ecosystem/ProfileManager');

describe('ecosystem orchestration', () => {
  test('resolves dependencies before targets and reverses them on stop', () => {
    const calls = [];
    const adapters = [
      { serviceId: 'yasin-core', capabilities: () => ({ start: true, stop: true }), start: () => calls.push('core-start'), stop: () => calls.push('core-stop') },
      { serviceId: 'yasin-relay', capabilities: () => ({ start: true, stop: true }), start: () => calls.push('relay-start'), stop: () => calls.push('relay-stop') }
    ];
    const orchestrator = new EcosystemOrchestrator(adapters, { 'yasin-relay': ['yasin-core'] });

    const started = orchestrator.start('relay');
    expect(started.order).toEqual(['yasin-core', 'yasin-relay']);
    expect(calls).toEqual(['core-start', 'relay-start']);

    const stopped = orchestrator.stop('relay');
    expect(stopped.order).toEqual(['yasin-relay', 'yasin-core']);
    expect(calls).toEqual(['core-start', 'relay-start', 'relay-stop', 'core-stop']);
  });

  test('detects dependency cycles', () => {
    const adapters = [{ serviceId: 'yasin-core', capabilities: () => ({}) }];
    const orchestrator = new EcosystemOrchestrator(adapters, { 'yasin-core': ['yasin-core'] });
    expect(() => orchestrator.start('core')).toThrow('Dependency cycle detected');
  });
});

describe('profile manager', () => {
  test('saves, lists, activates and removes profiles', () => {
    const data = {};
    const config = {
      get: (key) => data[key],
      set: (key, value) => { data[key] = value; }
    };
    const manager = new ProfileManager(config);
    manager.save('dev', { services: { core: true } });
    expect(manager.list().dev.services.core).toBe(true);
    manager.apply('dev');
    expect(data.activeProfile).toBe('dev');
    expect(manager.remove('dev')).toBe(true);
    expect(manager.list().dev).toBeUndefined();
  });
});
