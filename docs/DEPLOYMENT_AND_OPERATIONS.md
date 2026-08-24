# Deployment and Operations

Status date: **2026-08-24**

Tital runs as a single Cloud Run service serving both the production React build and the Node API. Live project state is stored in Cloud Storage, protected session APIs use Firebase ID-token verification, Google ADK/Gemini runs through Vertex AI, and scientific web research uses Parallel Search MCP.

## Hosted topology

```text
Internet
   ↓
Cloud Run: tital
   ├─ React / MUI Director Workspace
   └─ Node /api/*
        ├─ Firebase Admin authentication
        ├─ Governed session/orchestration services
        ├─ Google ADK → Gemini 3.5 Flash / Vertex AI
        ├─ Parallel MCP → web_search / web_fetch
        └─ Cloud Storage session persistence
```

The Cloud Run endpoint is network-public so judges can load the landing/demo, while `/api/sessions*` remains application-authenticated.

## Persistence and isolation

Hosted state uses:

```text
MvpSessionStore
└─ CloudStorageMvpSessionStore
```

Conceptual user layout:

```text
gs://<private-bucket>/<prefix>/users/<firebase-uid>/<session-id>.json
```

Public completed demos are detached sanitized snapshots; they are not direct views into mutable authenticated sessions.

## Authentication

```text
Firebase browser sign-in
→ ID token
→ Authorization: Bearer <token>
→ Firebase Admin verifyIdToken()
→ decoded uid
→ user-scoped session store
```

Firebase browser configuration is not the security boundary. Do not expose service-account keys, user tokens, passwords, OAuth secrets, or private bucket paths.

## Runtime proof

`/api/health` and `/api/public/config` expose only safe deployment metadata such as:

```text
model: gemini-3.5-flash
backend/platform: Vertex AI
agent framework: Google ADK
Cloud Run service/revision
release Git SHA
```

The deployment workflow calls `/api/health` after deploy and fails if model/framework/infrastructure/release do not match the intended main-branch release.

## CI/CD

Workflow:

```text
.github/workflows/ci-deploy-cloud-run.yml
```

Main path:

```text
pull request / push
→ npm ci
→ typecheck
→ deterministic tests
→ production build
→ main-only enabled deployment
→ GitHub OIDC
→ Google Workload Identity Federation
→ Cloud Run source deploy
→ post-deploy runtime assertion
```

Runtime and deploy identities are separated. Long-lived Google service-account JSON credentials are not the intended CI/CD mechanism.

## Current Cloud Run serving configuration

Live smoke testing showed why HTTP request concurrency and model-call concurrency must not be conflated.

An earlier deployment used:

```text
--max-instances=1
--concurrency=1
```

During a long Evidence request, that configuration could occupy the service's only HTTP request slot and make a normal browser reload return:

```text
Rate exceeded.
```

Current deployment policy keeps a small cost guard while allowing UI/read/health traffic during agent waits:

```text
--max-instances=2
--concurrency=8
--memory=1Gi
```

This does **not** mean Tital executes eight Evidence model calls at once.

## Model/tool concurrency is separate

General independent external work:

```text
TITAL_EXTERNAL_CONCURRENCY=3
```

Full-source Evidence:

```text
TITAL_EVIDENCE_CONCURRENCY=1
```

Evidence is intentionally conservative because each approved Source now requires a Gemini turn plus Parallel `web_fetch`.

```text
Cloud Run HTTP concurrency = ability to serve requests
Evidence concurrency       = pressure on Vertex/Parallel
```

They solve different problems.

## Environment variables

Core hosted variables include:

```text
GOOGLE_CLOUD_PROJECT
GOOGLE_CLOUD_LOCATION
GOOGLE_GENAI_USE_VERTEXAI=true
TITAL_GCS_BUCKET
TITAL_GCS_PREFIX
TITAL_AUTH_REQUIRED=true
TITAL_FIREBASE_PROJECT_ID
TITAL_FIREBASE_API_KEY
TITAL_FIREBASE_AUTH_DOMAIN
TITAL_DEMO_SESSION_ID        optional
TITAL_RELEASE_SHA            injected by CI
TITAL_EVIDENCE_CONCURRENCY=1
```

