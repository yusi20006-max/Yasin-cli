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
  "data": {},
  "meta": {
    "contract_version": "1",
    "request_id": "optional"
  }
}
```

Failures MUST preserve a stable error type and exit code.

## Capability model

Adapters expose capabilities before an operation is selected. Capabilities are advisory and MUST NOT grant access to Hub internals.

```json
{
  "service": "hub",
  "capabilities": ["status", "health", "start", "stop", "restart", "doctor", "logs"]
}
```

The CLI MUST fail fast with `INVALID_COMMAND` when a requested operation is not advertised by the selected adapter. A capability check MUST NOT replace authorization at the transport/API layer.

## Request semantics

Every adapter request SHOULD carry:

- `operation`: required canonical operation
- `service`: required canonical service identifier
- `request_id`: optional correlation identifier
- `timeout_ms`: optional bounded timeout selected by the CLI
- `params`: operation-specific parameters

The adapter MUST reject malformed requests as `VALIDATION_ERROR` and unavailable services as `SERVICE_UNAVAILABLE`.

## Timeout and cancellation

The CLI MUST use bounded timeouts for remote/process operations. A timeout is classified as `SERVICE_UNAVAILABLE` unless the underlying adapter can provide a more specific stable error type.

Cancellation MUST stop waiting for the adapter but MUST NOT be interpreted as confirmation that the remote operation was rolled back.

## Boundary rules

1. CLI MUST NOT import Hub internal modules.
2. CLI MUST NOT own Hub lifecycle state.
3. Hub remains authoritative for ecosystem-wide lifecycle coordination.
4. CLI adapters MAY use a public SDK/API/CLI protocol; transport is intentionally unspecified here.
5. `core`, `agent`, and `relay` operations must not silently bypass Hub when the operation is ecosystem-wide.
6. `health`, `status`, and `doctor` may aggregate local adapter information, but aggregation semantics must remain explicit.
7. AI, Feed, and Press are not added as CLI-managed adapters until their contracts are explicitly ratified.
8. Authentication and authorization remain transport/API responsibilities and MUST NOT be inferred from CLI capability discovery.

## Compatibility

The contract is transport-neutral so a future YasinHub SDK, HTTP API, Unix socket, or local process adapter can implement it without changing the public YasinCLI command surface.

## Versioning

`contract_version` starts at `1`. Backward-compatible additions MAY be introduced within version 1. Breaking request/response changes require a new contract version and an explicit migration decision.

## Next ADR

Before implementing a concrete Hub transport, define authentication, request IDs, timeout defaults, protocol versioning, capability negotiation, and operation idempotency in a separate ADR.
