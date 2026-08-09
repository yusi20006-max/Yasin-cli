const fs = require('fs');
const path = require('path');

class PluginSystem {
  constructor(configManager, commandRegistry, serviceManager) {
    this.configManager = configManager;
    this.registry = commandRegistry;
    this.serviceManager = serviceManager;
    this.pluginsDir = path.resolve(path.join(this.configManager.configDir, 'plugins'));
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  isValidPluginId(id) {
    return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 100;
  }

  resolveInside(baseDir, candidate) {
    const base = path.resolve(baseDir);
    const resolved = path.resolve(candidate);
    return resolved === base || resolved.startsWith(`${base}${path.sep}`) ? resolved : null;
  }

  getPluginDir(id) {
    if (!this.isValidPluginId(id)) {
      throw new Error(`Invalid plugin id "${id}".`);
    }
    const resolved = this.resolveInside(this.pluginsDir, path.join(this.pluginsDir, id));
    if (!resolved) throw new Error(`Plugin path escapes the plugin directory.`);
    return resolved;
  }

  installPlugin(srcPath) {
    const source = path.resolve(srcPath);
    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
      throw new Error(`Plugin source path "${srcPath}" does not exist or is not a directory.`);
    }

    let meta = null;
    const yasinMetaPath = path.join(source, 'yasin-plugin.json');
    const pkgMetaPath = path.join(source, 'package.json');

    if (fs.existsSync(yasinMetaPath)) {
      meta = JSON.parse(fs.readFileSync(yasinMetaPath, 'utf8'));
    } else if (fs.existsSync(pkgMetaPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgMetaPath, 'utf8'));
      if (pkg.yasinPlugin) {
        meta = {
          id: pkg.name,
          name: pkg.name,
          version: pkg.version || '1.0.0',
          description: pkg.description || '',
          main: pkg.main || 'index.js'
        };
      }
    }

    if (!meta || !this.isValidPluginId(meta.id)) {
      throw new Error('Invalid plugin: plugin id must match [a-zA-Z0-9_-]+ and be at most 100 characters.');
    }

    const destDir = this.getPluginDir(meta.id);
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    fs.cpSync(source, destDir, { recursive: true });

    const pluginsConfig = this.configManager.get('plugins') || {};
    pluginsConfig[meta.id] = {
      id: meta.id,
      name: meta.name || meta.id,
      version: meta.version || '1.0.0',
      description: meta.description || '',
      main: meta.main || 'index.js',
      enabled: true,
      installedAt: Date.now()
    };
    this.configManager.set('plugins', pluginsConfig);

    return pluginsConfig[meta.id];
  }

  uninstallPlugin(id) {
    const pluginsConfig = this.configManager.get('plugins') || {};
    if (!pluginsConfig[id]) throw new Error(`Plugin "${id}" is not installed.`);

    const destDir = this.getPluginDir(id);
    if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true });

    delete pluginsConfig[id];
    this.configManager.set('plugins', pluginsConfig);
    return true;
  }

  enablePlugin(id) {
    const pluginsConfig = this.configManager.get('plugins') || {};
    if (!pluginsConfig[id]) throw new Error(`Plugin "${id}" is not installed.`);
    this.getPluginDir(id);
    pluginsConfig[id].enabled = true;
    this.configManager.set('plugins', pluginsConfig);
  }

  disablePlugin(id) {
    const pluginsConfig = this.configManager.get('plugins') || {};
    if (!pluginsConfig[id]) throw new Error(`Plugin "${id}" is not installed.`);
    this.getPluginDir(id);
    pluginsConfig[id].enabled = false;
    this.configManager.set('plugins', pluginsConfig);
  }

  listPlugins() {
    const pluginsConfig = this.configManager.get('plugins') || {};
    return Object.values(pluginsConfig);
  }

  loadPlugins() {
    const pluginsConfig = this.configManager.get('plugins') || {};
    const loaded = [];

    Object.keys(pluginsConfig).forEach(id => {
      const plugin = pluginsConfig[id];
      if (!plugin.enabled) return;

      let pluginDir;
      try {
        pluginDir = this.getPluginDir(id);
      } catch (err) {
        console.error(`Error loading plugin "${id}": ${err.message}`);
        return;
      }

      const entryFile = this.resolveInside(pluginDir, path.join(pluginDir, plugin.main || 'index.js'));
      if (!entryFile || !fs.existsSync(entryFile) || !fs.statSync(entryFile).isFile()) {
        console.warn(`Warning: Entry file for plugin "${id}" is missing or outside its plugin directory.`);
        return;
      }

      try {
        const moduleExports = require(entryFile);
        const context = {
          registry: this.registry,
          configManager: this.configManager,
          serviceManager: this.serviceManager,
          pluginSystem: this
        };

        if (typeof moduleExports === 'function') {
          moduleExports(context);
        } else if (moduleExports && typeof moduleExports.init === 'function') {
          moduleExports.init(context);
        } else if (moduleExports && typeof moduleExports.register === 'function') {
          moduleExports.register(context);
        } else {
          throw new Error('Plugin does not export an initialization function or init/register method.');
        }

        loaded.push(id);
      } catch (err) {
        console.error(`Error loading plugin "${id}": ${err.message}`);
      }
    });

    return loaded;
  }
}

module.exports = PluginSystem;
