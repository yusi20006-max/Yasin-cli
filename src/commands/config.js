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

  renderHuman(result, options = {}) {
    if (options.json) return;
    if (!result.ok) {
      console.error(result.error.message);
      return;
    }
    const data = result.data || {};
    if (data.action === 'list') {
      console.log(JSON.stringify(data.value, null, 2));
    } else if (data.action === 'get') {
      console.log(data.value === undefined ? 'undefined' : String(data.value));
    } else if (data.action === 'set') {
      console.log(`Successfully set "${data.key}" to: ${JSON.stringify(data.value)}`);
    } else if (data.action === 'delete') {
      console.log(`Successfully deleted "${data.key}"`);
    }
  }

  execute(args, options = {}) {
    const action = args[0];
    const key = args[1];
    const value = args[2];
    let result;

    if (!['get', 'set', 'delete', 'list'].includes(action)) {
      result = AutomationResult.failure(
        ExitCodes.INVALID_COMMAND,
        `Unknown action "${action}". Supported actions: get, set, delete, list`
      );
      this.renderHuman(result, options);
      return result;
    }

    if ((action === 'get' || action === 'delete') && !key) {
      result = AutomationResult.failure(ExitCodes.INVALID_COMMAND, `Key is required for "${action}" action.`);
      this.renderHuman(result, options);
      return result;
    }

    if (action === 'set' && (!key || value === undefined)) {
      result = AutomationResult.failure(ExitCodes.INVALID_COMMAND, 'Both key and value are required for "set" action.');
      this.renderHuman(result, options);
      return result;
    }

    if (action === 'get') {
      const val = this.configManager.get(key);
      result = AutomationResult.success({ action, key, value: val });
      this.renderHuman(result, options);
      return result;
    }

    if (action === 'list') {
      result = AutomationResult.success({ action, value: this.configManager.list() });
      this.renderHuman(result, options);
      return result;
    }

    if (action === 'set') {
      let parsedValue = value;
      try { parsedValue = JSON.parse(value); } catch (_) { /* keep string */ }
      const changed = this.configManager.set(key, parsedValue);
      if (!changed) result = AutomationResult.failure(ExitCodes.CONFIGURATION_ERROR, `Unable to set configuration key "${key}".`);
      else result = AutomationResult.success({ action, key, value: parsedValue });
      this.renderHuman(result, options);
      return result;
    }

    const changed = this.configManager.delete(key);
    if (!changed) result = AutomationResult.failure(ExitCodes.CONFIGURATION_ERROR, `Unable to delete configuration key "${key}".`);
    else result = AutomationResult.success({ action, key });
    this.renderHuman(result, options);
    return result;
  }
}

module.exports = ConfigCommand;
