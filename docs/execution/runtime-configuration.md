# Runtime Configuration

Tital is configured through environment variables used by Google ADK / Gemini / Vertex AI and the Parallel MCP integration.

## Important note about `.env`

The repository contains `.env.example` as a configuration reference, but the current Tital application code does **not** contain a project-level dotenv loader that guarantees a root `.env` file is read for every entry point. Do not assume that simply creating `.env` automatically configures every command.

For the current MVP, the safest approach is to set the variables in the shell that launches Tital, or use tooling that explicitly loads `.env` for you.

Example on Windows PowerShell:

```powershell
$env:GOOGLE_CLOUD_PROJECT="scientific-film-director-agent"
$env:GOOGLE_CLOUD_LOCATION="global"
$env:GOOGLE_GENAI_USE_VERTEXAI="true"
```

Example on Linux/macOS:

```bash
export GOOGLE_CLOUD_PROJECT="scientific-film-director-agent"
export GOOGLE_CLOUD_LOCATION="global"
export GOOGLE_GENAI_USE_VERTEXAI="true"
```

## Environment Variables

The current verified Vertex AI configuration uses:

- `GOOGLE_CLOUD_PROJECT`: Google Cloud project ID.
- `GOOGLE_CLOUD_LOCATION`: Vertex AI location. The verified Tital configuration uses `global`.
- `GOOGLE_GENAI_USE_VERTEXAI`: set to `true` to use Vertex AI rather than an API-key based Gemini path.

The values in `.env.example` are examples for the current Tital development environment; they are not application-level fallback defaults implemented in code.

## Application Default Credentials (ADC)

Tital's verified local Vertex path uses Google Application Default Credentials.

Authenticate with:

```bash
gcloud auth application-default login
```

Optionally verify ADC without exposing the token in logs or chat:

```bash
gcloud auth application-default print-access-token
```

The command should succeed; do not copy the token into documentation, issues, commits, or chat.

## `GOOGLE_APPLICATION_CREDENTIALS` warning

If `GOOGLE_APPLICATION_CREDENTIALS` is set, Google client libraries may prefer that explicit file path over normal ADC discovery. During Tital development, a stale value pointing to a deleted service-account JSON file caused Vertex calls to fail even though ADC was valid.

If you intend to use ADC, inspect the variable first. On PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS
```

To remove it only from the current PowerShell session:

```powershell
Remove-Item Env:\GOOGLE_APPLICATION_CREDENTIALS -ErrorAction Ignore
```

Do not delete a machine- or user-level credential setting blindly; first confirm that it is stale and not required by another project.

## Parallel Search MCP

Tital's Parallel integration uses the Search MCP endpoint configured in `src/integrations/parallel/parallelMcp.ts`.

Current endpoint:

```text
https://search.parallel.ai/mcp
```

The current integration uses ADK `MCPToolset`; no Parallel API key is hard-coded in the repository.

## Cost discipline

The following can call paid or quota-limited external services:

```text
npm run adk:run
npm run parallel:run
npm run define -- "..."
npm run research-questions
```

Whether a specific command incurs cost depends on the runtime path and configured Google Cloud account. By contrast, the standard local validation commands are designed to run without live Vertex/Parallel calls:

```bash
npm run typecheck
npm test
```

Keep live model/MCP smoke tests deliberate and small.
