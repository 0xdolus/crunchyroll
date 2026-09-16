---
spec_version: 1.0.0
artifact_id: FOUNDATION-BUILD-BIBLE
entity_id: FOUNDATION
owner: architecture
path: 00_FOUNDATION/BUILD_BIBLE.md
locked: true
last_reviewed: 2026-09-16
---
# BUILD_BIBLE.md — Highest Authority Document

## 1. Mission
Produce a production-grade Crunchyroll Android client using Jetpack Compose, Media3, and a clean architecture that can be implemented and validated entirely through GitHub Actions and AI-assisted generation.

## 2. Non-Negotiable Rules
1. Specification is the single source of truth.
2. No Kotlin source exists in this repository.
3. Every screen, component, repository, and provider has an explicit contract before any code is written.
4. All public APIs are documented with contracts, examples, and error mappings.
5. Accessibility (WCAG 2.2 AA) is mandatory for every interactive element.
6. Offline-first where feasible; graceful degradation always.
7. Player (Media3) is isolated behind a strict boundary.

## 3. Architecture Overview
- Presentation: Compose + ViewModel (UDF)
- Domain: Use-cases + pure models
- Data: Repositories + Room + remote providers
- Player: Media3 module with explicit state machine

## 4. Phase Locking
A phase is locked only after its checklist is 100% green and signed in handoff/.
