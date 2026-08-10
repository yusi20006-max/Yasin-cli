const fs = require('fs');
const path = require('path');

const manifest = require('../package.json');
const lockfile = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8'));

function normalizeBinPaths(bin) {
  if (!bin || typeof bin !== 'object') return bin;
  return Object.fromEntries(
    Object.entries(bin).map(([name, value]) => [name, value.replace(/^\.\//, '')])
  );
}

describe('npm lockfile contract', () => {
  test('root package metadata matches package.json', () => {
    const root = lockfile.packages[''];
    expect(root).toBeDefined();
    expect(root.name).toBe(manifest.name);
    expect(root.version).toBe(manifest.version);
    expect(normalizeBinPaths(root.bin)).toEqual(normalizeBinPaths(manifest.bin));
  });

  test('root development dependencies match package.json', () => {
    const root = lockfile.packages[''];
    expect(root.devDependencies).toEqual(manifest.devDependencies);
  });
});
