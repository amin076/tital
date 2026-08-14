# Tital — Scientific Film Director Agent (Bootstrap Stage)

This repository contains the bootstrap configuration for the Tital Director, an assistant for planning short scientific films.

At this initial stage, the codebase serves as a **bootstrap smoke test** to verify integration with Google Agent Development Kit (ADK) and Vertex AI, and is not the final Tital application architecture.

## Project Information
* **Verified Model:** `gemini-2.5-flash`
* **Google Cloud Project:** `scientific-film-director-agent`
* **Verified Node.js Version:** `v24.13.0`

---

## Prerequisites
1. **Node.js**: Version `v24.13.0` or higher.
2. **Google Cloud SDK**: Installed and authenticated locally.
3. **Application Default Credentials (ADC)**: Configured and verified.

---

## Getting Started

### 1. Install Dependencies
Install all package dependencies locally:
```bash
npm install
```

### 2. Configure Your Environment
Create a `.env` file in the project root (note: `.env` is ignored by Git to prevent secret exposure):
```bash
# On Linux/macOS:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```
Ensure your environment contains the required GCP project coordinates (which match `.env.example` configurations):
* `GOOGLE_CLOUD_PROJECT=scientific-film-director-agent`
* `GOOGLE_CLOUD_LOCATION=global`
* `GOOGLE_GENAI_USE_VERTEXAI=true`

### 3. Authenticate with Google Cloud
Ensure your local Application Default Credentials (ADC) are active:
```bash
gcloud auth application-default login
```
You can verify your token availability using:
```bash
gcloud auth application-default print-access-token
```

### 4. Run the Agent
Execute the agent using the local ADK execution harness:
```bash
npm run adk:run
```
*(Alternatively: `npx adk run agent.ts`)*

### 5. Type Checking
Perform strict TypeScript type-checking:
```bash
npm run typecheck
```

---

## Scripts
* `npm run typecheck`: Performs static analysis and strict type checking using TypeScript compiler.
* `npm run adk:run`: Invokes the local `@google/adk-devtools` harness to run `agent.ts`.
* `npm test`: A placeholder for the test runner (currently not implemented).
