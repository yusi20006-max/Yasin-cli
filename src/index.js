#!/usr/bin/env node

const ConfigManager = require('./config/ConfigManager');
const CommandRegistry = require('./core/CommandRegistry');
const ServiceManager = require('./services/ServiceManager');
const PluginSystem = require('./plugins/PluginSystem');
const ServiceResolver = require('./core/ServiceResolver');
const ServiceOperation = require('./core/ServiceOperation');
const ServiceHealthOperation = require('./core/ServiceHealthOperation');
const ServiceStatusOperation = require('./core/ServiceStatusOperation');
const { normalize } = require('./output/ErrorTaxonomy');

const ConfigCommand = require('./commands/config');
const DoctorCommand = require('./commands/doctor');
const StatusCommand = require('./commands/status');
const ServiceCommand = require('./commands/service');
const PluginCommand = require('./commands/plugin');
const DiscoverCommand = require('./commands/discover');
const HealthCommand = require('./commands/health');
const LogsCommand = require('./commands/logs');
const LifecycleCommand = require('./commands/lifecycle');
const ProfileCommand = require('./commands/profile');
const CreateCommand = require('./commands/create');

const { createEcosystemAdapters } = require('./ecosystem');
const ProfileManager = require('./ecosystem/ProfileManager');

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
    const resolver = new ServiceResolver(adapters);
    const serviceOperation = new ServiceOperation(resolver);
    const serviceHealthOperation = new ServiceHealthOperation(resolver);
    const serviceStatusOperation = new ServiceStatusOperation(resolver);
    const profileManager = new ProfileManager(configManager);

    registry.register(new ConfigCommand(configManager));
    registry.register(new DoctorCommand(configManager));
    registry.register(new StatusCommand(configManager, serviceManager, pluginSystem, serviceStatusOperation));
    registry.register(new ServiceCommand(serviceManager));
    registry.register(new PluginCommand(pluginSystem));
    registry.register(new DiscoverCommand(adapters));
    registry.register(new HealthCommand(serviceHealthOperation));
    registry.register(new LogsCommand(serviceManager));
    registry.register(new LifecycleCommand('start', serviceOperation));
    registry.register(new LifecycleCommand('stop', serviceOperation));
    registry.register(new LifecycleCommand('restart', serviceOperation));
    registry.register(new ProfileCommand(profileManager));
    registry.register(new CreateCommand());

    registry.register(new CoreCommand(coreAdapter));
    registry.register(new AgentCommand(agentAdapter));
    registry.register(new HubCommand(hubAdapter));
    registry.register(new RelayCommand(relayAdapter));

    registry.serviceOperations = {
      status: serviceStatusOperation,
      health: serviceHealthOperation,
      lifecycle: serviceOperation
    };

    pluginSystem.loadPlugins();

    const args = process.argv.slice(2);
    return registry.dispatch(args);
  } catch (err) {
    const normalized = normalize(err);
    console.error('Fatal Error during Yasin CLI bootstrap:', normalized.message);
    process.exit(normalized.code);
  }
}

if (require.main === module) {
  bootstrap();
}

module.exports = { bootstrap };
