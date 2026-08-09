const ExitCodes = require('../src/runtime/ExitCodes');
const { classifyError } = require('../src/runtime/AutomationResult');

describe('Automation runtime', () => {
  test('defines stable exit codes', () => {
    expect(ExitCodes.SUCCESS).toBe(0);
    expect(ExitCodes.INVALID_COMMAND).toBe(2);
    expect(ExitCodes.SERVICE_UNAVAILABLE).toBe(3);
  });

  test('classifies typed errors', () => {
    expect(classifyError({ code: 'CONFIGURATION_ERROR' })).toBe(4);
    expect(classifyError({ code: 'DEPENDENCY_ERROR' })).toBe(5);
    expect(classifyError(new Error('boom'))).toBe(1);
  });
});
