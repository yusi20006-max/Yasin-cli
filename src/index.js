#!/usr/bin/env node

const ConfigManager = require('./config/ConfigManager');
const CommandRegistry = require('./core/CommandRegistry');
const ServiceManager = require('./services/ServiceManager');
const PluginSystem = require('./plugins/PluginSystem');

// Import Core Commands
const ConfigCommand = require('./commands/config');
const DoctorCommand = require('./commands/doctor');
const StatusCommand = require('./commands/status');
const ServiceCommand = require('./commands/service');
const PluginCommand = require('./commands/plugin');

// Import Adapters
const CoreAdapter = require('./adapters/CoreAdapter');
const AgentAdapter = require('./adapters/AgentAdapter');
const HubAdapter = require('./adapters/HubAdapter');
const RelayAdapter = require('./adapters/RelayAdapter');

// Import Ecosystem Commands
const CoreCommand = require('./commands/core');
const AgentCommand = require('./commands/agent');
const HubCommand = require('./commands/hub');
const RelayCommand = require('./commands/relay');

function bootstrap() {
  try {
    // 1. Initialize core systems
    const configManager = new ConfigManager();
    const registry = new CommandRegistry();
    const serviceManager = new ServiceManager(configManager);
    const pluginSystem = new PluginSystem(configManager, registry, serviceManager);

    // Initialize adapters
    const coreAdapter = new CoreAdapter(configManager, serviceManager);
    const agentAdapter = new AgentAdapter(configManager, serviceManager);
    const hubAdapter = new HubAdapter(configManager, serviceManager);
    const relayAdapter = new RelayAdapter(configManager, serviceManager);

    // 2. Register core commands
    registry.register(new ConfigCommand(configManager));
    registry.register(new DoctorCommand(configManager));
    registry.register(new StatusCommand(configManager, serviceManager, pluginSystem));
    registry.register(new ServiceCommand(serviceManager));
    registry.register(new PluginCommand(pluginSystem));

    // Register ecosystem commands
    registry.register(new CoreCommand(coreAdapter));
    registry.register(new AgentCommand(agentAdapter));
    registry.register(new HubCommand(hubAdapter));
    registry.register(new RelayCommand(relayAdapter));

    // 3. Load dynamic plugins (which can register custom commands)
    pluginSystem.loadPlugins();

    // 4. Dispatch arguments
    const args = process.argv.slice(2);
    registry.dispatch(args);
  } catch (err) {
    console.error('Fatal Error during Yasin CLI bootstrap:', err.message);
    process.exit(1);
  }
}

// Execute bootstrap only if run directly from CLI
if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };
