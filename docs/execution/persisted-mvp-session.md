# Persisted MVP Sessions

Tital's MVP session runner persists workflow state locally while keeping human review gates explicit. It is designed for the hackathon demonstration path where a project must survive multiple CLI invocations without silently auto-approving model output.

## Storage

By default, sessions are written to:

```text
.tital/sessions/<session-id>.json
```

The `.tital/` directory is gitignored. To use another directory, set:

```text
TITAL_SESSION_DIR
```

The JSON store validates every session with `MvpSessionSchema` when saving and loading. Writes use a temporary file followed by rename so a partially written JSON file is less likely to replace the last valid session.

## Commands

Start a session from a film idea:

```bash
npm run mvp -- start "A five-minute film explaining the evidence for Europa's subsurface ocean"
```

Show the current workflow stage without calling a model:

```bash
npm run mvp -- status <session-id>
```

Run the next legal automated stage:

```bash
npm run mvp -- continue <session-id>
```

Apply an explicit human decision to all pending records at the current gate:

```bash
npm run mvp -- review <session-id> approve
npm run mvp -- review <session-id> reject
```

Inspect the complete persisted session:

```bash
npm run mvp -- show <session-id>
```

List local sessions:

```bash
npm run mvp -- list
```

## Human-governance behavior

`continue` does not bypass review. A normal cycle is:

```text
continue
→ automated proposal generation
→ persisted REVIEW_REQUIRED / DISCOVERED records
→ stop
→ explicit review command
→ continue
```

Rejected records are retained in session history. They do not permanently block the project when an approved replacement provides the required downstream coverage. For example, if all discovered sources for a research question are rejected, the next `continue` can run another Parallel discovery attempt while preserving the rejected source records.

The FilmBrief schema does not include `REJECTED`. Therefore `review ... reject` at the FilmBrief gate fails clearly instead of inventing an unsupported status. Revise or restart the brief when it is unacceptable.

## Coverage-aware progression

Progression is based on approved provenance coverage, not merely whether an array is non-empty. The active chain requires:

```text
approved ResearchQuestion
  → at least one approved SourceRecord
  → approved EvidenceRecord coverage for approved sources
  → at least one approved ClaimRecord per approved question
  → at least one approved ScriptLineRecord per approved question
  → at least one approved SceneRecord per approved question
  → at least one approved ShotRecord per approved scene
  → at least one approved VisualDecisionRecord per approved shot
```

Pending records on the active chain still stop progression. Rejected terminal records remain historical provenance.

## Audit invalidation

Any new automated generation or human review decision clears the stored scientific audit. This prevents an old passing audit from being reused after the governed chain changes.

The deterministic audit runs only on the approved, provenance-connected production chain. Rejected history remains in the session but is excluded from the final production package.

## Cost behavior

These commands are deterministic/local and do not need Vertex AI:

```text
status
review
show
list
```

`start` calls the FilmBrief Gemini runtime. `continue` may call Gemini and, at source discovery, Parallel Search MCP. Use live continuation deliberately when controlling Vertex AI cost.

Unit tests use injected fake executors and fake FilmBrief generation; they do not require live Vertex AI or Parallel calls.
