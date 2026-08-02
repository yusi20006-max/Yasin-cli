const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../src/config/ConfigManager');
const CommandRegistry = require('../src/core/CommandRegistry');
const PluginSystem = require('../src/plugins/PluginSystem');
const PluginCommand = require('../src/commands/plugin');

describe('PluginSystem & PluginCommand', () => {
  let tempConfigPath;
  let configManager;
  let registry;
  let pluginSystem;
  let pluginCommand;
  let tempSrcDir;
  let logMock, errorMock, exitMock;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-test-'));
    tempConfigPath = path.join(tempDir, 'config.json');
    configManager = new ConfigManager(tempConfigPath);
    registry = new CommandRegistry();
    pluginSystem = new PluginSystem(configManager, registry, null);
    pluginCommand = new PluginCommand(pluginSystem);

    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});

    // Create a mock plugin source directory
    tempSrcDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-mock-plugin-'));
    const meta = {
      id: 'mock-plugin',
      name: 'Mock Plugin Ext',
      version: '1.5.0',
      description: 'A mock extension plugin',
      main: 'index.js'
    };
    fs.writeFileSync(path.join(tempSrcDir, 'yasin-plugin.json'), JSON.stringify(meta, null, 2));

    const entryCode = `
      module.exports = function(context) {
        context.registry.register({
          name: 'plugin-cmd',
          description: 'Added by mock plugin'
        });
      };
    `;
    fs.writeFileSync(path.join(tempSrcDir, 'index.js'), entryCode);
  });

  afterEach(() => {
    logMock.mockRestore();
    errorMock.mockRestore();
    exitMock.mockRestore();

    try {
      if (fs.existsSync(tempSrcDir)) {
        fs.readdirSync(tempSrcDir).forEach(f => fs.unlinkSync(path.join(tempSrcDir, f)));
        fs.rmdirSync(tempSrcDir);
      }
      const pluginsDir = path.join(path.dirname(tempConfigPath), 'plugins');
      if (fs.existsSync(pluginsDir)) {
        fs.readdirSync(pluginsDir).forEach(sub => {
          const subPath = path.join(pluginsDir, sub);
          if (fs.statSync(subPath).isDirectory()) {
            fs.readdirSync(subPath).forEach(f => fs.unlinkSync(path.join(subPath, f)));
            fs.rmdirSync(subPath);
          } else {
            fs.unlinkSync(subPath);
          }
        });
        fs.rmdirSync(pluginsDir);
      }
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        fs.rmdirSync(path.dirname(tempConfigPath));
      }
    } catch (e) {
      // ignore
    }
  });

  it('should install plugin correctly', () => {
    const detail = pluginSystem.installPlugin(tempSrcDir);
    expect(detail.id).toBe('mock-plugin');
    expect(detail.version).toBe('1.5.0');
    expect(detail.enabled).toBe(true);

    const list = pluginSystem.listPlugins();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('mock-plugin');
  });

  it('should load installed plugin and run hooks', () => {
    pluginSystem.installPlugin(tempSrcDir);

    const loaded = pluginSystem.loadPlugins();
    expect(loaded).toEqual(['mock-plugin']);

    // Check if the command registered by plugin exists
    const pluginCmd = registry.getCommand('plugin-cmd');
    expect(pluginCmd).toBeDefined();
    expect(pluginCmd.description).toBe('Added by mock plugin');
  });

  it('should not load disabled plugins', () => {
    pluginSystem.installPlugin(tempSrcDir);
    pluginSystem.disablePlugin('mock-plugin');

    const loaded = pluginSystem.loadPlugins();
    expect(loaded).toEqual([]);
    expect(registry.getCommand('plugin-cmd')).toBeUndefined();
  });

  it('should support disable/enable action via CLI', () => {
    pluginSystem.installPlugin(tempSrcDir);

    pluginCommand.execute(['disable', 'mock-plugin']);
    expect(pluginSystem.listPlugins()[0].enabled).toBe(false);

    pluginCommand.execute(['enable', 'mock-plugin']);
    expect(pluginSystem.listPlugins()[0].enabled).toBe(true);
  });

  it('should support install and uninstall CLI actions', () => {
    pluginCommand.execute(['install', tempSrcDir]);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('installed and enabled successfully'));

    expect(pluginSystem.listPlugins().length).toBe(1);

    pluginCommand.execute(['uninstall', 'mock-plugin']);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('uninstalled successfully'));
    expect(pluginSystem.listPlugins().length).toBe(0);
  });
});
