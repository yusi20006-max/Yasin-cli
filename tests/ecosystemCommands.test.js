const CoreCommand = require('../src/commands/core');
const AgentCommand = require('../src/commands/agent');
const HubCommand = require('../src/commands/hub');
const RelayCommand = require('../src/commands/relay');

describe('Ecosystem Commands integration and subcommands', () => {
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

  describe('CoreCommand', () => {
    let cmd;
    beforeEach(() => {
      cmd = new CoreCommand();
    });

    it('should invoke status subcommand correctly', async () => {
      await cmd.execute(['status']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin-Core Status ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Active:       true'));
    });

    it('should invoke start subcommand correctly', async () => {
      await cmd.execute(['start']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Core started successfully.'));
    });

    it('should invoke stop subcommand correctly', async () => {
      await cmd.execute(['stop']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Core stopped successfully.'));
    });

    it('should invoke restart subcommand correctly', async () => {
      await cmd.execute(['restart']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Core restarted successfully.'));
    });

    it('should invoke doctor subcommand correctly', async () => {
      await cmd.execute(['doctor']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin-Core Doctor ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Issues Found: 0'));
    });

    it('should fail with unknown subcommand', async () => {
      await cmd.execute(['unknown']);
      expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Unknown subcommand "unknown"'));
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('AgentCommand', () => {
    let cmd;
    beforeEach(() => {
      cmd = new AgentCommand();
    });

    it('should invoke status subcommand correctly', async () => {
      await cmd.execute(['status']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin-Agent Status ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Active:            true'));
    });

    it('should invoke start subcommand correctly', async () => {
      await cmd.execute(['start']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Agent started successfully.'));
    });

    it('should invoke stop subcommand correctly', async () => {
      await cmd.execute(['stop']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Agent stopped successfully.'));
    });

    it('should invoke restart subcommand correctly', async () => {
      await cmd.execute(['restart']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Yasin-Agent restarted successfully.'));
    });

    it('should invoke doctor subcommand correctly', async () => {
      await cmd.execute(['doctor']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== Yasin-Agent Doctor ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Issues Found:      0'));
    });

    it('should fail with unknown subcommand', async () => {
      await cmd.execute(['unknown']);
      expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Unknown subcommand "unknown"'));
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('HubCommand', () => {
    let cmd;
    beforeEach(() => {
      cmd = new HubCommand();
    });

    it('should invoke status subcommand correctly', async () => {
      await cmd.execute(['status']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== YasinHub Status ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Active:            true'));
    });

    it('should invoke start subcommand correctly', async () => {
      await cmd.execute(['start']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('YasinHub service started successfully.'));
    });

    it('should invoke stop subcommand correctly', async () => {
      await cmd.execute(['stop']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('YasinHub service stopped successfully.'));
    });

    it('should invoke restart subcommand correctly', async () => {
      await cmd.execute(['restart']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('YasinHub service restarted successfully.'));
    });

    it('should invoke doctor subcommand correctly', async () => {
      await cmd.execute(['doctor']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== YasinHub Doctor ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Issues Found:      0'));
    });

    it('should fail with unknown subcommand', async () => {
      await cmd.execute(['unknown']);
      expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Unknown subcommand "unknown"'));
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });

  describe('RelayCommand', () => {
    let cmd;
    beforeEach(() => {
      cmd = new RelayCommand();
    });

    it('should invoke status subcommand correctly', async () => {
      await cmd.execute(['status']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== YasinRelay Status ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Active:            true'));
    });

    it('should invoke start subcommand correctly', async () => {
      await cmd.execute(['start']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('YasinRelay service started successfully.'));
    });

    it('should invoke stop subcommand correctly', async () => {
      await cmd.execute(['stop']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('YasinRelay service stopped successfully.'));
    });

    it('should invoke restart subcommand correctly', async () => {
      await cmd.execute(['restart']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('YasinRelay service restarted successfully.'));
    });

    it('should invoke doctor subcommand correctly', async () => {
      await cmd.execute(['doctor']);
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('=== YasinRelay Doctor ==='));
      expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Issues Found:      0'));
    });

    it('should fail with unknown subcommand', async () => {
      await cmd.execute(['unknown']);
      expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Unknown subcommand "unknown"'));
      expect(exitMock).toHaveBeenCalledWith(1);
    });
  });
});
