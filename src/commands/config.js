const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');
const ExitCodes = require('../output/ExitCodes');

class ConfigCommand extends Command {
  constructor(configManager) {
    super({
      name: 'config',
      description: 'Manage CLI configuration settings',
      supportsJson: true,
      args: [
        { name: 'action', required: true, description: 'Action to perform: get, set, list, or delete' },
        { name: 'key', required: false, description: 'Configuration key (e.g., general.theme)' },
        { name: 'value', required: false, description: 'Value to set (required for "set" action)' }
      ]
    });
    this.configManager = configManager;
  }

  execute(args) {
    const action = args[0];
    const key = args[1];
    const value = args[2];

    if (!['get', 'set', 'delete', 'list'].includes(action)) {
      return AutomationResult.failure(
        ExitCodes.INVALID_COMMAND,
        `Unknown action "${action}". Supported actions: get, set, delete, list`
      );
    }

    if ((action === 'get' || action === 'delete') && !key) {
      return AutomationResult.failure(ExitCodes.INVALID_COMMAND, `Key is required for "${action}" action.`);
    }

    if (action === 'set' && (!key || value === undefined)) {
      return AutomationResult.failure(ExitCodes.INVALID_COMMAND, 'Both key and value are required for "set" action.');
    }

    if (action === 'get') {
      const val = this.configManager.get(key);
      return AutomationResult.success({ action, key, value: val });
    }

    if (action === 'list') {
      return AutomationResult.success({ action, value: this.configManager.list() });
    }

    if (action === 'set') {
      let parsedValue = value;
      try { parsedValue = JSON.parse(value); } catch (_) { /* keep string */ }
      const changed = this.configManager.set(key, parsedValue);
      if (!changed) return AutomationResult.failure(ExitCodes.CONFIGURATION_ERROR, `Unable to set configuration key "${key}".`);
      return AutomationResult.success({ action, key, value: parsedValue });
    }

    const changed = this.configManager.delete(key);
    if (!changed) return AutomationResult.failure(ExitCodes.CONFIGURATION_ERROR, `Unable to delete configuration key "${key}".`);
    return AutomationResult.success({ action, key });
  }
}

module.exports = ConfigCommand;
