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

  test('normalizes errors to stable automation shape', () => {
    expect(normalize({ code: 'ENOENT', message: 'missing executable' })).toEqual({
      type: ErrorTypes.SERVICE_UNAVAILABLE,
      code: ExitCodes.SERVICE_UNAVAILABLE,
      message: 'missing executable'
    });
  });
});
