const { spawnSync } = require('child_process');
const path = require('path');

const cli = path.join(__dirname, '..', 'src', 'index.js');

describe('automation subprocess contract', () => {
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    env: { ...process.env, YASIN_CLI_TEST: '1' }
  });

  test('status --json emits parseable JSON and success exit code', () => {
    const result = run('status', '--json');
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.ok).toBe(true);
    expect(payload.code).toBe(0);
  });

  test('invalid command returns stable invalid-command exit code', () => {
    const result = run('__invalid_command__');
    expect(result.status).toBe(2);
  });

  test('unsupported JSON mode returns stable invalid-command exit code', () => {
    const result = run('version', '--json');
    expect(result.status).toBe(2);
  });
});
