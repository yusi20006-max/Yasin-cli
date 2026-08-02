const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');
const ConfigManager = require('../src/config/ConfigManager');
const DoctorCommand = require('../src/commands/doctor');

describe('DoctorCommand', () => {
  let tempConfigPath;
  let configManager;
  let doctorCommand;
  let logMock, errorMock;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-test-'));
    tempConfigPath = path.join(tempDir, 'config.json');
    configManager = new ConfigManager(tempConfigPath);
    doctorCommand = new DoctorCommand(configManager);

    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    logMock.mockRestore();
    errorMock.mockRestore();
    try {
      const pluginDir = path.join(path.dirname(tempConfigPath), 'plugins');
      if (fs.existsSync(pluginDir)) {
        fs.rmdirSync(pluginDir);
      }
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        fs.rmdirSync(path.dirname(tempConfigPath));
      }
    } catch (e) {
      // ignore
    }
  });

  it('should run diagnostics and find issues if plugins dir is missing', () => {
    doctorCommand.execute([], {});
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Running Yasin CLI Diagnostics...'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Plugin Directory:'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Status: 1 issue(s) found.'));
  });

  it('should auto-heal and create plugins directory when --fix is provided', () => {
    const pluginDir = path.join(path.dirname(tempConfigPath), 'plugins');
    expect(fs.existsSync(pluginDir)).toBe(false);

    doctorCommand.execute([], { fix: true });

    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Attempting auto-healing...'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Created plugin directory:'));
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Status: All repairable issues fixed!'));
    expect(fs.existsSync(pluginDir)).toBe(true);
  });

  it('should handle legacy Node.js versions gracefully', () => {
    const originalVersion = process.version;
    Object.defineProperty(process, 'version', {
      value: 'v16.0.0',
      writable: true,
      configurable: true
    });

    doctorCommand.execute([], {});
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Legacy, recommended >= v18.x'));

    Object.defineProperty(process, 'version', {
      value: originalVersion,
      writable: true,
      configurable: true
    });
  });

  it('should handle missing git gracefully', () => {
    const execSyncSpy = jest.spyOn(child_process, 'execSync').mockImplementation(() => {
      throw new Error('git not found');
    });

    doctorCommand.execute([], {});
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('git is not installed or not in PATH'));

    execSyncSpy.mockRestore();
  });
});
