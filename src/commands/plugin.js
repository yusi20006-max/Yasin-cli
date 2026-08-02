const Command = require('../core/Command');

class PluginCommand extends Command {
  constructor(pluginSystem) {
    super({
      name: 'plugin',
      description: 'Install, uninstall, enable, disable, and list CLI extension plugins',
      args: [
        { name: 'action', required: true, description: 'Action to perform: install, uninstall, enable, disable, or list' },
        { name: 'pathOrId', required: false, description: 'Source path (for install) or Plugin ID (for uninstall/enable/disable)' }
      ]
    });
    this.pluginSystem = pluginSystem;
  }

  execute(args, options) {
    const action = args[0];
    const pathOrId = args[1];

    if (action === 'list') {
      const plugins = this.pluginSystem.listPlugins();
      if (plugins.length === 0) {
        console.log('No plugins installed.');
        return;
      }
      console.log('=== Installed Plugins ===\n');
      plugins.forEach(p => {
        const statusStr = p.enabled ? 'ENABLED' : 'DISABLED';
        console.log(`- [${statusStr}] ${p.id} v${p.version || '1.0.0'}`);
        if (p.name && p.name !== p.id) {
          console.log(`  Name:        ${p.name}`);
        }
        if (p.description) {
          console.log(`  Description: ${p.description}`);
        }
      });
      return;
    }

    if (!pathOrId) {
      console.error(`Error: Plugin ID or Source Path is required for action "${action}".`);
      process.exit(1);
    }

    if (action === 'install') {
      try {
        const details = this.pluginSystem.installPlugin(pathOrId);
        console.log(`Plugin "${details.id}" v${details.version} installed and enabled successfully.`);
      } catch (err) {
        console.error(`Error installing plugin: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (action === 'uninstall') {
      try {
        this.pluginSystem.uninstallPlugin(pathOrId);
        console.log(`Plugin "${pathOrId}" uninstalled successfully.`);
      } catch (err) {
        console.error(`Error uninstalling plugin: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (action === 'enable') {
      try {
        this.pluginSystem.enablePlugin(pathOrId);
        console.log(`Plugin "${pathOrId}" enabled successfully. It will load next time you run Yasin CLI.`);
      } catch (err) {
        console.error(`Error enabling plugin: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    if (action === 'disable') {
      try {
        this.pluginSystem.disablePlugin(pathOrId);
        console.log(`Plugin "${pathOrId}" disabled successfully.`);
      } catch (err) {
        console.error(`Error disabling plugin: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    console.error(`Error: Unknown action "${action}". Supported actions: install, uninstall, enable, disable, list`);
    process.exit(1);
  }
}

module.exports = PluginCommand;
