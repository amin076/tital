# Tital Web UI Vertical Slice

This branch now contains the bounded web UI from project creation through final production-package inspection. It wraps the existing governed MVP session workflow instead of rebuilding workflow rules in React.

## Implemented scope

```text
New scientific film idea
→ create persisted session through createMvpSession
→ FilmBrief human review
→ governed Continue actions
→ selective approve / reject at each human gate
→ workflow progress and blocker visibility
→ approved-chain coverage visibility
→ final Production Package view
→ scientific audit result
→ provenance / traceability view
→ JSON package download
```

`FilmBrief` rejection remains disabled because the current domain contract does not support a `REJECTED` FilmBrief status.

## UI missions included

### UI-1 — Current Gate

- persisted session list
- open session
- stage / next action / blockers / counts
- current human-review records
- selective approve / reject
- continue through the existing application service
- recent session events

### UI-2 — New Project

- enter a scientific film idea
- create the session through the real `createMvpSession` path
- persist it
- stop at the FilmBrief human-review gate
- explicit live-runtime / Vertex AI cost warning

### UI-3A — Final Production Package

When a package exists, the UI shows:

- package status and generated time
- FilmBrief
- approved research questions
- approved sources
- approved evidence
- approved claims
- scientific script lines
- scenes
- shots
- visual decisions
- scientific audit result and issues
- downloadable production-package JSON

### UI-3B — Workflow clarity and coverage

The API computes workflow insights from the deterministic workflow state. The UI shows:

- Define → Research → Evidence → Claims → Script → Scenes → Shots → Visuals → Audit → Package progress
- current deterministic blockers
- coverage ratios for every governed parent/child relationship
- missing parent IDs when coverage is incomplete

Coverage is not a raw count threshold. For example, Evidence is complete only when every approved Source in the active provenance-connected chain has at least one approved Evidence record.

### UI-3C — Provenance / traceability

The UI exposes the approved production chain and lets the user inspect:

```text
Source
→ Evidence
→ Claim
→ Script Line
→ Scene
→ Shot
→ Visual Decision
```

The traceability view is organized by approved Research Question and then by Script Line. Rejected historical records remain persisted in the session but do not appear in the approved production chain.

## Architecture

```text
React + TypeScript + Vite + MUI
            ↓ fetch
small local Node HTTP API
            ↓
existing Tital session/application services
            ↓
JsonMvpSessionStore
createMvpSession
reviewMvpSession
advanceMvpSession
evaluateMvpWorkflow
selectApprovedProductionChain
            ↓
existing Google ADK / Gemini / Parallel runtime when required
```

The API is an adapter. It does not directly mutate `.tital` JSON files and does not auto-approve model output.

Trusted provenance IDs remain application-owned. Model proposal schemas should not require Gemini to echo parent IDs that the application already knows.

## Validate after pulling

No new package dependency is required for UI-3 if UI-1/UI-2 dependencies are already installed.

Run:

```bash
npm run typecheck
npm test
npm run web:build
```

These commands should be green before opening the PR.

## Run locally

Use two terminals from the repository root.

Terminal 1:

```bash
npm run api:dev
```

Terminal 2:

```bash
npm run web:dev
```

Open:

```text
http://127.0.0.1:5173
```

The API defaults to:

```text
http://127.0.0.1:8787
```

The Vite dev server proxies `/api` requests to that API.

When using Vertex AI, the API terminal must have the same Google Cloud environment configuration used by the Tital runtime.

## Runtime cost warning

Listing sessions, opening sessions, package inspection, provenance inspection, coverage inspection, and review decisions are local/deterministic.

Creating a project and `Continue` can trigger Gemini / Vertex AI and, for source discovery, Parallel MCP. The UI displays live-runtime warnings before those actions.
