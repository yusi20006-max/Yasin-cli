const fs = require('fs');
const path = require('path');

class PluginSystem {
  constructor(configManager, commandRegistry, serviceManager) {
    this.configManager = configManager;
    this.registry = commandRegistry;
    this.serviceManager = serviceManager;
    this.pluginsDir = path.join(this.configManager.configDir, 'plugins');

    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }
  }

  installPlugin(srcPath) {
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Plugin source path "${srcPath}" does not exist.`);
    }

    // Read metadata
    let meta = null;
    const yasinMetaPath = path.join(srcPath, 'yasin-plugin.json');
    const pkgMetaPath = path.join(srcPath, 'package.json');

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

    if (!meta || !meta.id) {
      throw new Error('Invalid plugin: Could not find valid yasin-plugin.json or package.json with "yasinPlugin" flag.');
    }

    const destDir = path.join(this.pluginsDir, meta.id);
    if (fs.existsSync(destDir)) {
      // Remove existing to upgrade
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    // Copy directory recursively using native fs.cpSync (Node 16.7+)
    fs.cpSync(srcPath, destDir, { recursive: true });

    // Update config
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
    if (!pluginsConfig[id]) {
      throw new Error(`Plugin "${id}" is not installed.`);
    }

    const destDir = path.join(this.pluginsDir, id);
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    delete pluginsConfig[id];
    this.configManager.set('plugins', pluginsConfig);
    return true;
  }

  enablePlugin(id) {
    const pluginsConfig = this.configManager.get('plugins') || {};
    if (!pluginsConfig[id]) {
      throw new Error(`Plugin "${id}" is not installed.`);
    }
    pluginsConfig[id].enabled = true;
    this.configManager.set('plugins', pluginsConfig);
  }

  disablePlugin(id) {
    const pluginsConfig = this.configManager.get('plugins') || {};
    if (!pluginsConfig[id]) {
      throw new Error(`Plugin "${id}" is not installed.`);
    }
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

      const pluginDir = path.join(this.pluginsDir, id);
      const entryFile = path.resolve(pluginDir, plugin.main || 'index.js');

      if (!fs.existsSync(entryFile)) {
        console.warn(`Warning: Entry file "${entryFile}" for plugin "${id}" does not exist.`);
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
