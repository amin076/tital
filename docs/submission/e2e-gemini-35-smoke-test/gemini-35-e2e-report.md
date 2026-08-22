# Tital Gemini 3.5 Mutating E2E Smoke Test

Test start: `2026-08-22T04:28:06Z`
Initial blocked-test completion: `2026-08-22T04:52:48Z`
Post-fix successful continuation completion: `2026-08-22T05:45:57Z`
Deployed URL: <https://tital-o7za4b3w5q-ts.a.run.app/>
Chrome title: `Tital - Scientific Film Director`
Signed-in account observed: `admin@tital.com`
Created project title: `How Auroras Form: Solar Particles and Earth's Magnetic Field`
Created project ID: BLOCKED - no project ID was visible in the app UI or visible DOM. FilmBrief record ID observed: `FB-e8e9499c-c6b8-46ec-be2e-0a9f1a85e22e`.

## Overall Verdict

PASS after deployed diagnostics fix and Vertex spend-cap remediation.

The original run successfully created one new Aurora project and completed Define, Research, Source, and Evidence review gates, then hit the real Claims-stage regression: `Claim generation agent returned an empty response.` Diagnosis found the underlying provider error was a Google/Vertex `403` spend-cap failure for `aiplatform.googleapis.com`; the deployed diagnostics fix now exposes actionable provider/runtime metadata instead of a misleading empty-response-only symptom.

After spend-cap remediation and deployment of commit `3ded520f568ff8d86f9af83134c3e77f146019a8` to Cloud Run revision `tital-00030-8ht`, the existing Aurora project resumed successfully. The single authorized Claims retry produced 33 persisted claims; 32 were scientifically approved and 1 was rejected. Downstream Script, Scenes, Shots, Visual Decisions, deterministic audit, and the production package completed. Final state is `READY_FOR_PRODUCTION` with governance/provenance audit passed and 0 issues.

## Mutation Summary

Exactly one project was created during the original test. The post-fix continuation mutated only that existing Aurora project. No older projects were modified or deleted. No export, print, download, sign-out, account, permissions, Devpost, or public-publish actions were performed.

## Stage Results

