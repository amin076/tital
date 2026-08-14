import { MCPToolset } from '@google/adk';

export const PARALLEL_SEARCH_MCP_URL = 'https://search.parallel.ai/mcp';

/**
 * Standard ADK remote MCP integration for Parallel Search.
 * Parallel exposes web_search and web_fetch from this endpoint.
 */
export const parallelSearchMcpToolset = new MCPToolset({
  type: 'StreamableHTTPConnectionParams',
  url: PARALLEL_SEARCH_MCP_URL,
  timeout: 60000,          // 60-second connection timeout
  sseReadTimeout: 60000,   // 60-second read timeout for streaming
  terminateOnClose: true,
});
