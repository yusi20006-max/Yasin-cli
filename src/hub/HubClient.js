'use strict';

const HubError = require('./HubError');

/**
 * HubClient — minimal HTTP client for the verified YasinHub control API.
 *
 * Verified surface (YasinHub v1.0.1, yasinhub/api/server.py):
 *   GET  /api/health                          -> { status: 'ok', service: 'YasinHub' }
 *   GET  /api/status                          -> { ecosystem, projects: [...] }
 *   GET  /api/services                        -> { ecosystem, services: [...] }
 *   GET|POST /api/control/<service>/<action>  -> { service, action, success,
 *                                                  status, pid, message,
 *                                                  process_running[, error] }
 *     200 success, 404 unknown service, 409 lifecycle refused, 400 bad action.
 *
 * Transport only: no lifecycle decisions live here. Uses the global fetch
 * (Node >= 18, no new dependencies) with a bounded AbortController timeout.
 * The CLI is a pure client; Runit and ownership checks stay inside YasinHub.
 */
class HubClient {
  constructor({ baseUrl, timeoutMs = 30000, fetchImpl = null } = {}) {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new HubError(HubError.CODES.CONFIG_ERROR, 'Hub base URL is not configured.');
    }
    let parsed;
    try {
      parsed = new URL(baseUrl);
    } catch (e) {
      throw new HubError(HubError.CODES.CONFIG_ERROR, `Invalid Hub base URL: ${baseUrl}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new HubError(HubError.CODES.CONFIG_ERROR, 'Hub base URL must use http or https.');
    }
    this.baseUrl = parsed.toString().replace(/\/+$/, '');
    const timeout = Number(timeoutMs);
    if (!Number.isFinite(timeout) || timeout <= 0) {
      throw new HubError(HubError.CODES.CONFIG_ERROR, 'Hub timeout must be a positive number of milliseconds.');
    }
    this.timeoutMs = timeout;
    this.fetchImpl = fetchImpl || ((...args) => fetch(...args));
  }

  async request(method, path, body = undefined) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await this.fetchImpl(url, {
        method,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new HubError(HubError.CODES.TIMEOUT, `YasinHub request timed out after ${this.timeoutMs}ms.`);
      }
      throw new HubError(HubError.CODES.UNAVAILABLE, 'YasinHub is unavailable. Start it with: python -m yasinhub.startup');
    } finally {
      clearTimeout(timer);
    }
    let payload = null;
    try {
      payload = await response.json();
    } catch (e) {
      throw new HubError(HubError.CODES.INVALID_RESPONSE, 'YasinHub returned a malformed response.');
    }
    if (!response.ok) {
      if (response.status === 404) {
        const detail = (payload && (payload.error || payload.message)) || 'service not found';
        throw new HubError(HubError.CODES.UNKNOWN_SERVICE, `Unknown service. ${detail}`);
      }
      const detail = (payload && (payload.error || payload.message)) || `HTTP ${response.status}`;
      throw new HubError(HubError.CODES.HTTP_ERROR, `YasinHub request failed. ${detail}`);
    }
    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new HubError(HubError.CODES.INVALID_RESPONSE, 'YasinHub returned a malformed response.');
    }
    return payload;
  }

  async health() {
    const payload = await this.request('GET', '/api/health');
    if (payload.status !== 'ok') {
      throw new HubError(HubError.CODES.INVALID_RESPONSE, 'YasinHub health check did not report ok.');
    }
    return payload;
  }

  async status() {
    const payload = await this.request('GET', '/api/status');
    if (!Array.isArray(payload.projects)) {
      throw new HubError(HubError.CODES.INVALID_RESPONSE, 'YasinHub status response has no projects list.');
    }
    return payload;
  }

  async services() {
    const payload = await this.request('GET', '/api/services');
    if (!Array.isArray(payload.services)) {
      throw new HubError(HubError.CODES.INVALID_RESPONSE, 'YasinHub services response has no services list.');
    }
    return payload;
  }

  async control(service, action) {
    if (!['start', 'stop', 'restart'].includes(action)) {
      throw new HubError(HubError.CODES.CONFIG_ERROR, `Unsupported lifecycle action "${action}".`);
    }
    if (!service || typeof service !== 'string') {
      throw new HubError(HubError.CODES.CONFIG_ERROR, 'A service name is required.');
    }
    const payload = await this.request('POST', `/api/control/${encodeURIComponent(service)}/${action}`, {});
    if (payload.success !== true) {
      const reason = payload.error || payload.message || 'lifecycle operation refused';
      const code = /not found/i.test(String(reason))
        ? HubError.CODES.UNKNOWN_SERVICE
        : HubError.CODES.REFUSED;
      throw new HubError(code, `YasinHub refused ${action} for "${service}". ${reason}`);
    }
    return payload;
  }
}

module.exports = HubClient;
