const ConfigCommand = require('../src/commands/config');
const ExitCodes = require('../src/output/ExitCodes');

describe('ConfigCommand result contract', () => {
  function createConfig() {
    const values = { general: { logLevel: 'info' } };
    return {
      get: jest.fn((key) => key === 'general.logLevel' ? values.general.logLevel : undefined),
      set: jest.fn((key, value) => { values.general.logLevel = value; return true; }),
      delete: jest.fn(() => true),
      list: jest.fn(() => values)
    };
  }

  test('does not terminate the process for invalid arguments', () => {
    const result = new ConfigCommand(createConfig()).execute(['get']);
    expect(result.ok).toBe(false);
    expect(result.code).toBe(ExitCodes.INVALID_COMMAND);
  });

  test('returns structured results for get/list/set/delete', () => {
    const command = new ConfigCommand(createConfig());
    expect(command.execute(['get', 'general.logLevel']).ok).toBe(true);
    expect(command.execute(['list']).ok).toBe(true);
    expect(command.execute(['set', 'general.logLevel', 'debug']).ok).toBe(true);
    expect(command.execute(['delete', 'general.logLevel']).ok).toBe(true);
  });
});
