# Local Development

This document provides instructions for setting up your local development environment for Tital.

## Prerequisites

1.  **Node.js**: Version `v24.13.0` or higher. You can use a version manager like `nvm` to manage your Node.js versions.
2.  **Google Cloud SDK**: The `gcloud` command-line tool must be installed and authenticated locally.
3.  **Application Default Credentials (ADC)**: Your local ADC must be configured and verified.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/amin076/tital.git
cd tital
```

### 2. Install Dependencies

Install all package dependencies using `npm`:

```bash
npm install
```

### 3. Configure Your Environment

Create a `.env` file in the project root by copying the example file:

```bash
# On Linux/macOS:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```

The default values in `.env.example` are sufficient for running the application.

### 4. Authenticate with Google Cloud

Ensure your local Application Default Credentials (ADC) are active:

```bash
gcloud auth application-default login
```

You can verify that your credentials are set up correctly by printing an access token:

```bash
gcloud auth application-default print-access-token
```

## Running the Application

There are two ways to run the Tital agents:

1.  **Interactive `adk run` session:**
    ```bash
    npm run adk:run
    ```
    This will start an interactive session with the main `agent.ts`.

2.  **CLI scripts:**
    ```bash
    npm run define -- "A film about the moons of Jupiter"
    ```
    This will run the `defineFilm` service and output a `FilmBrief` JSON object.

## Code Formatting and Linting

This project does not yet have a standardized code formatter or linter. This is an area for future improvement.
