const DoctorCommand = require('../src/commands/doctor');
const AutomationResult = require('../src/output/AutomationResult');
const ExitCodes = require('../src/output/ExitCodes');

describe('DoctorCommand contracts', () => {
  test('JSON mode returns AutomationResult without human output responsibility', () => {
    const config = {
      configDir: process.cwd(),
      ensureDirectoryExists: jest.fn()
    };
    const command = new DoctorCommand(config);
    const result = command.execute([], { json: true });

    expect(result).toBeInstanceOf(AutomationResult);
    expect(result.data).toHaveProperty('results');
    expect(result.code).toBeGreaterThanOrEqual(ExitCodes.SUCCESS);
  });

  test('diagnostic result exposes deterministic health state', () => {
    const config = {
      configDir: process.cwd(),
      ensureDirectoryExists: jest.fn()
    };
    const result = new DoctorCommand(config).execute([], { json: true });

    expect(typeof result.data.healthy).toBe('boolean');
    expect(typeof result.data.issues).toBe('number');
    expect(Array.isArray(result.data.results)).toBe(true);
  });
});
