'use strict';

const HubClient = require('./HubClient');
const HubError = require('./HubError');
const { resolveHubSettings } = require('./HubConfig');
const ExitCodes = require('../runtime/ExitCodes');

/**
 * HubLifecycle — gateway routing Hub-managed services to YasinHub.
 *
 * The CLI performs no process control here: every operation is a Hub API
 * call, and Hub owns PID/Runit/ownership decisions. Failures are fail-closed
 * ( HubError taxonomy ) and mapped to CLI exit codes; nothing ever falls
 * back to direct process management.
 */
class HubLifecycle {
  constructor(configManager, client = null) {
    this.settings = resolveHubSettings(configManager);
    this.client = client;
  }

  getClient() {
    if (!this.client) {
      this.client = new HubClient({
        baseUrl: this.settings.baseUrl,
        timeoutMs: this.settings.timeoutMs
      });
    }
    return this.client;
  }

  normalizeName(name) {
    return String(name || '').trim();
  }

  isHubManaged(name) {
    const normalized = this.normalizeName(name).toLowerCase();
    return this.settings.managedServices.some((managed) => managed.toLowerCase() === normalized);
  }

  exitCodeFor(error) {
    if (!(error instanceof HubError)) return ExitCodes.GENERAL_ERROR;
    switch (error.code) {
      case HubError.CODES.UNAVAILABLE:
      case HubError.CODES.TIMEOUT:
        return ExitCodes.SERVICE_UNAVAILABLE;
      case HubError.CODES.UNKNOWN_SERVICE:
        return ExitCodes.INVALID_COMMAND;
      case HubError.CODES.CONFIG_ERROR:
        return ExitCodes.CONFIGURATION_ERROR;
      default:
        return ExitCodes.GENERAL_ERROR;
    }
  }

  async hubHealth() {
    try {
      const payload = await this.getClient().health();
      return { reachable: true, status: payload.status, service: payload.service || 'YasinHub', exitCode: ExitCodes.SUCCESS };
    } catch (err) {
      return { reachable: false, status: 'unavailable', error: err.message, code: err.code || 'UNKNOWN', exitCode: this.exitCodeFor(err) };
    }
  }

  async hubStatus() {
    try {
      const payload = await this.getClient().status();
      const projects = payload.projects.map((project) => ({
        name: project.name,
        status: project.status || 'UNKNOWN',
        pid: project.pid || null,
        processRunning: project.process_running === true,
        message: project.message || ''
      }));
      const running = projects.filter((p) => p.status === 'RUNNING').length;
      const failed = projects.filter((p) => p.status === 'FAILED').length;
      return {
        reachable: true,
        ecosystem: payload.ecosystem || 'Yasin',
        total: projects.length,
        running,
        failed,
        projects,
        exitCode: ExitCodes.SUCCESS
      };
    } catch (err) {
      return { reachable: false, projects: [], error: err.message, code: err.code || 'UNKNOWN', exitCode: this.exitCodeFor(err) };
    }
  }

  async controlService(action, service) {
    const name = this.normalizeName(service);
    if (!name) {
      return { ok: false, action, service: name, error: 'A service name is required.', exitCode: ExitCodes.INVALID_COMMAND };
    }
    try {
      const payload = await this.getClient().control(name, action);
      return {
        ok: true,
        action: payload.action || action,
        service: payload.service || name,
        success: true,
        status: payload.status || 'UNKNOWN',
        pid: payload.pid || null,
        processRunning: payload.process_running === true,
        message: payload.message || 'ok',
        exitCode: ExitCodes.SUCCESS
      };
    } catch (err) {
      return {
        ok: false,
        action,
        service: name,
        success: false,
        error: err.message,
        code: err.code || 'UNKNOWN',
        exitCode: this.exitCodeFor(err)
      };
    }
  }

  async start(service) { return this.controlService('start', service); }
  async stop(service) { return this.controlService('stop', service); }
  async restart(service) { return this.controlService('restart', service); }
}

module.exports = HubLifecycle;
