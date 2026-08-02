const Command = require('../core/Command');
const CoreAdapter = require('../adapters/CoreAdapter');

class CoreCommand extends Command {
  constructor() {
    super({
      name: 'core',
      description: 'Manage and integrate with Yasin-Core runtime',
      args: [
        { name: 'subcommand', required: true, description: 'Action to perform: status, start, stop, restart, or doctor' }
      ]
    });
    this.adapter = new CoreAdapter();
  }

  async execute(args, _options) {
    const subcommand = args[0];

    try {
      if (subcommand === 'status') {
        const status = await this.adapter.status();
        console.log(`=== Yasin-Core Status ===`);
        console.log(`Active:       ${status.active}`);
        console.log(`PID:          ${status.pid}`);
        console.log(`Uptime:       ${status.uptime}s`);
        console.log(`Memory Usage: ${status.memoryUsage}`);
      } else if (subcommand === 'start') {
        const start = await this.adapter.start();
        console.log(start.message);
      } else if (subcommand === 'stop') {
        const stop = await this.adapter.stop();
        console.log(stop.message);
      } else if (subcommand === 'restart') {
        const restart = await this.adapter.restart();
        console.log(restart.message);
      } else if (subcommand === 'doctor') {
        const doc = await this.adapter.doctor();
        console.log(`=== Yasin-Core Doctor ===`);
        console.log(`Issues Found: ${doc.issuesFound}`);
        console.log(`Compatible:   ${doc.compatible}`);
      } else {
        console.error(`Error: Unknown subcommand "${subcommand}". Supported subcommands: status, start, stop, restart, doctor`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error managing Yasin-Core: ${err.message}`);
      process.exit(1);
    }
  }
}

module.exports = CoreCommand;
