# YasinCLI Phase 4.5.1 — Automation Integration

## Goal

Synchronize the Phase 4.5 machine-interface design with the actual command runtime without breaking the human CLI.

## Implemented

- Stable exit-code constants in `src/output/ExitCodes.js`.
- Structured automation results in `src/output/AutomationResult.js`.
- Command-level `supportsJson` capability metadata.
- Registry-level `--json` handling with explicit rejection for unsupported commands.
- Centralized JSON formatting and exit-code handling at the registry boundary.
- Normalized `status`, `doctor`, `discover`, `health`, `config`, `lifecycle`, `logs`, `core`, `agent`, `hub`, and `relay` around structured results where JSON support is advertised.
- Canonical `ServiceResolver` / operation boundary for ecosystem lifecycle, status, and health operations.
- Adapter error taxonomy mapped to stable exit codes.
- Subprocess, lifecycle, health, output-boundary, lockfile, launcher, and production-audit tests.
- Cross-platform validation workflow for Linux, Windows, and macOS with Node.js 18, 20, and 22.
- Lockfile reconciliation and release-readiness workflows.
- Canonical cross-platform Node launcher at `bin/yasin.js` while retaining `yasin.sh` as a Unix compatibility wrapper.

## Machine Contract

Successful automation commands emit:

```json
{
  "ok": true,
  "code": 0,
  "data": {}
}
```

Failures emit a stable error envelope:

```json
{
  "ok": false,
  "code": 2,
  "error": {
    "type": "INVALID_COMMAND",
    "message": "..."
  }
}
```

## Exit Codes

- `0` — success
- `1` — general error / failed diagnostic
- `2` — invalid command or unsupported automation mode
- `3` — service unavailable
- `4` — configuration error
- `5` — dependency error

## JSON-capable commands

The following commands currently advertise `supportsJson` and return structured automation results:

- `yasin status --json`
- `yasin doctor --json`
- `yasin discover --json`
- `yasin health --json`
- `yasin config --json`
- `yasin start --json`
- `yasin stop --json`
- `yasin restart --json`
- `yasin logs --json`
- `yasin core --json`
- `yasin agent --json`
- `yasin hub --json`
- `yasin relay --json`

Commands that do not advertise JSON support are rejected deterministically with `INVALID_COMMAND` rather than producing an ambiguous machine interface.

## Design Boundary

The automation layer does not introduce direct dependencies on Yasin-Core, Yasin-Agent, YasinHub, or YasinRelay internals. Ecosystem communication remains adapter-owned.

## Verification State

Implementation and contract tests are present. Runtime release validation remains dependent on GitHub Actions execution of `npm ci`, lint, tests, smoke validation, dependency audit, and the full 9-way cross-platform matrix.
