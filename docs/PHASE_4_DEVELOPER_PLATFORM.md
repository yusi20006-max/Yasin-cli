# YasinCLI Phase 4 — Developer Platform

Phase 4 turns YasinCLI from an ecosystem runtime manager into a developer-facing platform.

## Implemented foundation

- `yasin create plugin <name>`
- `yasin create service <name>`
- `yasin create adapter <name>`
- Safe project-name validation
- Safe target containment
- Refusal to overwrite non-empty directories
- Standard plugin metadata scaffold
- Standard service metadata scaffold
- Standard adapter scaffold

## Next work

1. Plugin SDK and typed command registration contract.
2. Plugin lifecycle hooks and metadata validation.
3. `yasin dev` workflow for controlled local development.
4. Project templates and template versioning.
5. Developer diagnostics for generated projects.
6. Machine-readable scaffold output.
7. Documentation and examples for plugin/service authors.

## Safety model

Generated projects are local files. The scaffolder validates names, confines generated paths to the selected base directory, and never overwrites a non-empty target directory.

Plugins remain trusted local code; Phase 4 does not claim to sandbox plugin execution.
