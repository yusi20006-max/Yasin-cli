const fs = require('fs');
const path = require('path');

class ProjectScaffolder {
  constructor(baseDir = process.cwd()) {
    this.baseDir = path.resolve(baseDir);
  }

  validateName(name) {
    return typeof name === 'string' && /^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 100;
  }

  resolveTarget(name) {
    if (!this.validateName(name)) throw new Error('Project name must contain only letters, numbers, underscores, or hyphens.');
    const target = path.resolve(this.baseDir, name);
    if (target !== this.baseDir && !target.startsWith(`${this.baseDir}${path.sep}`)) throw new Error('Target path escapes the current directory.');
    return target;
  }

  ensureEmpty(target) {
    if (fs.existsSync(target)) {
      const entries = fs.readdirSync(target);
      if (entries.length) throw new Error(`Target directory is not empty: ${target}`);
    } else {
      fs.mkdirSync(target, { recursive: true });
    }
  }

  write(target, relative, content) {
    const file = path.resolve(target, relative);
    if (file !== target && !file.startsWith(`${target}${path.sep}`)) throw new Error('Generated path escapes the project directory.');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  }

  createPlugin(name) {
    const target = this.resolveTarget(name);
    this.ensureEmpty(target);
    this.write(target, 'yasin-plugin.json', JSON.stringify({ id: name, name, version: '0.1.0', description: 'YasinCLI plugin', main: 'index.js' }, null, 2) + '\n');
    this.write(target, 'index.js', "module.exports = function init({ registry }) {\n  // Register plugin commands here.\n  void registry;\n};\n");
    this.write(target, 'README.md', `# ${name}\n\nYasinCLI plugin scaffold.\n\n## Development\n\nImplement the plugin entry point in index.js.\n`);
    return { type: 'plugin', name, path: target };
  }

  createService(name) {
    const target = this.resolveTarget(name);
    this.ensureEmpty(target);
    this.write(target, 'service.json', JSON.stringify({ id: name, name, version: '0.1.0', mode: 'daemon', command: '', args: [] }, null, 2) + '\n');
    this.write(target, 'README.md', `# ${name}\n\nYasin ecosystem service scaffold.\n`);
    return { type: 'service', name, path: target };
  }

  createAdapter(name) {
    const target = this.resolveTarget(name);
    this.ensureEmpty(target);
    const parts = name.split(/[-_]+/).filter(Boolean);
    const baseName = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
    const identifierBase = /^[A-Za-z_$]/.test(baseName) ? baseName : `Yasin${baseName}`;
    const className = /Adapter$/i.test(identifierBase) ? identifierBase : `${identifierBase}Adapter`;
    this.write(target, `${className}.js`, `const BaseEcosystemAdapter = require('yasin-cli/src/adapters/BaseEcosystemAdapter');\n\nclass ${className} extends BaseEcosystemAdapter {\n  constructor(configManager, serviceManager) {\n    super(configManager, serviceManager, {\n      serviceId: '${name}',\n      configKey: '${name}',\n      envPrefix: '${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}',\n      serviceName: '${name}',\n      mode: 'daemon'\n    });\n  }\n}\n\nmodule.exports = ${className};\n`);
    this.write(target, 'README.md', `# ${className}\n\nYasinCLI adapter scaffold.\n`);
    return { type: 'adapter', name, path: target, className };
  }
}

module.exports = ProjectScaffolder;
