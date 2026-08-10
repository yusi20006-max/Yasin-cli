const LogsCommand = require('../src/commands/logs');

describe('LogsCommand automation contract', () => {
  test('returns structured JSON result without printing raw logs', () => {
    const serviceManager = {
      getServiceLogs: jest.fn(() => 'line 1\nline 2')
    };
    const command = new LogsCommand(serviceManager);
    const result = command.execute(['yasin-relay', '2'], { json: true });

    expect(result).toEqual({
      ok: true,
      code: 0,
      data: {
        service: 'yasin-relay',
        lines: 2,
        output: 'line 1\nline 2'
      }
    });
    expect(serviceManager.getServiceLogs).toHaveBeenCalledWith('yasin-relay', 2);
  });

  test('preserves human-readable output mode', () => {
    const serviceManager = {
      getServiceLogs: jest.fn(() => 'line 1')
    };
    const command = new LogsCommand(serviceManager);
    const print = jest.spyOn(console, 'log').mockImplementation(() => {});

    expect(command.execute(['yasin-relay'], {})).toBe('line 1');
    expect(print).toHaveBeenCalledWith('line 1');
    print.mockRestore();
  });

  test('rejects invalid line count', () => {
    const command = new LogsCommand({ getServiceLogs: jest.fn() });
    expect(() => command.execute(['yasin-relay', '0'], { json: true })).toThrow();
    expect(() => command.execute(['yasin-relay', '10001'], { json: true })).toThrow();
  });
});
