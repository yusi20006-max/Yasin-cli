const Command = require('../core/Command');

class ProfileCommand extends Command {
  constructor(profileManager) {
    super({
      name: 'profile',
      description: 'Manage Yasin ecosystem profiles',
      args: [
        { name: 'action', required: true, description: 'list, get, use, save, or delete' },
        { name: 'name', required: false, description: 'Profile name' }
      ]
    });
    this.profileManager = profileManager;
  }

  execute(args) {
    const action = args[0];
    const name = args[1];

    if (action === 'list') {
      const result = this.profileManager.list();
      console.log(JSON.stringify(result, null, 2));
      return result;
    }

    if (!name) throw new Error('Profile name is required.');

    if (action === 'get') {
      const result = this.profileManager.get(name);
      console.log(JSON.stringify(result, null, 2));
      return result;
    }

    if (action === 'use') {
      const result = this.profileManager.apply(name);
      console.log(`Profile "${name}" activated.`);
      return result;
    }

    if (action === 'delete') {
      const removed = this.profileManager.remove(name);
      if (!removed) throw new Error(`Profile "${name}" not found.`);
      console.log(`Profile "${name}" deleted.`);
      return true;
    }

    if (action === 'save') {
      const services = args.slice(2);
      const profile = { services: Object.fromEntries(services.map((service) => [service, true])) };
      const result = this.profileManager.save(name, profile);
      console.log(JSON.stringify(result, null, 2));
      return result;
    }

    throw new Error(`Unknown profile action "${action}".`);
  }
}

module.exports = ProfileCommand;
