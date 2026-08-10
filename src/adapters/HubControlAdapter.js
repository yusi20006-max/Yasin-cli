class HubControlAdapter {
  constructor({ transport, timeoutMs = 10000, version = '1' } = {}) {
    if (!transport || typeof transport.request !== 'function') {
      throw new TypeError('HubControlAdapter requires a transport with request()');
    }
    this.transport = transport;
    this.timeoutMs = timeoutMs;
    this.version = version;
  }

  request(operation, service = 'all', params = {}) {
    return this.transport.request({
      version: this.version,
      requestId: params.requestId,
      operation,
      service,
      params,
      timeoutMs: this.timeoutMs
    });
  }

  status(service = 'all', params = {}) { return this.request('status', service, params); }
  health(service = 'all', params = {}) { return this.request('health', service, params); }
  start(service, params = {}) { return this.request('start', service, params); }
  stop(service, params = {}) { return this.request('stop', service, params); }
  restart(service, params = {}) { return this.request('restart', service, params); }
  doctor(service = 'all', params = {}) { return this.request('doctor', service, params); }
  logs(service, params = {}) { return this.request('logs', service, params); }
}

module.exports = HubControlAdapter;
