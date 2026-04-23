import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import pkg from '../package.json' with { type: 'json' };
import { registerGetDesignContext } from './tools/get-design-context.ts';
import type { ServerConfig } from './types/config.ts';

export function createMcpServer(config: ServerConfig): McpServer {
  const server = new McpServer({
    name: pkg.name,
    version: pkg.version
  });

  registerGetDesignContext({ server, config });

  return server;
}
