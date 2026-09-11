'use strict';

/**
 * HubError — stable, fail-closed error taxonomy for YasinHub API failures.
 *
 * Codes:
 *   UNAVAILABLE       Hub not reachable (connection refused / DNS / network)
 *   TIMEOUT           request exceeded the bounded timeout
 *   HTTP_ERROR        non-2xx response that is not a lifecycle refusal
 *   UNKNOWN_SERVICE   Hub reports the service name as not found (404)
 *   REFUSED           Hub refused the lifecycle operation (fail-closed)
 *   INVALID_RESPONSE  Hub answered with malformed/unexpected payload
 *   CONFIG_ERROR      CLI-side Hub configuration is invalid
 *
 * Messages never carry secrets: tokens/keys are redacted at construction.
 */
class HubError extends Error {
  constructor(code, message) {
    super(HubError.redact(message));
    this.name = 'HubError';
    this.code = code;
  }

  static redact(message) {
    if (message === null || message === undefined) return 'Unknown Hub error.';
    const text = String(message);
    return text
      .replace(/(token|secret|password|passwd|api[_-]?key|bearer|authorization)(\s*[:=]\s*)\S+/gi, '$1$2***')
      .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '***')
      .slice(0, 500);
  }
}

HubError.CODES = Object.freeze({
  UNAVAILABLE: 'UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  HTTP_ERROR: 'HTTP_ERROR',
  UNKNOWN_SERVICE: 'UNKNOWN_SERVICE',
  REFUSED: 'REFUSED',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  CONFIG_ERROR: 'CONFIG_ERROR'
});

module.exports = HubError;
