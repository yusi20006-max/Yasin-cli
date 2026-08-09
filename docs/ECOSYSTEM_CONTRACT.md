# YasinCLI Ecosystem Runtime Contract

Phase 2.5 validates that YasinCLI does not assume every ecosystem repository is a long-running daemon.

## Service modes

| Component | Mode | Runtime contract |
|---|---|---|
| Yasin-Core | `library` | Python package/runtime; version is probed from `yasin_core.version.VERSION`; no daemon is started by YasinCLI |
| Yasin-Agent | `oneshot` | `python3 -m agent_platform.cli agent run news_bot` |
| YasinHub | `oneshot` | `python3 -m yasinhub.cli status` |
| YasinRelay | `daemon` | `python3 -m yasinrelay.cli run --schedule` |

`YASIN_PYTHON` may be set when the Python executable is not named `python3`.

## Configuration override

Each adapter can override its command contract through `services.<service-id>` in YasinCLI configuration.

Supported fields:

- `command`
- `args`
- `mode`
- `env`
- `workingDirectory`
- `versionCommand`
- `versionCommandArgs`
- `versionArgs`

The configured command is always preferred over the adapter default.

## Lifecycle semantics

`daemon` services support:

- `start`
- `stop`
- `restart`
- `status`

`oneshot` services support:

- `run`
- `doctor`
- `version`
- `status`

`library` components support inspection/version operations only. They are not represented as background processes.

## Source contracts verified from ecosystem repositories

- Yasin-Core declares version `3.3.0` in `yasin_core/version.py` and is packaged as `yasin-core`.
- Yasin-Agent declares version `1.0.0` and documents `python -m agent_platform.cli agent run news_bot`.
- YasinHub declares version `1.0.0` and documents `python3 -m yasinhub.cli status`.
- YasinRelay declares version `2.0.0` and documents `python3 -m yasinrelay.cli run --schedule` as its recommended scheduled runtime.

These are integration contracts, not assumptions that the components share a common daemon lifecycle.
