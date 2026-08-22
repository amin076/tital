# Deployment and Operations

Status date: **2026-08-22**

This document describes Tital's current hosted architecture, authentication boundary, persistence model, deployment process, GitHub Actions design, and operational failure handling.

## Hosted architecture

Tital is deployed as one Cloud Run service that serves both the production React build and the Node API:

```text
Internet
                ↓
          Cloud Run: tital
                ↓
      Node production server
        ├─ React static UI
        └─ /api/*
             ↓
       governed services
        ├─ Vertex AI / Gemini
        ├─ Parallel Search MCP
        └─ Cloud Storage sessions
```

The web app uses same-origin `/api/...` requests in production. The Vite proxy is development-only.

## Current validated cloud path

The following have been live-validated on Google Cloud:

- Cloud Run source deployment in `australia-southeast1`;
- production React build served by the Node process;
- `/api/health` and session API through the deployed runtime;
- Vertex AI/Gemini execution from Cloud Run service identity;
- Parallel MCP execution from the hosted workflow;
- durable Cloud Storage session persistence;
- session survival across Cloud Run revision replacement;
- Firebase Email/Password login;
- Firebase ID-token verification by the backend;
- per-user session namespace using Firebase `uid`;
- public landing plus detached read-only completed demo;
- live workflow protected behind Firebase sign-in;
- GitHub Actions deployment through Workload Identity Federation.

The Cloud Run service is publicly reachable so judges can load the landing page and completed demo. Application authorization remains enforced separately: anonymous requests cannot access `/api/sessions*`, while `/api/public/*` and `/api/health` expose only deliberate public data.

## Production server configuration

`src/api/runtimeConfig.ts` resolves local and hosted defaults.

Local defaults:

```text
host: 127.0.0.1
port: 8787
web origin: http://127.0.0.1:5173
```

When Cloud Run supplies `PORT`, hosted defaults are:

```text
host: 0.0.0.0
port: $PORT
same-origin UI/API
```

The server serves the built Vite app for non-API GET routes and preserves JSON 404 behavior for unknown `/api/*` routes.

## Persistence

Tital uses a storage abstraction:

```text
MvpSessionStore
├─ JsonMvpSessionStore          local development
└─ CloudStorageMvpSessionStore  hosted deployment
```

Store selection:

```text
TITAL_GCS_BUCKET set    → Cloud Storage
TITAL_GCS_BUCKET absent → local JSON
```

Base hosted object layout:

```text
gs://<bucket>/<prefix>/<session-id>.json
```

Authenticated user layout:

```text
gs://<bucket>/<prefix>/users/<firebase-uid>/<session-id>.json
```

A curated public demo is intentionally separate from user-owned live sessions.

Cloud Storage is the durable source of hosted session state. Cloud Run container filesystem must not be used as project persistence.

## Authentication architecture

Public-facing web configuration is delivered by:

```text
GET /api/public/config
```

The browser initializes Firebase Authentication and signs in with Email/Password. For protected API calls:

```text
Firebase sign-in
→ client ID token
→ Authorization: Bearer <token>
→ Tital backend
→ Firebase Admin verifyIdToken()
→ decoded uid
→ user-scoped session store
```

The Firebase Web API key/config is a browser-side Firebase identifier, not the authorization boundary. Authorization comes from verified ID tokens and server-side session scoping.

Secrets that must never be placed in the browser bundle or repository include service-account private keys, access tokens, refresh tokens, judge passwords, OAuth client secrets, and non-browser API secrets.

## Public demo vs live workflow

Target public experience:

```text
Anonymous visitor
├─ landing page
├─ product explanation
└─ completed read-only demo

Authorized judge/user
└─ sign in
    └─ create/review/continue live governed projects
```

The normal demo snapshot ID is `public-demo`; `TITAL_DEMO_SESSION_ID` is an optional override. Publishing is allowed only from an authenticated `READY_FOR_PRODUCTION` session with a passing governance/provenance audit. Promotion constructs a detached snapshot, clears private project input, event history, and Director Feedback Memory, and never exposes another user's private namespace.

## Public runtime proof

`GET /api/health` and `GET /api/public/config` expose a safe, non-secret runtime manifest:

```text
Gemini model
model platform
agent framework
Cloud Run service/revision
release Git commit SHA
public persistence label
```

They do not expose private bucket names, object prefixes, service-account credentials, or tokens. The public landing page renders the model/framework/infrastructure values. After deployment, CI calls `/api/health` and fails unless the model is `gemini-3.5-flash`, the framework is Google ADK, the infrastructure is Cloud Run, and the release SHA matches the triggering main-branch commit.

## Environment variables

