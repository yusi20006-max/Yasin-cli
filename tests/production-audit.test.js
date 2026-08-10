const fs = require('fs');
const os = require('os');
const path = require('path');

const ConfigManager = require('../src/config/ConfigManager');
const PluginSystem = require('../src/plugins/PluginSystem');
const CommandRegistry = require('../src/core/CommandRegistry');
const AutomationResult = require('../src/output/AutomationResult');
const ExitCodes = require('../src/output/ExitCodes');
const HealthCommand = require('../src/commands/health');

describe('production audit contracts', () => {
  test('config rejects prototype-pollution paths', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-config-'));
    const config = new ConfigManager(path.join(dir, 'config.json'));
    expect(config.get('__proto__.polluted', 'safe')).toBe('safe');
    expect(config.set('__proto__.yasinPolluted', true)).toBe(false);
    expect(config.set('constructor.yasinPolluted', true)).toBe(false);
    expect(Object.prototype.yasinPolluted).toBeUndefined();
    expect(config.get('constructor.polluted', 'safe')).toBe('safe');
  });

  test('config supports isolated platform-safe custom paths', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-config-'));
    const file = path.join(dir, 'nested', 'config.json');
    const config = new ConfigManager(file);
    config.set('general.logLevel', 'debug');
    expect(new ConfigManager(file).get('general.logLevel')).toBe('debug');
  });

  test('plugin paths cannot escape plugin root', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-plugin-'));
    const config = new ConfigManager(path.join(dir, 'config.json'));
    const system = new PluginSystem(config, new CommandRegistry(), {});
    expect(() => system.getPluginDir('../escape')).toThrow();
    expect(system.resolveInside(system.pluginsDir, path.join(system.pluginsDir, '..', 'escape'))).toBeNull();
  });

  test('plugin entry paths are constrained to plugin directory', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-plugin-'));
    const config = new ConfigManager(path.join(dir, 'config.json'));
    const system = new PluginSystem(config, new CommandRegistry(), {});
    const pluginDir = system.getPluginDir('safe-plugin');
    expect(system.resolveInside(pluginDir, path.join(pluginDir, '..', 'escape.js'))).toBeNull();
  });

  test('automation result and exit codes remain deterministic', () => {
    const success = AutomationResult.success({ ok: true });
    const failure = AutomationResult.failure(ExitCodes.GENERAL_ERROR, 'failed', { detail: 'x' });
    expect(success.ok).toBe(true);
    expect(success.code).toBe(ExitCodes.SUCCESS);
    expect(failure.ok).toBe(false);
    expect(failure.code).toBe(ExitCodes.GENERAL_ERROR);
    expect(failure.data).toEqual({ detail: 'x' });
    expect(failure.error.type).toBe('GENERAL_ERROR');
  });

  test('health command does not write directly to stdout', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    const command = new HealthCommand([{ serviceId: 'yasin-core', health: () => ({ healthy: true }) }]);
    const result = command.execute([], { json: false });
    expect(result.ok).toBe(true);
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  test('health compatibility path fails when an adapter throws', () => {
    const command = new HealthCommand([{
      serviceId: 'yasin-core',
      health: () => { throw new Error('service unavailable'); }
    }]);
    const result = command.execute([], { json: true });
    expect(result.ok).toBe(false);
    expect(result.code).toBe(ExitCodes.GENERAL_ERROR);
    expect(result.data.healthy).toBe(false);
    expect(result.data.services[0].status).toBe('error');
  });
});
