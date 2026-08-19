# Incident: GitHub Actions validation passed but Cloud Run deploy failed

Date: 2026-08-19

## Observed behavior

After PR #12 merged to `main`, the `Tital CI and Cloud Run Deploy` workflow ran on push. The validation job succeeded, including the full Vitest suite, but `Deploy to Cloud Run` failed almost immediately.

At that point the repository workflow already referenced these GitHub Actions secrets:

```text
GCP_WIF_PROVIDER
GCP_DEPLOY_SERVICE_ACCOUNT
TITAL_FIREBASE_API_KEY
```

The Workload Identity Federation provider/deployer identity and corresponding GitHub secrets had not yet been completed. Therefore the deployment job was enabled before its authentication prerequisites existed.

Manual `gcloud run deploy --source .` from the authenticated developer machine still worked, confirming that the application/Cloud Run source build path was healthy and the failure was specific to CI authentication/configuration rather than the Tital build itself.

## Workflow hardening

The workflow now requires repository variable:

```text
GCP_DEPLOY_ENABLED=true
```

before the deploy job can run. Until WIF is configured, validation still runs on pull requests and `main`, while deployment is skipped rather than producing a misleading red deployment failure.

When deployment is enabled, a preflight step explicitly checks that these required secrets are non-empty:

```text
GCP_WIF_PROVIDER
GCP_DEPLOY_SERVICE_ACCOUNT
TITAL_FIREBASE_API_KEY
```

A missing value now produces a direct configuration error before the Google authentication action executes.

## Intended final setup

```text
GitHub Actions OIDC token
→ Google Workload Identity Federation provider restricted to amin076/tital
→ tital-deployer service account
→ Cloud Run source deployment
→ tital-runtime service identity at runtime
```

No long-lived Google service-account JSON key should be stored in GitHub.

## Enablement rule

Do not set `GCP_DEPLOY_ENABLED=true` until the WIF provider, deploy service account IAM bindings, and GitHub Actions secrets have been created and verified. Once configured, enable the variable and run the workflow manually once before relying on push-to-main deployment.