Core hosted variables:

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
TITAL_DEMO_SESSION_ID   optional override; defaults to public-demo
TITAL_RELEASE_SHA       injected by deployment workflow
```

Cloud Run provides `PORT` automatically.

Runtime Google Cloud credentials come from the Cloud Run service identity. Do not upload a JSON key and do not configure `GOOGLE_APPLICATION_CREDENTIALS` in Cloud Run for this deployment.

## Runtime service identity

Tital uses a dedicated runtime service account conceptually named:

```text
tital-runtime@<project>.iam.gserviceaccount.com
```

Its responsibilities are runtime-only, primarily:

- access Vertex AI required by Tital;
- read/write/list/delete session objects in the configured bucket as permitted;
- no GitHub deployment responsibility.

Separating runtime and deploy identities limits blast radius.

## Manual deployment

The current manual source-deployment pattern is:

```powershell
gcloud run deploy tital `
  --source . `
  --project=<project-id> `
  --region=australia-southeast1 `
  --service-account=<runtime-service-account> `
  --set-env-vars="..." `
  --max-instances=1 `
  --concurrency=1 `
  --timeout=900 `
  --memory=1Gi
```

For private operational debugging, an authenticated developer can still use:

```powershell
gcloud run services proxy tital `
  --project=<project-id> `
  --region=australia-southeast1 `
  --port=8081
```

The conservative `concurrency=1` / `max-instances=1` posture reduces concurrent session-write risk until optimistic locking/version preconditions are implemented. It is not the intended final scale configuration.

## GitHub Actions CI/CD

The repository contains:

```text
.github/workflows/ci-deploy-cloud-run.yml
```

Intended flow:

```text
pull request / push
→ npm ci
→ typecheck
→ tests
→ production build
→ deploy only on approved branch/manual condition
→ Google Cloud authentication with OIDC/WIF
→ Cloud Run source deployment
→ deployed health/model/revision/release verification
```

### Why Workload Identity Federation

GitHub Actions should not store a long-lived Google service-account JSON key. Use GitHub OIDC with Google Workload Identity Federation (WIF), producing short-lived credentials.

Recommended identity split:

```text
tital-runtime  → application runtime permissions
tital-deployer → CI/CD deployment permissions
```

The WIF provider must be constrained to the expected GitHub repository and, where practical, the deployment branch/environment.

Official references:

- Google Cloud WIF for deployment pipelines: https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines
- Google GitHub auth action: https://github.com/google-github-actions/auth
- Cloud Run deployment action: https://github.com/google-github-actions/deploy-cloudrun
- Cloud Run source deployment permissions: https://cloud.google.com/run/docs/deploying-source-code

### Deployment permissions

For source deployment, Google documents roles such as Cloud Run Source Developer and Service Usage Consumer for the deployer, Service Account User on the runtime identity, and Cloud Run Builder for the build service account. Exact least-privilege bindings should be verified when WIF is configured rather than broadening the runtime identity.

## Deployment failure scenarios

### CI tests fail

Do not deploy. Fix type/schema/test failures first.

### Cloud build fails

Keep the current serving revision. Inspect build logs; do not change application schemas merely to make deployment proceed.

### New revision starts but health/API fails

Shift traffic back to the previous known-good revision or deploy the known-good commit. Cloud Storage sessions remain outside the revision and should survive rollback.

### Firebase login succeeds but API says authentication required

Check whether the browser sends `Authorization: Bearer <ID token>` and whether backend `verifyIdToken()` succeeds. A previous Tital defect used revocation checking unnecessarily; current verification uses normal Firebase Admin ID-token verification and logs verification failures.

### Session disappears after revision

Check `TITAL_GCS_BUCKET`, prefix, service-account bucket permissions, and user `uid` namespace. Hosted sessions must not be read from local container disk.

### Parallel/Vertex transient failure

Persist no partial generated batch. Retry from the last valid session state. Distinguish network/quota errors from deterministic validation errors.

### Duplicate writes / concurrent Continue

Current risk until optimistic locking exists. Keep conservative concurrency and avoid multiple simultaneous Continue requests on the same session. Planned solution: session version/generation preconditions and conflict response.

## Public release regression checklist

Before every submission-facing release:

```text
CI green
hosted health green
anonymous landing works
anonymous protected session API returns authorization failure
Firebase judge login works
judge-owned sessions isolated by uid
curated demo works without login
live Continue works after login
Parallel malformed-item recovery validated
trusted model-reference audit validated
GCS revision persistence validated
complete hosted project reaches READY_FOR_PRODUCTION
rollback procedure understood
cost controls/max instances set
```

Public Cloud Run access and application authentication are separate layers. Making Cloud Run reachable must not make protected live workflow endpoints anonymously usable.
