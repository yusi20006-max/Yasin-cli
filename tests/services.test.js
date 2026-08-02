const fs = require('fs');
const path = require('path');
const os = require('os');
const child_process = require('child_process');
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
    logMock.mockRestore();
    errorMock.mockRestore();
    exitMock.mockRestore();

    // Stop any spawned services in test
    try {
      const list = serviceManager.listServices();
      list.forEach(s => {
        if (s.status === 'running') {
          serviceManager.stopService(s.id);
        }
      });
    } catch (e) {}

    try {
      const logDir = path.join(path.dirname(tempConfigPath), 'logs');
      if (fs.existsSync(logDir)) {
        fs.readdirSync(logDir).forEach(f => {
          fs.unlinkSync(path.join(logDir, f));
        });
        fs.rmdirSync(logDir);
      }
      const stateFile = path.join(path.dirname(tempConfigPath), 'services-state.json');
      if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
      }
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
        fs.rmdirSync(path.dirname(tempConfigPath));
      }
    } catch (e) {
      // ignore
    }
  });

  it('should register and list services correctly', () => {
    serviceManager.registerService('test-api', 'Test API', 'node', ['app.js'], { PORT: 5000 });
    const list = serviceManager.listServices();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('test-api');
    expect(list[0].name).toBe('Test API');
    expect(list[0].command).toBe('node');
    expect(list[0].status).toBe('stopped');
  });

  it('should unregister services and clean up state', () => {
    serviceManager.registerService('test-api', 'Test API', 'node', ['app.js']);
    expect(serviceManager.listServices().length).toBe(1);

    serviceManager.unregisterService('test-api');
    expect(serviceManager.listServices().length).toBe(0);
  });

  it('should fail starting unregistered service', () => {
    expect(() => {
      serviceManager.startService('ghost-service');
    }).toThrow('is not registered');
  });

  it('should spawn a real cross-platform background service and stop it', async () => {
    // Register a simple infinite loop using Node
    serviceManager.registerService(
      'ping-loop',
      'Ping Loop',
      'node',
      ['-e', 'setInterval(() => { console.log("ping"); }, 1000);']
    );

    const details = serviceManager.startService('ping-loop');
    expect(details.status).toBe('running');
    expect(details.pid).toBeGreaterThan(0);
    expect(serviceManager.isProcessRunning(details.pid)).toBe(true);

    // Verify service list shows running
    const list = serviceManager.listServices();
    expect(list[0].status).toBe('running');
    expect(list[0].pid).toBe(details.pid);

    // Stop the service
    const stopped = serviceManager.stopService('ping-loop');
    expect(stopped).toBe(true);

    // Wait slightly for OS process teardown
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(serviceManager.isProcessRunning(details.pid)).toBe(false);

    const listPostStop = serviceManager.listServices();
    expect(listPostStop[0].status).toBe('stopped');
    expect(listPostStop[0].pid).toBeNull();
  });

  it('should support register CLI action', () => {
    serviceCommand.execute(['register', 'cli-srv', 'CLI Service', 'node', '-v']);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Successfully registered service "cli-srv"'));

    const list = serviceManager.listServices();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe('cli-srv');
  });

  it('should show logs of background service', () => {
    serviceManager.registerService('log-srv', 'Log Srv', 'node', ['-v']);

    // Create a dummy log file
    const logFile = path.join(serviceManager.logDir, 'log-srv.log');
    fs.writeFileSync(logFile, 'line 1\nline 2\nline 3\n', 'utf8');

    const logs = serviceManager.getServiceLogs('log-srv', 2);
    expect(logs).toContain('line 2\nline 3');
  });

  it('should handle synchronous spawn failures gracefully', () => {
    // Intentionally pass an invalid command (which fails instantly or is invalid)
    serviceManager.registerService('fail-srv', 'Fail Srv', '');
    expect(() => {
      serviceManager.startService('fail-srv');
    }).toThrow('Failed to spawn service');
  });

  it('should handle asynchronous spawn failures gracefully and write to logs', async () => {
    serviceManager.registerService('async-fail-srv', 'Async Fail Srv', 'nonexistentbinary12345');

    // It should not throw synchronously (since spawn returns child, but child emits 'error' asynchronously)
    let errOccurred = false;
    let details;
    try {
      details = serviceManager.startService('async-fail-srv');
    } catch (e) {
      errOccurred = true;
    }

    // Node child_process.spawn might throw ENOENT synchronously on some platforms (like Windows/Mac)
    // and emit it asynchronously on others. We support both.
    if (!errOccurred) {
      expect(details.status).toBe('running');
      // Wait for the async error to fire
      await new Promise(resolve => setTimeout(resolve, 200));

      const services = serviceManager.listServices();
      const status = services.find(s => s.id === 'async-fail-srv').status;
      expect(status).toBe('stopped');

      const logs = serviceManager.getServiceLogs('async-fail-srv');
      expect(logs).toContain('Asynchronous execution error:');
    }
  });
});
