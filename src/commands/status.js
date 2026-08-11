const Command = require('../core/Command');
const os = require('os');

class StatusCommand extends Command {
  constructor(configManager, serviceManager = null, pluginSystem = null) {
    super({
      name: 'status',
      description: 'Show current CLI status, running services, loaded plugins, and system resources'
    });
    this.configManager = configManager;
    this.serviceManager = serviceManager;
    this.pluginSystem = pluginSystem;
  }

  execute(args, options) {
    console.log('=== Yasin CLI Status ===\n');

    // 1. CLI Metadata
    const version = require('../core/version').getVersion();

    console.log(`CLI Version:       v${version}`);
    console.log(`Config Directory:  ${this.configManager.configDir}`);
    console.log(`Config File:       ${this.configManager.configPath}`);
    console.log();

    // 2. System Resource Usage
    console.log('--- System Resources ---');
    const uptimeSec = os.uptime();
    const uptimeStr = this.formatUptime(uptimeSec);
    console.log(`OS Uptime:         ${uptimeStr}`);

    const freeMemGb = (os.freemem() / (1024 ** 3)).toFixed(2);
    const totalMemGb = (os.totalmem() / (1024 ** 3)).toFixed(2);
    console.log(`System Memory:     ${freeMemGb} GB free / ${totalMemGb} GB total`);

    const processHeapMb = (process.memoryUsage().heapUsed / (1024 ** 2)).toFixed(2);
    console.log(`CLI Process Memory:${processHeapMb} MB heap used`);

    const cpus = os.cpus();
    console.log(`CPU Cores:         ${cpus.length}x ${cpus[0] ? cpus[0].model : 'Unknown'}`);

    if (process.platform !== 'win32') {
      const load = os.loadavg();
      console.log(`System Load (Avg): ${load[0].toFixed(2)}, ${load[1].toFixed(2)}, ${load[2].toFixed(2)}`);
    }
    console.log();

    // 3. Active Services
    console.log('--- Managed Services ---');
    if (this.serviceManager) {
      const services = this.serviceManager.listServices ? this.serviceManager.listServices() : [];
      const runningServices = services.filter(s => s.status === 'running');
      if (services.length === 0) {
        console.log('No services registered.');
      } else {
        console.log(`Total registered:  ${services.length}`);
        console.log(`Running:           ${runningServices.length}`);
        services.forEach(s => {
          console.log(`  - [${s.status.toUpperCase()}] ${s.id} (PID: ${s.pid || 'N/A'})`);
        });
      }
    } else {
      console.log('Service Manager not initialized.');
    }
    console.log();

    // 4. Loaded Plugins
    console.log('--- Active Plugins ---');
    if (this.pluginSystem) {
      const plugins = this.pluginSystem.listPlugins ? this.pluginSystem.listPlugins() : [];
      const enabledPlugins = plugins.filter(p => p.enabled);
      if (plugins.length === 0) {
        console.log('No plugins installed.');
      } else {
        console.log(`Total installed:   ${plugins.length}`);
        console.log(`Enabled:           ${enabledPlugins.length}`);
        plugins.forEach(p => {
          const statusStr = p.enabled ? 'ENABLED' : 'DISABLED';
          console.log(`  - [${statusStr}] ${p.id} v${p.version || '1.0.0'}`);
        });
      }
    } else {
      console.log('Plugin System not initialized.');
    }
  }

  formatUptime(sec) {
    const days = Math.floor(sec / (3600 * 24));
    const hours = Math.floor((sec % (3600 * 24)) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }
}

module.exports = StatusCommand;
