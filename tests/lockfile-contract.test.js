const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

describe('package-lock.json contract', () => {
  const projectRoot = path.join(__dirname, '..');
  const pkgPath = path.join(projectRoot, 'package.json');
  const lockPath = path.join(projectRoot, 'package-lock.json');

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
      ...(pkg.devDependencies || {}),
    };

    const locked = {
      ...(rootEntry.dependencies || {}),
      ...(rootEntry.devDependencies || {}),
    };

    for (const name of Object.keys(declared)) {
      expect(locked).toHaveProperty(name);
    }
  });

  test('npm ci succeeds against the committed lockfile (no drift)', () => {
    const isolatedUserConfig = path.join(
      os.tmpdir(),
      `yasin-cli-npmrc-${process.pid}-${Date.now()}`
    );

    fs.writeFileSync(isolatedUserConfig, '', 'utf8');

    try {
      expect(() => {
        const env = { ...process.env };

        delete env.npm_config_allow_scripts;
        delete env.NPM_CONFIG_ALLOW_SCRIPTS;

        env.npm_config_userconfig = isolatedUserConfig;

        execFileSync('npm', ['ci', '--dry-run'], {
          cwd: projectRoot,
          stdio: 'pipe',
          shell: process.platform === 'win32',
          env,
        });
      }).not.toThrow();
    } finally {
      fs.rmSync(isolatedUserConfig, { force: true });
    }
  });
});
