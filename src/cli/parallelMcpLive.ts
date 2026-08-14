import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { InMemoryRunner, stringifyContent } from '@google/adk';

function loadLocalEnvironment(): void {
  if (existsSync('.env')) {
    loadEnvFile('.env');
  }
}

function assertVertexAiConfiguration(): void {
  const useVertexAi = process.env.GOOGLE_GENAI_USE_VERTEXAI?.trim().toLowerCase() === 'true';
  const project = process.env.GOOGLE_CLOUD_PROJECT?.trim();
  const location = process.env.GOOGLE_CLOUD_LOCATION?.trim();

  const missing: string[] = [];
  if (!useVertexAi) missing.push('GOOGLE_GENAI_USE_VERTEXAI=true');
  if (!project) missing.push('GOOGLE_CLOUD_PROJECT');
  if (!location) missing.push('GOOGLE_CLOUD_LOCATION');

  if (missing.length > 0) {
    throw new Error(
      `Vertex AI configuration is missing or invalid: ${missing.join(', ')}. ` +
        'Update the local .env or set these values in the current PowerShell session.'
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

    // Import MCP/agent modules only after Vertex AI configuration is loaded.
    const { parallelSearchMcpToolset } = await import('../integrations/parallel/parallelMcp.js');

    // Probe the Partner MCP server before spending a Gemini request. This makes
    // transport/tool-discovery failures explicit instead of looking like an
    // empty model response.
    const discoveredTools = await parallelSearchMcpToolset.getTools();
    const toolNames = discoveredTools.map((tool) => tool.name);
    console.log(`Parallel MCP tools: ${toolNames.join(', ') || '(none)'}`);

    if (!toolNames.includes('parallel_web_search')) {
      throw new Error(
        `Parallel MCP connected but parallel_web_search was not discovered. Tools: ${toolNames.join(', ') || '(none)'}`
      );
    }

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
    const trace: string[] = [];

    for await (const event of run) {
      const text = stringifyContent(event);
      if (text) {
        output += text;
        trace.push(`text:${event.author ?? 'unknown'}:${text.slice(0, 120)}`);
      }

      for (const part of event.content?.parts ?? []) {
        if (part.functionCall?.name) {
          trace.push(`functionCall:${part.functionCall.name}`);
        }
        if (part.functionResponse?.name) {
          trace.push(`functionResponse:${part.functionResponse.name}`);
        }
      }
    }

    if (!output.trim()) {
      throw new Error(
        `The ADK agent returned no textual output. Event trace: ${trace.join(' | ') || '(no content events)'}`
      );
    }

    console.log(output.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Parallel MCP live integration failed: ${message}`);
    process.exit(1);
  }
}

void main();
