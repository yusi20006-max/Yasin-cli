const CoreAdapter = require('../src/adapters/CoreAdapter');
const AgentAdapter = require('../src/adapters/AgentAdapter');
const HubAdapter = require('../src/adapters/HubAdapter');
const RelayAdapter = require('../src/adapters/RelayAdapter');

describe('Ecosystem Adapters Unit Tests', () => {
  describe('CoreAdapter', () => {
    let adapter;
    beforeEach(() => {
      adapter = new CoreAdapter();
    });

    it('should implement the correct name', () => {
      expect(adapter.name).toBe('Yasin-Core');
    });

    it('should support discover API', async () => {
      const res = await adapter.discover();
      expect(res.found).toBe(true);
      expect(res.path).toContain('yasin-core');
    });

    it('should support getVersion API', async () => {
      const version = await adapter.getVersion();
      expect(version).toBe('1.2.4');
    });

    it('should support healthCheck API', async () => {
      const hc = await adapter.healthCheck();
      expect(hc.status).toBe('healthy');
    });

    it('should support status API', async () => {
      const stat = await adapter.status();
      expect(stat.active).toBe(true);
      expect(stat.pid).toBe(24018);
    });

    it('should support configSync API', async () => {
      const res = await adapter.configSync({ key: 'val' });
      expect(res.synced).toBe(true);
      expect(res.keysUpdated).toBe(1);
    });

    it('should support start/stop/restart APIs', async () => {
      const startRes = await adapter.start();
      expect(startRes.success).toBe(true);
      expect(startRes.pid).toBe(24018);

      const stopRes = await adapter.stop();
      expect(stopRes.success).toBe(true);

      const restartRes = await adapter.restart();
      expect(restartRes.success).toBe(true);
      expect(restartRes.pid).toBe(24019);
    });

    it('should support doctor API', async () => {
      const doc = await adapter.doctor();
      expect(doc.issuesFound).toBe(0);
      expect(doc.compatible).toBe(true);
    });
  });

  describe('AgentAdapter', () => {
    let adapter;
    beforeEach(() => {
      adapter = new AgentAdapter();
    });

    it('should implement the correct name', () => {
      expect(adapter.name).toBe('Yasin-Agent');
    });

    it('should support discover API', async () => {
      const res = await adapter.discover();
      expect(res.found).toBe(true);
      expect(res.address).toContain('localhost');
    });

    it('should support getVersion API', async () => {
      const version = await adapter.getVersion();
      expect(version).toBe('0.9.1');
    });

    it('should support healthCheck API', async () => {
      const hc = await adapter.healthCheck();
      expect(hc.status).toBe('healthy');
    });

    it('should support status API', async () => {
      const stat = await adapter.status();
      expect(stat.active).toBe(true);
      expect(stat.pid).toBe(24022);
    });

    it('should support configSync API', async () => {
      const res = await adapter.configSync({ key: 'val' });
      expect(res.synced).toBe(true);
    });

    it('should support start/stop/restart APIs', async () => {
      const startRes = await adapter.start();
      expect(startRes.success).toBe(true);
      expect(startRes.pid).toBe(24022);

      const stopRes = await adapter.stop();
      expect(stopRes.success).toBe(true);

      const restartRes = await adapter.restart();
      expect(restartRes.success).toBe(true);
    });

    it('should support doctor API', async () => {
      const doc = await adapter.doctor();
      expect(doc.issuesFound).toBe(0);
    });
  });

  describe('HubAdapter', () => {
    let adapter;
    beforeEach(() => {
      adapter = new HubAdapter();
    });

    it('should implement the correct name', () => {
      expect(adapter.name).toBe('YasinHub');
    });

    it('should support discover API', async () => {
      const res = await adapter.discover();
      expect(res.found).toBe(true);
      expect(res.endpoint).toContain('hub.yasin.io');
    });

    it('should support getVersion API', async () => {
      const version = await adapter.getVersion();
      expect(version).toBe('2.0.0-rc1');
    });

    it('should support healthCheck API', async () => {
      const hc = await adapter.healthCheck();
      expect(hc.status).toBe('healthy');
    });

    it('should support status API', async () => {
      const stat = await adapter.status();
      expect(stat.active).toBe(true);
      expect(stat.projectsCount).toBe(8);
    });

    it('should support configSync API', async () => {
      const res = await adapter.configSync({ key: 'val' });
      expect(res.synced).toBe(true);
    });

    it('should support start/stop/restart APIs', async () => {
      const startRes = await adapter.start();
      expect(startRes.success).toBe(true);

      const stopRes = await adapter.stop();
      expect(stopRes.success).toBe(true);

      const restartRes = await adapter.restart();
      expect(restartRes.success).toBe(true);
    });

    it('should support doctor API', async () => {
      const doc = await adapter.doctor();
      expect(doc.issuesFound).toBe(0);
    });
  });

  describe('RelayAdapter', () => {
    let adapter;
    beforeEach(() => {
      adapter = new RelayAdapter();
    });

    it('should implement the correct name', () => {
      expect(adapter.name).toBe('YasinRelay');
    });

    it('should support discover API', async () => {
      const res = await adapter.discover();
      expect(res.found).toBe(true);
      expect(res.endpoint).toContain('relay.yasin.io');
    });

    it('should support getVersion API', async () => {
      const version = await adapter.getVersion();
      expect(version).toBe('1.0.2');
    });

    it('should support healthCheck API', async () => {
      const hc = await adapter.healthCheck();
      expect(hc.status).toBe('healthy');
    });

    it('should support status API', async () => {
      const stat = await adapter.status();
      expect(stat.active).toBe(true);
      expect(stat.activeFeeds).toBe(12);
    });

    it('should support configSync API', async () => {
      const res = await adapter.configSync({ key: 'val' });
      expect(res.synced).toBe(true);
    });

    it('should support start/stop/restart APIs', async () => {
      const startRes = await adapter.start();
      expect(startRes.success).toBe(true);

      const stopRes = await adapter.stop();
      expect(stopRes.success).toBe(true);

      const restartRes = await adapter.restart();
      expect(restartRes.success).toBe(true);
    });

    it('should support doctor API', async () => {
      const doc = await adapter.doctor();
      expect(doc.issuesFound).toBe(0);
    });
  });
});
