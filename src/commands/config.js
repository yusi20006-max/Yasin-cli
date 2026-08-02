const Command = require('../core/Command');

class ConfigCommand extends Command {
  constructor(configManager) {
    super({
      name: 'config',
      description: 'Manage CLI configuration settings',
      args: [
        { name: 'action', required: true, description: 'Action to perform: get, set, list, or delete' },
        { name: 'key', required: false, description: 'Configuration key (e.g., general.theme)' },
        { name: 'value', required: false, description: 'Value to set (required for "set" action)' }
      ]
    });
    this.configManager = configManager;
  }

  execute(args, options) {
    const action = args[0];
    const key = args[1];
    const value = args[2];

    if (action === 'get') {
      if (!key) {
        console.error('Error: Key is required for "get" action.');
        process.exit(1);
      }
      const val = this.configManager.get(key);
      if (val === undefined) {
        console.log('undefined');
      } else if (typeof val === 'object') {
        console.log(JSON.stringify(val, null, 2));
      } else {
        console.log(val);
      }
    } else if (action === 'set') {
      if (!key || value === undefined) {
        console.error('Error: Both key and value are required for "set" action.');
        process.exit(1);
      }

      // Try to parse value as JSON if possible (for numbers, booleans, arrays, objects)
      let parsedValue = value;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        // Keep as string if parsing fails
      }

      this.configManager.set(key, parsedValue);
      console.log(`Successfully set "${key}" to: ${JSON.stringify(parsedValue)}`);
    } else if (action === 'delete') {
      if (!key) {
        console.error('Error: Key is required for "delete" action.');
        process.exit(1);
      }
      this.configManager.delete(key);
      console.log(`Successfully deleted "${key}"`);
    } else if (action === 'list') {
      const config = this.configManager.list();
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.error(`Error: Unknown action "${action}". Supported actions: get, set, delete, list`);
      process.exit(1);
    }
  }
}

module.exports = ConfigCommand;
