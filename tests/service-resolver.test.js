const ServiceResolver = require('../src/core/ServiceResolver');

describe('ServiceResolver', () => {
  const adapters = [
    { serviceId: 'yasin-core' },
    { serviceId: 'yasin-agent' },
    { serviceId: 'yasin-hub' },
    { serviceId: 'yasin-relay' }
  ];

  test('resolves all canonical services', () => {
    const resolver = new ServiceResolver(adapters);
    expect(resolver.resolve('all')).toEqual(adapters);
    expect(resolver.ids()).toEqual(adapters.map(a => a.serviceId));
  });

  test('resolves one service', () => {
    const resolver = new ServiceResolver(adapters);
    expect(resolver.resolve('yasin-core')).toEqual([adapters[0]]);
  });

  test('rejects unknown services', () => {
    const resolver = new ServiceResolver(adapters);
    expect(() => resolver.resolve('unknown')).toThrow('Unknown service: unknown');
  });
});
