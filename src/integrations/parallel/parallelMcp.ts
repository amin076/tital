import { MCPToolset, StreamableHTTPConnectionParamsSchema } from '@google/adk';

export const PARALLEL_SEARCH_MCP_URL = 'https://search.parallel.ai/mcp';

const connectionParams = StreamableHTTPConnectionParamsSchema.parse({
  type: 'StreamableHTTPConnectionParams',
  url: PARALLEL_SEARCH_MCP_URL,
});

/**
 * Anonymous Parallel Search MCP integration.
 * Parallel documents this endpoint as free for exploration/light use and
 * requiring no API key. The prefix keeps Partner tools explicit in traces.
 */
export const parallelSearchMcpToolset = new MCPToolset(
  connectionParams,
  ['web_search', 'web_fetch'],
  'parallel'
);
