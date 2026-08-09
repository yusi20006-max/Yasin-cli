# YasinCLI Phase 2.5

## Real Ecosystem Integration & Hardening

Phase 2.5 transitions YasinCLI from mock ecosystem adapters to configuration-driven integration with the real Yasin ecosystem.

### Completed in this implementation slice

- Added `BaseEcosystemAdapter`.
- Replaced Core, Agent, Hub and Relay mock processes with real command configuration.
- Added explicit service discovery through `services.<serviceId>` configuration and environment variables.
- Added real version probing through `versionArgs` / `--version`.
- Added working-directory support.
- Hardened ServiceManager process identity checks.
- Added process exit/error state handling.
- Disabled shell execution for service spawning.
- Hardened PluginSystem against plugin ID traversal and entry-point traversal.
- Updated adapter tests so mock runtime behavior is no longer required.

### Service configuration

Each ecosystem service may be configured under `services`:

```json
{
  "services": {
    "yasin-core": {
      "id": "yasin-core",
      "name": "Yasin-Core Service",
      "command": "python",
      "args": ["-m", "yasin_core"],
      "versionArgs": ["--version"],
      "workingDirectory": "/path/to/Yasin-Core",
      "env": {}
    }
  }
}
```

The corresponding environment variables are:

- `YASIN_CORE_COMMAND`
- `YASIN_CORE_WORKDIR`
- `YASIN_AGENT_COMMAND`
- `YASIN_AGENT_WORKDIR`
- `YASIN_HUB_COMMAND`
- `YASIN_HUB_WORKDIR`
- `YASIN_RELAY_COMMAND`
- `YASIN_RELAY_WORKDIR`

The CLI must never silently create or execute a mock ecosystem service in production code.

## Remaining Phase 2.5 work

1. Validate the actual launch commands of Yasin-Core, Yasin-Agent, YasinHub and YasinRelay.
2. Add service-specific health/API checks where those projects expose them.
3. Add adapter contract tests for all lifecycle operations.
4. Add integration and E2E tests against controlled real service fixtures.
5. Validate Termux/Linux/Windows/macOS behavior.
6. Regenerate the production audit and synchronize project status documentation.

## Release gate

Phase 2.5 is not complete until real ecosystem commands are validated and the full unit, integration, E2E and lint suites pass.
