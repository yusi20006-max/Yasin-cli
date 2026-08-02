const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../src/config/ConfigManager');

// Mock Command so that config.js can be imported/tested if needed
jest.mock('../src/core/Command', () => {
  return class MockCommand {
    constructor(opts) {
      this.name = opts.name;
      this.description = opts.description;
      this.args = opts.args;
      this.options = opts.options || [];
    }
  };
});

const ConfigCommand = require('../src/commands/config');

describe('ConfigManager', () => {
  let tempConfigPath;
  let configManager;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-test-'));
    tempConfigPath = path.join(tempDir, 'config.json');
    configManager = new ConfigManager(tempConfigPath);
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        fs.rmdirSync(path.dirname(tempConfigPath));
      }
    } catch (e) {
      // ignore
    }
  });

  it('should initialize with default configuration', () => {
    expect(configManager.get('general.theme')).toBe('default');
    expect(configManager.get('general.logLevel')).toBe('info');
    expect(configManager.get('services')).toEqual({});
  });

  it('should set and get nested keys', () => {
    configManager.set('general.theme', 'dark');
    expect(configManager.get('general.theme')).toBe('dark');

    configManager.set('services.web.port', 3000);
    expect(configManager.get('services.web.port')).toBe(3000);
  });

  it('should return default value if key does not exist', () => {
    expect(configManager.get('nonexistent.key', 'fallback')).toBe('fallback');
  });

  it('should delete keys successfully', () => {
    configManager.set('services.web.port', 3000);
    expect(configManager.get('services.web.port')).toBe(3000);

    configManager.delete('services.web.port');
    expect(configManager.get('services.web.port')).toBeUndefined();
  });

  it('should list all configurations', () => {
    configManager.set('general.theme', 'custom');
    const all = configManager.list();
    expect(all.general.theme).toBe('custom');
    expect(all.general.logLevel).toBe('info');
  });

  it('should block and prevent prototype pollution through malicious keys', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Try setting __proto__ keys
    configManager.set('__proto__.polluted', 'yes');
    expect({}.polluted).toBeUndefined();
    expect(configManager.get('__proto__.polluted')).toBeUndefined();

    // Try setting constructor.prototype keys
    configManager.set('constructor.prototype.polluted2', 'yes');
    expect({}.polluted2).toBeUndefined();
    expect(configManager.get('constructor.prototype.polluted2')).toBeUndefined();

    // Try nested prototype pollution
    configManager.set('general.__proto__.polluted3', 'yes');
    expect({}.polluted3).toBeUndefined();

    // Try deepMerge prototype pollution
    const pollutedPayload = JSON.parse('{"__proto__": {"pollutedMerge": "yes"}}');
    const merged = configManager.deepMerge({}, pollutedPayload);
    expect({}.pollutedMerge).toBeUndefined();
    expect(merged.__proto__.pollutedMerge).toBeUndefined();

    warnSpy.mockRestore();
  });
});

describe('ConfigCommand', () => {
  let tempConfigPath;
  let configManager;
  let configCommand;
  let logMock, errorMock, exitMock;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-test-'));
    tempConfigPath = path.join(tempDir, 'config.json');
    configManager = new ConfigManager(tempConfigPath);
    configCommand = new ConfigCommand(configManager);

    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    logMock.mockRestore();
    errorMock.mockRestore();
    exitMock.mockRestore();
    try {
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        fs.rmdirSync(path.dirname(tempConfigPath));
      }
    } catch (e) {
      // ignore
    }
  });

  it('should list config', () => {
    configCommand.execute(['list']);
    expect(logMock).toHaveBeenCalled();
    const output = JSON.parse(logMock.mock.calls[0][0]);
    expect(output.general.theme).toBe('default');
  });

  it('should get a config key', () => {
    configCommand.execute(['get', 'general.theme']);
    expect(logMock).toHaveBeenCalledWith('default');
  });

  it('should set a config key', () => {
    configCommand.execute(['set', 'general.theme', 'ocean']);
    expect(logMock).toHaveBeenCalledWith('Successfully set "general.theme" to: "ocean"');
    expect(configManager.get('general.theme')).toBe('ocean');
  });

  it('should set boolean / number config keys parsed from JSON', () => {
    configCommand.execute(['set', 'services.web.port', '8080']);
    expect(configManager.get('services.web.port')).toBe(8080);

    configCommand.execute(['set', 'general.enabled', 'true']);
    expect(configManager.get('general.enabled')).toBe(true);
  });

  it('should delete a config key', () => {
    configManager.set('test.key', 'val');
    configCommand.execute(['delete', 'test.key']);
    expect(logMock).toHaveBeenCalledWith('Successfully deleted "test.key"');
    expect(configManager.get('test.key')).toBeUndefined();
  });
});