| Stage / requirement | Status | Observed result | Counts / notes | Screenshot filename |
|---|---|---|---|---|
| Authenticated session | PASS | App loaded signed in as `admin@tital.com`. | Existing projects remained present. | `001-baseline-authenticated.png` |
| Create exactly one test project | PASS | Created the authorized aurora project only. | New project visible dated `8/22/2026`. | `005-create-project-submitted.png`, `006-project-created-film-brief.png` |
| Film Brief | PASS | Generated FilmBrief covered aurora formation, solar particles, magnetosphere, atmospheric gases, colors, high latitudes, and borealis/australis. | Approved 1, rejected 0. | `006-project-created-film-brief.png`, `008-filmbrief-approved.png` |
| Director Brief | PASS | Collaboration Collaborative, pacing Balanced, camera Restrained, representation Balanced, visual language and avoid-list persisted. | Camera explicitly set to Restrained movement. | `003-new-project-form-filled.png`, `004-director-brief-camera-restrained.png`, `040-full-page-blocked-state.png` |
| Refresh after Film Brief | PASS | Browser refresh preserved the new project and Research stage. | Status `RESEARCH`. | `009-refresh-after-filmbrief-approval.png` |
| Research questions | PASS | Six relevant questions generated and inspected. They covered oxygen lifetimes/altitudes, magnetotail reconnection, nitrogen emissions, conjugate auroras, CME/storm distinction, and misconceptions. | Approved 6, rejected 0. | `011-research-questions-ready.png`, `013-research-questions-approved.png` |
| Source discovery | PASS | 33 sources generated and inspected. Authoritative/technical sources approved; weak, duplicate, promotional, or less reliable sources rejected. | Approved 20, rejected 13. | `015-sources-ready.png`, `016-authoritative-sources-selected.png`, `019-sources-approved-rejected.png` |
| Refresh after source review | PASS | Approved/rejected source counts persisted and all 6 questions had source coverage. | Sources approved 20, rejected 13. | `020-refresh-after-source-review.png` |
| Evidence | PASS | 45 evidence records generated and inspected. Supported records approved. One ambiguous 557.7 nm oxygen transition notation record was rejected. | Approved 44, rejected 1. | `023-evidence-ready.png`, `024-ambiguous-evidence-selected-for-rejection.png`, `027-evidence-approved-rejected.png` |
| Refresh after evidence review | PASS | Evidence decisions persisted; all 6 research questions had evidence coverage. | Evidence approved 44, rejected 1. | `028-refresh-after-evidence-review.png` |
| Claims generation | FAIL | Initial claim generation returned an empty response and produced no claim review gate. | Claims 0. | `031-current-state-after-claims-wait-timeout.png`, `032-claim-generation-empty-response-defect.png` |
| Claims retry control | FAIL | Retried the Claims stage twice, within the allowed limit. Both retries left the project at `CLAIMS_INCOMPLETE` with the same empty-response message. | Retry count 2; no claim records generated. | `033-claims-generation-retry-1-started.png`, `034-claims-retry-1-no-gate.png`, `036-claims-generation-retry-2-started.png`, `038-current-state-after-claims-retry-2-timeout.png` |
| Claims review | BLOCKED | No claims existed to inspect, approve, or reject. | Blocked by empty response. | `038-current-state-after-claims-retry-2-timeout.png` |
| Script | BLOCKED | Script generation depends on approved claims and was not safely reachable. | Claims coverage 0 / 6. | `038-current-state-after-claims-retry-2-timeout.png` |
| Scenes | BLOCKED | Scene generation depends on approved script/claims and was not safely reachable. | Claims coverage 0 / 6. | `038-current-state-after-claims-retry-2-timeout.png` |
| Shots | BLOCKED | Shot generation depends on scenes and was not safely reachable. | No scenes. | `038-current-state-after-claims-retry-2-timeout.png` |
| Visual decisions | BLOCKED | Visual decision generation depends on shots and was not safely reachable. | No shots. | `038-current-state-after-claims-retry-2-timeout.png` |
| Reject and try another | NOT TESTED | No generated downstream script/scene/shot/visual record reached review with a need for replacement. Claims failed before record review. | Record-level rejection was used for sources/evidence, but replacement retry was not applicable before block. | `032-claim-generation-empty-response-defect.png` |
| Governance and provenance | PASS up to blocker | Governed stages stopped at human review gates. Rejected source/evidence records remained out of the production chain. | Progress reached 3 / 10 stages complete. | `027-evidence-approved-rejected.png`, `040-full-page-blocked-state.png` |
| Traceability and coverage | PASS up to blocker | Source and evidence coverage were complete for all 6 approved research questions. Claim/script/scene coverage remained unresolved because claims could not be generated. | Source 6 / 6, evidence 6 / 6, claims 0 / 6. | `027-evidence-approved-rejected.png`, `038-current-state-after-claims-retry-2-timeout.png`, `040-full-page-blocked-state.png` |
| Activity history | PASS | Activity history count visible as 10 for the blocked project. | Activity row visible; detailed expansion was not necessary to identify blocker. | `039-bottom-runtime-activity-area.png`, `040-full-page-blocked-state.png` |
| Runtime performance | PASS with limitation | Runtime panel visible: 3 stages, 4 executions, 3m 1s measured automated runtime, 28 external calls, 0 failed, slowest stage Source discovery. | Does not explain claim empty response as a failed external call. | `039-bottom-runtime-activity-area.png`, `040-full-page-blocked-state.png` |
| Gemini 3.5 runtime model confirmation | FAIL | Visible new runtime records and console-log check did not expose `Gemini`, `Gemini 3.5`, `Vertex`, or model configuration text. | Cannot confirm required model from new runtime records. | `039-bottom-runtime-activity-area.png`, `040-full-page-blocked-state.png`; see `console-logs-model-runtime.json` |
| Production package status | BLOCKED | Package generation requires completed downstream stages and was not safely reachable. | No final package, no export/download attempted. | `038-current-state-after-claims-retry-2-timeout.png` |
| Final refresh persistence | PASS | Browser refresh preserved the new aurora project at Claims stage. | Project visible with status `CLAIMS`. | `042-final-refresh-persistence-blocked-claims.png` |
| Layout / UI obvious errors | PASS with issue noted | Main UI remained readable. The key user-facing error was functional, not layout: claim generation empty response. | No obvious overlap/blocking in app content. | `040-full-page-blocked-state.png` |

