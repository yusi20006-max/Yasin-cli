const Command = require('../src/core/Command');
const CommandRegistry = require('../src/core/CommandRegistry');
const AutomationResult = require('../src/output/AutomationResult');
const ExitCodes = require('../src/output/ExitCodes');

describe('Phase 4.5.1 automation contract', () => {
  test('AutomationResult success has stable shape', () => {
    expect(AutomationResult.success({ value: 1 })).toEqual({ ok: true, code: ExitCodes.SUCCESS, data: { value: 1 } });
  });

  test('AutomationResult failure has stable shape', () => {
    expect(AutomationResult.failure(ExitCodes.GENERAL_ERROR, 'failed', { value: 1 })).toEqual({
      ok: false,
      code: ExitCodes.GENERAL_ERROR,
      data: { value: 1 },
      error: { type: 'GENERAL_ERROR', message: 'failed' }
    });
  });

  test('commands can declare JSON support', () => {
    const command = new Command({ name: 'example', supportsJson: true });
    expect(command.supportsJson).toBe(true);
  });

  test('registry rejects JSON mode for unsupported commands', () => {
    const registry = new CommandRegistry();
    registry.register(new Command({ name: 'example' }));
    const logMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});
    registry.dispatch(['example', '--json']);
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('does not support --json'));
    expect(exitMock).toHaveBeenCalledWith(ExitCodes.INVALID_COMMAND);
    exitMock.mockRestore();
    errorMock.mockRestore();
    logMock.mockRestore();
  });
});
