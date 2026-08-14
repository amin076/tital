import { InMemoryRunner, stringifyContent } from '@google/adk';
import { parallelSourceAgent } from '../agents/parallelSourceAgent.js';

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(' ').trim();

  if (!question) {
    console.error('Usage: npm run parallel-mcp-live -- "<approved research question>"');
    process.exit(1);
  }

  try {
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
