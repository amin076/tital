import { MCPToolset } from '@google/adk';

export const PARALLEL_SEARCH_MCP_URL = 'https://search.parallel.ai/mcp';

/**
 * Minimal standard ADK remote MCP integration for Parallel Search.
 * Tool discovery is handled by MCPToolset at runtime.
 */
export const parallelSearchMcpToolset = new MCPToolset({
  type: 'StreamableHTTPConnectionParams',
  url: PARALLEL_SEARCH_MCP_URL,
});
