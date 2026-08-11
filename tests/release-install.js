const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yasin-cli-release-'));
let tarballPath = null;

try {
  const tarballName = execFileSync('npm', ['pack', '--silent'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/).pop();
  if (!tarballName) throw new Error('npm pack did not produce a tarball name.');

  tarballPath = path.join(root, tarballName);
  execFileSync('npm', ['install', '--ignore-scripts', '--prefix', tempDir, tarballPath], {
    cwd: root,
    stdio: 'inherit'
  });

  const binName = process.platform === 'win32' ? 'yasin.cmd' : 'yasin';
  const binPath = path.join(tempDir, 'node_modules', '.bin', binName);
  if (!fs.existsSync(binPath)) throw new Error(`Installed CLI executable not found: ${binPath}`);

  if (process.platform === 'win32') {
    execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', binPath, '--version'], { cwd: tempDir, stdio: 'inherit' });
  } else {
    execFileSync(binPath, ['--version'], { cwd: tempDir, stdio: 'inherit' });
  }
  console.log('Clean package install and installed yasin executable check passed.');
} finally {
  if (tarballPath) {
    try { fs.rmSync(tarballPath, { force: true }); } catch (e) {}
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
}
