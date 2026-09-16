---
spec_version: 1.0.0
artifact_id: FREEZE
owner: architecture
locked: true
---

# Spec v1.0.0 Freeze (Corrected)

This repository is the corrected, ready-to-commit baseline.

## Lock model

- **LOCKED_CONTENT_HASH** is computed only over:
  - 00_FOUNDATION … 12_AI_GUIDE
  - templates/
- Control files (PROJECT_MANIFEST.json, DEPENDENCY_GRAPH.json, VERSION.md, FREEZE.md, README.md, previews/, scripts/, handoff/, .github/) are **excluded** from the hash. This eliminates the circular-hash problem.

## ID model

- `artifact_id` — globally unique document identifier (e.g. SCR-001-LAYOUT)
- `entity_id` — logical entity shared by related artifacts (e.g. SCR-001)

Multiple documents may share an `entity_id`; no two documents may share an `artifact_id`.

## Change process

Any modification to locked content requires:

1. Formal change request
2. Version bump
3. Regeneration of LOCKED_CONTENT_HASH and manifests
4. Passing CI

Current LOCKED_CONTENT_HASH:
`bb8bcf5b98d2f9a78494090061ff4c4e7c7f9e9034984272488d14da90c1382c`


## Control-plane files

PROJECT_MANIFEST.json, DEPENDENCY_GRAPH.json, VERSION.md, FREEZE.md, README.md and .github/ are control-plane artifacts. They are excluded from LOCKED_CONTENT_HASH and are not required to self-hash inside the manifest inventory.
