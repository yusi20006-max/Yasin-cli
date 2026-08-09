# YasinCLI Phase 3 — Production Runtime

## Scope

Phase 3 establishes the operational runtime layer for the Yasin ecosystem.

### Commands

- `yasin discover`
- `yasin health`
- `yasin logs <service> [lines]`
- `yasin start [service|all]`
- `yasin stop [service|all]`
- `yasin restart [service|all]`

### Architecture

`src/ecosystem/index.js` creates one shared adapter set for Core, Agent, Hub, and Relay. Runtime commands consume these adapters instead of constructing independent service definitions.

### Lifecycle rules

- Only adapters advertising a lifecycle capability are started/stopped/restarted.
- Library and one-shot services are reported as skipped rather than treated as daemons.
- Unknown service identifiers fail explicitly.

### Validation

Phase 3 changes must pass:

- `npm test`
- `npm run lint`
- `npm run smoke`

The actual Yasin services remain external dependencies; CI must use controlled fixtures or mocks for deterministic tests.
