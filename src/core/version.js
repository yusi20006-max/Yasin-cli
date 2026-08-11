const fs = require('fs');
const path = require('path');

const FALLBACK_VERSION = '1.0.0';

function getVersion() {
  try {
    const pkgPath = path.join(__dirname, '..', '..', 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) return pkg.version;
    }
  } catch (e) {
    // fall through to default below
  }
  return FALLBACK_VERSION;
}

module.exports = { getVersion, FALLBACK_VERSION };
