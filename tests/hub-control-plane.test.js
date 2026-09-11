'use strict';

/**
 * YasinHub Control Plane integration tests (Issue #41).
 *
 * No real network: the transport is stubbed at the fetch boundary with
 * payloads shaped like the verified YasinHub API (v1.0.1,
 * yasinhub/api/server.py). Covers client, config, gateway mapping,
 * commands, errors, exit codes, and the output contract.
 */

const HubClient = require('../src/hub/HubClient');
const HubError = require('../src/hub/HubError');
const HubLifecycle = require('../src/hub/HubLifecycle');
const { resolveHubSettings, DEFAULT_BASE_URL } = require('../src/hub/HubConfig');
const ExitCodes = require('../src/runtime/ExitCodes');
const LifecycleCommand = require('../src/commands/lifecycle');
const StatusCommand = require('../src/commands/status');
const HealthCommand = require('../src/commands/health');
const ConfigManager = require('../src/config/ConfigManager');
const fs = require('fs');
const os = require('os');
const path = require('path');

function tempConfig() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-hub-test-'));
  return new ConfigManager(path.join(dir, 'config.json'));
}

function jsonResponse(payload, ok = true, status = 200) {
  return { ok, status, json: async () => payload };
}

describe('HubError', () => {
  test('redacts secrets from messages', () => {
    const err = new HubError('REFUSED', 'failed token=SECRET-ABC password=hunter2');
    expect(err.message).not.toContain('SECRET-ABC');
    expect(err.message).not.toContain('hunter2');
    expect(err.code).toBe('REFUSED');
  });
});

describe('HubClient configuration', () => {
  test('rejects missing, malformed, and non-http base URLs', () => {
    expect(() => new HubClient({})).toThrow('not configured');
    expect(() => new HubClient({ baseUrl: '::bad::' })).toThrow('Invalid Hub base URL');
    expect(() => new HubClient({ baseUrl: 'ftp://x' })).toThrow('http or https');
    expect(() => new HubClient({ baseUrl: DEFAULT_BASE_URL, timeoutMs: -1 })).toThrow('positive');
  });

  test('accepts the Termux default without network use', () => {
    const client = new HubClient({ baseUrl: DEFAULT_BASE_URL });
    expect(client.baseUrl).toBe('http://127.0.0.1:7000');
  });
});

