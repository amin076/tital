# Tital — All Things Agentic Submission Kit

Primary track: **Collaborative Partner**

Hosted app: **https://tital-o7za4b3w5q-ts.a.run.app/**

Repository: **https://github.com/amin076/tital**

## Files

- [`SUBMISSION.md`](./SUBMISSION.md) — copy-ready Devpost narrative, features, stack, data sources, findings and safe claims.
- [`COMPLIANCE.md`](./COMPLIANCE.md) — mandatory requirement matrix and final go/no-go checklist.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — detailed architecture and trust-boundary explanation.
- [`architecture.svg`](./architecture.svg) — static architecture diagram for upload/screenshot.
- [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) — timed 3:40–3:55 video plan, Google Cloud proof shot, recording checklist.
- [`BONUS_CONTENT.md`](./BONUS_CONTENT.md) — optional public LinkedIn/blog drafts for bonus consideration.

## Current readiness

### Code / deployment

- [x] Working hosted Cloud Run application.
- [x] Public completed read-only demo.
- [x] Google ADK architecture.
- [x] Parallel Search MCP source-discovery action.
- [x] Human-gated persisted workflow.
- [x] Explicit opt-in Director Feedback Memory for later cinematic proposals.
- [x] Public demo sanitizes project-scoped feedback memory.
- [x] CI/CD with Cloud Run deployment.
- [x] Code migration prepared for `gemini-3.5-flash`.
- [x] Regression check prepared to prevent accidental 2.5 agent-model drift.
- [x] Public runtime/release metadata and post-deploy health assertion prepared.
- [x] Local submission verification passes: typecheck, 228 tests, web build, and server build.
- [ ] PR CI for the Gemini 3.5 submission branch passes.
- [ ] Submission branch is merged and production deployment is green.
- [ ] Live Gemini 3.5 production smoke test passes.

### Submission materials

- [x] Track selected.
- [x] Devpost text draft.
- [x] Architecture diagram.
- [x] Architecture explanation.
- [x] Reproducible README spin-up instructions.
- [x] 4-minute demo script.
- [x] Bonus social/blog drafts.
- [ ] Record and upload demo video.
- [ ] Add final video URL to Devpost.
- [ ] If publishing bonus content, publish it publicly and add URLs.
- [ ] Entrant personally completes legal/eligibility attestations in Devpost.
- [ ] Submit entry and re-check all links before deadline.

## Recommended final order

1. Merge this readiness branch only after CI is green.
2. Confirm Cloud Run deployment of the merged commit.
3. Run a small production smoke project through FilmBrief → Research Questions → Source Discovery → one downstream Gemini stage.
4. Record the video using `DEMO_SCRIPT.md`.
5. Open the Devpost form early and paste the narrative from `SUBMISSION.md`.
6. Upload `architecture.svg` or a PNG export of it.
7. Add hosted app + GitHub repo + video URLs.
8. Complete personal eligibility fields.
9. Submit early enough for the organizers' baseline review window if possible.
10. Keep polishing the entry until the final deadline without changing claims beyond what production evidence supports.
