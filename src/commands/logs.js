const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');

class LogsCommand extends Command {
  constructor(serviceManager) {
    super({
      name: 'logs',
      description: 'Show logs for a managed Yasin service',
      args: [
        { name: 'service', required: true, description: 'Managed service id' },
        { name: 'lines', required: false, description: 'Number of log lines' }
      ],
      options: [
        { name: '--json', type: 'boolean', default: false, description: 'Emit machine-readable JSON' }
      ],
      supportsJson: true
    });
    this.serviceManager = serviceManager;
  }

  execute(args, options = {}) {
    const serviceId = args[0];
    const lines = args[1] === undefined ? 50 : Number(args[1]);
    if (!Number.isInteger(lines) || lines < 1 || lines > 10000) {
      throw new Error('lines must be an integer between 1 and 10000.');
    }

    const output = this.serviceManager.getServiceLogs(serviceId, lines);

    if (options.json) {
      return AutomationResult.success({
        service: serviceId,
        lines,
        output
      });
    }

    console.log(output);
    return output;
  }
}

module.exports = LogsCommand;
