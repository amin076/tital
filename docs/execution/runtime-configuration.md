# Runtime Configuration

Tital is configured via environment variables. The configuration is loaded from a `.env` file in the root of the project.

## `.env` file

To configure Tital, create a `.env` file in the project root. You can copy the example file to get started:

```bash
# On Linux/macOS:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```

## Environment Variables

The following environment variables are used to configure the application:

-   **`GOOGLE_CLOUD_PROJECT`**: The ID of your Google Cloud project. This is required for interacting with Vertex AI.
    -   Default: `scientific-film-director-agent`
-   **`GOOGLE_CLOUD_LOCATION`**: The location of your Google Cloud project.
    -   Default: `global`
-   **`GOOGLE_GENAI_USE_VERTEXAI`**: A boolean flag that tells the `@google/genai` SDK to use Vertex AI instead of the public Gemini API.
    -   Default: `true`

## Application Default Credentials (ADC)

In addition to the environment variables, Tital relies on Application Default Credentials (ADC) for authentication with Google Cloud.

Before running the application, you must authenticate with the `gcloud` CLI:

```bash
gcloud auth application-default login
```

This will store your credentials in a well-known location on your local machine, where the `@google/genai` SDK can find them.