## Scientific Decisions

Approved FilmBrief because it correctly framed aurora formation as a sequence involving solar particles, magnetospheric guidance, particle precipitation, upper-atmosphere collisions, excitation, photon emission, color dependence, geomagnetic latitude, and borealis/australis distinction.

Approved all 6 research questions because each was scientifically useful and aligned with the requested standard.

Rejected 13 sources because they were weaker, duplicate, less authoritative, or less relevant compared with NASA, NOAA, NPS, peer-reviewed journals, university/scientific publishers, and established scientific institutions. Rejected examples included a preprint duplicate, ResearchGate copy, Wikipedia, unknown explainer sites, blogs, and a meteor misconception article not directly needed for aurora support.

Rejected evidence record `EV-dedbafff-abc0-4e0f-b1b4-c3ae242e3941` because its interpretation carried ambiguous/reversed oxygen transition notation for the 557.7 nm green line. The rest of the evidence set had enough approved support to preserve coverage.

No claim, script, scene, shot, or visual scientific decisions could be made because the Claims stage never produced reviewable records.

## Defects and Reproduction Steps

### DEFECT 1 - Claim generation returns empty response

Status: FAIL
Impact: Blocks governed workflow at Stage 4, prevents claims, script, scenes, shots, visuals, audit, and production package.
Evidence: `031-current-state-after-claims-wait-timeout.png`, `032-claim-generation-empty-response-defect.png`, `034-claims-retry-1-no-gate.png`, `038-current-state-after-claims-retry-2-timeout.png`

Reproduction steps:

1. Open <https://tital-o7za4b3w5q-ts.a.run.app/> in the signed-in Chrome session.
2. Create one project titled `How Auroras Form: Solar Particles and Earth's Magnetic Field` with the aurora scientific question and Director Brief preferences from this test.
3. Approve the generated FilmBrief.
4. Generate and approve the 6 research questions.
5. Generate sources, approve the authoritative set, and reject weak/duplicate sources.
6. Generate evidence, approve supported evidence, and reject the ambiguous oxygen-transition evidence record.
7. Click `Continue workflow` to generate claims.
8. Observe the banner/message: `Claim generation agent returned an empty response.`
9. Refresh the browser and click `Continue workflow` again.
10. Repeat once more, staying within the 2-retry limit.
11. Observe that no `Review ClaimRecord` gate appears, `Claims` remains `0`, and coverage shows `Research question -> claim coverage 0 / 6`.

### DEFECT 2 - Required runtime model is not visible in new runtime records

Status: FAIL
Impact: The request required confirmation from new runtime records that Gemini 3.5 was used. The visible runtime panel only showed timing/call statistics, not model identity/configuration.
Evidence: `039-bottom-runtime-activity-area.png`, `040-full-page-blocked-state.png`, `console-logs-model-runtime.json`

Reproduction steps:

1. With the new aurora project open at the blocked Claims stage, scroll to `RUNTIME PERFORMANCE`.
2. Inspect the runtime panel.
3. Observe timing metrics: stages, executions, automated runtime, external calls, slowest stage, overlap, and stage profile.
4. Search visible page text and console logs for `Gemini`, `Gemini 3.5`, `Vertex`, or model configuration.
5. Observe no model name/configuration is exposed for this new project runtime.

## Runtime Observations

- FilmBrief generation: 10 s, 1 external call.
- Source discovery: 1m 33s, 7 calls, slowest call 55 s, overlap 2.05x, 2 executions.
- Evidence: 1m 17s, 20 calls, overlap 2.70x, slowest call 16 s.
- Total visible runtime panel: 3 stages, 4 executions, 3m 1s measured automated runtime, 28 external calls, 0 failed.
- Claims failure surfaced as an application message but was not reflected as a failed external call in the visible runtime panel.

## Screenshot Map

