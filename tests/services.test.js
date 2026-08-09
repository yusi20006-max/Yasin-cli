const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../src/config/ConfigManager');
const ServiceManager = require('../src/services/ServiceManager');
const ServiceCommand = require('../src/commands/service');

describe('ServiceManager & ServiceCommand', () => {
  let tempConfigPath;
  let configManager;
  let serviceManager;
  let serviceCommand;
  let logMock, errorMock, exitMock;

  beforeEach(() => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-test-'));
    tempConfigPath = path.join(tempDir, 'config.json');
    configManager = new ConfigManager(tempConfigPath);
    serviceManager = new ServiceManager(configManager);
    serviceCommand = new ServiceCommand(serviceManager);
    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    logMock.mockRestore(); errorMock.mockRestore(); exitMock.mockRestore();
    try { serviceManager.listServices().filter(s => s.status === 'running').forEach(s => serviceManager.stopService(s.id)); } catch (e) {}
    try {
      const logDir = path.join(path.dirname(tempConfigPath), 'logs');
      if (fs.existsSync(logDir)) { fs.readdirSync(logDir).forEach(f => fs.unlinkSync(path.join(logDir, f))); fs.rmdirSync(logDir); }
      const stateFile = path.join(path.dirname(tempConfigPath), 'services-state.json'); if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
      if (fs.existsSync(tempConfigPath)) { fs.unlinkSync(tempConfigPath); fs.rmdirSync(path.dirname(tempConfigPath)); }
    } catch (e) {}
  });

  it('should register and list services correctly', () => {
    serviceManager.registerService('test-api', 'Test API', 'node', ['app.js'], { PORT: 5000 });
    const list = serviceManager.listServices();
    expect(list).toHaveLength(1); expect(list[0].id).toBe('test-api'); expect(list[0].name).toBe('Test API'); expect(list[0].command).toBe('node'); expect(list[0].status).toBe('stopped');
  });

  it('should unregister services and clean up state', () => {
    serviceManager.registerService('test-api', 'Test API', 'node', ['app.js']);
    expect(serviceManager.listServices()).toHaveLength(1); serviceManager.unregisterService('test-api'); expect(serviceManager.listServices()).toHaveLength(0);
  });

  it('should fail starting unregistered service', () => {
    expect(() => serviceManager.startService('ghost-service')).toThrow('not configured with an executable command');
  });

  it('should spawn a real cross-platform background service and stop it', async () => {
    serviceManager.registerService('ping-loop', 'Ping Loop', 'node', ['-e', 'setInterval(() => { console.log("ping"); }, 1000);']);
    const details = serviceManager.startService('ping-loop');
    expect(details.status).toBe('running'); expect(details.pid).toBeGreaterThan(0); expect(serviceManager.isProcessRunning(details.pid)).toBe(true);
    expect(serviceManager.listServices()[0].status).toBe('running');
    expect(serviceManager.stopService('ping-loop')).toBe(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(serviceManager.isProcessRunning(details.pid)).toBe(false); expect(serviceManager.listServices()[0].status).toBe('stopped'); expect(serviceManager.listServices()[0].pid).toBeNull();
  });

  it('should support register CLI action', () => {
    serviceCommand.execute(['register', 'cli-srv', 'CLI Service', 'node', '-v']);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Successfully registered service "cli-srv"'));
    expect(serviceManager.listServices()).toHaveLength(1); expect(serviceManager.listServices()[0].id).toBe('cli-srv');
  });

  it('should show logs of background service', () => {
    serviceManager.registerService('log-srv', 'Log Srv', 'node', ['-v']);
    fs.writeFileSync(path.join(serviceManager.logDir, 'log-srv.log'), 'line 1\nline 2\nline 3\n', 'utf8');
    expect(serviceManager.getServiceLogs('log-srv', 2)).toContain('line 2\nline 3');
  });

  it('should reject an invalid executable before spawning', () => {
    serviceManager.registerService('fail-srv', 'Fail Srv', 'nonexistentbinary12345');
    expect(() => serviceManager.startService('fail-srv')).toThrow('executable not found');
  });
});
