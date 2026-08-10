# YasinCLI Distribution Contract

## Package

YasinCLI is distributed as a Node.js CLI package. The package must expose the CLI entry point without requiring development-only dependencies.

## Supported environments

- Linux
- macOS
- Windows
- Termux/Android where the supported Node.js runtime is available

## Release requirements

Before publishing a release:

1. Run unit and integration tests.
2. Run lint checks.
3. Run security/dependency audit.
4. Verify package contents with `npm pack --dry-run`.
5. Verify the CLI entry point from a clean installation.
6. Ensure no secrets, local paths, test fixtures, or development artifacts are packaged.

## Versioning

Use Semantic Versioning. Breaking CLI/API changes require a major version.

## Automation compatibility

The Phase 4.5 JSON output and exit-code contract must remain stable across patch and minor releases.
