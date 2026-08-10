# YasinCLI Phase 4.5.1 — Automation Integration

## Goal

Synchronize the existing Phase 4.5 machine-interface design with the actual command runtime without breaking the human CLI.

## Implemented

- Added stable exit-code constants in `src/output/ExitCodes.js`.
- Added a structured automation result contract in `src/output/AutomationResult.js`.
- Added command-level `supportsJson` capability metadata.
- Added registry-level `--json` handling for commands that explicitly support machine output.
- Normalized `status`, `doctor`, `discover`, and `health` around structured results.
- Prevented unsupported commands from silently pretending to provide a JSON contract.
- Preserved human-readable output when `--json` is not supplied.

## Machine Contract

Supported commands currently emit:

```json
{
  "ok": true,
  "code": 0,
  "data": {}
}
```

Failures use:

```json
{
  "ok": false,
  "code": 1,
  "error": {
    "message": "..."
  },
  "data": {}
}
```

## Exit Codes

- `0` — success
- `1` — general error / failed diagnostic
- `2` — invalid command or unsupported automation mode
- `3` — service unavailable
- `4` — configuration error
- `5` — dependency error

## Current JSON-capable commands

- `yasin status --json`
- `yasin doctor --json`
- `yasin discover --json`
- `yasin health --json`

Other commands remain human-output-only until their return values and failure semantics are migrated to this contract.

## Design Boundary

The automation layer does not introduce direct dependencies on Yasin-Core, Yasin-Agent, YasinHub, or YasinRelay internals. Ecosystem communication remains adapter-owned.

## Remaining Work

1. Migrate lifecycle and logs to the same result contract.
2. Add JSON-capable domain command groups (`core`, `agent`, `hub`, `relay`).
3. Normalize adapter error classes and map them to stable exit codes.
4. Add integration tests for subprocess behavior and exit codes.
5. Verify the contract on Termux/Linux/Windows/macOS.
