const ExitCodes = require('../src/output/ExitCodes');
const { ErrorTypes, classify, normalize } = require('../src/output/ErrorTaxonomy');

describe('automation error taxonomy', () => {
  test.each([
    ['ENOENT', ErrorTypes.SERVICE_UNAVAILABLE],
    ['ECONNREFUSED', ErrorTypes.SERVICE_UNAVAILABLE],
    ['ENOTFOUND', ErrorTypes.SERVICE_UNAVAILABLE]
  ])('classifies %s as service unavailable', (code, expected) => {
    expect(classify({ code })).toBe(expected);
  });

  test('preserves explicit taxonomy', () => {
    expect(classify({ type: ErrorTypes.ADAPTER })).toBe(ErrorTypes.ADAPTER);
  });

  test('preserves typed exit codes', () => {
    expect(classify({ code: 'CONFIGURATION_ERROR' })).toBe(ErrorTypes.CONFIGURATION);
    expect(classify({ code: 'DEPENDENCY_ERROR' })).toBe(ErrorTypes.DEPENDENCY);
    expect(normalize({ code: 'CONFIGURATION_ERROR', message: 'invalid configuration' })).toEqual({
      type: ErrorTypes.CONFIGURATION,
      code: ExitCodes.CONFIGURATION_ERROR,
      message: 'invalid configuration'
    });
    expect(normalize({ code: 'DEPENDENCY_ERROR', message: 'dependency failed' }).code)
      .toBe(ExitCodes.DEPENDENCY_ERROR);
  });

  test('explicit error type remains authoritative', () => {
    expect(normalize({ type: ErrorTypes.INVALID_COMMAND, code: ExitCodes.GENERAL_ERROR }).code)
      .toBe(ExitCodes.INVALID_COMMAND);
  });

  test('normalizes errors to stable automation shape', () => {
    expect(normalize({ code: 'ENOENT', message: 'missing executable' })).toEqual({
      type: ErrorTypes.SERVICE_UNAVAILABLE,
      code: ExitCodes.SERVICE_UNAVAILABLE,
      message: 'missing executable'
    });
  });
});
