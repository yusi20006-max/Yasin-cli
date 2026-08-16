# FINAL-G1 — Default Branch Migration Evidence

**Issue:** Yasin-cli #37  
**Related:** #34  
**Date:** 2026-08-16

## Branch integrity

| Branch | Tip SHA | Role |
|--------|---------|------|
| `main` | `2f7972eb9976008cb7d9ddf762937305b57f09c4` | **Canonical** — includes FINAL-08 (#35) |
| `initial-setup` | `de0d05db0c2c9e0e7df019f0af9dd016f080492b` | Historical default; ancestor of `main` tip path |

`main` is strictly ahead of `initial-setup` by the FINAL-08 reconciliation commit. No divergent exclusive history required for promotion.

## GitHub Settings status

| Item | Observed |
|------|----------|
| API `default_branch` | **`initial-setup`** (verified via repository metadata) |
| `git clone` default checkout | `initial-setup` |
| Connector / agent capability to PATCH `default_branch` | **Not available** (no repository-settings write tool; no GH token in executor environment) |
| Repo permissions on token used for content API | admin/push present for content operations only |

**BLOCKED-EXTERNAL (maintainer-only):**  
Settings → Branches → Default branch → change to **`main`**.  
This cannot be completed by the automation agent without GitHub Settings API access.

## CI / docs reconciliation performed in #37

| Change | Reason |
|--------|--------|
| `.github/workflows/phase-4-5-1-ci.yml` triggers on `main` and `initial-setup` | Operational CI must run on canonical branch |
| `.github/workflows/release-check.yml` PR/push include `main` | Avoid stale `initial-setup`-only targeting |
| `ci.yml` already `branches: ["**"]` | No change |

## Post-Settings verification checklist (maintainer)

1. Default branch shows `main` on GitHub UI.
2. `git clone https://github.com/yusi20006-max/Yasin-cli.git` checks out `main` at `2f7972e` or later.
3. Open PRs target `main`.
4. CI green on `main`.
5. Close #34 when steps 1–4 pass.

## Acceptance for #37

| Criterion | Status |
|-----------|--------|
| `main` proven canonical | **Met** |
| Documented maintainer-only blocker with evidence | **Met** (Settings) |
| No runtime regression from this Issue | **Met** (workflow trigger only) |
| Operational stale branch refs reconciled | **Met** |
| Evidence recorded | **This document** |
| #34 closed only after Settings change | **Deferred to maintainer** — #34 remains open |
