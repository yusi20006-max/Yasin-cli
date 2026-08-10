const Command = require('../src/core/Command');
const CommandRegistry = require('../src/core/CommandRegistry');

class TestCommand extends Command {
  constructor() {
    super({
      name: 'test-cmd',
      description: 'A test command for verification',
      args: [
        { name: 'reqArg', required: true, description: 'Required arg' },
        { name: 'optArg', required: false, description: 'Optional arg' }
      ],
      options: [
        { name: '--flag', alias: '-f', type: 'boolean', description: 'A flag' },
        { name: '--port', alias: '-p', type: 'number', default: 3000, description: 'Port option' }
      ]
    });
    this.executedWith = null;
  }

  execute(args, options) {
    this.executedWith = { args, options };
  }
}

describe('Command Parser Core', () => {
  it('should parse options and positional arguments correctly', () => {
    const cmd = new TestCommand();
    const result = cmd.parse(['hello', 'world', '--flag', '-p', '4000']);
    expect(result.args).toEqual(['hello', 'world']);
    expect(result.options.flag).toBe(true);
    expect(result.options.port).toBe(4000);
  });

  it('should use default values for options when not provided', () => {
    const cmd = new TestCommand();
    const result = cmd.parse(['hello']);
    expect(result.args).toEqual(['hello']);
    expect(result.options.flag).toBe(false);
    expect(result.options.port).toBe(3000);
  });

  it('should parse boolean values correctly', () => {
    const cmd = new TestCommand();
    const result = cmd.parse(['--flag=true']);
    expect(result.options.flag).toBe(true);
  });
});

describe('CommandRegistry', () => {
  let registry;
  let logMock, errorMock, exitMock;

  beforeEach(() => {
    registry = new CommandRegistry();
    logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    logMock.mockRestore();
    errorMock.mockRestore();
    exitMock.mockRestore();
  });

  it('should register and retrieve commands', () => {
    const cmd = new TestCommand();
    registry.register(cmd);
    expect(registry.getCommand('test-cmd')).toBe(cmd);
    expect(registry.listCommands()).toEqual([cmd]);
  });

  it('should print global help and exit when no command is specified', () => {
    registry.dispatch([]);
    expect(logMock).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('should print global help and exit when --help is supplied globally', () => {
    registry.dispatch(['-h']);
    expect(logMock).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('should print version and exit on -v / --version', () => {
    registry.dispatch(['-v']);
    expect(logMock).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('should fail on unknown command with the stable invalid-command exit code', () => {
    registry.dispatch(['unknown-cmd']);
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Unknown command "unknown-cmd"'));
    expect(exitMock).toHaveBeenCalledWith(2);
  });

  it('should dispatch to registered command and execute successfully', () => {
    const cmd = new TestCommand();
    registry.register(cmd);
    registry.dispatch(['test-cmd', 'val1', 'val2', '-f']);
    expect(cmd.executedWith).toEqual({
      args: ['val1', 'val2'],
      options: { flag: true, port: 3000 }
    });
  });

  it('should fail dispatch if required argument is missing with the stable invalid-command exit code', () => {
    const cmd = new TestCommand();
    registry.register(cmd);
    registry.dispatch(['test-cmd']);
    expect(errorMock).toHaveBeenCalledWith(
      'Error executing command "test-cmd":',
      expect.stringContaining('Missing required argument <reqArg>')
    );
    expect(exitMock).toHaveBeenCalledWith(2);
  });

  it('should display command-specific help on command --help / -h', () => {
    const cmd = new TestCommand();
    registry.register(cmd);
    registry.dispatch(['test-cmd', '-h']);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Command: test-cmd'));
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('should support asynchronous command execution and handle successes', async () => {
    class AsyncSuccessCommand extends Command {
      constructor() {
        super({ name: 'async-success' });
        this.called = false;
      }
      async execute() {
        this.called = true;
        return 'done';
      }
    }
    const cmd = new AsyncSuccessCommand();
    registry.register(cmd);
    const p = registry.dispatch(['async-success']);
    expect(p).toBeInstanceOf(Promise);
    const val = await p;
    expect(val).toBe('done');
    expect(cmd.called).toBe(true);
  });

  it('should handle asynchronous command rejections and exit gracefully', async () => {
    class AsyncFailCommand extends Command {
      constructor() {
        super({ name: 'async-fail' });
      }
      async execute() {
        throw new Error('Async execution failure');
      }
    }
    const cmd = new AsyncFailCommand();
    registry.register(cmd);
    const p = registry.dispatch(['async-fail']);
    expect(p).toBeInstanceOf(Promise);
    await p;
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Error executing command "async-fail":'), 'Async execution failure');
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
