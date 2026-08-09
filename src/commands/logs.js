const Command = require('../core/Command');

class LogsCommand extends Command {
  constructor(serviceManager) {
    super({ name: 'logs', description: 'Show logs for a managed Yasin service', args: [{ name: 'service', required: true, description: 'Managed service id' }, { name: 'lines', required: false, description: 'Number of log lines' }] });
    this.serviceManager = serviceManager;
  }

  execute(args) {
    const serviceId = args[0];
    const lines = args[1] === undefined ? 50 : Number(args[1]);
    if (!Number.isInteger(lines) || lines < 1 || lines > 10000) {
      throw new Error('lines must be an integer between 1 and 10000.');
    }
    const output = this.serviceManager.getServiceLogs(serviceId, lines);
    console.log(output);
    return output;
  }
}

module.exports = LogsCommand;
