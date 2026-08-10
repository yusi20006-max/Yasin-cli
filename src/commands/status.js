const Command = require('../core/Command');
const os = require('os');
const path = require('path');
const fs = require('fs');
const AutomationResult = require('../output/AutomationResult');

class StatusCommand extends Command {
  constructor(configManager, serviceManager = null, pluginSystem = null) {
    super({
      name: 'status',
      description: 'Show current CLI status, running services, loaded plugins, and system resources',
      supportsJson: true
    });
    this.configManager = configManager;
    this.serviceManager = serviceManager;
    this.pluginSystem = pluginSystem;
  }

  getVersion() {
    let version = '1.0.0';
    try {
      const pkgPath = path.join(__dirname, '..', '..', 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        version = pkg.version || version;
      }
    } catch (e) {
      // Keep the fallback version when package metadata is unavailable.
    }
    return version;
  }

  collectStatus() {
    const services = this.serviceManager && this.serviceManager.listServices
      ? this.serviceManager.listServices()
      : [];
    const plugins = this.pluginSystem && this.pluginSystem.listPlugins
      ? this.pluginSystem.listPlugins()
      : [];
    const cpus = os.cpus();

    return {
      cli: {
        version: this.getVersion(),
        configDirectory: this.configManager.configDir,
        configFile: this.configManager.configPath
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        uptimeSeconds: os.uptime(),
        uptime: this.formatUptime(os.uptime()),
        memory: {
          freeBytes: os.freemem(),
          totalBytes: os.totalmem(),
          freeGb: Number((os.freemem() / (1024 ** 3)).toFixed(2)),
          totalGb: Number((os.totalmem() / (1024 ** 3)).toFixed(2)),
          cliHeapUsedBytes: process.memoryUsage().heapUsed
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0] ? cpus[0].model : 'Unknown'
        },
        loadAverage: process.platform === 'win32' ? null : os.loadavg()
      },
      services: {
        initialized: Boolean(this.serviceManager),
        total: services.length,
        running: services.filter(s => s.status === 'running').length,
        items: services
      },
      plugins: {
        initialized: Boolean(this.pluginSystem),
        total: plugins.length,
        enabled: plugins.filter(p => p.enabled).length,
        items: plugins
      }
    };
  }

  execute(args, options = {}) {
    const data = this.collectStatus();
    const result = AutomationResult.success(data);

    if (options.json) {
      return result;
    }

    console.log('=== Yasin CLI Status ===\n');
    console.log(`CLI Version:       v${data.cli.version}`);
    console.log(`Config Directory:  ${data.cli.configDirectory}`);
    console.log(`Config File:       ${data.cli.configFile}`);
    console.log();

    console.log('--- System Resources ---');
    console.log(`OS Uptime:         ${data.system.uptime}`);
    console.log(`System Memory:     ${data.system.memory.freeGb.toFixed(2)} GB free / ${data.system.memory.totalGb.toFixed(2)} GB total`);
    console.log(`CLI Process Memory:${(data.system.memory.cliHeapUsedBytes / (1024 ** 2)).toFixed(2)} MB heap used`);
    console.log(`CPU Cores:         ${data.system.cpu.cores}x ${data.system.cpu.model}`);
    if (data.system.loadAverage) {
      console.log(`System Load (Avg): ${data.system.loadAverage.map(v => v.toFixed(2)).join(', ')}`);
    }
    console.log();

    console.log('--- Managed Services ---');
    if (!data.services.initialized) {
      console.log('Service Manager not initialized.');
    } else if (data.services.total === 0) {
      console.log('No services registered.');
    } else {
      console.log(`Total registered:  ${data.services.total}`);
      console.log(`Running:           ${data.services.running}`);
      data.services.items.forEach(s => {
        console.log(`  - [${s.status.toUpperCase()}] ${s.id} (PID: ${s.pid || 'N/A'})`);
      });
    }
    console.log();

    console.log('--- Active Plugins ---');
    if (!data.plugins.initialized) {
      console.log('Plugin System not initialized.');
    } else if (data.plugins.total === 0) {
      console.log('No plugins installed.');
    } else {
      console.log(`Total installed:   ${data.plugins.total}`);
      console.log(`Enabled:           ${data.plugins.enabled}`);
      data.plugins.items.forEach(p => {
        const statusStr = p.enabled ? 'ENABLED' : 'DISABLED';
        console.log(`  - [${statusStr}] ${p.id} v${p.version || '1.0.0'}`);
      });
    }

    return result;
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
