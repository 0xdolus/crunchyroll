---
spec_version: 1.0.0
artifact_id: FOUNDATION-MODULE-BOUNDARIES
entity_id: FOUNDATION
owner: architecture
path: 00_FOUNDATION/MODULE_BOUNDARIES.md
locked: true
last_reviewed: 2026-09-16
---
# Module Boundaries

The eventual Android implementation must respect these compile-time and architectural boundaries. The specification repository itself mirrors the same separation.

## Layers (top → bottom)

| Layer | Responsibility | May depend on | Must not depend on |
|-------|----------------|---------------|--------------------|
| Presentation (Compose UI + ViewModels) | UI state, events, navigation | Domain, Design System | Data, Providers, Player internals |
| Domain | Pure models, use-cases, repository interfaces | nothing | Android framework, network, Room |
| Data | Repository implementations, Room, cache | Domain, Provider contracts | Presentation, Compose |
| Provider | Remote API adapters, auth, DTO mapping | Domain models only | UI, Room |
| Player | Media3 session, controls, playback state machine | Domain (Episode, Subtitle…) | Screens, other repositories |
| Design System | Tokens, themes, reusable components | nothing | Business logic |

## Concrete rules

1. No Compose import may appear below the Presentation layer.
2. Room / DataStore / network clients live only inside Data or Provider modules.
3. The Player module exposes a narrow public API (PlayerController, PlayerState). Screens may only talk to that API.
4. Feature modules (Home, Browse, Detail, Library…) may depend on the shared Design System and Domain; they must not depend on each other.
5. Circular dependencies between any two layers are forbidden and will fail the architecture-check CI job.

## Specification mapping

- `03_COMPONENT_LIBRARY` + `02_DESIGN_SYSTEM` → Design System module
- `04_SCREEN_BLUEPRINTS` + `06_STATE_ARCHITECTURE` → Presentation
- `07_DATA_LAYER` → Data + Domain models
- `08_PROVIDER_CONTRACTS` → Provider
- `09_PLAYER_MODULE` → Player