- `001-baseline-authenticated.png` - signed-in baseline.
- `002-new-project-form-open.png` - new project form.
- `003-new-project-form-filled.png` - aurora title, concept, Director Brief notes, avoid list.
- `004-director-brief-camera-restrained.png` - camera preference set to Restrained movement.
- `005-create-project-submitted.png` - project creation submitted.
- `006-project-created-film-brief.png` - generated FilmBrief at review gate.
- `007-filmbrief-selected-for-approval.png` - FilmBrief selected.
- `008-filmbrief-approved.png` - FilmBrief approved.
- `009-refresh-after-filmbrief-approval.png` - persistence after FilmBrief approval.
- `010-research-generation-started.png` - research generation started.
- `011-research-questions-ready.png` - 6 research questions ready.
- `012-research-questions-selected.png` - questions selected.
- `013-research-questions-approved.png` - questions approved.
- `014-source-discovery-started.png` - source discovery started.
- `015-sources-ready.png` - 33 source candidates ready.
- `016-authoritative-sources-selected.png` - authoritative sources selected.
- `017-sources-approved-first-pass.png` - first source approvals.
- `018-weak-sources-selected-for-rejection.png` - weak sources selected for rejection.
- `019-sources-approved-rejected.png` - source decisions complete.
- `020-refresh-after-source-review.png` - persistence after source review.
- `021-evidence-generation-started.png` - evidence generation started.
- `023-evidence-ready.png` - 45 evidence records ready.
- `024-ambiguous-evidence-selected-for-rejection.png` - ambiguous evidence selected for rejection.
- `027-evidence-approved-rejected.png` - evidence decisions complete.
- `028-refresh-after-evidence-review.png` - persistence after evidence review.
- `029-claims-generation-started.png` - claims generation started.
- `031-current-state-after-claims-wait-timeout.png` - claim generation empty response.
- `032-claim-generation-empty-response-defect.png` - defect evidence before retry.
- `033-claims-generation-retry-1-started.png` - first retry started.
- `034-claims-retry-1-no-gate.png` - first retry did not produce review gate.
- `035-refresh-before-claims-retry-2.png` - refresh before second retry.
- `036-claims-generation-retry-2-started.png` - second retry started.
- `038-current-state-after-claims-retry-2-timeout.png` - final blocked claim state.
- `039-bottom-runtime-activity-area.png` - activity/runtime area.
- `040-full-page-blocked-state.png` - full-page blocked state.
- `042-final-refresh-persistence-blocked-claims.png` - final refresh persistence.

## Post-Fix Continuation - 2026-08-22

This section records the continuation after the deployed diagnostics fix and after the external Vertex AI spend-cap blocker was remediated outside this test run. It supersedes only the downstream `BLOCKED` status caused by the original Claims failure; the original pre-fix failure evidence above remains valid historical evidence.

### Deployed Runtime Verification

| Check | Status | Observed result | Screenshot / evidence |
| --- | --- | --- | --- |
| Production URL | PASS | Chrome was on `https://tital-o7za4b3w5q-ts.a.run.app/`; title `Tital - Scientific Film Director`. | `043-post-fix-runtime-baseline.png` |
| Cloud Run revision | PASS | Live `/api/health` and Cloud Run both reported `tital-00030-8ht`. | `043-post-fix-runtime-baseline.png` |
| Release SHA | PASS | Live `/api/health` reported `3ded520f568ff8d86f9af83134c3e77f146019a8`. | command output captured in run notes |
| Runtime model | PASS | Live runtime reported provider `Google`, backend `VERTEX_AI`, model identifier `gemini-3.5-flash`, model platform `Vertex AI`, agent framework `Google ADK`. Cloud Run ADK logs also showed `model: gemini-3.5-flash, backend: VERTEX_AI, stream: false`. | `043-post-fix-runtime-baseline.png`; Cloud Run logs |
| Existing Aurora progress before retry | PASS | The existing project was preserved through Evidence: Research 6 approved, Sources 20 approved / 13 rejected, Evidence 44 approved / 1 rejected, Claims 0. | `044-aurora-pre-retry-state.png` |

### Original Failure vs Fix vs Spend-Cap Remediation

| Item | Status | Result |
| --- | --- | --- |
| Original pre-fix Claims failures | FAIL, historical | Initial Claims attempt and two retries failed with visible `Claim generation agent returned an empty response.` Claims stayed at 0 and downstream stages were blocked. |
| Deployed diagnostics fix | PASS | Revision `tital-00030-8ht` exposes verified runtime metadata and preserves actionable provider/error diagnostics. |
| Spend-cap blocker | PASS after external remediation | Pre-retry audit identified the provider failure as Google/Vertex `403` with message `Spend cap breached for project: projects/593835701785 for service: aiplatform.googleapis.com`. The post-fix Claims retry did not reproduce this provider error. |
| Post-fix Claims retry | PASS | A single authorized Claims retry at `2026-08-22T05:34:48.364Z` succeeded and produced 33 persisted Claim records. |

