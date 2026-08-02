const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor(customConfigPath = null) {
    this.defaults = {
      services: {},
      plugins: {},
      general: {
        theme: 'default',
        logLevel: 'info'
      }
    };

    if (customConfigPath) {
      this.configDir = path.dirname(customConfigPath);
      this.configPath = customConfigPath;
    } else {
      this.configDir = this.getDefaultConfigDir();
      this.configPath = path.join(this.configDir, 'config.json');
    }

    this.ensureDirectoryExists();
    this.config = this.loadConfig();
  }

  getDefaultConfigDir() {
    const home = os.homedir();
    if (process.platform === 'win32') {
      return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'yasin');
    }
    // Linux, Termux, macOS
    const xdgConfig = process.env.XDG_CONFIG_HOME;
    if (xdgConfig) {
      return path.join(xdgConfig, 'yasin');
    }
    return path.join(home, '.config', 'yasin');
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      this.saveConfig(this.defaults);
      return JSON.parse(JSON.stringify(this.defaults));
    }
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all required fields exist
      return this.deepMerge(this.defaults, parsed);
    } catch (e) {
      // In case of corruption, return a copy of defaults
      return JSON.parse(JSON.stringify(this.defaults));
    }
  }

  saveConfig(data) {
    this.ensureDirectoryExists();
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf8');
  }

  isKeySafe(keyPath) {
    if (!keyPath) return true;
    const forbidden = ['__proto__', 'constructor', 'prototype'];
    const parts = keyPath.split('.');
    return !parts.some(part => forbidden.includes(part));
  }

  get(keyPath, defaultValue = undefined) {
    if (!keyPath) return this.config;
    if (!this.isKeySafe(keyPath)) {
      console.warn(`Warning: Key contains prohibited prototype-pollution keywords.`);
      return defaultValue;
    }
    const value = this.getValueByPath(this.config, keyPath);
    return value !== undefined ? value : defaultValue;
  }

  set(keyPath, value) {
    if (!keyPath) return;
    if (!this.isKeySafe(keyPath)) {
      console.warn(`Warning: Attempted setting prohibited prototype-pollution key.`);
      return;
    }
    this.setValueByPath(this.config, keyPath, value);
    this.saveConfig(this.config);
  }

  delete(keyPath) {
    if (!keyPath) return;
    if (!this.isKeySafe(keyPath)) {
      console.warn(`Warning: Attempted deleting prohibited prototype-pollution key.`);
      return;
    }
    const parts = keyPath.split('.');
    let current = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || typeof current[part] !== 'object') {
        return;
      }
      current = current[part];
    }
    delete current[parts[parts.length - 1]];
    this.saveConfig(this.config);
  }

  list() {
    return this.config;
  }

  getValueByPath(obj, keyPath) {
    if (!this.isKeySafe(keyPath)) return undefined;
    return keyPath.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : undefined;
    }, obj);
  }

  setValueByPath(obj, keyPath, value) {
    if (!this.isKeySafe(keyPath)) return;
    const parts = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
        return;
      }
      if (current[part] === undefined || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    const lastPart = parts[parts.length - 1];
    if (lastPart !== '__proto__' && lastPart !== 'constructor' && lastPart !== 'prototype') {
      current[lastPart] = value;
    }
  }

  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return;
        }
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            // Clone the object to prevent shared references
            output[key] = this.deepMerge({}, source[key]);
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}

module.exports = ConfigManager;
