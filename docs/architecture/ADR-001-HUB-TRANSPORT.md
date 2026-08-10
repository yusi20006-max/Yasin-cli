# ADR-001: YasinHub Transport Boundary

Status: Proposed

## Decision

Keep the YasinCLI ↔ YasinHub contract transport-neutral. Do not hard-code HTTP, sockets, or direct Hub module imports into the CLI.

The first production transport should be selected only after YasinHub exposes a stable public control surface.

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
