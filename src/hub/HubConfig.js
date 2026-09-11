'use strict';

/**
 * HubConfig — resolve YasinHub connection settings.
 *
 * Precedence: CLI config `hub.*` > environment > built-in defaults.
 *   baseUrl:  hub.baseUrl | YASINHUB_BASE_URL | YASIN_HUB_URL | http://127.0.0.1:7000
 *   timeout:  hub.timeoutMs | YASINHUB_TIMEOUT_MS | 30000
 *   managed:  hub.managedServices | verified default set (overridable)
 *
 * The default managed set mirrors the Hub registry services verified on
 * Termux (v1.0.1, 5/5 PASS). It classifies which names the CLI must route
 * to YasinHub instead of its local ServiceManager; the Hub remains
 * authoritative at runtime (unknown names fail closed via Hub 404).
 */
const DEFAULT_BASE_URL = 'http://127.0.0.1:7000';
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MANAGED_SERVICES = Object.freeze([
  'yasin-agent',
  'yasin-ai',
  'yasinrelay',
  'yasinfeed',
  'yasinpress'
]);

function resolveHubSettings(configManager) {
  const fromConfig = (key) => {
    try {
      return configManager ? configManager.get(`hub.${key}`) : undefined;
    } catch (e) {
      return undefined;
    }
  };
  const baseUrl = fromConfig('baseUrl')
    || process.env.YASINHUB_BASE_URL
    || process.env.YASIN_HUB_URL
    || DEFAULT_BASE_URL;
  const rawTimeout = fromConfig('timeoutMs') || process.env.YASINHUB_TIMEOUT_MS || DEFAULT_TIMEOUT_MS;
  const timeoutMs = Number(rawTimeout);
  const configuredManaged = fromConfig('managedServices');
  const managedServices = Array.isArray(configuredManaged) && configuredManaged.length > 0
    ? configuredManaged.filter((name) => typeof name === 'string' && name.length > 0)
    : [...DEFAULT_MANAGED_SERVICES];
  return { baseUrl: String(baseUrl), timeoutMs, managedServices };
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MANAGED_SERVICES,
  resolveHubSettings
};
