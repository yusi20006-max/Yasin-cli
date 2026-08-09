#!/usr/bin/env node

const ConfigManager = require('./config/ConfigManager');
const CommandRegistry = require('./core/CommandRegistry');
const ServiceManager = require('./services/ServiceManager');
const PluginSystem = require('./plugins/PluginSystem');

const ConfigCommand = require('./commands/config');
const DoctorCommand = require('./commands/doctor');
const StatusCommand = require('./commands/status');
const ServiceCommand = require('./commands/service');
const PluginCommand = require('./commands/plugin');
const DiscoverCommand = require('./commands/discover');
const HealthCommand = require('./commands/health');
const LogsCommand = require('./commands/logs');
const LifecycleCommand = require('./commands/lifecycle');

const { createEcosystemAdapters } = require('./ecosystem');

const CoreCommand = require('./commands/core');
const AgentCommand = require('./commands/agent');
const HubCommand = require('./commands/hub');
const RelayCommand = require('./commands/relay');

function bootstrap() {
  try {
    const configManager = new ConfigManager();
    const registry = new CommandRegistry();
    const serviceManager = new ServiceManager(configManager);
    const pluginSystem = new PluginSystem(configManager, registry, serviceManager);

    const adapters = createEcosystemAdapters(configManager, serviceManager);
    const [coreAdapter, agentAdapter, hubAdapter, relayAdapter] = adapters;

    registry.register(new ConfigCommand(configManager));
    registry.register(new DoctorCommand(configManager));
    registry.register(new StatusCommand(configManager, serviceManager, pluginSystem));
    registry.register(new ServiceCommand(serviceManager));
    registry.register(new PluginCommand(pluginSystem));
    registry.register(new DiscoverCommand(adapters));
    registry.register(new HealthCommand(adapters));
    registry.register(new LogsCommand(serviceManager));
    registry.register(new LifecycleCommand('start', adapters));
    registry.register(new LifecycleCommand('stop', adapters));
    registry.register(new LifecycleCommand('restart', adapters));

    registry.register(new CoreCommand(coreAdapter));
    registry.register(new AgentCommand(agentAdapter));
    registry.register(new HubCommand(hubAdapter));
    registry.register(new RelayCommand(relayAdapter));

    pluginSystem.loadPlugins();

    const args = process.argv.slice(2);
    return registry.dispatch(args);
  } catch (err) {
    console.error('Fatal Error during Yasin CLI bootstrap:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };
