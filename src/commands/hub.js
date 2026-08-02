const Command = require('../core/Command');
const HubAdapter = require('../adapters/HubAdapter');

class HubCommand extends Command {
  constructor() {
    super({
      name: 'hub',
      description: 'Manage and integrate with YasinHub projects & workspaces',
      args: [
        { name: 'subcommand', required: true, description: 'Action to perform: status, start, stop, restart, or doctor' }
      ]
    });
    this.adapter = new HubAdapter();
  }

  async execute(args, _options) {
    const subcommand = args[0];

    try {
      if (subcommand === 'status') {
        const status = await this.adapter.status();
        console.log(`=== YasinHub Status ===`);
        console.log(`Active:            ${status.active}`);
        console.log(`Uptime:            ${status.uptime}s`);
        console.log(`Connected Agents:  ${status.connectedAgents}`);
        console.log(`Workspaces Count:  ${status.workspacesCount}`);
        console.log(`Projects Count:    ${status.projectsCount}`);
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
        console.log(`=== YasinHub Doctor ===`);
        console.log(`Issues Found:      ${doc.issuesFound}`);
        console.log(`Compatible:        ${doc.compatible}`);
      } else {
        console.error(`Error: Unknown subcommand "${subcommand}". Supported subcommands: status, start, stop, restart, doctor`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error managing YasinHub: ${err.message}`);
      process.exit(1);
    }
  }
}

module.exports = HubCommand;
