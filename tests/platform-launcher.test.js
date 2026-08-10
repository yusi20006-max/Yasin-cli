const fs = require('fs');
const path = require('path');

describe('cross-platform launcher contract', () => {
  test('canonical Node launcher exists and delegates to bootstrap', () => {
    const launcher = path.resolve(__dirname, '../bin/yasin.js');
    const source = fs.readFileSync(launcher, 'utf8');

    expect(source).toContain('#!/usr/bin/env node');
    expect(source).toContain("require('../src/index').bootstrap();");
  });

  test('legacy shell launcher delegates to canonical Node launcher', () => {
    const launcher = path.resolve(__dirname, '../yasin.sh');
    const source = fs.readFileSync(launcher, 'utf8');

    expect(source).toContain('exec node');
    expect(source).toContain('/bin/yasin.js');
  });
});
