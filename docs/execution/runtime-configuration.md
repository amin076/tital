# Runtime Configuration

Tital uses environment variables for Google ADK / Vertex AI, Cloud Run serving, Cloud Storage persistence, Firebase Authentication, and the optional public demo.

## Local Vertex configuration

Verified PowerShell setup:

```powershell
$env:GOOGLE_CLOUD_PROJECT="scientific-film-director-agent"
$env:GOOGLE_CLOUD_LOCATION="global"
$env:GOOGLE_GENAI_USE_VERTEXAI="true"
```

Local authentication uses Application Default Credentials (ADC):

```bash
gcloud auth application-default login
```

Do not copy access tokens into chat, issues, commits, or documentation.

If you intend to use ADC, ensure a stale `GOOGLE_APPLICATION_CREDENTIALS` path is not overriding it.

## `.env` note

`.env.example` is a configuration reference. Tital does not provide a universal project-level dotenv guarantee for every entry point. Set variables in the launching shell or deployment environment unless a specific tool loads `.env` explicitly.

## Hosted Cloud Run variables

Core variables:

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
TITAL_RELEASE_SHA       deployment commit injected by CI
```

Cloud Run supplies `PORT` automatically. Hosted server logic binds to `0.0.0.0` when Cloud Run `PORT` is present.

Optional server overrides:

```text
TITAL_API_HOST
TITAL_API_PORT
TITAL_WEB_ORIGIN
TITAL_WEB_DIST_DIR
```

## Cloud Storage persistence

When `TITAL_GCS_BUCKET` is set, Tital selects `CloudStorageMvpSessionStore`; otherwise it falls back to the local JSON store.

Typical hosted configuration:

```text
TITAL_GCS_BUCKET=tital-sessions-<project-number>
TITAL_GCS_PREFIX=sessions
```

Authenticated sessions are further namespaced under `users/<firebase-uid>/` by application code.

## Firebase Authentication

When:

```text
TITAL_AUTH_REQUIRED=true
```

these values are required:

```text
TITAL_FIREBASE_PROJECT_ID
TITAL_FIREBASE_API_KEY
TITAL_FIREBASE_AUTH_DOMAIN
```

The public web config is intentionally browser-readable. It identifies the Firebase Web application; it is not the authorization boundary.

Protected requests use:

```text
Firebase client login
→ ID token
→ Authorization: Bearer <token>
→ Firebase Admin verifyIdToken()
→ decoded uid
```

True secrets such as service-account private keys, user passwords, OAuth client secrets, access tokens and refresh tokens must not be exposed to browser code or committed.

Official Firebase ID-token guidance: https://firebase.google.com/docs/auth/admin/verify-id-tokens

## Cloud Run credentials

Cloud Run uses its attached runtime service identity. Do not upload a JSON service-account key to the service and do not set `GOOGLE_APPLICATION_CREDENTIALS` for the normal hosted path.

Runtime IAM and deployment IAM should be separate. See [../DEPLOYMENT_AND_OPERATIONS.md](../DEPLOYMENT_AND_OPERATIONS.md).

## Parallel Search MCP

Tital uses:

```text
https://search.parallel.ai/mcp
```

through ADK `MCPToolset`. The current MCP path does not hard-code a Parallel API key in the repository.

Malformed individual source candidates are validated independently; bad candidates are discarded while valid candidates remain usable. If none remain valid, discovery fails closed.

## Public demo

`TITAL_DEMO_SESSION_ID` enables the read-only public demo endpoint for one curated base-store session. Do not point this at a user-private authenticated namespace.

## GitHub Actions deployment variables

The CI/CD workflow expects Google authentication through Workload Identity Federation. Repository configuration will include identifiers such as the WIF provider and deploy service account, while the Firebase browser key may be stored as a GitHub secret to keep it out of repository source text.

No long-lived Google service-account JSON key should be added to GitHub Secrets for the recommended path.

## Cost discipline

Live workflow actions can consume Vertex AI/Google Cloud resources. Standard validation should remain no-live:

```bash
npm run typecheck
npm test
npm run build
```

Live model/MCP runs should be deliberate, especially during repeated error reproduction.
