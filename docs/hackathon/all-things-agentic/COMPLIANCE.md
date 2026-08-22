# All Things Agentic — Compliance Matrix

This checklist maps the published hackathon requirements to concrete Tital evidence. It intentionally separates **implemented/verified**, **prepared**, and **human action still required**.

## Mandatory technology requirements

| Requirement | Tital evidence | Status |
|---|---|---|
| Gemini 3.5 or newer | Central runtime model `src/config/models.ts` is `gemini-3.5-flash`; all LLM agents import that constant; regression test prevents 2.5 drift; public runtime metadata and the deploy workflow verify the exact model/release; authenticated Aurora E2E completed on `gemini-3.5-flash` / `VERTEX_AI` / Google ADK | ✅ deployed + automated runtime assertion passed + live semantic E2E passed |
| Google Agent Framework | `@google/adk` TypeScript agents for Define, Research Questions, Source Discovery, Evidence, Claims, Script, Scenes, Shots, Visual Decisions | ✅ |
| Google Cloud infrastructure | Hosted Node + React service on Cloud Run; Cloud Storage persistence; Firebase authentication; Workload Identity Federation deployment | ✅ |
| Agent beyond a standard chat loop | Typed multi-stage workflow with action/tool calls, persistence, human interrupts, review, coverage, audit, and package release | ✅ |

## Selected track

**Collaborative Partner**

Evidence:

- persistent Director Brief captures the user's collaboration mode and cinematic preferences;
- every generative stage pauses at a human review boundary;
- `Reject & try another` accepts scoped feedback and triggers targeted replacement;
- the director can explicitly opt in to remember a retry instruction for later Scene, Shot, and Visual Decision proposals;
- remembered feedback is persisted as governed project state, surfaced in the Director Context rail, counted in cinematic decision provenance, and removed from public demo snapshots;
- rejection does not authorize silent regeneration;
- intentional gaps require explicit human waivers;
- creative preferences cannot override evidence/uncertainty/visual-integrity constraints.

## Required submission items

| Devpost item | Prepared artifact / evidence | Status |
|---|---|---|
| Category | Collaborative Partner | ✅ |
| Hosted project URL | `https://tital-o7za4b3w5q-ts.a.run.app/` | ✅ deployed |
| Features/functionality description | `SUBMISSION.md` | ✅ |
| Technologies used | `SUBMISSION.md` + root README | ✅ |
| Other data sources | Parallel Search MCP documented | ✅ |
| Findings/learnings | `SUBMISSION.md` | ✅ |
| Public code repository | `https://github.com/amin076/tital` | ✅ |
| Spin-up instructions | Root `README.md`, strengthened for hackathon reproducibility | ✅ |
| Architecture diagram | `architecture.svg` + `ARCHITECTURE.md` | ✅ prepared |
| ~4-minute demo video | `DEMO_SCRIPT.md` + recording checklist | 🟡 human recording/upload required |
| Proof backend runs on Google Cloud | Cloud Run URL + GitHub deployment workflow; public landing/health expose safe model, framework, service, revision, and release metadata; demo script includes Cloud Run/Vertex proof shot | ✅ evidence exists / 🟡 Console proof must be shown in video |
| Verified Gemini 3.5 E2E evidence | `docs/submission/e2e-gemini-35-smoke-test/gemini-35-e2e-report.md` plus curated screenshots in `docs/submission/e2e-gemini-35-smoke-test/selected/` | ✅ |

## Production-readiness evidence

- Public no-login completed demo exists and has been browser-validated.
- Authenticated live Director Workspace exists.
- GitHub Actions validates typecheck, tests, and production build.
- `npm run verify:submission` reproduces typecheck, all deterministic tests, and the production build locally.
- Main pushes deploy to Cloud Run via Workload Identity Federation when enabled.
- The deploy job fails closed if `/api/health` does not report `gemini-3.5-flash`, Google ADK, Cloud Run, and the deployed Git commit.
- Cloud Storage persistence survives Cloud Run revisions.
- Firebase ID tokens protect live session APIs.
- User sessions are namespaced by Firebase UID.
- Completed Dinosaur project reached `READY_FOR_PRODUCTION`.
- Authenticated Aurora Gemini 3.5 E2E reached `READY_FOR_PRODUCTION` on Cloud Run revision `tital-00030-8ht` at commit `3ded520f568ff8d86f9af83134c3e77f146019a8`.
- Aurora governance/provenance audit passed with 0 issues and final refresh persistence passed.
- Governance/provenance audit reports its scope honestly and does not claim independent scientific peer review.

## Gemini 3.5 migration acceptance checklist

Before using the words **“powered by Gemini 3.5 Flash”** in the final video/submission, complete all of the following on the deployed revision:

- [x] Central model migration and model-drift regression test are present.
- [x] Local typecheck, 239 deterministic tests, web build, and server build pass on main.
- [x] Safe runtime/release proof is implemented in the public landing and `/api/health`.
- [x] Main deployment workflow contains an exact post-deploy model/framework/infrastructure/release assertion.
- [x] Final-readiness PR #29 CI passed.
- [x] Main workflow #61 deployed to Cloud Run and passed the exact post-deploy runtime assertion.
- [x] Create one new project through the production UI.
- [x] FilmBrief generation succeeds on `gemini-3.5-flash`.
- [x] Approve FilmBrief and run Research Question generation.
- [x] Approve Research Questions and confirm Parallel MCP Source Discovery still works.
- [x] Run downstream Gemini stages through Claims, Script, Scenes, Shots, and Visual Decisions; structured output parsing, validation, provenance, review gates, and persistence remained compatible.
- [x] Capture screenshot evidence showing the live deployed application after the migration.

The authenticated Aurora run completed a full production package and is documented in `docs/submission/e2e-gemini-35-smoke-test/gemini-35-e2e-report.md`.

## Participant / legal self-attestation

The repository cannot determine personal legal eligibility. Before final submission, the entrant must personally confirm in Devpost that:

- they meet the age-of-majority requirement;
- their country/territory is eligible under the official rules;
- all required Devpost terms and prize/tax declarations are accepted;
- any team/organization details are accurate.

Do not infer or automate those attestations.

## Disclosure discipline

The submission should accurately disclose that Tital uses:

- Google ADK and Gemini on Vertex AI;
- Parallel Search MCP as an external source-discovery tool;
- Firebase Authentication;
- Cloud Run and Cloud Storage;
- open-source application dependencies listed in `package.json`.

If the Devpost form asks about prior work, reused code, teams, employers, or development assistance, answer that field truthfully based on the entrant's actual development history. This checklist does not attempt to interpret unverified legal language.

## Final go/no-go

**GO** only when:

```text
Gemini 3.5 live E2E smoke test       PASS
CI + production deployment          PASS
public demo                          PASS
architecture diagram                ATTACHED
video <= ~4 min                      PENDING UPLOAD
Cloud proof visible in video         YES
repo + README reproducibility        PASS
Devpost personal eligibility         PENDING SELF-CONFIRMATION
```
