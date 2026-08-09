const CoreCommand = require('../src/commands/core');
const AgentCommand = require('../src/commands/agent');
const HubCommand = require('../src/commands/hub');
const RelayCommand = require('../src/commands/relay');

describe('Ecosystem Commands', () => {
  let logMock;
  beforeEach(() => { logMock = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { logMock.mockRestore(); });

  const adapter = serviceId => ({
    status: jest.fn().mockReturnValue({ id: serviceId, status: 'running', pid: 9876 }),
    doctor: jest.fn().mockReturnValue({ status: 'healthy', checks: [{ name: 'Test Check', status: 'PASS' }] }),
    start: jest.fn().mockReturnValue({ id: serviceId, status: 'running', pid: 9876 }),
    stop: jest.fn().mockReturnValue(true),
    restart: jest.fn().mockReturnValue({ id: serviceId, status: 'running', pid: 9877 }),
    run: jest.fn().mockReturnValue({ status: 0, stdout: 'completed\n', stderr: '' }),
    version: jest.fn().mockReturnValue({ version: '1.0.0', status: 'ok' }),
    config: jest.fn().mockImplementation((action) => action === 'get' ? 'some-val' : action === 'list' ? { mockKey: 'some-val' } : true)
  });

  test.each([
    ['CoreCommand', CoreCommand, 'yasin-core'],
    ['AgentCommand', AgentCommand, 'yasin-agent'],
    ['HubCommand', HubCommand, 'yasin-hub'],
    ['RelayCommand', RelayCommand, 'yasin-relay']
  ])('%s status and doctor use adapter contracts', (name, CommandClass, id) => {
    const a = adapter(id); const cmd = new CommandClass(a);
    cmd.execute(['status']); cmd.execute(['doctor']);
    expect(a.status).toHaveBeenCalled(); expect(a.doctor).toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('"id"'));
  });

  test('CoreCommand exposes inspection only and rejects daemon lifecycle', () => {
    const a = adapter('yasin-core'); const cmd = new CoreCommand(a);
    cmd.execute(['version']); expect(a.version).toHaveBeenCalled();
    expect(() => cmd.execute(['start'])).toThrow('no managed daemon');
    expect(() => cmd.execute(['stop'])).toThrow('no managed daemon');
    expect(() => cmd.execute(['restart'])).toThrow('no managed daemon');
  });

  test('AgentCommand executes its on-demand operation', () => {
    const a = adapter('yasin-agent'); const cmd = new AgentCommand(a);
    cmd.execute(['run']);
    expect(a.run).toHaveBeenCalled();
  });

  test('HubCommand executes its on-demand operation', () => {
    const a = adapter('yasin-hub'); const cmd = new HubCommand(a);
    cmd.execute(['run']);
    expect(a.run).toHaveBeenCalled();
  });

  test('RelayCommand manages the daemon lifecycle', () => {
    const a = adapter('yasin-relay'); const cmd = new RelayCommand(a);
    cmd.execute(['start']); cmd.execute(['stop']); cmd.execute(['restart']);
    expect(a.start).toHaveBeenCalled(); expect(a.stop).toHaveBeenCalled(); expect(a.restart).toHaveBeenCalled();
  });

  test.each([
    [CoreCommand, 'yasin-core'], [AgentCommand, 'yasin-agent'], [HubCommand, 'yasin-hub'], [RelayCommand, 'yasin-relay']
  ])('%s supports configuration operations', (CommandClass, id) => {
    const a = adapter(id); const cmd = new CommandClass(a);
    cmd.execute(['config', 'get', 'someKey']);
    cmd.execute(['config', 'set', 'someKey', 'newVal']);
    cmd.execute(['config', 'delete', 'someKey']);
    cmd.execute(['config', 'list']);
    expect(a.config).toHaveBeenCalledWith('get', 'someKey');
    expect(a.config).toHaveBeenCalledWith('set', 'someKey', 'newVal');
    expect(a.config).toHaveBeenCalledWith('delete', 'someKey');
    expect(a.config).toHaveBeenCalledWith('list');
  });
});
