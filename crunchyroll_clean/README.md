---
spec_version: 1.0.0
artifact_id: DOC-README
owner: architecture
path: README.md
locked: true
last_reviewed: 2026-09-16
---
# Crunchyroll Android Master Build Spec v1.0

**Specification-only repository** — no Kotlin, Gradle, or Android Studio project.

This is the immutable pre-code source of truth for an AI-assisted, phase-locked Android (Jetpack Compose + Media3) Crunchyroll client.

## Authority Hierarchy
1. `00_FOUNDATION/BUILD_BIBLE.md`
2. `PROJECT_MANIFEST.json`
3. Phase playbooks and individual contracts

## Build Principle
Specification → Contract → Implementation → Validation.
Code never overrides the specification.

## Repository Layout
| Phase | Folder | Purpose |
|-------|--------|---------|
| 00 | 00_FOUNDATION/ | Project constitution & architecture |
| 01 | 01_PHASE_PLAYBOOKS/ | 16 build phases + checklists |
| 02 | 02_DESIGN_SYSTEM/ | Material 3 tokens, typography, colors, spacing |
| 03 | 03_COMPONENT_LIBRARY/ | Every reusable UI component |
| 04 | 04_SCREEN_BLUEPRINTS/ | Complete specs for every screen/state |
| 05 | 05_NAVIGATION/ | Routes, graphs, transitions, deep links |
| 06 | 06_STATE_ARCHITECTURE/ | UI states / events / effects / ViewModel contracts |
| 07 | 07_DATA_LAYER/ | Models, Room, repositories, cache |
| 08 | 08_PROVIDER_CONTRACTS/ | API / provider abstraction |
| 09 | 09_PLAYER_MODULE/ | Media3 playback specification |
| 10 | 10_LIBRARY_PROFILE/ | Library / profile / download / history |
| 11 | 11_QA_RELEASE/ | Testing, accessibility, CI/CD |
| 12 | 12_AI_GUIDE/ | AI prompts, review guides, handoff |
| 13 | previews/ | HTML + PNG references |
| 14 | templates/ | Reusable document templates |
| 15 | handoff/ | Progress tracking |
| 16 | scripts/ | Validation / export / build helpers |

## Next Step
Generate the implementation repository (`Crunchyroll-Android-App`) from this specification in strict phase order.
