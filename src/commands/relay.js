const Command = require('../core/Command');
const RelayAdapter = require('../adapters/RelayAdapter');

class RelayCommand extends Command {
  constructor() {
    super({
      name: 'relay',
      description: 'Manage and integrate with YasinRelay feeds & bridges',
      args: [
        { name: 'subcommand', required: true, description: 'Action to perform: status, start, stop, restart, or doctor' }
      ]
    });
    this.adapter = new RelayAdapter();
  }

  async execute(args, _options) {
    const subcommand = args[0];

    try {
      if (subcommand === 'status') {
        const status = await this.adapter.status();
        console.log(`=== YasinRelay Status ===`);
        console.log(`Active:            ${status.active}`);
        console.log(`PID:               ${status.pid}`);
        console.log(`Uptime:            ${status.uptime}s`);
        console.log(`Active Feeds:      ${status.activeFeeds}`);
        console.log(`Active Bridges:    ${status.activeBridges}`);
        console.log(`Queue Size:        ${status.queueSize}`);
        console.log(`Sync Status:       ${status.syncStatus}`);
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
        console.log(`=== YasinRelay Doctor ===`);
        console.log(`Issues Found:      ${doc.issuesFound}`);
        console.log(`Compatible:        ${doc.compatible}`);
      } else {
        console.error(`Error: Unknown subcommand "${subcommand}". Supported subcommands: status, start, stop, restart, doctor`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error managing YasinRelay: ${err.message}`);
      process.exit(1);
    }
  }
}

module.exports = RelayCommand;
