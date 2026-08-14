import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { InMemoryRunner, stringifyContent } from '@google/adk';

function loadLocalEnvironment(): void {
  if (existsSync('.env')) {
    loadEnvFile('.env');
  }
}

function assertVertexAiConfiguration(): void {
  const useVertexAi = process.env.GOOGLE_GENAI_USE_VERTEXAI?.toLowerCase() === 'true';
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION;

  if (!useVertexAi || !project || !location) {
    throw new Error(
      'Vertex AI configuration is missing. Create a local .env from .env.example or set GOOGLE_GENAI_USE_VERTEXAI=true, GOOGLE_CLOUD_PROJECT, and GOOGLE_CLOUD_LOCATION in this PowerShell session.'
    );
  }
}

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(' ').trim();

  if (!question) {
    console.error('Usage: npm run parallel-mcp-live -- "<approved research question>"');
    process.exit(1);
  }

  try {
    loadLocalEnvironment();
    assertVertexAiConfiguration();

    // Import the agent only after the Vertex AI environment has been loaded.
    // This prevents the Google GenAI client from falling back to API-key auth.
    const { parallelSourceAgent } = await import('../agents/parallelSourceAgent.js');

    const runner = new InMemoryRunner({ agent: parallelSourceAgent });
    const run = runner.runEphemeral({
      userId: 'phase-4b-live',
      newMessage: {
        parts: [
          {
            text: `APPROVED research question: ${question}\n\nUse Parallel Search MCP to discover reliable public-web sources for this question.`,
          },
        ],
      },
    });

    let output = '';
    for await (const event of run) {
      output += stringifyContent(event);
    }

    if (!output.trim()) {
      throw new Error('The ADK agent returned no output.');
    }

    console.log(output.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Parallel MCP live integration failed: ${message}`);
    process.exit(1);
  }
}

void main();
