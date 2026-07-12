/**
 * @module features/ai/mcp
 *
 * Model Context Protocol client. MCP standardizes how models discover and call
 * external tools, resources, and prompts. Planned (Phase 4):
 *  - Connect to local & remote MCP servers
 *  - Expose FlutterForge actions (run build, open file) as MCP tools
 *  - Let agents compose tools across servers
 *
 * Phase 1: contract only.
 */

export interface McpServer {
  id: string;
  name: string;
  transport: "stdio" | "http" | "sse";
  url?: string;
  command?: string;
  connected: boolean;
}

export interface McpTool {
  serverId: string;
  name: string;
  description: string;
  inputSchema: unknown;
}

export interface McpResource {
  serverId: string;
  uri: string;
  name: string;
  mimeType?: string;
}

/** List connected MCP servers. Empty in Phase 1. */
export const mcpServers: McpServer[] = [];

/** List tools exposed by all connected servers. Empty in Phase 1. */
export function listTools(): McpTool[] {
  return [];
}

/** Invoke an MCP tool. NOT IMPLEMENTED in Phase 1. */
export async function callTool(
  _serverId: string,
  _toolName: string,
  _args: Record<string, unknown>
): Promise<unknown> {
  throw new Error("MCP is not implemented in Phase 1. Arrives in Phase 4.");
}
