const Command = require('../core/Command');
const AutomationResult = require('../output/AutomationResult');

class HubCommand extends Command {
  constructor(adapter) {
    super({ name: 'hub', description: 'Manage YasinHub on-demand status', args: [{ name: 'action', required: true, description: 'status, doctor, run, version, or config' }, { name: 'subAction', required: false }, { name: 'key', required: false }, { name: 'value', required: false }], options: [{ name: '--json', type: 'boolean', default: false, description: 'Emit machine-readable JSON' }], supportsJson: true });
    this.adapter = adapter;
  }
  execute(args, options = {}) {
    const action = args[0];
    let data;
    if (action === 'status') data = this.adapter.status();
    else if (action === 'doctor') data = this.adapter.doctor();
    else if (action === 'version') data = this.adapter.version();
    else if (action === 'run') {
      const result = this.adapter.run();
      if (result.status !== 0) throw new Error(`YasinHub exited with status ${result.status}.\n${result.stderr || ''}`);
      data = { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
    } else if (action === 'config') {
      const subAction = args[1] || 'list'; const key = args[2]; const value = args[3];
      if (subAction === 'get') { if (!key) throw new Error('Key is required for config get.'); data = this.adapter.config('get', key); }
      else if (subAction === 'set') { if (!key || value === undefined) throw new Error('Key and value are required for config set.'); this.adapter.config('set', key, value); data = { updated: true, key }; }
      else if (subAction === 'delete') { if (!key) throw new Error('Key is required for config delete.'); this.adapter.config('delete', key); data = { deleted: true, key }; }
      else if (subAction === 'list') data = this.adapter.config('list');
      else throw new Error(`Unknown config action "${subAction}".`);
    } else throw new Error(`Unsupported YasinHub action "${action}". Use run, status, doctor, version, or config.`);
    if (options.json) return AutomationResult.success(data);
    if (action === 'run') process.stdout.write(data.stdout || 'YasinHub completed successfully.\n');
    else if (typeof data === 'string') console.log(data); else console.log(JSON.stringify(data, null, 2));
    return data;
  }
}
module.exports = HubCommand;
