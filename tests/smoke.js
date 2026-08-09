const assert = require('assert');
const CommandRegistry = require('../src/core/CommandRegistry');
const DiscoverCommand = require('../src/commands/discover');
const HealthCommand = require('../src/commands/health');

const registry = new CommandRegistry();
const adapters = [
  { serviceId: 'yasin-core', detect: () => ({ id: 'yasin-core', configured: true }), doctor: () => ({ status: 'healthy' }) }
];

registry.register(new DiscoverCommand(adapters));
registry.register(new HealthCommand(adapters));
assert.strictEqual(registry.getCommand('discover').name, 'discover');
assert.strictEqual(registry.getCommand('health').name, 'health');
assert.strictEqual(new HealthCommand(adapters).execute().healthy, true);
console.log('YasinCLI smoke check passed.');