describe('HubClient transport', () => {
  test('health() accepts ok and validates shape', async () => {
    const ok = new HubClient({ baseUrl: DEFAULT_BASE_URL, fetchImpl: async () => jsonResponse({ status: 'ok', service: 'YasinHub' }) });
    await expect(ok.health()).resolves.toMatchObject({ status: 'ok' });
    const bad = new HubClient({ baseUrl: DEFAULT_BASE_URL, fetchImpl: async () => jsonResponse({ status: 'down' }) });
    await expect(bad.health()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  test('maps connection failure to UNAVAILABLE and abort to TIMEOUT', async () => {
    const down = new HubClient({ baseUrl: DEFAULT_BASE_URL, fetchImpl: async () => { throw new Error('connect ECONNREFUSED'); } });
    await expect(down.health()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
    const slow = new HubClient({
      baseUrl: DEFAULT_BASE_URL,
      timeoutMs: 20,
      fetchImpl: (url, opts) => new Promise((resolve, reject) => {
        opts.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      })
    });
    await expect(slow.health()).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  test('maps 404 to UNKNOWN_SERVICE and other errors to HTTP_ERROR', async () => {
    const missing = new HubClient({ baseUrl: DEFAULT_BASE_URL, fetchImpl: async () => jsonResponse({ success: false, error: 'service not found' }, false, 404) });
    await expect(missing.control('nope', 'start')).rejects.toMatchObject({ code: 'UNKNOWN_SERVICE' });
    const broken = new HubClient({ baseUrl: DEFAULT_BASE_URL, fetchImpl: async () => jsonResponse({ error: 'boom' }, false, 500) });
    await expect(broken.health()).rejects.toMatchObject({ code: 'HTTP_ERROR' });
  });

  test('rejects malformed and non-object payloads', async () => {
    const badJson = new HubClient({ baseUrl: DEFAULT_BASE_URL, fetchImpl: async () => ({ ok: true, status: 200, json: async () => { throw new Error('no json'); } }) });
    await expect(badJson.health()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
    const arrayStatus = new HubClient({ baseUrl: DEFAULT_BASE_URL, fetchImpl: async () => jsonResponse({ projects: 'nope' }) });
    await expect(arrayStatus.status()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  test('control() success returns the Hub verdict; refusal raises REFUSED', async () => {
    const client = new HubClient({
      baseUrl: DEFAULT_BASE_URL,
      fetchImpl: async (url) => {
        if (url.endsWith('/yasin-ai/start')) {
          return jsonResponse({ service: 'yasin-ai', action: 'start', success: true, status: 'RUNNING', pid: 4773, message: 'ok', process_running: true });
        }
        return jsonResponse({ service: 'yasin-ai', action: 'stop', success: false, status: 'FAILED', pid: null, message: 'port held by foreign process', process_running: false }, false, 409);
      }
    });
    await expect(client.control('yasin-ai', 'start')).resolves.toMatchObject({ status: 'RUNNING', pid: 4773 });
    await expect(client.control('yasin-ai', 'stop')).rejects.toMatchObject({ code: 'HTTP_ERROR' });
  });

  test('control() 200 with success:false raises REFUSED (fail-closed)', async () => {
    const client = new HubClient({
      baseUrl: DEFAULT_BASE_URL,
      fetchImpl: async () => jsonResponse({ service: 's', action: 'start', success: false, message: 'refused: unsafe metadata' })
    });
    await expect(client.control('s', 'start')).rejects.toMatchObject({ code: 'REFUSED' });
  });
});

describe('HubConfig resolution', () => {
  const OLD_ENV = { ...process.env };
  afterEach(() => { process.env = { ...OLD_ENV }; });

  test('defaults target the local Termux Hub with verified managed set', () => {
    delete process.env.YASINHUB_BASE_URL;
    delete process.env.YASIN_HUB_URL;
    const settings = resolveHubSettings(tempConfig());
    expect(settings.baseUrl).toBe('http://127.0.0.1:7000');
    expect(settings.timeoutMs).toBe(30000);
    expect(settings.managedServices).toEqual(expect.arrayContaining(['yasin-agent', 'yasin-ai', 'yasinrelay', 'yasinfeed', 'yasinpress']));
  });

  test('env and CLI config override defaults', () => {
    process.env.YASINHUB_BASE_URL = 'http://192.0.2.10:7000';
    expect(resolveHubSettings(tempConfig()).baseUrl).toBe('http://192.0.2.10:7000');
    delete process.env.YASINHUB_BASE_URL;
    const config = tempConfig();
    config.set('hub.baseUrl', 'http://192.0.2.20:7000');
    config.set('hub.managedServices', ['custom-svc']);
    const settings = resolveHubSettings(config);
    expect(settings.baseUrl).toBe('http://192.0.2.20:7000');
    expect(settings.managedServices).toEqual(['custom-svc']);
  });
});

describe('HubLifecycle gateway', () => {
  test('isHubManaged is case-insensitive and local names stay local', () => {
    const gateway = new HubLifecycle(tempConfig());
    expect(gateway.isHubManaged('yasin-ai')).toBe(true);
    expect(gateway.isHubManaged('YasinRelay')).toBe(true);
    expect(gateway.isHubManaged('my-local-daemon')).toBe(false);
  });

  test('exit code mapping: unavailable/timeout/unknown/refused', () => {
    const gateway = new HubLifecycle(tempConfig());
    expect(gateway.exitCodeFor(new HubError('UNAVAILABLE', 'x'))).toBe(ExitCodes.SERVICE_UNAVAILABLE);
    expect(gateway.exitCodeFor(new HubError('TIMEOUT', 'x'))).toBe(ExitCodes.SERVICE_UNAVAILABLE);
    expect(gateway.exitCodeFor(new HubError('UNKNOWN_SERVICE', 'x'))).toBe(ExitCodes.INVALID_COMMAND);
    expect(gateway.exitCodeFor(new HubError('REFUSED', 'x'))).toBe(ExitCodes.GENERAL_ERROR);
    expect(gateway.exitCodeFor(new Error('plain'))).toBe(ExitCodes.GENERAL_ERROR);
  });

  test('controlService maps success and refusal without process control', async () => {
    const successClient = { control: async () => ({ service: 'yasin-ai', action: 'restart', success: true, status: 'RUNNING', pid: 4774, message: 'ok', process_running: true }) };
    const gateway = new HubLifecycle(tempConfig(), successClient);
    await expect(gateway.restart('yasin-ai')).resolves.toMatchObject({ ok: true, status: 'RUNNING', pid: 4774, exitCode: 0 });

    const refusedClient = { control: async () => { throw new HubError('REFUSED', 'port held by foreign process'); } };
    const refused = new HubLifecycle(tempConfig(), refusedClient);
    await expect(refused.start('yasin-ai')).resolves.toMatchObject({ ok: false, success: false, exitCode: 1 });
  });

  test('hubStatus summarizes the real Hub snapshot', async () => {
    const client = {
      status: async () => ({
        ecosystem: 'Yasin',
        projects: [
          { name: 'yasin-ai', status: 'RUNNING', pid: 4773, process_running: true, message: 'observed running' },
          { name: 'yasinfeed', status: 'FAILED', pid: null, process_running: false, message: 'refused' }
        ]
      })
    };
    const snapshot = await new HubLifecycle(tempConfig(), client).hubStatus();
    expect(snapshot.reachable).toBe(true);
    expect(snapshot.total).toBe(2);
    expect(snapshot.running).toBe(1);
    expect(snapshot.failed).toBe(1);
  });

  test('hubHealth reports unavailable instead of fabricating state', async () => {
    const client = { health: async () => { throw new HubError('UNAVAILABLE', 'down'); } };
    const result = await new HubLifecycle(tempConfig(), client).hubHealth();
    expect(result.reachable).toBe(false);
    expect(result.exitCode).toBe(ExitCodes.SERVICE_UNAVAILABLE);
  });
});

describe('launcher dispatch', () => {
  test('bin/yasin.js bootstraps and dispatches commands', () => {
    const { execFileSync } = require('child_process');
    const bin = require('path').join(__dirname, '..', 'bin', 'yasin.js');
    const output = execFileSync(process.execPath, [bin, '--help'], { encoding: 'utf8', timeout: 15000 });
    expect(output).toMatch(/Yasin CLI/);
    expect(output).toMatch(/status/);
  });
});

describe('command wiring', () => {
  let logMock;
  beforeEach(() => { logMock = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { logMock.mockRestore(); jest.restoreAllMocks(); });

  test('lifecycle routes Hub-managed names to the gateway, never the orchestrator', async () => {
    const orchestrator = { start: jest.fn(), stop: jest.fn(), restart: jest.fn() };
    const gateway = {
      isHubManaged: (name) => name === 'yasin-ai',
      start: jest.fn(async () => ({ ok: true, service: 'yasin-ai', status: 'RUNNING', pid: 1, exitCode: 0 })),
      stop: jest.fn(async () => ({ ok: false, service: 'yasin-ai', exitCode: 3 })),
      restart: jest.fn()
    };
    const startCmd = new LifecycleCommand('start', orchestrator, gateway);
    const result = await startCmd.execute(['yasin-ai']);
    expect(gateway.start).toHaveBeenCalledWith('yasin-ai');
    expect(orchestrator.start).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('RUNNING'));

    const stopCmd = new LifecycleCommand('stop', orchestrator, gateway);
    const prevExit = process.exitCode;
    const refused = await stopCmd.execute(['yasin-ai']);
    expect(refused.ok).toBe(false);
    expect(process.exitCode).toBe(3);
    process.exitCode = prevExit;
    expect(orchestrator.stop).not.toHaveBeenCalled();
  });

  test('lifecycle keeps the legacy path for local and all targets', () => {
    const orchestrator = { start: jest.fn(() => ({ action: 'start' })) };
    const gateway = { isHubManaged: () => false };
    const command = new LifecycleCommand('start', orchestrator, gateway);
    command.execute(['my-local']);
    expect(orchestrator.start).toHaveBeenCalledWith('my-local');
  });

  test('status appends the Hub section only when a gateway is attached', async () => {
    const config = tempConfig();
    const plain = new StatusCommand(config, null, null);
    plain.execute([], {});
    expect(logMock).not.toHaveBeenCalledWith(expect.stringContaining('YasinHub Control Plane'));

    const gateway = {
      hubStatus: async () => ({
        reachable: true, total: 5, running: 5, failed: 0,
        projects: [{ name: 'yasin-ai', status: 'RUNNING', pid: 4773 }]
      })
    };
    const withHub = new StatusCommand(config, null, null, gateway);
    const snapshot = await withHub.execute([], {});
    expect(snapshot.running).toBe(5);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('--- YasinHub Control Plane ---'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('[RUNNING] yasin-ai (PID: 4773)'));

    const down = new StatusCommand(config, null, null, { hubStatus: async () => ({ reachable: false, error: 'down' }) });
    await down.execute([], {});
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('UNAVAILABLE'));
  });

  test('health merges the Hub entry when a gateway is attached', async () => {
    const adapters = [{ doctor: () => ({ id: 'relay', status: 'healthy' }) }];
    const plain = new HealthCommand(adapters);
    expect(plain.execute().healthy).toBe(true);

    const withHub = new HealthCommand(adapters, { hubHealth: async () => ({ reachable: true, status: 'ok' }) });
    const merged = await withHub.execute();
    expect(merged.healthy).toBe(true);
    expect(merged.services).toHaveLength(2);

    const hubDown = new HealthCommand(adapters, { hubHealth: async () => ({ reachable: false, error: 'down' }) });
    const degraded = await hubDown.execute();
    expect(degraded.healthy).toBe(false);
  });
});
