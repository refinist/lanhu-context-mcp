// HTTP integration tests for get_design_context.
// These tests require access to the real Lanhu APIs:
// RUN_INTEGRATION=1 LANHU_TEST_URL="<design detail URL>" npx vitest run src/tools/__tests__/get-design-context.http.integration.spec.ts

import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../../mcp.ts';
import { createLanhuClients } from '../../services/clients.ts';
import {
  describeGetDesignContextIntegration,
  makeIntegrationConfig
} from './integration-shared.ts';
import type { ServerConfig } from '../../config.ts';
import type { Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';

async function setupHttpClientServer(cfg?: Partial<ServerConfig>) {
  const httpConfig = makeIntegrationConfig({
    port: 0,
    isHttpMode: true,
    isStdioMode: false,
    ...cfg
  });
  createLanhuClients(httpConfig);
  const app = createMcpExpressApp({ host: httpConfig.host });

  app.post('/mcp', async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });
    const server = createMcpServer(httpConfig);
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const methodNotAllowed = (
    _req: unknown,
    res: {
      status: (code: number) => {
        set: (name: string, value: string) => { send: (body: string) => void };
      };
    }
  ) => {
    res.status(405).set('Allow', 'POST').send('Method Not Allowed');
  };

  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  const httpServer = await new Promise<HttpServer>((resolve, reject) => {
    const server = app.listen(httpConfig.port, httpConfig.host, () =>
      resolve(server)
    );
    server.on('error', reject);
  });

  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine HTTP integration test port');
  }

  const client = new Client({ name: 'lanhu-test-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://${httpConfig.host}:${(address as AddressInfo).port}/mcp`)
  );

  await client.connect(transport);

  return {
    client,
    async close() {
      await client.close();
      await new Promise<void>((resolve, reject) => {
        httpServer.close(error => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  };
}

describeGetDesignContextIntegration('http', setupHttpClientServer);
