# ADR-001: YasinHub Transport Boundary

Status: Implemented (HTTP transport selected)

## Decision

Keep the YasinCLI ↔ YasinHub contract transport-neutral. Do not hard-code HTTP, sockets, or direct Hub module imports into the CLI.

The first production transport should be selected only after YasinHub exposes a stable public control surface.

## Selected transport (YasinHub v1.0.1)

YasinHub now exposes a stable, verified HTTP control API
(default `http://127.0.0.1:7000`), so the concrete transport adapter is HTTP:

- `GET /api/health` — Control Plane liveness
- `GET /api/status` — real per-service snapshot (status, PID, process state)
- `GET /api/services` — Hub-managed service inventory
- `POST /api/control/<service>/<start|stop|restart>` — lifecycle operations

Implementation: `src/hub/HubClient.js` (transport only, global fetch, bounded
timeouts, validated responses) behind `src/hub/HubLifecycle.js` (gateway).
The command layer depends on the gateway interface, never on HTTP details,
so the transport stays replaceable per this ADR.

## Required properties

- request/response correlation
- bounded timeouts
- explicit protocol/contract version
- capability discovery
- stable error taxonomy
- idempotency semantics for lifecycle operations
- authentication/authorization at the transport/API boundary

## Preferred implementation direction

Implement a small `HubAdapter` interface in YasinCLI and allow one concrete transport adapter to satisfy it. Keep the command layer unaware of transport details.

```text
Command
  -> HubAdapter
      -> transport implementation
          -> YasinHub public control surface
```

## Lifecycle semantics

`start`, `stop`, and `restart` MUST expose whether the operation was accepted, completed, or timed out. A timeout is not proof that the remote state was unchanged.

`status` and `health` are read operations and SHOULD be safe to retry.

## Non-goals

- importing YasinHub internals
- creating a second lifecycle coordinator inside YasinCLI
- adding AI/Feed/Press adapters without ratified contracts
- introducing shared persistence

## Consequence

YasinCLI can stabilize its public command surface now while postponing transport coupling until YasinHub's public control API is ready.
