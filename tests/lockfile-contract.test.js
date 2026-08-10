const fs = require('fs');
const path = require('path');

const manifest = require('../package.json');
const lockfile = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8'));

describe('npm lockfile contract', () => {
  test('root package metadata matches package.json', () => {
    const root = lockfile.packages[''];
    expect(root).toBeDefined();
    expect(root.name).toBe(manifest.name);
    expect(root.version).toBe(manifest.version);
    expect(root.bin).toEqual(manifest.bin);
  });

  test('root development dependencies match package.json', () => {
    const root = lockfile.packages[''];
    expect(root.devDependencies).toEqual(manifest.devDependencies);
  });
});
