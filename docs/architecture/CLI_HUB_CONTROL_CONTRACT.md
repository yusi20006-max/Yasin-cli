# YasinCLI ↔ YasinHub Control Contract

Status: Draft / boundary specification

## Purpose

Define the transport-neutral boundary between YasinCLI and YasinHub without coupling the CLI to Hub internals.

## Responsibilities

### YasinCLI
- command UX and argument parsing
- human and machine output formatting
- local configuration/profile selection
- adapter invocation
- stable exit codes

### YasinHub
- ecosystem lifecycle coordination
- aggregated status/health
- service discovery/registry
- operational control of managed services
- authoritative orchestration state

## Contract shape

CLI requests are expressed as an adapter-owned operation:

```text
operation: status | health | start | stop | restart | doctor | logs
service: core | agent | hub | relay | all
request: optional operation-specific parameters
```

Responses MUST be normalized by the CLI automation layer into:

```json
{
  "ok": true,
  "code": 0,
  "data": {}
}
```

Failures MUST preserve a stable error type and exit code.

## Boundary rules

1. CLI MUST NOT import Hub internal modules.
2. CLI MUST NOT own Hub lifecycle state.
3. Hub remains authoritative for ecosystem-wide lifecycle coordination.
4. CLI adapters MAY use a public SDK/API/CLI protocol; transport is intentionally unspecified here.
5. `core`, `agent`, and `relay` operations must not silently bypass Hub when the operation is ecosystem-wide.
6. `health`, `status`, and `doctor` may aggregate local adapter information, but aggregation semantics must remain explicit.
7. AI, Feed, and Press are not added as CLI-managed adapters until their contracts are explicitly ratified.

## Compatibility

The contract is transport-neutral so a future YasinHub SDK, HTTP API, Unix socket, or local process adapter can implement it without changing the public YasinCLI command surface.

## Next decision

Before implementing a concrete Hub transport, define authentication, request IDs, timeouts, protocol versioning, and capability negotiation in a separate ADR.
