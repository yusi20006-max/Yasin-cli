const Command = require('../core/Command');

class ServiceCommand extends Command {
  constructor(serviceManager) {
    super({
      name: 'service',
      description: 'Register, start, stop, monitor, and view logs of background services',
      args: [
        { name: 'action', required: true, description: 'Action to perform: register, unregister, start, stop, restart, list, or logs' },
        { name: 'id', required: false, description: 'Service ID' },
        { name: 'nameOrCommand', required: false, description: 'Service friendly name (for register)' },
        { name: 'command', required: false, description: 'Command to run (for register)' }
      ],
      options: [
        { name: '--lines', alias: '-n', type: 'number', default: 50, description: 'Number of lines of logs to show' }
      ]
    });
    this.serviceManager = serviceManager;
  }

  execute(args, options) {
    const action = args[0];
    const id = args[1];

    if (action === 'list') {
      const list = this.serviceManager.listServices();
      if (list.length === 0) {
        console.log('No registered services found. Use "yasin service register" to add a service.');
        return;
      }
      console.log('=== Registered Services ===\n');
      list.forEach(s => {
        const pidStr = s.pid ? `(PID: ${s.pid})` : '';
        const uptimeStr = s.startTime && s.status === 'running'
          ? `(Uptime: ${Math.floor((Date.now() - s.startTime) / 1000)}s)`
          : '';
        console.log(`- [${s.status.toUpperCase()}] ${s.id}: ${s.name || 'Service'} ${pidStr} ${uptimeStr}`);
        console.log(`  Command: ${s.command} ${(s.args || []).join(' ')}`);
      });
      return;
    }

    if (!id) {
      console.error(`Error: Service ID is required for action "${action}".`);
      process.exit(1);
    }

    if (action === 'register') {
      const name = args[2];
      const command = args[3];
      if (!name || !command) {
        console.error('Error: Friendly name and executable command are required to register a service.');
        console.error('Usage: yasin service register <id> <name> <command> [args...]');
        process.exit(1);
      }

      // Collect extra arguments
      const serviceArgs = args.slice(4);
      this.serviceManager.registerService(id, name, command, serviceArgs);
      console.log(`Successfully registered service "${id}".`);
      return;
    }

    if (action === 'unregister') {
      const success = this.serviceManager.unregisterService(id);
      if (success) {
        console.log(`Successfully unregistered service "${id}".`);
      } else {
        console.error(`Error: Service "${id}" is not registered.`);
        process.exit(1);
      }
      return;
    }

    if (action === 'start') {
      try {
        const details = this.serviceManager.startService(id);
        console.log(`Service "${id}" started successfully with PID ${details.pid}.`);
      } catch (err) {
        console.error(`Error starting service: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (action === 'stop') {
      const success = this.serviceManager.stopService(id);
      if (success) {
        console.log(`Service "${id}" stopped successfully.`);
      } else {
        console.log(`Service "${id}" was not running or not found.`);
      }
      return;
    }

    if (action === 'restart') {
      console.log(`Restarting service "${id}"...`);
      this.serviceManager.stopService(id);
      try {
        const details = this.serviceManager.startService(id);
        console.log(`Service "${id}" restarted successfully with PID ${details.pid}.`);
      } catch (err) {
        console.error(`Error starting service: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (action === 'logs') {
      const logs = this.serviceManager.getServiceLogs(id, options.lines);
      console.log(`=== Logs for Service "${id}" ===\n`);
      console.log(logs);
      return;
    }

    console.error(`Error: Unknown action "${action}". Supported actions: register, unregister, start, stop, restart, list, logs`);
    process.exit(1);
  }
}

module.exports = ServiceCommand;
