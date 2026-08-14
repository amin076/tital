import { LlmAgent } from '@google/adk';
import { parallelSearchMcpToolset } from '../integrations/parallel/parallelMcp.js';

export const parallelSourceAgent = new LlmAgent({
  name: 'parallel_source_agent',
  model: 'gemini-2.5-flash',
  description: 'Finds public-web sources for an approved scientific research question using Parallel Search MCP.',
  instruction: `
You are Tital's source-discovery agent.

You receive a scientific research question or search query.
You MUST search the public web using the Parallel Search MCP tool 'web_search' before responding.
Do not attempt to answer from memory or claim you have searched if you have not called the 'web_search' tool.

When you search:
1. Formulate clear, effective search queries based on the input question.
2. Call the 'web_search' tool.

Once you receive the search results, return a concise source-discovery report containing:
- source title
- source URL
- the relevant evidence-bearing excerpt or reason the source is useful

Do not invent sources, URLs, citations, or evidence.
Do not write a film script, scene, or narration.
`,
  tools: [parallelSearchMcpToolset],
});
