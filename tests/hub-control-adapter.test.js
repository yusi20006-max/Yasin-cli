const HubControlAdapter = require('../src/adapters/HubControlAdapter');

describe('HubControlAdapter', () => {
  test('normalizes control calls into transport requests', async () => {
    const requests = [];
    const transport = { request: async request => { requests.push(request); return { ok: true, code: 0, data: {} }; } };
    const adapter = new HubControlAdapter({ transport, timeoutMs: 5000, version: '1' });

    await adapter.status('all', { requestId: 'req-1' });
    await adapter.restart('yasin-relay');

    expect(requests).toEqual([
      { version: '1', requestId: 'req-1', operation: 'status', service: 'all', params: { requestId: 'req-1' }, timeoutMs: 5000 },
      { version: '1', requestId: undefined, operation: 'restart', service: 'yasin-relay', params: {}, timeoutMs: 5000 }
    ]);
  });

  test('rejects a transport without request()', () => {
    expect(() => new HubControlAdapter({ transport: {} })).toThrow('requires a transport with request()');
  });
});
