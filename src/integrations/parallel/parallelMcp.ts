import { MCPToolset, type StreamableHTTPConnectionParams } from '@google/adk';

export const PARALLEL_SEARCH_MCP_URL = 'https://search.parallel.ai/mcp';

const connectionParams: StreamableHTTPConnectionParams = {
  type: 'StreamableHTTPConnectionParams',
  url: PARALLEL_SEARCH_MCP_URL,
};

/**
 * Anonymous Parallel Search MCP integration.
 * Parallel documents this endpoint as free for exploration/light use and
 * requiring no API key. The prefix keeps Partner tools explicit in traces.
 *
 * We intentionally leave the MCPToolset filter empty here. Parallel's Search
 * MCP currently exposes only web_search and web_fetch; exposing all discovered
 * tools avoids version-specific ambiguity over whether ADK applies filters
 * before or after prefixing tool names.
 */
export const parallelSearchMcpToolset = new MCPToolset(
  connectionParams,
  [],
  'parallel'
);
