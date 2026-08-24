# Agentic Cinema — Compliance Gate

Status date: **2026-08-24**

Hackathon: **Google Cloud Agentic Cinema — The Blockbuster Hackathon**

Official rules: https://agentic-cinema.devpost.com/rules

This document intentionally separates **product readiness** from **track compliance**. Tital is a working hosted filmmaking agentic system, but it must not be described as ready for the Parallel track until the current Partner-specific runtime requirement is satisfied and verified in code/deployment.

## Contest requirements relevant to Tital

Based on the current Official Rules:

- submission deadline: **September 9, 2026 at 2:00 PM PT**;
- project must be newly created during the Contest Period;
- project must be a functional production-ready AI agent or multi-agent network for entertainment/media workflows;
- runtime AI/agent tooling must use permitted Google Cloud AI plus the selected Partner's allowed built-in AI capability;
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

## Critical Parallel-track blocker

### Current Tital integration

Tital currently uses:

```text
Parallel Search MCP web_search
Parallel web_fetch
```

for source discovery and full-source Evidence grounding.

### Current Official Rules requirement

The Parallel-track requirement states that the project must **actively use Parallel's Search API at runtime**, and gives examples including:

- official `parallel-web` SDK (Python or TypeScript);
- `@parallel-web/ai-sdk-tools`;
- LangChain `ParallelWebSearchTool`;
- a supported grounding configuration using Parallel Web Search.

The rules explicitly state that mentioning Parallel in the README is insufficient; the runtime integration must be present in code.

### Compliance conclusion

**Do not assume the current Search MCP integration satisfies the Parallel-track Search API requirement.**

Status:

```text
Product use of Parallel: VERIFIED
Agentic Cinema Parallel-track compliance: BLOCKED / NOT YET VERIFIED
```

Before final Agentic Cinema submission, Tital should add and deploy an explicitly accepted Parallel Search API runtime path (preferably the official TypeScript `parallel-web` SDK if compatible with the existing architecture), then capture code/runtime evidence that it is actually called.

The change should preserve Tital's existing governance model:

```text
Parallel Search API discovery
→ SourceRecord candidate
→ human Source approval
→ approved-URL full-source retrieval/grounding
→ Evidence governance
```

Do not replace working product behavior with a submission-only fake call. The Search API must perform a meaningful runtime role.

## New-project requirement

Repository creation history places Tital's standalone repository creation on **2026-08-07**, within the Official Rules' Contest Period beginning 2026-07-27. Tital must continue to be presented as its own new standalone project, not as an extension of an older project.

Final eligibility remains an entrant self-attestation/legal requirement and is not established by this technical document.

## Runtime AI restriction

The submitted Tital runtime must not add OpenAI, Anthropic, AWS AI, Microsoft AI or another non-permitted model/agent framework/API.

Development assistance and code-authoring disclosures, if requested by Devpost, should be answered accurately, but the shipped product runtime must remain within the Official Rules.

## Submission checklist

- [x] Public GitHub repository.
- [x] Apache-2.0 license at repository root.
- [x] Hosted web application.
- [x] English product UI.
- [x] Gemini runtime.
- [x] Google ADK / Vertex AI runtime.
- [x] Google Cloud Run deployment.
- [x] Real Partner product use (Parallel MCP) in current product.
- [ ] **Accepted Parallel Search API runtime integration verified for Agentic Cinema track.**
- [ ] Repository/documentation updated with that exact runtime path.
- [ ] Three-minute Agentic Cinema demo recorded and public on YouTube/Vimeo.
- [ ] Final Devpost description completed in English.
- [ ] Hosted URL tested logged out/in as appropriate.
- [ ] Final main-branch CI/deployment proof captured.
- [ ] Personal/team eligibility fields self-attested by entrant.

## Demo strategy after compliance blocker is resolved

The three-minute Agentic Cinema demo should prioritize filmmaking value and actual runtime behavior:

1. scientific question → evidence-governed production;
2. real Partner Search API source discovery;
3. full-source grounding and human approval;
4. stage-aware AI review while human authority remains explicit;
5. Script/Scene/Shot/Visual production path;
6. Final Review + selective governed revision;
7. `READY_FOR_PRODUCTION` package + audit/version history.

Do not spend the limited video on generic architecture slides or cinematic trailer footage that does not prove the functioning agent.

## Freeze rule

Outside the explicit Parallel Search API compliance requirement and critical bugs, Tital remains in feature freeze. Do not add unrelated features before submission.
