const OutputFormatter = require('../src/output/OutputFormatter');

describe('OutputFormatter', () => {
  test('formats JSON deterministically', () => {
    expect(OutputFormatter.format({ status: 'healthy' }, { json: true })).toBe('{\n  "status": "healthy"\n}');
  });

  test('preserves strings in text mode', () => {
    expect(OutputFormatter.format('healthy')).toBe('healthy');
  });
});
