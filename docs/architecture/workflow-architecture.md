# Workflow Architecture

Status date: **2026-08-24**

Tital's workflow combines six structures that must remain distinct:

1. **provenance chain** — why a scientific/cinematic decision exists;
2. **execution stage machine** — what automation may legally run next;
3. **governed coverage** — whether required branches are approved or intentionally waived;
4. **human attention policy** — how AI review can focus judgment without taking authority;
5. **director context** — creative guidance below scientific constraints;
6. **revision/version lifecycle** — how completed productions change without starting over.

## Provenance chain

```mermaid
graph LR
    FB[FilmBrief]
    RQ[ResearchQuestion]
    SR[SourceRecord]
    ER[EvidenceRecord]
    CR[ClaimRecord]
    SL[ScriptLineRecord]
    SC[SceneRecord]
    SH[ShotRecord]
    VD[VisualDecisionRecord]
    AU[Governance / Provenance Audit]
    PP[ProductionPackage]

    FB --> RQ --> SR --> ER --> CR --> SL --> SC --> SH --> VD --> AU --> PP
```

Only approved/locked provenance-connected records enter the trusted downstream chain.

## Execution stage machine

```text
DEFINE
→ RESEARCH
→ EVIDENCE
→ CLAIMS
→ SCRIPT
→ SCENES
→ SHOTS
→ VISUAL_DECISIONS
→ AUDIT
→ PACKAGE
→ COMPLETE
```

`evaluateMvpWorkflow` derives the current stage from persisted state. `executeNextMvpStep` selects the next legal action. `advanceMvpSession` applies one governed model/tool stage and stops at the next human boundary; the deterministic audit/package tail may continue automatically.

## Optional review loop at every human gate

Every active candidate gate now has the same collaboration shape:

```mermaid
graph LR
    G[Generator / tool proposal]
    V[Schema + provenance validation]
    AI[Optional stage-aware Gemini review]
    H{Human decision}
    OK[APPROVED]
    NO[REJECTED]
    NX[Next governed stage]

    G --> V --> AI --> H
    V --> H
    H -->|approve| OK --> NX
    H -->|reject| NO
```

The AI branch is optional. The user can skip it and review manually. This prevents quality assistance from automatically doubling model cost at every stage.

The evaluator can be invoked for:

```text
FilmBrief
ResearchQuestion
SourceRecord
EvidenceRecord
ClaimRecord
ScriptLineRecord
SceneRecord
ShotRecord
VisualDecisionRecord
```

It uses a different rubric for each stage and receives relevant approved upstream context. For example, Script review sees approved Claims plus audience/duration/tone; Shot review sees its approved Scene/Script and Director Brief; Visual review sees the approved Shot and representation/disclosure constraints.

AI review output is advisory metadata only. It cannot convert a pending candidate into `APPROVED` or `REJECTED`.

## Research-to-Evidence loop

```text
approved ResearchQuestion
→ Parallel web_search
→ SourceRecord DISCOVERED
→ optional stage-aware AI Source review
→ human Source decision
→ approved Source
→ Parallel web_fetch exact URL
→ compact Evidence proposals
→ Candidate Evidence Pool
→ Adaptive Evidence Budget
→ active Evidence human gate
→ optional stage-aware AI Evidence review
→ human Evidence decision
```

Discovery snippets orient source selection but are not the Evidence basis for new full-source records.

## Adaptive human-attention layer

A large scientific research pool is useful; a large mandatory review queue is not necessarily useful.

```mermaid
graph TD
    P[Full-source Evidence candidates]
    B[Deterministic Adaptive Evidence Budget]
    A[Active REVIEW_REQUIRED subset]
    X[ARCHIVED_CANDIDATE research archive]
    R[Optional stage-aware AI Review]
    H[Human Review]
    D[Approved downstream chain]

    P --> B
    B --> A --> R --> H --> D
    A --> H
    B --> X
```

The current budget uses film duration and Research Question priority, then favors Evidence strength, full-source grounding, source diversity, and reduced duplication.

Archived candidates are persisted but not considered pending review, approved coverage, or trusted production Evidence.

See [../ADAPTIVE_EVIDENCE_BUDGET.md](../ADAPTIVE_EVIDENCE_BUDGET.md).

## Stage-aware review context

The evaluator is independent from the generator's hidden reasoning. Application code constructs a model-safe evaluation context from persisted trusted state.

```text
FilmBrief review
→ project idea/settings

ResearchQuestion review
→ approved FilmBrief

Source review
→ approved ResearchQuestion + source metadata/excerpts

Evidence review
→ approved ResearchQuestion + exact approved Source context + grounded Evidence candidate

Claim review
→ supporting approved Evidence (+ source context)

Script review
→ supporting approved Claims/Evidence + audience + duration + tone + Director Brief

Scene review
→ supporting approved Script + Director Brief

Shot review
→ approved Scene/Script + Director Brief + scientific/visual constraints

Visual review
→ approved Shot + category/disclosure/risk + Director Brief
```

This lets review evaluate the **transformation between stages**, not merely whether a sentence sounds plausible.

Current recommendation vocabulary:

```text
APPROVE_SUGGESTED
REJECT_SUGGESTED
REVIEW_REQUIRED

attention: LOW | MEDIUM | HIGH
confidence
reasons[]
risks[]
flags[]
```

Flags cover scientific/provenance risks plus downstream concerns such as audience mismatch, pacing, narrative redundancy, unsupported additions, Director Brief conflicts and visual-integrity risk.

