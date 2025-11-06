APTUM MVP overview

Sources
- PRD v1.1 (Product Requirements)
- ASA v1.0 (Architecture)
- TIG v1.0 (Technical Implementation Guidelines)

MVP pillars
- Auth: Google Sign-In is required. Establish Google Drive App Folder under the athlete’s account.
- Data: Local-first IndexedDB; Drive App Folder is the synchronized replica. Export/import JSON zip.
- AI: BYOK. Orchestrator distills a Session Context (SC) from full context; subsequent turns use SC + deltas.
- Core modules: Strategy, Exercise Engine, Tracking, Recovery, Calendar/Constraints.

Key screens
- Strategy (chat + editable mesocycle scaffold)
- Schedule (week grid, blockers w/ RRULE, daily cap, focus)
- Session (Warm-up → Focus/Compounds → Accessories/ISO → Cool-down; inline edits; toggles)
- Recovery & Progress (systemic readiness, per-muscle heatmap, weekly targets)
- Settings (units, BYOK, export/import)

Performance budgets
- Initial load ≤ 1s (cached)
- Proposal p50 ≤ 3s
- Auto-save P95 ≤ 150 ms

Notes for engineering
- Background weekly generation before daily presentation; rebuild after a missed session.
- Deterministic IDs for sessions/events.
- SC cache with prompt template version and context hashes.
\nCI: trigger auto-merge workflow
