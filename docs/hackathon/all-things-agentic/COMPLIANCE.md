# All Things Agentic — Compliance Matrix

Status date: **2026-08-24**

This checklist maps submission requirements to concrete Tital evidence and separates product verification from remaining human submission actions.

## Mandatory technology requirements

| Requirement | Tital evidence | Status |
|---|---|---|
| Gemini 3.5 or newer | Central runtime uses `gemini-3.5-flash`; deployed runtime/health metadata and authenticated E2E verify Gemini 3.5 Flash on Vertex AI | ✅ |
| Google Agent Framework | `@google/adk` TypeScript agents power generation, tool-backed research and review roles | ✅ |
| Google Cloud infrastructure | Cloud Run, Cloud Storage, Firebase Auth/Admin, Workload Identity Federation | ✅ |
| Agent beyond standard chat | Persisted multi-stage workflow with Parallel tools, provenance, stage-aware AI review, human gates, coverage, final review, revision impact, selective repair, audit and package history | ✅ |

## Selected category

**Collaborative Partner**

Verified collaboration behavior:

- Director Brief persists creative constraints;
- every generative stage stops at human review;
- AI recommendations remain advisory;
- `Reject & try another` supports scoped feedback;
- coverage gaps require explicit Retry/Waive/Cancel;
- stage-aware AI review is available from Film Brief through Visual Decision;
- completed packages can receive advisory Final AI Review;
- human-governed revision preserves unaffected trusted science;
- scientific/provenance/uncertainty constraints outrank creative preference.

## Required submission artifacts

| Item | Evidence | Status |
|---|---|---|
| Category | Collaborative Partner | ✅ |
| Hosted URL | `https://tital-o7za4b3w5q-ts.a.run.app/` | ✅ |
| Features/functionality | `SUBMISSION.md` | ✅ current |
| Technology/data sources | root README + `SUBMISSION.md` | ✅ current |
| Public repository | `https://github.com/amin076/tital` | ✅ |
| Reproducible run instructions | root README | ✅ |
| Architecture explanation | `ARCHITECTURE.md` | ✅ current |
| Architecture graphic | `architecture.svg` | ✅ existing / verify final export visually |
| ~4-minute demo plan | `DEMO_SCRIPT.md` | ✅ current / recording pending |
| Google Cloud runtime proof | runtime metadata + Cloud Run/GitHub Actions | ✅ evidence exists / include in demo |
| Earlier Gemini 3.5 E2E | `docs/submission/e2e-gemini-35-smoke-test/` | ✅ |
| Feedback-driven acceptance | `docs/submission/feedback-driven-e2e/README.md` | ✅ |

## Partner/runtime evidence

Tital uses Parallel in the live research path:

```text
Parallel web_search
→ Source candidates
→ human Source approval
→ Parallel web_fetch exact approved URL
→ grounded Evidence proposals
```

Parallel output is validated before trusted workflow use.

## Live acceptance evidence — verified

The 2026-08-24 `Aurora Grounding Test` verified:

- `5` Research Questions approved;
- `24` Sources total: `21 approved / 3 rejected`;
- `123` full-source Evidence candidates;
- Adaptive Evidence Budget: `24 active / 99 archived`;
- active Evidence decisions: `21 approved / 3 rejected`;
- `21/21` active Evidence Source branches using Parallel `web_fetch`;
- stage-aware Script review with attention/risk recommendations and human-controlled status;
- explicit coverage-gap dialog;
- stage-aware Scene/Shot/Visual review;
- deterministic Governance & Provenance Audit with `0 issues`;
- separate Final Production AI Review with cross-stage semantic findings;
- Script and Scene revision targets added after live Final Review exposed the need;
- deterministic Script revision impact: `1 Script / 1 Scene / 2 Shots / 2 Visuals`, with Research/Source/Evidence/Claims preserved;
- repair-before-audit/package state guard added after live bug discovery;
- selective repair returned replacement Script candidates to AI-assisted Human Review;
- re-audit + package rebuild;
- activity history recorded `REVISION COMPLETED`, `AUDIT EXECUTED`, `PACKAGE BUILT`;
- rebuilt package returned to `READY_FOR_PRODUCTION` with audit `0 issues`;
- second Final Production Review ran on the rebuilt package without mutating trusted state.

## Production-readiness evidence

- Public detached no-login completed demo exists.
- Authenticated Director Workspace exists.
- Cloud Storage state survives Cloud Run revisions.
- Firebase ID tokens protect live session APIs.
- GitHub Actions validates typecheck/tests/build before enabled main deployment.
- Workload Identity Federation avoids bundled long-lived service-account JSON credentials.
- `/api/health` post-deploy assertion verifies required runtime/release facts.
- rejected/archived/stale records remain distinct historical states.
- governed revision cannot complete while an `APPLIED` revision still requires repair.
- audit scope is accurately described as governance/provenance rather than scientific peer review.

## Safe scientific claim boundary

Safe:

> New production Evidence is grounded through Parallel `web_fetch` of the exact human-approved Source URL, and its provenance is stored in Tital.

Unsafe:

> Every source/evidence item has been independently verified as scientifically true.

Full-source grounding, AI review, human review and deterministic governance audit are different layers.

## Performance/cost claim boundary

Safe:

> Tital uses separate concurrency controls for general agent work and full-source Evidence, bounded retry for transient provider rate limits, and an Adaptive Evidence Budget to reduce active review/downstream volume while preserving broad research candidates.

Do not claim a percentage cost/speed improvement without controlled comparable runs. Evidence Budget V1 still retrieves/extracts approved Sources before global compaction.

## Participant/legal self-attestation

The entrant must personally confirm Devpost age, country/territory, team, ownership, prior-work/disclosure, prize/tax and other legal fields. Repository code cannot self-attest personal eligibility.

## Final go/no-go

```text
hosted application / public demo        PASS
Gemini 3.5 + Google ADK runtime          PASS
Google Cloud runtime                     PASS
Parallel runtime integration             PASS
human-governed workflow                  PASS
full-source grounding                    PASS
stage-aware AI review                    PASS
Adaptive Evidence Budget                 PASS — live accepted
Final Production AI Review               PASS — live accepted
governed Script/Scene revision           PASS — live accepted
selective repair / re-audit              PASS — live accepted
architecture/docs                        CURRENT after final polish PR
video                                    PENDING RECORD/UPLOAD
final public/logged-out check             PENDING
Devpost personal/legal fields            PENDING HUMAN ACTION
```

Product GO is achieved. Submission GO still requires the final video, public-link check and completion of human Devpost fields.
