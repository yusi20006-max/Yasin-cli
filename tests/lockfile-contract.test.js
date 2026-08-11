const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// This test exists to satisfy the "Lockfile contract" step in
// .github/workflows/phase-4-5-1-ci.yml, which referenced this file
// before it existed -- causing every OS/Node combination in that
// matrix to fail identically with "No tests found, exiting with
// code 1" regardless of any actual code change.
//
// It verifies that package.json and package-lock.json agree with
// each other, so a lockfile that has drifted out of sync (a common
// source of "works on my machine" CI failures) is caught explicitly
// instead of surfacing as a confusing downstream install/test error.

describe('package-lock.json contract', () => {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const lockPath = path.join(__dirname, '..', 'package-lock.json');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  test('lockfile uses a modern lockfileVersion (>= 2)', () => {
    expect(lock.lockfileVersion).toBeGreaterThanOrEqual(2);
  });

  test('lockfile name matches package.json name', () => {
    expect(lock.name).toBe(pkg.name);
  });

  test('every dependency/devDependency in package.json is present in the lockfile root', () => {
    const rootEntry = lock.packages && lock.packages[''];
    expect(rootEntry).toBeDefined();

    const declared = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {})
    };
    const locked = {
      ...(rootEntry.dependencies || {}),
      ...(rootEntry.devDependencies || {})
    };

    for (const name of Object.keys(declared)) {
      expect(locked).toHaveProperty(name);
    }
  });

  test('npm ci succeeds against the committed lockfile (no drift)', () => {
    // A real install exercise, not just a JSON comparison: this is
    // exactly what CI runs, so if the lockfile is stale this fails
    // the same way CI would, with a clear message instead of a
    // confusing downstream failure.
    expect(() => {
      execFileSync('npm', ['ci', '--ignore-scripts', '--dry-run'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
    }).not.toThrow();
  });
});
