# Local Development

This document describes the verified local-development workflow for the current Tital MVP.

## Prerequisites

### Node.js

Two Node.js versions have been used successfully during Tital development:

```text
22.18.0
24.13.0
```

The repository does **not** currently declare a formal minimum Node version in `package.json`, so do not treat `24.13.0 or higher` as a project requirement. Prefer one of the versions already verified with the current dependency set unless there is a reason to test an upgrade.

### npm

Tital uses npm. Install dependencies with:

```bash
npm install
```

### Google Cloud SDK

`gcloud` is required for live Vertex AI runs using Application Default Credentials (ADC).

## Clone and install

```bash
git clone https://github.com/amin076/tital.git
cd tital
npm install
```

## Configure the live runtime

The current repository includes `.env.example`, but the application does not implement a universal project-level dotenv loader. For reliable local runs, set the verified variables in the shell that launches Tital.

Windows PowerShell:

```powershell
$env:GOOGLE_CLOUD_PROJECT="scientific-film-director-agent"
$env:GOOGLE_CLOUD_LOCATION="global"
$env:GOOGLE_GENAI_USE_VERTEXAI="true"
```

Authenticate ADC:

```bash
gcloud auth application-default login
```

If live Vertex calls fail unexpectedly, also inspect `GOOGLE_APPLICATION_CREDENTIALS`. A stale path can override normal ADC discovery.

PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS
```

If the value is known to be stale and you intend to use ADC, remove it from the current shell only:

```powershell
Remove-Item Env:\GOOGLE_APPLICATION_CREDENTIALS -ErrorAction Ignore
```

See [Runtime Configuration](../execution/runtime-configuration.md) for the full explanation.

## Validation before live runs

Run these first:

```bash
npm run typecheck
npm test
```

These validation commands are designed to run without live Vertex AI or Parallel MCP calls.

## Current executable entry points

### Baseline ADK agent

```bash
npm run adk:run
```

Runs the root `agent.ts` harness.

### Parallel MCP agent

```bash
npm run parallel:run
```

Runs `parallel-agent.ts`, which exposes the Parallel-enabled source-discovery agent through ADK.

### Define film brief

```bash
npm run define -- "A film about the moons of Jupiter"
```

Runs `src/cli/define.ts` and produces a validated `FilmBrief`.

### Research questions

```bash
npm run research-questions
```

Runs `src/cli/researchQuestions.ts`.

## Current development boundary

The current repository is a TypeScript/Node.js MVP. It does not yet include:

```text
production web UI
persistent project database
authentication
multi-user review queues
one persisted end-to-end project session
final video rendering
```

When developing a new feature, preserve the existing trust boundary:

```text
model proposes content
→ Zod validates structure
→ service validates provenance and upstream approval
→ application owns IDs/statuses
→ human review gate
→ next stage becomes eligible
```

## Formatting and linting

Tital does not yet have a standardized formatter/linter command in `package.json`. Match the existing TypeScript style and rely on `npm run typecheck` plus the test suite until a formatter/linter is intentionally introduced.
