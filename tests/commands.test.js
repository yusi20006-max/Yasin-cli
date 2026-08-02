const CoreCommand = require('../src/commands/core');
const AgentCommand = require('../src/commands/agent');
const HubCommand = require('../src/commands/hub');
const RelayCommand = require('../src/commands/relay');

describe('Ecosystem Commands', () => {
  let logMock, errorMock, exitMock;

  beforeEach(() => {
    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    logMock.mockRestore();
    errorMock.mockRestore();
    exitMock.mockRestore();
  });

  const createMockAdapter = (serviceId, versionString) => ({
    status: jest.fn().mockReturnValue({ id: serviceId, status: 'running', pid: 9876, startTime: Date.now() - 5000 }),
    doctor: jest.fn().mockReturnValue({ status: 'healthy', checks: [{ name: 'Test Check', status: 'PASS' }] }),
    start: jest.fn().mockReturnValue({ id: serviceId, status: 'running', pid: 9876 }),
    stop: jest.fn().mockReturnValue(true),
    restart: jest.fn().mockReturnValue({ id: serviceId, status: 'running', pid: 9877 }),
    version: jest.fn().mockReturnValue(versionString),
    config: jest.fn().mockImplementation((action, key, value) => {
      if (action === 'get') return 'some-val';
      if (action === 'list') return { mockKey: 'some-val' };
      return true;
    })
  });

  describe('CoreCommand', () => {
    let mockAdapter, cmd;

    beforeEach(() => {
      mockAdapter = createMockAdapter('yasin-core', '1.0.0-mock-core');
      cmd = new CoreCommand(mockAdapter);
    });

    it('should output status info', () => {
      cmd.execute(['status'], {});
      expect(mockAdapter.status).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin-Core Status ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Status:  RUNNING'));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('PID:     9876'));
    });

    it('should output doctor diagnostics', () => {
      cmd.execute(['doctor'], {});
      expect(mockAdapter.doctor).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin-Core Diagnostics ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Overall: HEALTHY'));
    });

    it('should handle start', () => {
      cmd.execute(['start'], {});
      expect(mockAdapter.start).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Core started successfully with PID 9876'));
    });

    it('should handle stop', () => {
      cmd.execute(['stop'], {});
      expect(mockAdapter.stop).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Core stopped successfully'));
    });

    it('should handle restart', () => {
      cmd.execute(['restart'], {});
      expect(mockAdapter.restart).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Core restarted successfully with PID 9877'));
    });

    it('should handle version', () => {
      cmd.execute(['version'], {});
      expect(mockAdapter.version).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Core version: 1.0.0-mock-core'));
    });

    it('should handle config get, set, delete, list', () => {
      cmd.execute(['config', 'get', 'someKey'], {});
      expect(mockAdapter.config).toHaveBeenCalledWith('get', 'someKey');
      expect(logMock).toHaveBeenCalledWith('some-val');

      cmd.execute(['config', 'set', 'someKey', 'newVal'], {});
      expect(mockAdapter.config).toHaveBeenCalledWith('set', 'someKey', 'newVal');
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Successfully set config "someKey" to "newVal"'));

      cmd.execute(['config', 'delete', 'someKey'], {});
      expect(mockAdapter.config).toHaveBeenCalledWith('delete', 'someKey');
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Successfully deleted config "someKey"'));

      cmd.execute(['config', 'list'], {});
      expect(mockAdapter.config).toHaveBeenCalledWith('list');
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('mockKey'));
    });
  });

  describe('AgentCommand', () => {
    let mockAdapter, cmd;

    beforeEach(() => {
      mockAdapter = createMockAdapter('yasin-agent', '1.0.0-mock-agent');
      cmd = new AgentCommand(mockAdapter);
    });

    it('should output status info', () => {
      cmd.execute(['status'], {});
      expect(mockAdapter.status).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin-Agent Status ==='));
    });
  });

  describe('HubCommand', () => {
    let mockAdapter, cmd;

    beforeEach(() => {
      mockAdapter = createMockAdapter('yasin-hub', '1.0.0-mock-hub');
      cmd = new HubCommand(mockAdapter);
    });

    it('should output status info', () => {
      cmd.execute(['status'], {});
      expect(mockAdapter.status).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== YasinHub Status ==='));
    });
  });

  describe('RelayCommand', () => {
    let mockAdapter, cmd;

    beforeEach(() => {
      mockAdapter = createMockAdapter('yasin-relay', '1.0.0-mock-relay');
      cmd = new RelayCommand(mockAdapter);
    });

    it('should output status info', () => {
      cmd.execute(['status'], {});
      expect(mockAdapter.status).toHaveBeenCalled();
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== YasinRelay Status ==='));
    });
  });
});
