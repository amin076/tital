# Tital Web UI Vertical Slice

This branch contains the bounded Tital web UI from project creation through final production-package inspection. It wraps the existing governed MVP session workflow instead of rebuilding workflow rules in React.

## Implemented scope

```text
New scientific film idea
→ create persisted session through createMvpSession
→ FilmBrief human review
→ governed Continue actions
→ selective approve / reject at each human gate
→ workflow progress and blocker visibility
→ approved-chain coverage visibility
→ final human-readable Production Package
→ governance / provenance audit result
→ provenance / traceability view
→ human-readable text report
→ print-ready / Save-as-PDF report
→ machine-readable JSON package download
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

Review records are presented as readable scientific content. The web UI no longer exposes raw JSON as the normal human-review surface. JSON remains persisted and available through the API/domain workflow.

### UI-2 — New Project

- enter a scientific film idea
- create the session through the real `createMvpSession` path
- persist it
- stop at the FilmBrief human-review gate
- explicit live-runtime / Vertex AI cost warning

### UI-3A — Final Production Package

When a package exists, the UI shows readable, styled sections for:

- FilmBrief
- approved research questions
- approved sources and source links
- approved evidence, interpretation, strength, and uncertainty
- approved claims and confidence
- scientific script lines and disclosures
- scenes and visual summaries
- shots, camera direction, scientific constraints, and uncertainty
- visual decisions, risk level, scientific constraints, and viewer disclosures
- governance / provenance audit result and issues

The final-results area intentionally separates human-readable presentation from machine-readable data.

Exports:

- **Print / Save PDF** opens a dedicated A4 print report with typography, color accents, summary metrics, cards, tables, audit status, and print page-break rules. Long source/evidence/shot/visual-decision cards may flow across pages to reduce unnecessary blank space, while compact records and disclosures are kept together where practical. The browser's native print dialog is used to save the styled report as PDF, so no PDF runtime dependency is required.
- **Download text** exports a clean plain-text production report for reading, archiving, or downstream editing.
- **Download JSON** preserves the canonical machine-readable Production Package for APIs, agents, workflow continuation, and downstream tools.

For clean Chrome/Edge PDF output, turn off **Headers and footers** under the browser print dialog's **More settings**. Browsers do not allow a web application to change that user print preference. Tital also assigns the print popup a meaningful same-origin report URL so that, if browser headers/footers remain enabled, `about:blank` is not used as the footer URL.

### Audit semantics

The existing domain object remains `ScientificAuditReport`, but the human-facing UI/report labels it **Governance & provenance audit** because that is what the current deterministic audit actually establishes.

It checks:

- broken provenance references
- approved records depending on unapproved upstream records
- unsupported claims caused by missing/unapproved evidence
- scene / shot / script-line provenance integrity
- shot / visual-decision category consistency
- required disclosures for medium/high-risk visual decisions

A passed audit does **not** independently establish that every human-approved source is authoritative or that every approved scientific statement is true. Human approval decisions remain part of the governance model.

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

## Complete-state UX

When a session reaches `COMPLETE`, redundant empty `Current human gate` and disabled `Continue workflow` panels are hidden. The completed project focuses on:

```text
Project header
→ counts
→ progress and coverage
→ final Production Package
→ provenance / traceability
→ session history
```

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

No new package dependency is required for these final UI/report improvements if UI-1/UI-2 dependencies are already installed.

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

Listing sessions, opening sessions, package inspection, provenance inspection, coverage inspection, report export, and review decisions are local/deterministic.

Creating a project and `Continue` can trigger Gemini / Vertex AI and, for source discovery, Parallel MCP. The UI displays live-runtime warnings before those actions.
