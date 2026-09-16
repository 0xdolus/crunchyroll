---
spec_version: 1.0.0
artifact_id: FOUNDATION-CHANGE-MANAGEMENT
entity_id: FOUNDATION
owner: architecture
path: 00_FOUNDATION/CHANGE_MANAGEMENT.md
locked: true
last_reviewed: 2026-09-16
---
# Change Management

This specification is frozen at v1.0.0. Changes follow a strict process.

## Allowed change types

| Type | Process | Version impact |
|------|---------|----------------|
| Typo / clarification | PR + review | patch (1.0.x) |
| New artifact for existing entity | Change request + PR | minor (1.x.0) |
| New entity (new screen, component…) | Change request + architecture review | minor or major |
| Breaking contract change | RFC + approval | major (x.0.0) |
| Deletion of entity | Explicit deprecation notice + grace period | major |

## Required artifacts for any change

1. Filled change-request template from `templates/`.
2. Updated DEPENDENCY_GRAPH.json edges.
3. Regenerated PROJECT_MANIFEST.json and LOCKED_CONTENT_HASH.
4. Passing `spec-validation` workflow.
5. Updated FREEZE.md / VERSION.md only on version bumps.

Silent edits that alter the lock hash without a version bump are rejected by CI.
