---
spec_version: 1.0.0
artifact_id: FOUNDATION-CONTRACT-STANDARD
entity_id: FOUNDATION
owner: architecture
path: 00_FOUNDATION/CONTRACT_STANDARD.md
locked: true
last_reviewed: 2026-09-16
---
# Contract Standard

Every public surface (component, screen, repository, provider, player control) is defined by a contract before any Kotlin is written.

## Required sections for a contract document

1. **Purpose** — one-sentence intent.
2. **entity_id / artifact_id** — already in front matter.
3. **Inputs / Props / Parameters** — typed, with defaults and constraints.
4. **Outputs / Events / Effects** — exhaustive list.
5. **States** — table of possible UI or domain states and transitions.
6. **Error model** — mapped error types and recovery actions.
7. **Accessibility** — role, label, actions, focus order.
8. **Dependencies** — other entities this contract requires (must appear in DEPENDENCY_GRAPH).
9. **Examples** — at least one happy-path and one failure-path illustration.

## Enforcement

- Missing required sections fail the `spec-validation` workflow.
- Contracts are the only artifacts that may be referenced by implementation code generation prompts.
