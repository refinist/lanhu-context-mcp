import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { getServerConfig } from './config.ts';
import { createMcpServer } from './mcp.ts';
import { createLanhuClients } from './services/clients.ts';
import type { NextFunction, Request, Response } from 'express';

export async function startServer(): Promise<void> {
  const config = getServerConfig();

  createLanhuClients(config);

  if (config.isHttpMode) {
    const port = config.port;
    const app = createMcpExpressApp({ host: config.host });
    app.post('/mcp', async (req: Request, res: Response) => {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      });
      const server = createMcpServer(config);
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    });
    const methodNotAllowed = (_req: Request, res: Response) => {
      res.status(405).set('Allow', 'POST').send('Method Not Allowed');
    };
    app.get('/mcp', methodNotAllowed);
    app.delete('/mcp', methodNotAllowed);
    app.use(
      (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        console.error('[mcp] unhandled request error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    );
    app.listen(port, config.host, () => {
      console.error(
        `[http] server running on http://${config.host}:${port}/mcp`
      );
    });
  } else {
    const server = createMcpServer(config);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}
