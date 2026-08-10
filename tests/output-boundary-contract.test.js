const LifecycleCommand = require('../src/commands/lifecycle');
const DoctorCommand = require('../src/commands/doctor');
const PluginSystem = require('../src/plugins/PluginSystem');
const ConfigManager = require('../src/config/ConfigManager');
const CommandRegistry = require('../src/core/CommandRegistry');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('command/output boundary', () => {
  test('lifecycle command does not write to stdout', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const target = { execute: () => ({ ok: true, code: 0, data: { services: [] } }) };
    const result = new LifecycleCommand('start', target).execute([], {});
    expect(result.ok).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test('doctor command does not write directly to stdout/stderr', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-doctor-'));
    const manager = new ConfigManager(path.join(dir, 'config.json'));
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    new DoctorCommand(manager).execute([], { json: true });
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('plugin loading reports failures as diagnostics instead of console output', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-plugin-'));
    const manager = new ConfigManager(path.join(dir, 'config.json'));
    manager.set('plugins.bad', { id: 'bad', main: 'missing.js', enabled: true });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const system = new PluginSystem(manager, new CommandRegistry(), {});
    expect(system.loadPlugins()).toEqual([]);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(system.lastLoadDiagnostics[0]).toMatchObject({ plugin: 'bad', status: 'error', code: 'PLUGIN_ENTRY_MISSING' });
    errorSpy.mockRestore();
  });
});
