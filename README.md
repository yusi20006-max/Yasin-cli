# Yasin CLI

Yasin CLI is a modular, extensible, and cross-platform Command Line Interface for the Yasin ecosystem. It is designed for Termux (Android), Linux, macOS, and Windows.

## Architecture

The CLI is split into command, service, and ecosystem layers:

```text
CLI entrypoint
├── bin/yasin.js          # canonical cross-platform Node launcher
└── yasin.sh              # legacy Unix wrapper → bin/yasin.js

src/
├── index.js              # bootstrap and command registration
├── core/
│   ├── Command.js
│   ├── CommandRegistry.js
│   ├── ServiceResolver.js
│   ├── ServiceOperation.js
│   ├── ServiceStatusOperation.js
│   ├── ServiceHealthOperation.js
│   └── ServiceCommandFactory.js
├── commands/
│   ├── config.js
│   ├── doctor.js
│   ├── status.js
│   ├── health.js
│   ├── lifecycle.js      # start / stop / restart
│   ├── service.js
│   ├── plugin.js
│   └── logs.js
├── services/
│   └── ServiceManager.js
└── plugins/
    └── PluginSystem.js
```

### Unified ecosystem operation path

Ecosystem operations use a canonical resolver boundary:

```text
Command
  ↓
ServiceOperation / ServiceStatusOperation / ServiceHealthOperation
  ↓
ServiceResolver
  ↓
Canonical service adapter
```

`status`, `health`, and `doctor` intentionally keep distinct semantics: status is a snapshot, health reports runtime service health, and doctor performs CLI/environment diagnostics.

## Installation

```bash
npm install
```

For a local checkout on Unix systems, the legacy launcher remains available:

```bash
./yasin.sh --help
```

The canonical npm executable is:

```bash
yasin --help
```

The npm launcher is implemented in Node.js so the same entrypoint works across Linux, macOS, Windows, and Termux.

## CLI Usage

```bash
yasin config list
yasin status
yasin health
yasin doctor
yasin start all
yasin stop all
yasin restart yasin-relay
yasin logs yasin-relay
```

## Validation

The repository includes unit, integration, launcher, smoke, and cross-platform validation. The cross-platform workflow targets Linux, Windows, and macOS with Node.js 18, 20, and 22 and runs:

```text
npm ci
npm run lint
npm test
npm run smoke
```

See `docs/cross-platform-validation.md` for the validation contract.

## Test Suite

Run all tests with:

```bash
npm test
```

Run linting and smoke validation with:

```bash
npm run lint
npm run smoke
```