`TITAL_EXTERNAL_CONCURRENCY` defaults conservatively in application code unless explicitly configured.

Cloud Run supplies `PORT`. Runtime Google credentials come from the Cloud Run service identity / Application Default Credentials.

## Runtime service identity

Runtime service account responsibility is limited to application runtime needs such as Vertex AI access and required Cloud Storage operations. Deployment permissions belong to the CI deploy identity.

## Manual deployment reference

A manual deployment equivalent to the current serving posture is conceptually:

```powershell
gcloud run deploy tital `
  --source . `
  --project=<project-id> `
  --region=australia-southeast1 `
  --service-account=<runtime-service-account> `
  --set-env-vars="GOOGLE_GENAI_USE_VERTEXAI=true,TITAL_EVIDENCE_CONCURRENCY=1,..." `
  --max-instances=2 `
  --concurrency=8 `
  --timeout=900 `
  --memory=1Gi
```

The checked-in GitHub Actions workflow is the preferred reproducible release path.

## ADK / Vertex failure handling

Tital inspects ADK event streams before parsing model JSON and records safe provider/runtime failure metadata.

### Fail closed

These do not trigger blind recovery:

```text
billing / spend cap
authentication / authorization
safety stop
schema validation
provenance validation
application/domain errors
```

### Bounded transient retry

Transient runtime failures such as classified rate-limit/capacity conditions may receive bounded retry/backoff. Full-source Evidence uses a particularly conservative concurrency/retry policy because of its heavier tool+model path.

No fallback model silently replaces Gemini when a governed stage fails.

## Live 429 incidents and fixes

### Vertex Evidence 429

The Aurora Grounding Test reached Evidence with 21 approved Sources and exposed a transient Vertex/ADK 429. The response was:

- classify rate-limit failure separately from generic provider failure;
- bounded exponential retry/backoff;
- default full-source Evidence concurrency 1;
- no retry for billing/auth/safety/deterministic failures.

### Cloud Run serving 429

A separate browser-level `Rate exceeded.` appeared while the service had one instance and one concurrent HTTP request slot. The response was:

- HTTP concurrency 8;
- max instances 2;
- keep Evidence model concurrency 1.

These were separate failure domains and are documented separately on purpose.

## Adaptive Evidence Budget and operations

A later live Evidence run produced 123 candidate Evidence items for a 5-minute film. The system now limits per-source Evidence output and compacts the broad candidate pool before AI/human review.

This reduces review/downstream load, but V1 still full-fetches approved Sources before global compaction. Source-content caching and coverage-aware early stopping remain the next operational cost layer.

See:

- [ADAPTIVE_EVIDENCE_BUDGET.md](ADAPTIVE_EVIDENCE_BUDGET.md)
- [PERFORMANCE.md](PERFORMANCE.md)

## Concurrency correctness limitation

Higher Cloud Run HTTP serving concurrency makes the application responsive during long async agent calls, but Tital still does not have general optimistic locking for simultaneous mutation of the **same** session.

Until session version/precondition support is implemented:

- avoid treating Tital as a high-contention collaborative editor;
- keep mutations governed and user-driven;
- add optimistic locking before broad multi-user concurrent editing claims.

## Operational smoke checklist

After a main deploy:

1. deployment job passes `Validate` and `Deploy to Cloud Run`;
2. `/api/health` reports current release/model/framework;
3. anonymous landing/demo loads;
4. authenticated project loads;
5. long agent operation does not make ordinary browser/read requests return Cloud Run `Rate exceeded.`;
6. transient provider errors leave governed state recoverable;
7. session refresh preserves review/revision/version state.
