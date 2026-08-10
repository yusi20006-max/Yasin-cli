const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor(customConfigPath = null) {
    this.defaults = {
      services: {},
      plugins: {},
      general: { theme: 'default', logLevel: 'info' }
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
    return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'yasin');
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.configDir)) fs.mkdirSync(this.configDir, { recursive: true });
  }

  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      this.saveConfig(this.defaults);
      return JSON.parse(JSON.stringify(this.defaults));
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return this.deepMerge(this.defaults, parsed);
    } catch (error) {
      const wrapped = new Error(`Invalid configuration file: ${this.configPath}`);
      wrapped.code = 'CONFIGURATION_ERROR';
      wrapped.cause = error;
      throw wrapped;
    }
  }

  saveConfig(data) {
    this.ensureDirectoryExists();
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf8');
  }

  isKeySafe(keyPath) {
    if (!keyPath) return true;
    const forbidden = ['__proto__', 'constructor', 'prototype'];
    return !keyPath.split('.').some(part => forbidden.includes(part));
  }

  get(keyPath, defaultValue = undefined) {
    if (!keyPath) return this.config;
    if (!this.isKeySafe(keyPath)) return defaultValue;
    const value = this.getValueByPath(this.config, keyPath);
    return value !== undefined ? value : defaultValue;
  }

  set(keyPath, value) {
    if (!keyPath || !this.isKeySafe(keyPath)) return false;
    this.setValueByPath(this.config, keyPath, value);
    this.saveConfig(this.config);
    return true;
  }

  delete(keyPath) {
    if (!keyPath || !this.isKeySafe(keyPath)) return false;
    const parts = keyPath.split('.');
    let current = this.config;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || typeof current[part] !== 'object') return false;
      current = current[part];
    }
    const finalKey = parts[parts.length - 1];
    if (!Object.prototype.hasOwnProperty.call(current, finalKey)) return false;
    delete current[finalKey];
    this.saveConfig(this.config);
    return true;
  }

  list() { return this.config; }

  getValueByPath(obj, keyPath) {
    if (!this.isKeySafe(keyPath)) return undefined;
    return keyPath.split('.').reduce((acc, part) => (
      acc && acc[part] !== undefined ? acc[part] : undefined
    ), obj);
  }

  setValueByPath(obj, keyPath, value) {
    if (!this.isKeySafe(keyPath)) return false;
    const parts = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || typeof current[part] !== 'object') current[part] = {};
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
    return true;
  }

  deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (!this.isKeySafe(key)) return;
        if (this.isObject(source[key])) {
          output[key] = this.deepMerge(this.isObject(target[key]) ? target[key] : {}, source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  }

  isObject(item) { return item && typeof item === 'object' && !Array.isArray(item); }
}

module.exports = ConfigManager;
