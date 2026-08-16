'use strict';

const fs = require('fs');
const path = require('path');

describe('launcher contract', () => {
  test('bin/yasin.js exists and is the package bin target', () => {
    const root = path.join(__dirname, '..');
    const binJs = path.join(root, 'bin', 'yasin.js');
    expect(fs.existsSync(binJs)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    expect(pkg.bin.yasin).toBe('./bin/yasin.js');
  });

  test('yasin.sh compatibility wrapper exists', () => {
    const sh = path.join(__dirname, '..', 'yasin.sh');
    expect(fs.existsSync(sh)).toBe(true);
    const body = fs.readFileSync(sh, 'utf8');
    expect(body).toMatch(/src\/index\.js/);
  });

  test('LICENSE file exists', () => {
    expect(fs.existsSync(path.join(__dirname, '..', 'LICENSE'))).toBe(true);
  });
});
