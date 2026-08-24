# All Things Agentic — Compliance Matrix

Status date: **2026-08-24**

This checklist maps hackathon submission requirements to concrete Tital evidence. It separates implemented/verified facts from remaining human submission actions.

## Mandatory technology requirements

| Requirement | Tital evidence | Status |
|---|---|---|
| Gemini 3.5 or newer | Central model constant is `gemini-3.5-flash`; ADK agents import it; deployed health/runtime metadata reports model/framework/release; authenticated Aurora E2E completed on Gemini 3.5 Flash / Vertex AI / Google ADK | ✅ |
| Google Agent Framework | `@google/adk` TypeScript agents for generation, tool-backed research, AI review assistance and final production review | ✅ |
| Google Cloud infrastructure | Cloud Run app/API, Cloud Storage persistence, Firebase auth, Workload Identity Federation deployment | ✅ |
| Agent beyond standard chat | Persisted typed multi-stage workflow with Parallel actions, AI/human review, provenance, coverage, revision impact, selective repair, audit, and versioned package lifecycle | ✅ |

## Selected track

**Collaborative Partner**

Implemented evidence:

- persistent Director Brief controls cinematic collaboration;
- every generative stage pauses at human review;
- Source/Evidence AI review assistance focuses human attention but cannot change trusted approval status;
- `Reject & try another` supports scoped feedback;
- retry guidance is reusable only with explicit opt-in project memory;
- coverage gaps require explicit retry/waiver choices;
- completed packages can receive advisory AI review and explicit human-governed revision;
- scientific evidence/uncertainty/visual-integrity constraints outrank creative preference.

## Required submission items

| Item | Artifact / evidence | Status |
|---|---|---|
| Category | Collaborative Partner | ✅ |
| Hosted URL | `https://tital-o7za4b3w5q-ts.a.run.app/` | ✅ |
| Features/functionality | `SUBMISSION.md` | ✅ current |
| Technology/data sources | `SUBMISSION.md` + root README | ✅ current |
| Public repository | `https://github.com/amin076/tital` | ✅ |
| Reproducible run instructions | root `README.md` | ✅ |
| Architecture explanation | `ARCHITECTURE.md` | ✅ current |
| Architecture graphic | `architecture.svg` | ✅ refreshed |
| ~4-minute demo plan | `DEMO_SCRIPT.md` | ✅ updated / 🟡 recording required |
| Google Cloud runtime proof | public runtime metadata + Cloud Run/GitHub Actions deployment evidence | ✅ evidence exists / 🟡 include in video |
| Gemini 3.5 E2E evidence | `docs/submission/e2e-gemini-35-smoke-test/` | ✅ |

## Partner/runtime evidence

Tital uses Parallel Search MCP in the live scientific-research path:

```text
Parallel web_search
→ candidate SourceRecords
→ human Source approval
→ Parallel web_fetch exact approved URL
→ full-source grounded Evidence proposals
```

Parallel discovery/fetch output is validated before trusted workflow use. The submission should describe Parallel as both the source-discovery and approved-source retrieval tool for the current production Evidence path.

## Production-readiness evidence

- Public no-login detached completed demo exists.
- Authenticated Director Workspace exists.
- Cloud Storage persistence survives Cloud Run revisions.
- Firebase ID tokens protect live session APIs.
- GitHub Actions validates typecheck/tests/build before enabled main deployment.
- Deployment uses Workload Identity Federation rather than bundled long-lived service-account JSON credentials.
- `/api/health` post-deploy assertion verifies required model/framework/infrastructure/release facts.
- Human rejection remains history and cannot silently re-enter generation.
- AI review recommendations do not auto-approve Source/Evidence records.
- New Evidence requires full-source exact-URL grounding.
- Governed revision can invalidate affected downstream work and rebuild a package version.
- Audit scope remains Governance/Provenance rather than an unsupported claim of scientific peer review.

## Feedback-driven live acceptance status

Earlier Aurora E2E already proved Gemini 3.5 compatibility through `READY_FOR_PRODUCTION`.

The newer `Aurora Grounding Test` is being used to validate the expanded product behavior under real load. Verified observations so far include:

- 5 Research Questions approved;
- 24 Source candidates, 21 human-approved and 3 rejected;
- AI Source reviewer produced advisory recommendations while all 24 remained pending until human action;
- full-source Evidence extraction produced a broad candidate pool;
- transient Vertex 429 and Cloud Run request-starvation 429 were converted into production resilience fixes;
- the 123-Evidence live run motivated Adaptive Evidence Budget instead of hiding or deleting research material.

Adaptive Evidence Budget PR #39 must still complete final merge/deploy/live acceptance before its exact deployed `candidate → active → archived` counts are used as submission evidence.

## Safe scientific claim boundary

Safe:

> New production Evidence is grounded through Parallel `web_fetch` of the exact human-approved Source URL, and its provenance is stored in Tital.

Do **not** convert that into:

> Every source/evidence item has been independently verified as scientifically true.

Full-source grounding, AI review assistance, human review, and deterministic governance audit are different layers.

## Performance/cost claim boundary

Safe:

> Tital uses separate concurrency controls for general agent work and full-source Evidence, bounded retry for transient provider rate limits, and an Adaptive Evidence Budget to reduce active review/downstream volume while preserving broad research candidates.

Do **not** claim a percentage cost/speed improvement until controlled comparable runs exist. Adaptive Evidence Budget V1 still retrieves/extracts approved Sources before global compaction.

## Participant/legal self-attestation

The entrant must personally confirm all Devpost age, country/territory, team, ownership, prize/tax, prior-work, and related legal fields. Repository code cannot self-attest personal eligibility.

## Final go/no-go

```text
hosted application / public demo        PASS
Gemini 3.5 + Google ADK runtime          PASS
Parallel runtime integration             PASS
human-governed workflow                  PASS
full-source grounding                    PASS
AI review authority boundary             PASS
revision/versioning implementation       PASS
Adaptive Evidence Budget CI              PASS on PR branch; deployment acceptance pending
architecture/docs                        UPDATED
video                                    PENDING RECORD/UPLOAD
Devpost personal/legal fields            PENDING HUMAN ACTION
```

Final GO requires current main deployment, final live smoke acceptance, uploaded video, and completed personal Devpost submission fields.
