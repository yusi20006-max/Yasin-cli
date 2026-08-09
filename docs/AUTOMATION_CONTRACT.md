# YasinCLI Automation Contract

## Output

Commands intended for automation should support a machine-readable JSON mode without changing the default human-readable output.

```text
yasin status --json
yasin doctor --json
yasin discover --json
yasin health --json
```

JSON output must contain structured data only and must never include secrets.

## Exit Codes

| Code | Meaning |
| ---: | --- |
| 0 | Success |
| 1 | General error |
| 2 | Invalid command or arguments |
| 3 | Service unavailable |
| 4 | Configuration error |
| 5 | Dependency error |

Scripts should rely on exit codes for success/failure and use JSON output for structured inspection.

## Compatibility

Human-readable output remains the default. The automation interface must remain backward compatible with existing commands.
