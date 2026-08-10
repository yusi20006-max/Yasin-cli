# Cross-Platform Validation

## Supported runtime matrix

Yasin CLI validates the supported Node.js runtime line on:

- Ubuntu latest
- Windows latest
- macOS latest

The CI matrix covers Node.js 18, 20, and 22 and runs installation, lint, unit/integration tests, and the smoke test.

## Launcher contract

The canonical launcher is:

`bin/yasin.js`

It is a Node.js entrypoint and is therefore suitable for npm's cross-platform `bin` handling. The historical `yasin.sh` entrypoint remains for Unix compatibility and delegates to the canonical launcher.

## Validation rules

Every matrix job must pass:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run smoke`

The project must not introduce platform-specific shell commands into the canonical npm launcher.

## Release gate

Cross-platform support is considered validated only after the complete matrix is green. A local or partial test run is not treated as equivalent to the GitHub Actions matrix.
