const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../src/config/ConfigManager');
const StatusCommand = require('../src/commands/status');

describe('StatusCommand', () => {
  let tempConfigPath;
  let configManager;
  let statusCommand;
  let logMock;

  // Mock service manager and plugin system
  const mockServiceManager = {
    listServices: jest.fn().mockReturnValue([
      { id: 'web-api', status: 'running', pid: 1234 },
      { id: 'db-cache', status: 'stopped', pid: null }
    ])
  };

  const mockPluginSystem = {
    listPlugins: jest.fn().mockReturnValue([
      { id: 'github-sync', enabled: true, version: '1.2.0' },
      { id: 'slack-notifier', enabled: false, version: '0.9.0' }
    ])
  };

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-test-'));
    tempConfigPath = path.join(tempDir, 'config.json');
    configManager = new ConfigManager(tempConfigPath);
    statusCommand = new StatusCommand(configManager, mockServiceManager, mockPluginSystem);

    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logMock.mockRestore();
    try {
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        fs.rmdirSync(path.dirname(tempConfigPath));
      }
    } catch (e) {
      // ignore
    }
  });

  it('should print full status report', () => {
    statusCommand.execute([], {});

    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin CLI Status ==='));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('CLI Version:'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Config Directory:'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('OS Uptime:'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('System Memory:'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('CLI Process Memory:'));

    // Services
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('--- Managed Services ---'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Total registered:  2'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Running:           1'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('- [RUNNING] web-api (PID: 1234)'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('- [STOPPED] db-cache (PID: N/A)'));

    // Plugins
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('--- Active Plugins ---'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Total installed:   2'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Enabled:           1'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('- [ENABLED] github-sync v1.2.0'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('- [DISABLED] slack-notifier v0.9.0'));
  });

  it('should handle uninitialized services or plugins elegantly', () => {
    const basicStatus = new StatusCommand(configManager, null, null);
    basicStatus.execute([], {});

    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Service Manager not initialized.'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Plugin System not initialized.'));
  });

  it('should format uptime correctly', () => {
    expect(statusCommand.formatUptime(45)).toBe('45s');
    expect(statusCommand.formatUptime(120)).toBe('2m 0s');
    expect(statusCommand.formatUptime(3665)).toBe('1h 1m 5s');
    expect(statusCommand.formatUptime(90061)).toBe('1d 1h 1m 1s');
  });
});
