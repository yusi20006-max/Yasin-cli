const fs = require('fs');
const path = require('path');
const os = require('os');
const { bootstrap } = require('../src/index');

describe('Yasin CLI Bootstrap', () => {
  let tempDir;
  let oldXdg, oldAppdata;
  let logMock, errorMock, exitMock;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-bootstrap-test-'));

    // Backup env
    oldXdg = process.env.XDG_CONFIG_HOME;
    oldAppdata = process.env.APPDATA;

    // Direct ConfigManager to use our temp dir
    process.env.XDG_CONFIG_HOME = tempDir;
    process.env.APPDATA = tempDir;

    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    logMock.mockRestore();
    errorMock.mockRestore();
    exitMock.mockRestore();

    process.env.XDG_CONFIG_HOME = oldXdg;
    process.env.APPDATA = oldAppdata;

    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {}
  });

  it('should run global help successfully when dispatched with no arguments', () => {
    // Override process.argv
    const originalArgv = process.argv;
    process.argv = ['node', 'src/index.js'];

    bootstrap();

    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin CLI - v'));
    expect(exitMock).toHaveBeenCalledWith(0);

    process.argv = originalArgv;
  });

  it('should run doctor successfully', () => {
    const originalArgv = process.argv;
    process.argv = ['node', 'src/index.js', 'doctor'];

    bootstrap();

    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Running Yasin CLI Diagnostics...'));
    expect(exitMock).not.toHaveBeenCalledWith(1);

    process.argv = originalArgv;
  });
});
