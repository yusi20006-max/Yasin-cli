const Command = require('../core/Command');

class RelayCommand extends Command {
  constructor(adapter) {
    super({
      name: 'relay',
      description: 'Manage and monitor YasinRelay ecosystem components',
      args: [
        { name: 'action', required: true, description: 'Action to perform: status, doctor, start, stop, restart, version, or config' },
        { name: 'subAction', required: false, description: 'Sub-action (for config: get, set, delete, list)' },
        { name: 'key', required: false, description: 'Configuration key' },
        { name: 'value', required: false, description: 'Configuration value' }
      ]
    });
    this.adapter = adapter;
  }

  execute(args, options) {
    const action = args[0];

    if (action === 'status') {
      const status = this.adapter.status();
      console.log(`=== YasinRelay Status ===\n`);
      console.log(`Status:  ${status.status.toUpperCase()}`);
      console.log(`PID:     ${status.pid || 'N/A'}`);
      if (status.startTime && status.status === 'running') {
        const uptime = Math.floor((Date.now() - status.startTime) / 1000);
        console.log(`Uptime:  ${uptime}s`);
      }
      return;
    }

    if (action === 'doctor') {
      const report = this.adapter.doctor();
      console.log(`=== YasinRelay Diagnostics ===\n`);
      console.log(`Overall: ${report.status.toUpperCase()}`);
      console.log(`Checks:`);
      report.checks.forEach(c => {
        console.log(`  - [${c.status}] ${c.name}`);
      });
      return;
    }

    if (action === 'start') {
      try {
        const details = this.adapter.start();
        console.log(`YasinRelay started successfully with PID ${details.pid}.`);
      } catch (err) {
        console.error(`Error starting YasinRelay: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (action === 'stop') {
      const success = this.adapter.stop();
      if (success) {
        console.log(`YasinRelay stopped successfully.`);
      } else {
        console.log(`YasinRelay was not running or not found.`);
      }
      return;
    }

    if (action === 'restart') {
      console.log(`Restarting YasinRelay...`);
      try {
        const details = this.adapter.restart();
        console.log(`YasinRelay restarted successfully with PID ${details.pid}.`);
      } catch (err) {
        console.error(`Error restarting YasinRelay: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (action === 'version') {
      const version = this.adapter.version();
      console.log(`YasinRelay version: ${version}`);
      return;
    }

    if (action === 'config') {
      const subAction = args[1] || 'list';
      const key = args[2];
      const value = args[3];

      if (subAction === 'get') {
        if (!key) {
          console.error('Error: Key is required for config get.');
          process.exit(1);
        }
        const val = this.adapter.config('get', key);
        console.log(val !== undefined ? val : 'undefined');
        return;
      }

      if (subAction === 'set') {
        if (!key || value === undefined) {
          console.error('Error: Key and value are required for config set.');
          process.exit(1);
        }
        this.adapter.config('set', key, value);
        console.log(`Successfully set config "${key}" to "${value}".`);
        return;
      }

      if (subAction === 'delete') {
        if (!key) {
          console.error('Error: Key is required for config delete.');
          process.exit(1);
        }
        this.adapter.config('delete', key);
        console.log(`Successfully deleted config "${key}".`);
        return;
      }

      if (subAction === 'list') {
        const cfg = this.adapter.config('list');
        console.log(JSON.stringify(cfg, null, 2));
        return;
      }

      console.error(`Error: Unknown config action "${subAction}". Supported actions: get, set, delete, list`);
      process.exit(1);
    }

    console.error(`Error: Unknown action "${action}". Supported actions: status, doctor, start, stop, restart, version, config`);
    process.exit(1);
  }
}

module.exports = RelayCommand;