### Post-Fix Smoke Results

| Check | Status | Observed result | Screenshot / evidence |
| --- | --- | --- | --- |
| Claims retry exactly once | PASS | One Claims retry was started; it generated 33 `REVIEW_REQUIRED` claims. No second Claims retry was attempted. | `046-post-fix-claims-retry-final-outcome.png` |
| Claims persistence after refresh | PASS | Browser refresh preserved 33 pending claims. | `047-post-fix-claims-persist-after-refresh.png` |
| Claims scientific review | PASS | Approved 32 supported claims. Rejected `CL-3896c950-b474-41dd-9e6a-edb29cc4aa61` because it overstated CMEs as the primary driver of geomagnetic storms without preserving the broader storm-driver nuance. | `048-claims-supported-selected-for-approval.png`, `049-claims-after-approval.png`, `050-claims-overbroad-selected-for-rejection.png`, `051-claims-after-reject-one.png`, `048-claim-review-decisions.json` |
| Script generation and review | PASS | Script generated 32 lines from approved claims. All 32 were reviewed and approved; no rejected claim was reintroduced. | `052-script-review-ready.png`, `053-script-lines-selected-for-approval.png`, `054-script-approved-scenes-ready.png` |
| Scenes generation and review | PASS | Scenes generated 22 records. All were reviewed and approved; scene coverage remained complete. | `055-scenes-review-ready.png`, `056-scenes-selected-for-approval.png`, `057-scenes-approved-shots-ready.png` |
| Shots generation and review | PASS with rejections | Shots generated 56 records. Approved 54. Rejected `SH-4d97ad06-79fe-420e-9371-b866ba97c028` for changing the green-line lifetime from 0.7 s to 0.8 s in the disclosure, and `SH-550c4abc-722e-4ed1-a62f-c5d0f1d1c3c4` for adding an unsupported `100-150 km` green-emission altitude band. Scene-to-shot coverage remained complete. | `058-shots-review-ready.png`, `059-supported-shots-selected-for-approval.png`, `060-shots-after-approval.png`, `061-drifted-shots-selected-for-rejection.png`, `062-shots-after-reject-two.png` |
| Visual Decisions generation and review | PASS | Visual Decisions generated 54 records, one for each approved shot. All 54 were reviewed and approved; no rejected shot drift was carried forward. | `063-visual-decisions-review-ready.png`, `064-visual-decisions-selected-for-approval.png`, `065-visual-decisions-approved.png` |
| Governance and provenance audit | PASS | Deterministic audit passed with 0 issues. UI states: `Governance & provenance audit passed with 0 issues.` | `067-production-package-ready.png`, `068-final-refresh-persistence-ready.png` |
| Traceability and coverage | PASS | Coverage complete: research question to source/evidence/claim/script/scene, scene to shot, and shot to visual decision. Final package counts: Sources 20, Evidence 44, Claims 32, Script 32, Scenes 22, Shots 54, Visual Decisions 54. | `067-production-package-ready.png`, `068-final-refresh-persistence-ready.png` |
| Activity history | PASS | Activity history persisted review decisions, automation executions, `AUDIT_EXECUTED`, and `PACKAGE_BUILT`. | persisted session event log |
| Runtime performance / provider logging | PASS | Cloud Run request logs showed successful `/continue` and `/review` calls on revision `tital-00030-8ht`; ADK logs showed Gemini requests with `model: gemini-3.5-flash`, `backend: VERTEX_AI`, `stream: false`. | Cloud Run logs |
| Production package status | PASS | Package completed to `READY_FOR_PRODUCTION`; no print, export, or download buttons were used. | `067-production-package-ready.png` |
| Final refresh persistence | PASS | After browser refresh, Aurora remained `COMPLETE` with `READY_FOR_PRODUCTION`, audit passed, and final approved/rejected counts intact. | `068-final-refresh-persistence-ready.png` |
| Layout / UI obvious errors | PASS with minor evidence note | No blocking layout issues were observed. Full-page screenshot capture timed out on the large package page, so the final persistence screenshot is viewport plus DOM text evidence. | `068-final-refresh-persistence-ready.png`, `068-final-refresh-persistence-ready-dom.txt` |

