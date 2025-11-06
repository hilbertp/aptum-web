# APTUM — Role Contract and Ways of Working

Purpose: clarify responsibilities, decision rights, and working agreements between the Product side and the Engineering side for the APTUM web MVP and beyond.

Last updated: 2025-11-06

## Roles

Owned by Product (you)
- Stakeholder: Owns vision, business goals, and outcomes
- Product Owner (PO): Owns scope, priorities, acceptance of increments
- Sports Science Analyst: Provides validated models, thresholds, and rationale for recovery/readiness/training logic

Owned by Engineering (II Agent)
- Architect: Owns system architecture, data model, security/privacy, and API contracts
- Development Team Lead: Owns delivery planning, task breakdown, code quality, and release readiness
- Development: Builds features, tests, and documentation according to standards
- CI/CD Owner: Owns pipelines, branch protections, automation, and deployment health

## Responsibilities

Product Owner / Stakeholder
- Define product goals and accept the increment (MVP and follow‑ons)
- Prioritize the backlog (what matters first) and supply non‑technical assets (copy, brand choices, etc.)
- Provide/approve required third‑party credentials (e.g., Google OAuth Client ID)
- Give timely feedback on live builds and designs; raise constraints, risks, or policy concerns

Sports Science Analyst
- Provide/curate validated literature and parameter choices (τ values, method multipliers, thresholds)
- Review training/recovery logic and sign off on assumptions and simplifications

Architect (II Agent)
- Maintain ASA (architecture), data ownership model, and security posture
- Keep `openapi.yaml` and core contracts aligned to PRD; enforce compatibility
- Select libraries/tools; manage non‑functional requirements (performance, reliability, accessibility)

Dev Team Lead (II Agent)
- Plan work, break down into PRs, keep work flowing via auto‑merge once checks pass
- Enforce coding standards, testing strategy, and “Definition of Done” (below)
- Keep CI green; fix blockers quickly; coordinate releases

Development (II Agent)
- Implement features per PRD/ASA/TIG with tests and documentation
- Maintain visual quality and UX per design principles
- Proactively refactor and improve code quality

CI/CD Owner (II Agent)
- Maintain GitHub Actions, auto‑merge, and branch protections
- Manage secrets and automation via the GitHub App (least privilege)
- Ensure reproducible builds, PWA integrity, and artifact retention

## Decision Rights

- Product scope, priorities, UX acceptance → Product Owner (final say)
- Technical architecture, libraries, code conventions → Architect/Dev Lead (final say)
- Security/secrets handling → Architect/CI Owner (must meet best practices)
- Disagreements are escalated to PO for scope/time tradeoffs; otherwise II Agent proceeds with best practice implementation

## Working Agreements

Branching & PRs
- Branch names: `feat/*`, `fix/*`, `chore/*`, `refactor/*`
- PRs auto‑merge (squash) when CI passes; PO can pause by adding label `do-not-merge` or commenting “HOLD”
- All PRs must pass: lint, typecheck, build; feature PRs should include tests when applicable

CI/CD
- Workflows: `.github/workflows/ci.yml` (lint+build), auto‑merge enablement on PR events and check completion
- Secrets (repository level):
  - `GHA_APP_ID`, `GHA_APP_PRIVATE_KEY` (GitHub App for PR management)
  - Frontend env as needed (e.g., `VITE_GOOGLE_CLIENT_ID`)
- Main is protected; only CI‑passing auto‑merge writes to main

Security & Privacy
- BYOK keys are never exported; stored locally encrypted when user opts in
- Google Drive scope is `drive.appdata` only; data remains under the athlete’s control
- Export/import is a local zip with a manifest; no telemetry in MVP

Documentation & Artifacts
- PRD/ASA/TIG (source), `docs/OVERVIEW.md` (summary), `openapi.yaml` (contracts), `docs/ROLE_CONTRACT.md`
- Code comments are minimal and only where non‑obvious; otherwise rely on clear names and structure

Backlog & Planning
- II Agent proposes and executes a backlog aligned to PRD; PO can reprioritize anytime
- II Agent raises issues/risks and proceeds with best practice defaults unless blocked by credentials/policy

Acceptance & Definition of Done
- Code merged to `main` with CI passing
- Visible UI feature behind a route or component demo where applicable
- Basic tests where applicable; type‑safe and lint‑clean
- Docs updated (contracts and README/OVERVIEW as needed)
- Manual smoke test and screenshots for major UI features

Communication
- Asynchronous by default via PR descriptions and status updates
- PO provides feedback by commenting on PRs or creating issues; otherwise II Agent proceeds

Change Management
- Breaking contract changes are proposed via PR with migration notes
- Secrets and keys are rotated/revoked as required

## Current Agreements (MVP)
- Auth: Google Sign‑In (GIS token client), Drive App Folder sync (encrypted bundle)
- AI: BYOK (provider‑agnostic orchestrator; SC pattern)
- Weekly sessions are generated ahead of daily presentation; missed sessions trigger rebuild prior to next day
- Auto‑merge is enabled when CI passes; “HOLD” comment or `do-not-merge` label pauses it
