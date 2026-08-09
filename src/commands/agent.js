const Command = require('../core/Command');

class AgentCommand extends Command {
  constructor(adapter) {
    super({ name: 'agent', description: 'Manage Yasin-Agent on-demand execution', args: [{ name: 'action', required: true, description: 'status, doctor, run, version, or config' }, { name: 'subAction', required: false }, { name: 'key', required: false }, { name: 'value', required: false }] });
    this.adapter = adapter;
  }
  execute(args) {
    const action = args[0];
    if (action === 'status') { console.log(JSON.stringify(this.adapter.status(), null, 2)); return; }
    if (action === 'doctor') { console.log(JSON.stringify(this.adapter.doctor(), null, 2)); return; }
    if (action === 'version') { console.log(JSON.stringify(this.adapter.version(), null, 2)); return; }
    if (action === 'run') {
      const result = this.adapter.run();
      if (result.status !== 0) throw new Error(`Yasin-Agent exited with status ${result.status}.\n${result.stderr || ''}`);
      process.stdout.write(result.stdout || 'Yasin-Agent completed successfully.\n');
      return;
    }
    if (action === 'config') {
      const subAction = args[1] || 'list'; const key = args[2]; const value = args[3];
      if (subAction === 'get') { if (!key) throw new Error('Key is required for config get.'); console.log(this.adapter.config('get', key)); return; }
      if (subAction === 'set') { if (!key || value === undefined) throw new Error('Key and value are required for config set.'); this.adapter.config('set', key, value); console.log('Configuration updated.'); return; }
      if (subAction === 'delete') { if (!key) throw new Error('Key is required for config delete.'); this.adapter.config('delete', key); console.log('Configuration deleted.'); return; }
      if (subAction === 'list') { console.log(JSON.stringify(this.adapter.config('list'), null, 2)); return; }
      throw new Error(`Unknown config action "${subAction}".`);
    }
    throw new Error(`Unsupported Yasin-Agent action "${action}". Use run, status, doctor, version, or config.`);
  }
}
module.exports = AgentCommand;
