const Command = require('../core/Command');
const ProjectScaffolder = require('../dev/ProjectScaffolder');

class CreateCommand extends Command {
  constructor() {
    super({
      name: 'create',
      description: 'Create a YasinCLI plugin, service, or adapter scaffold',
      args: [
        { name: 'type', required: true, description: 'Resource type: plugin, service, or adapter' },
        { name: 'name', required: true, description: 'Resource name' }
      ]
    });
  }

  execute(args) {
    const [type, name] = args;
    const scaffolder = new ProjectScaffolder();
    let result;
    if (type === 'plugin') result = scaffolder.createPlugin(name);
    else if (type === 'service') result = scaffolder.createService(name);
    else if (type === 'adapter') result = scaffolder.createAdapter(name);
    else throw new Error(`Unsupported resource type "${type}". Use plugin, service, or adapter.`);
    console.log(`Created ${result.type} scaffold: ${result.path}`);
    return result;
  }
}

module.exports = CreateCommand;
