# YasinCLI Phase 3.5 — Advanced Ecosystem Orchestration

Phase 3.5 adds dependency-aware lifecycle orchestration and named ecosystem profiles.

## Commands

- `yasin start [service|all]`
- `yasin stop [service|all]`
- `yasin restart [service|all]`
- `yasin profile list`
- `yasin profile get <name>`
- `yasin profile use <name>`
- `yasin profile save <name> [services...]`
- `yasin profile delete <name>`

## Dependency graph

Dependencies are read from the `dependencies` configuration object. Startup is topological; shutdown is the reverse order. Cycles are rejected.

Example:

```json
{
  "dependencies": {
    "yasin-relay": ["yasin-core"]
  }
}
```

## Profiles

Profiles are stored under `profiles` in the CLI configuration. A profile can describe enabled services and dependency information. Activating a profile records the active profile and its service/dependency configuration.

The orchestrator still respects adapter capabilities: library and one-shot services are never forced into daemon lifecycle operations.
