# Yasin CLI

Yasin CLI is a modular, extensible, and high-performance Command Line Interface tool built on Node.js. It is designed to work seamlessly across Termux (Android), Linux, macOS, and Windows.

## Key Features

1. **Configuration Management System**: Unified management of CLI preferences and settings using hierarchical JSON files supporting dot-notation keys (e.g., `yasin config set general.theme dark`).
2. **Core CLI Framework & Command Registry**: Custom, lightweight, and zero-dependency argument and option parser supporting global help, command-specific usage flags, and dynamic subcommand dispatching.
3. **Doctor Command**: Environment diagnostics engine checking platform compatibility, directory permissions (write/read access to configuration and plugin directories), Node.js versions, and critical external dependencies like Git. Includes auto-healing capabilities.
4. **Status Command**: Real-time monitoring showing CLI configuration paths, active processes, system resource metrics (uptime, memory, CPU load), and loaded modules.
5. **Service Manager**: Cross-platform background daemon/process manager designed to spawn, stop, monitor, list, and view logs of long-running tasks.
6. **Plugin System**: Dynamic loading framework allowing custom extensions to register new commands during application startup, with built-in actions to install, list, enable, disable, and uninstall plugins.

## Architecture

The project has a highly modular architecture separated into distinct layers:

```
src/
├── index.js             # Main bootstrap and orchestration entry point
├── config/
│   └── ConfigManager.js # Config management core (XDG, AppData, dot-notation resolution)
├── core/
│   ├── Command.js       # Base Command class & Custom CLI Argument/Option Parser
│   └── CommandRegistry.js # Dispatcher & dynamic Help menu generator
├── commands/
│   ├── config.js        # Config CLI subcommand
│   ├── doctor.js        # Doctor health check & auto-healing implementation
│   ├── status.js        # Resource monitoring and meta status report
│   ├── service.js       # Background process manager subcommands
│   └── plugin.js        # Plugin installer and state toggler subcommands
├── services/
│   └── ServiceManager.js # Process spawn, track, log, and kill logic
└── plugins/
    └── PluginSystem.js  # Plugin scanner, dynamic loader, and registry hook
```

## Installation

Run the installation script to configure permissions and install all required development packages:

```bash
./install.sh
```

## CLI Usage

Run help to inspect available commands and global flags:

```bash
./yasin.sh --help
```

### 1. Configuration (`config`)
Read, write, list, or delete hierarchical settings:
```bash
# Get a configuration parameter
./yasin.sh config get general.theme

# Set a configuration parameter
./yasin.sh config set general.theme ocean
./yasin.sh config set services.web.port 8080

# List entire configuration
./yasin.sh config list

# Delete a configuration parameter
./yasin.sh config delete general.theme
```

### 2. Diagnostics (`doctor`)
Perform environment sanity checks and auto-heal missing configurations:
```bash
# Perform checks
./yasin.sh doctor

# Auto-heal fixable directories
./yasin.sh doctor --fix
```

### 3. CLI Status (`status`)
Inspect system resources, CLI meta-attributes, and running services:
```bash
./yasin.sh status
```

### 4. Background Services (`service`)
Spawn, monitor, and manage long-running background tasks:
```bash
# Register a custom service
./yasin.sh service register my-api "Mock API" node -e "setInterval(() => console.log('Ping...'), 5000);"

# Start the service in background
./yasin.sh service start my-api

# List registered services and active statuses
./yasin.sh service list

# View service logs
./yasin.sh service logs my-api -n 20

# Restart or stop the service
./yasin.sh service restart my-api
./yasin.sh service stop my-api

# Unregister service
./yasin.sh service unregister my-api
```

### 5. Extension Plugins (`plugin`)
Extend CLI capabilities dynamically by installing extension folders:
```bash
# Install local plugin directory
./yasin.sh plugin install /path/to/custom-plugin

# List installed plugins
./yasin.sh plugin list

# Enable or disable plugins
./yasin.sh plugin disable custom-plugin
./yasin.sh plugin enable custom-plugin

# Uninstall plugin
./yasin.sh plugin uninstall custom-plugin
```

## Test Suite

The test suite contains thorough unit and integration tests written in Jest, achieving complete coverage over all core behaviors and commands.

Run all tests:
```bash
npm test
```