## Human review and coverage recovery

```mermaid
graph LR
    M[Validated proposal]
    AI[Optional AI recommendation]
    H{Human decision}
    OK[APPROVED]
    NO[REJECTED]
    G{Coverage gap?}
    RT[RETRY]
    W[WAIVE]
    C[CANCEL]

    M --> AI --> H
    M --> H
    H -->|approve| OK
    H -->|reject| G
    G -->|no| NO
    G -->|replacement| RT
    G -->|intentional omission| W
    G -->|back| C
```

AI recommendations can assist checkbox selection but still require the explicit human action in the Human Gate.

## Governed coverage

Progression is based on required parent coverage through approved provenance or explicit human waiver, not raw counts.

```text
required RQ    → approved Source
required RQ    → approved active Evidence through approved Source
required RQ    → approved Claim
required RQ    → approved ScriptLine
required RQ    → approved Scene or waiver
required Scene → approved Shot or waiver
required Shot  → approved VisualDecision or waiver
```

Important semantics:

```text
AI APPROVE_SUGGESTED ≠ APPROVED
approved Source ≠ every Evidence from that Source must be approved
ARCHIVED_CANDIDATE ≠ rejected
ARCHIVED_CANDIDATE ≠ approved
candidate count ≠ scientific coverage
waived gap ≠ approved content
```

## Rejection recovery

Rejected candidates remain terminal history and do not authorize silent regeneration.

```text
first automatic attempt
→ optional AI review
→ human rejects
→ REJECTED remains persisted
→ if required coverage is lost:
     explicit RETRY
     or explicit WAIVE where policy permits
```

`RETRY` is target-specific and duplicate-resistant. `WAIVE` records the intentional omission.

## Director-control context

Scene/Shot/Visual generation and their review can consume relevant `DirectorBrief`, explicitly remembered project feedback, and scoped replacement guidance.

```text
science / uncertainty / visual-integrity constraints
        ↓ hard boundary
Director Brief / remembered preference / scoped note
        ↓ creative guidance
AI proposal
        ↓
optional AI evaluation
        ↓
human review
```

Director guidance cannot turn inference into observation or bypass source/Evidence governance.

## Final-package review and revision loop

`COMPLETE / READY_FOR_PRODUCTION` is not an irreversible endpoint.

```mermaid
graph TD
    P1[ProductionPackage v1 READY]
    AR[Separate AI Final Production Review\nadvisory]
    H{Human chooses change?}
    RR[RevisionRequest]
    IP[Deterministic Impact Preview]
    S[Mark affected descendants STALE]
    REP[Selective Repair]
    SR[Optional stage-aware review\nof repaired candidates]
    HR[Human re-review]
    AU[Re-audit]
    P2[ProductionPackage v2 READY]
    HIST[Version history / comparison]

    P1 --> AR --> H
    H -->|no| P1
    H -->|yes| RR --> IP --> S --> REP --> SR --> HR --> AU --> P2 --> HIST
    REP --> HR
```

Per-gate AI review and Final Production Review are intentionally distinct:

- **Stage-aware Review Evaluator:** helps decide about current pending candidates.
- **Final Production Reviewer:** looks for cross-stage risks in the completed package.

Neither has trusted mutation authority.

Supported revision targets include project duration, approved Source, Claim, Shot, and Visual Decision. The impact graph prevents a cinematic-only change from unnecessarily discarding valid upstream science.

Example:

```text
Shot revision
→ Shot STALE
→ dependent Visual Decision STALE
→ Source/Evidence/Claim/Script/Scene preserved
```

A Source revocation may invalidate a much larger downstream branch. The preview tells the director before applying the revision.

## Version semantics

Old trusted work is not overwritten in place. Revised packages are stored as production-version milestones with change summaries and revision links.

```text
v1 → superseded by governed revision → v2
```

The current package is the active production result; prior versions remain inspectable history.

## Multi-record routing and concurrency

Provenance routing remains:

- Source discovery per required approved Research Question;
- full-source Evidence extraction per approved Source;
- Claim/Script/Scene generation grouped by Research Question;
- Shot generation per approved Scene;
- Visual Decision generation per approved Shot.

Stage-aware review uses bounded independent batches consistent with the same parent grouping: question-level records by Research Question, Shots by Scene, Visual Decisions by Shot.

General independent calls inside an authorized stage may use bounded concurrency. Full-source Evidence is deliberately more conservative because each Source requires a Gemini + Parallel tool interaction.

```text
TITAL_EXTERNAL_CONCURRENCY=3
TITAL_EVIDENCE_CONCURRENCY=1
```

The rate-limit retry policy applies only to transient provider/runtime failures and does not weaken fail-closed validation.

## Model-assisted versus deterministic responsibilities

Model/tool-assisted:

```text
FilmBrief
Research Questions
Source discovery
Full-source Evidence extraction
Claims
Script Lines
Scenes
Shots
Visual Decisions
optional stage-aware review recommendations at every human gate
Final Production Review findings
```

Deterministic application code:

```text
schema validation
trusted IDs / parent mapping
status assignment
review context assembly / target mapping
Adaptive Evidence Budget / archive status
human review transitions
coverage evaluation
Retry/Waive policy
Director feedback persistence policy
revision impact / STALE invalidation
selective repair routing
stage evaluation
bounded concurrency policy
audit
ProductionPackage construction
production version history
session persistence
```
