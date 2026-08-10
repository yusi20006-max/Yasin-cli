const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-cli-release-'));

try {
  const tarball = execFileSync('npm', ['pack', '--silent'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).pop();
  if (!tarball) throw new Error('npm pack did not produce a tarball name.');

  const tarballPath = path.join(root, tarball);
  execFileSync('npm', ['install', '--ignore-scripts', '--prefix', tempDir, tarballPath], {
    cwd: root,
    stdio: 'inherit'
  });

  const binName = process.platform === 'win32' ? 'yasin.cmd' : 'yasin';
  const binPath = path.join(tempDir, 'node_modules', '.bin', binName);
  if (!fs.existsSync(binPath)) throw new Error(`Installed CLI executable not found: ${binPath}`);

  execFileSync(binPath, ['--version'], { cwd: tempDir, stdio: 'inherit' });
  console.log('Clean package install and installed yasin executable check passed.');
} finally {
  try {
    const entries = fs.readdirSync(root).filter(name => name.startsWith('yasin-cli-') && name.endsWith('.tgz'));
    for (const entry of entries) fs.rmSync(path.join(root, entry), { force: true });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
