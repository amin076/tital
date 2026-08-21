# All Things Agentic — Compliance Matrix

This checklist maps the published hackathon requirements to concrete Tital evidence. It intentionally separates **implemented/verified**, **prepared**, and **human action still required**.

## Mandatory technology requirements

| Requirement | Tital evidence | Status |
|---|---|---|
| Gemini 3.5 or newer | Central runtime model `src/config/models.ts` is `gemini-3.5-flash`; all LLM agents import that constant; regression test prevents 2.5 drift | ✅ code-ready; live smoke test required after deployment |
| Google Agent Framework | `@google/adk` TypeScript agents for Define, Research Questions, Source Discovery, Evidence, Claims, Script, Scenes, Shots, Visual Decisions | ✅ |
| Google Cloud infrastructure | Hosted Node + React service on Cloud Run; Cloud Storage persistence; Firebase authentication; Workload Identity Federation deployment | ✅ |
| Agent beyond a standard chat loop | Typed multi-stage workflow with action/tool calls, persistence, human interrupts, review, coverage, audit, and package release | ✅ |

## Selected track

**Collaborative Partner**

Evidence:

- persistent Director Brief captures the user's collaboration mode and cinematic preferences;
- every generative stage pauses at a human review boundary;
- `Reject & try another` accepts scoped feedback and triggers targeted replacement;
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
| Spin-up instructions | Root `README.md`, strengthened for hackathon reproducibility | ✅ after this branch merges |
| Architecture diagram | `architecture.svg` + `ARCHITECTURE.md` | ✅ prepared |
| ~4-minute demo video | `DEMO_SCRIPT.md` + recording checklist | 🟡 human recording/upload required |
| Proof backend runs on Google Cloud | Cloud Run URL + GitHub deployment workflow; demo script includes Cloud Run/Vertex proof shot | ✅ evidence exists / 🟡 must be shown in video |

## Production-readiness evidence

- Public no-login completed demo exists and has been browser-validated.
- Authenticated live Director Workspace exists.
- GitHub Actions validates typecheck, tests, and production build.
- Main pushes deploy to Cloud Run via Workload Identity Federation when enabled.
- Cloud Storage persistence survives Cloud Run revisions.
- Firebase ID tokens protect live session APIs.
- User sessions are namespaced by Firebase UID.
- Completed Dinosaur project reached `READY_FOR_PRODUCTION`.
- Governance/provenance audit reports its scope honestly and does not claim independent scientific peer review.

## Gemini 3.5 migration acceptance checklist

Before using the words **“powered by Gemini 3.5 Flash”** in the final video/submission, complete all of the following on the deployed revision:

- [ ] PR CI passes after model migration.
- [ ] Main deploy to Cloud Run succeeds.
- [ ] Create one new project through the production UI.
- [ ] FilmBrief generation succeeds on `gemini-3.5-flash`.
- [ ] Approve FilmBrief and run Research Question generation.
- [ ] Approve at least one Research Question and confirm Parallel MCP Source Discovery still works.
- [ ] Run at least one downstream Gemini stage (Evidence or Claims) to confirm structured JSON parsing remains compatible.
- [ ] Capture a screenshot/video frame showing the live deployed application after the migration.

A full second production package is desirable but not required merely to prove model compatibility if the existing public demo remains the main read-only showcase.

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
Gemini 3.5 live smoke test           PASS
CI + production deployment          PASS
public demo                          PASS
architecture diagram                ATTACHED
video <= ~4 min                      UPLOADED / accessible
Cloud proof visible in video         YES
repo + README reproducibility        PASS
Devpost personal eligibility         SELF-CONFIRMED
```
