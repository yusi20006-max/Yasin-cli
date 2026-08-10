# Yasin CLI Release Readiness

## Release gate

A release is ready only when all gates below are green. No gate should be marked complete from static inspection alone when it requires runtime validation.

### Architecture

- [x] Canonical Node launcher is `bin/yasin.js`.
- [x] `yasin.sh` remains a compatibility wrapper.
- [x] Service operations use the canonical resolver boundary.
- [x] Commands return structured automation results.
- [x] Registry owns the process/output boundary.
- [x] Central exit-code taxonomy is defined.

### Configuration and plugins

- [x] Missing configuration creates defaults.
- [x] Corrupt configuration raises `CONFIGURATION_ERROR`.
- [x] Prototype-pollution paths are rejected.
- [x] Plugin IDs are constrained.
- [x] Plugin paths are confined to the plugin root.
- [x] Plugin load failures are represented as diagnostics instead of direct console output.

### Automated validation

- [x] Unit and contract tests exist for core operations.
- [x] Launcher contract tests exist.
- [x] Smoke validation exists.
- [x] Linux/Windows/macOS + Node 18/20/22 workflow exists.
- [x] Lockfile reconciliation workflow exists and can regenerate the lockfile from `package.json`.
- [x] Lockfile root metadata contract is tested.

### Final runtime gates

- [ ] `npm ci` passes from the committed lockfile.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run smoke` passes.
- [ ] Cross-platform matrix is green.
- [ ] No unresolved high-severity security findings.
- [ ] Release branch contains no unintended generated changes.

## Current known blocker

The branch's `package-lock.json` is materially smaller than the original dependency lockfile. It currently contains only a small subset of the dependency tree. The reconciliation workflow is therefore authoritative: it regenerates the lockfile with npm and then validates `npm ci`, lint, tests, and smoke checks.

Do not replace the lockfile manually with a guessed dependency tree.
