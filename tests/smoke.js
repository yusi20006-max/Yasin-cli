const assert = require('assert');
const CommandRegistry = require('../src/core/CommandRegistry');
const DiscoverCommand = require('../src/commands/discover');
const HealthCommand = require('../src/commands/health');
const ServiceResolver = require('../src/core/ServiceResolver');
const ServiceHealthOperation = require('../src/core/ServiceHealthOperation');

const registry = new CommandRegistry();
const adapter = {
  serviceId: 'yasin-core',
  detect: () => ({ id: 'yasin-core', configured: true }),
  health: () => ({ healthy: true })
};
const resolver = new ServiceResolver([adapter]);
const healthOperation = new ServiceHealthOperation(resolver);

registry.register(new DiscoverCommand([adapter]));
registry.register(new HealthCommand(healthOperation));

assert.strictEqual(registry.getCommand('discover').name, 'discover');
assert.strictEqual(registry.getCommand('health').name, 'health');

const result = registry.execute('health', ['yasin-core'], { json: true });
assert.strictEqual(result.ok, true);
assert.strictEqual(result.data.healthy, true);
assert.strictEqual(result.data.results[0].service, 'yasin-core');

process.stdout.write('YasinCLI smoke check passed.\n');
