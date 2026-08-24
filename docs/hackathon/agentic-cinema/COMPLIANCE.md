# Agentic Cinema — Compliance Status

Status date: **2026-08-24**

Hackathon: **Google Cloud Agentic Cinema — The Blockbuster Hackathon**

Official rules: https://agentic-cinema.devpost.com/rules

Tital is a working hosted filmmaking agentic system with **real Parallel runtime integration**. The project should not be described as blocked merely because the implementation uses Parallel through MCP/tool calls rather than one specific SDK example.

## Contest requirements relevant to Tital

Based on the current Official Rules:

- submission deadline: **September 9, 2026 at 2:00 PM PT**;
- project must be newly created during the Contest Period;
- project must be a functional production-ready AI agent or multi-agent network for entertainment/media workflows;
- runtime AI/agent tooling must use permitted Google Cloud AI plus the selected Partner technology;
- hosted project URL required;
- public open-source repository required, including an OSI-approved license;
- code must demonstrate real runtime Google Cloud and Partner use, not README-only claims;
- demo video should be **no longer than 3 minutes**; if longer, only the first 3 minutes are evaluated;
- written submission must be in English and the product must support English;
- entrants select one Partner track.

## Product fit

Tital has a strong functional fit to the filmmaking requirement:

```text
scientific idea
→ research / full-source Evidence
→ Claims
→ Script
→ Scenes
→ Shots
→ Visual Decisions
→ governed Production Package
```

It targets a real filmmaking bottleneck: preserving scientific traceability, uncertainty, representation integrity, human approval state and revision history while moving from research into production decisions.

## Google runtime status

Verified product runtime currently uses:

```text
Gemini 3.5 Flash
Google ADK TypeScript
Vertex AI
Google Cloud Run
Google Cloud Storage
Firebase Authentication/Admin
```

The repository uses an Apache-2.0 license and is public.

## Parallel runtime integration

Tital currently uses Parallel in the live scientific-research workflow:

```text
Parallel web_search
→ SourceRecord candidates
→ human Source approval
→ Parallel web_fetch on the exact approved URL
→ full-source-grounded Evidence proposals
→ governed Evidence review
```

This is meaningful runtime use, not a README-only mention. Parallel directly participates in source discovery and retrieval used to build the scientific evidence chain.

The submission should describe this implementation precisely:

> **Tital uses Parallel Search MCP/tool calls at runtime for source discovery and exact approved-URL full-source retrieval before Evidence generation.**

The Official Rules mention accepted Search API examples such as the `parallel-web` SDK and other integrations. Those examples should not be turned into an unsupported statement that Tital is automatically disqualified or blocked simply because its current integration path is MCP-based.

Status:

```text
Product use of Parallel: VERIFIED
Parallel runtime calls: VERIFIED
Partner integration in core workflow: VERIFIED
Final Devpost wording / track mapping: REVIEW BEFORE SUBMISSION
```

If we later choose to add a direct Parallel Search API/SDK path, that would be an optional compliance-hardening step only if needed after checking the final submission form or receiving explicit organizer guidance. It is not currently treated as a product blocker.

## New-project requirement

Repository creation history places Tital's standalone repository creation on **2026-08-07**, within the Official Rules' Contest Period beginning 2026-07-27. Tital should continue to be presented as its own new standalone project, not as an extension of an older project.

Final eligibility remains an entrant self-attestation/legal requirement and is not established by this technical document.

## Runtime AI restriction

The submitted Tital runtime should remain within the permitted Google Cloud AI + selected Partner technology boundary. Do not add unrelated non-permitted AI model/framework/runtime dependencies for the submission build.

Development assistance and code-authoring disclosures, if requested by Devpost, should be answered accurately.

## Submission checklist

- [x] Public GitHub repository.
- [x] Apache-2.0 license at repository root.
- [x] Hosted web application.
- [x] English product UI.
- [x] Gemini runtime.
- [x] Google ADK / Vertex AI runtime.
- [x] Google Cloud Run deployment.
- [x] Real Partner product use through Parallel runtime calls.
- [x] Parallel source discovery integrated into the product workflow.
- [x] Parallel full-source retrieval integrated before Evidence generation.
- [ ] Final Partner-track wording reviewed against the submission form/rules.
- [ ] Three-minute Agentic Cinema demo recorded and public on YouTube/Vimeo.
- [ ] Final Devpost description completed in English.
- [ ] Hosted URL tested logged out/in as appropriate.
- [ ] Final main-branch CI/deployment proof captured.
- [ ] Personal/team eligibility fields self-attested by entrant.

## Demo strategy

The three-minute Agentic Cinema demo should prioritize filmmaking value and actual runtime behavior:

1. scientific question → evidence-governed production;
2. real Parallel source discovery and retrieval;
3. full-source grounding and human approval;
4. stage-aware AI review while human authority remains explicit;
5. Script/Scene/Shot/Visual production path;
6. Final Review + selective governed revision;
7. `READY_FOR_PRODUCTION` package + audit/version history.

Do not spend the limited video on generic architecture slides or cinematic trailer footage that does not prove the functioning agent.

## Freeze rule

Tital remains in feature freeze. Do not add unrelated features before submission. Any further Partner-integration change should be made only if the final rules/form or organizer guidance makes it necessary.
