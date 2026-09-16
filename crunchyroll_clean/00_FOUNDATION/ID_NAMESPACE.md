---
spec_version: 1.0.0
artifact_id: FOUNDATION-ID-NAMESPACE
entity_id: FOUNDATION
owner: architecture
path: 00_FOUNDATION/ID_NAMESPACE.md
locked: true
last_reviewed: 2026-09-16
---
# ID Namespace (Locked)

All identifiers in this specification are globally unique within their namespace and must never be reused or renumbered.

## Artifact vs Entity

| Concept | Purpose | Example |
|---------|---------|---------|
| **entity_id** | Identifies the logical thing (screen, component, repository…) | `SCR-001`, `CMP-042`, `REP-007` |
| **artifact_id** | Identifies one specific document about that entity | `SCR-001-LAYOUT`, `CMP-042-CONTRACT`, `REP-007-OFFLINE` |

- Multiple artifacts may share the same `entity_id`.
- Every Markdown file that describes a concrete entity must declare both fields in its front matter.
- Control documents (BUILD_BIBLE, policies, templates) use only an `artifact_id` (or omit entity_id).

## Locked Ranges

| Prefix | Range | Meaning |
|--------|-------|---------|
| SCR | 001–099 | Screens |
| CMP | 001–199 | Components |
| STATE | 001–099 | Presentation-state contracts (per screen) |
| REP | 001–099 | Repositories |
| PROV | 001–099 | Provider / API contracts |
| MOD | 001–099 | Domain models |
| TEST | 001–999 | QA / test cases |
| PHASE | 00–16 | Build phases |
| FOUNDATION | — | Constitution documents |

## Rules

1. New entities receive the next free number in their range.
2. Numbers are never recycled, even after deletion.
3. Artifact suffixes are UPPER-SNAKE and drawn from a controlled vocabulary: LAYOUT, STATES, EVENTS, ACCESSIBILITY, CONTRACT, MAPPING, PREVIEW, NOTES, etc.
4. The combination `(entity_id, artifact_id)` must be unique across the entire repository.
5. GitHub Actions reject any PR that introduces a colliding `artifact_id` or re-uses a retired entity number.
