# UI Current Gate Vertical Slice

This branch introduces the first bounded Tital web UI mission. It intentionally wraps the existing governed MVP session workflow instead of rebuilding workflow rules in React.

## Scope

Implemented in this slice:

```text
persisted session list
→ open session
→ show stage / nextAction / blockedBy / record counts
→ show current pending human-review records
→ select records
→ approve / reject through reviewMvpSession
→ persist
→ continue through advanceMvpSession
→ refresh
→ show recent session events
```

`FilmBrief` rejection remains disabled because the current domain contract does not support a `REJECTED` FilmBrief status.

Not implemented in this slice:

```text
Start New Project
provenance graph/navigation
full stage-specific record browsers
Audit page
Production Package page
authentication
cloud persistence
deployment
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
reviewMvpSession
advanceMvpSession
evaluateMvpWorkflow
            ↓
existing Google ADK / Gemini / Parallel runtime when required
```

The API is an adapter. It does not directly mutate `.tital` JSON files and does not auto-approve model output.

## Install after pulling the branch

The branch changes `package.json` but intentionally does not hand-edit `package-lock.json`.

Run:

```bash
npm install
```

This installs the new web dependencies and lets npm update the lockfile correctly.

## Validate

```bash
npm run typecheck
npm test
npm run web:build
```

These commands should be run before merging.

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

Optional API configuration:

```text
TITAL_API_HOST
TITAL_API_PORT
TITAL_WEB_ORIGIN
TITAL_SESSION_DIR
```

## Runtime cost warning

Listing sessions, opening sessions, and review decisions are local/deterministic.

`Continue` delegates to the real `advanceMvpSession` workflow. Depending on the current stage, it can trigger Gemini / Vertex AI and Parallel MCP calls. The UI displays this warning before the action.
