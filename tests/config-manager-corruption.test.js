const fs = require('fs');
const os = require('os');
const path = require('path');
const ConfigManager = require('../src/config/ConfigManager');

describe('ConfigManager corruption handling', () => {
  test('creates defaults when configuration is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-config-'));
    const file = path.join(dir, 'config.json');
    const manager = new ConfigManager(file);
    expect(manager.get('general.logLevel')).toBe('info');
    expect(fs.existsSync(file)).toBe(true);
  });

  test('throws a typed configuration error for malformed JSON', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-config-'));
    const file = path.join(dir, 'config.json');
    fs.writeFileSync(file, '{malformed', 'utf8');

    expect(() => new ConfigManager(file)).toThrow(/Invalid configuration file/);
    try { new ConfigManager(file); } catch (error) {
      expect(error.code).toBe('CONFIGURATION_ERROR');
    }
  });
});