### Final Persisted Counts

- Research Questions: 6 approved.
- Sources: 20 approved, 13 rejected.
- Evidence: 44 approved, 1 rejected.
- Claims: 32 approved, 1 rejected.
- Script Lines: 32 approved.
- Scenes: 22 approved.
- Shots: 54 approved, 2 rejected.
- Visual Decisions: 54 approved.
- Governance audit: passed, 0 issues.
- Production package: `READY_FOR_PRODUCTION`.

### New Post-Fix Screenshot Map

- `043-post-fix-runtime-baseline.png` - deployed runtime baseline in signed-in app.
- `044-aurora-pre-retry-state.png` - Aurora pre-retry state with Claims 0.
- `045-post-fix-claims-retry-provider-error.png` - intermediate Claims retry observation while the button still showed `Working`; filename is from the initial detector and is not a provider error.
- `046-post-fix-claims-retry-final-outcome.png` - Claims generated 33 review records.
- `047-post-fix-claims-persist-after-refresh.png` - Claims persisted after refresh.
- `048-claims-supported-selected-for-approval.png` - 32 supported claims selected for approval.
- `049-claims-after-approval.png` - 32 claims approved, one claim pending.
- `050-claims-overbroad-selected-for-rejection.png` - over-broad CME claim selected for rejection.
- `051-claims-after-reject-one.png` - Claims review complete; workflow advanced to Script.
- `052-script-review-ready.png` - Script review gate with 32 pending lines.
- `053-script-lines-selected-for-approval.png` - script lines selected.
- `054-script-approved-scenes-ready.png` - Script approved; Scenes stage ready.
- `055-scenes-review-ready.png` - Scenes review gate with 22 pending scenes.
- `056-scenes-selected-for-approval.png` - scenes selected.
- `057-scenes-approved-shots-ready.png` - Scenes approved; Shots stage ready.
- `058-shots-review-ready.png` - Shots review gate with 56 pending shots.
- `059-supported-shots-selected-for-approval.png` - 54 supported shots selected.
- `060-shots-after-approval.png` - 54 shots approved, two pending.
- `061-drifted-shots-selected-for-rejection.png` - two drifted shots selected for rejection.
- `062-shots-after-reject-two.png` - Shots review complete; Visual Decisions stage ready.
- `063-visual-decisions-review-ready.png` - Visual Decisions review gate with 54 pending records.
- `064-visual-decisions-selected-for-approval.png` - visual decisions selected.
- `065-visual-decisions-approved.png` - Visual Decisions approved; Audit stage ready.
- `067-production-package-ready.png` - package completed to `READY_FOR_PRODUCTION`.
- `068-final-refresh-persistence-ready.png` - final refresh-persistence evidence.

### Curated Submission Evidence

The full local screenshot collection is preserved in this directory but intentionally ignored by git. The committed submission subset is under `selected/`:

- `selected/01-aurora-director-brief.png` - Aurora Director Brief controls and avoid-list.
- `selected/02-evidence-approved-rejected.png` - approved/rejected evidence gate.
- `selected/03-post-fix-runtime-baseline.png` - post-fix Aurora baseline and runtime panel.
- `selected/04-claims-generated-after-fix.png` - successful post-fix Claims generation.
- `selected/05-claims-approved-rejected.png` - 32 approved / 1 rejected Claims.
- `selected/06-scientifically-rejected-shots.png` - two scientifically rejected Shots.
- `selected/07-visual-decisions-approved-audit-ready.png` - Visual Decisions approved.
- `selected/08-ready-for-production-package.png` - `READY_FOR_PRODUCTION` package and audit pass.
- `selected/09-final-refresh-persistence.png` - final refresh-persistence state.
- `selected/runtime-health-gemini-35-metadata.json` - live `/api/health` runtime proof: `gemini-3.5-flash`, `VERTEX_AI`, Google ADK, Cloud Run revision `tital-00030-8ht`, release SHA `3ded520f568ff8d86f9af83134c3e77f146019a8`.
