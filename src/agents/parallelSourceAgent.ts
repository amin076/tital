import { LlmAgent } from '@google/adk';
import { parallelSearchMcpToolset } from '../integrations/parallel/parallelMcp.js';

export const parallelSourceAgent = new LlmAgent({
  name: 'parallel_source_agent',
  model: 'gemini-2.5-flash',
  description: 'Finds public-web sources for an approved scientific research question using Parallel Search MCP.',
  instruction: `
You are Tital's source-discovery agent.

You receive one APPROVED scientific research question.
You MUST search the public web with Parallel Search MCP before answering.
Use the MCP tool named web_search.

Return a concise source-discovery report containing:
- source title
- source URL
- the relevant evidence-bearing excerpt or reason the source is useful

Do not invent sources, URLs, citations, or evidence.
Do not answer from memory when the MCP tool can provide the source.
Do not write a film script, scene, or narration.
`,
  tools: [parallelSearchMcpToolset],
});
