import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ServerConfig } from '../config.ts';

const mocks = vi.hoisted(() => {
  return {
    getServerConfig: vi.fn(),
    createLanhuClients: vi.fn(),
    createMcpServer: vi.fn(),
    createMcpExpressApp: vi.fn(),
    stdioInstances: [] as any[],
    httpInstances: [] as any[],
    StdioServerTransport: vi.fn(function (this: any) {
      mocks.stdioInstances.push(this);
    }),
    StreamableHTTPServerTransport: vi.fn(function (
      this: any,
      options: unknown
    ) {
      this.options = options;
      this.close = vi.fn();
      this.handleRequest = vi.fn().mockResolvedValue(undefined);
      mocks.httpInstances.push(this);
    })
  };
});

vi.mock('../config.ts', async () => {
  const actual =
    await vi.importActual<typeof import('../config.ts')>('../config.ts');
  return {
    ...actual,
    getServerConfig: mocks.getServerConfig
  };
});

vi.mock('../mcp.ts', () => ({
  createMcpServer: mocks.createMcpServer
}));

vi.mock('../services/clients.ts', () => ({
  createLanhuClients: mocks.createLanhuClients
}));

vi.mock('@modelcontextprotocol/sdk/server/express.js', () => ({
  createMcpExpressApp: mocks.createMcpExpressApp
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: mocks.StdioServerTransport
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: mocks.StreamableHTTPServerTransport
}));

import { startServer } from '../app.ts';

function makeConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    lanhuToken: 'token',
    ddsToken: 'token',
    httpTimeout: 30_000,
    port: 5200,
    host: '127.0.0.1',
    isHttpMode: false,
    isStdioMode: true,
    tailwindcss: false,
    skipSlices: false,
    unitScale: 1,
    promptLang: 'zh-CN',
    ...overrides
  };
}

describe('startServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.stdioInstances.length = 0;
    mocks.httpInstances.length = 0;
  });

  test('starts the stdio transport in stdio mode', async () => {
    const server = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn()
    };
    mocks.getServerConfig.mockReturnValue(makeConfig());
    mocks.createMcpServer.mockReturnValue(server);

    await startServer();

    expect(mocks.createMcpExpressApp).not.toHaveBeenCalled();
    expect(mocks.createLanhuClients).toHaveBeenCalledWith(makeConfig());
    expect(mocks.StdioServerTransport).toHaveBeenCalledTimes(1);
    expect(server.connect).toHaveBeenCalledWith(mocks.stdioInstances[0]);
  });

  test('starts HTTP mode and wires request handlers', async () => {
    const config = makeConfig({ isHttpMode: true, isStdioMode: false });
    const server = {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn()
    };
    const app = {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      use: vi.fn(),
      listen: vi.fn((_port: number, _host: string, cb?: () => void) => cb?.())
    };
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    mocks.getServerConfig.mockReturnValue(config);
    mocks.createMcpExpressApp.mockReturnValue(app);
    mocks.createMcpServer.mockReturnValue(server);

    await startServer();

    expect(mocks.createLanhuClients).toHaveBeenCalledWith(config);
    expect(mocks.createMcpExpressApp).toHaveBeenCalledWith({
      host: config.host
    });
    expect(app.listen).toHaveBeenCalledWith(
      config.port,
      config.host,
      expect.any(Function)
    );
    expect(consoleError).toHaveBeenCalledWith(
      `[http] server running on http://${config.host}:${config.port}/mcp`
    );

    const postHandler = app.post.mock.calls[0][1] as (
      req: Record<string, unknown>,
      res: Record<string, unknown>
    ) => Promise<void>;
    const getHandler = app.get.mock.calls[0][1] as (
      req: Record<string, unknown>,
      res: Record<string, unknown>
    ) => void;
    const deleteHandler = app.delete.mock.calls[0][1] as (
      req: Record<string, unknown>,
      res: Record<string, unknown>
    ) => void;
    const errorHandler = app.use.mock.calls[0][0] as (
      err: unknown,
      req: Record<string, unknown>,
      res: Record<string, unknown>,
      next: () => void
    ) => void;

    let closeHandler: (() => void) | undefined;
    const req = { body: { foo: 'bar' } };
    const res = {
      on: vi.fn((event: string, cb: () => void) => {
        if (event === 'close') closeHandler = cb;
      })
    };

    await postHandler(req, res);

    const httpTransport = mocks.httpInstances[0];
    expect(mocks.StreamableHTTPServerTransport).toHaveBeenCalledWith({
      sessionIdGenerator: undefined
    });
    expect(server.connect).toHaveBeenCalledWith(httpTransport);
    expect(httpTransport.handleRequest).toHaveBeenCalledWith(
      req,
      res,
      req.body
    );

    closeHandler?.();
    expect(httpTransport.close).toHaveBeenCalled();
    expect(server.close).toHaveBeenCalled();

    const methodRes = {
      status: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      send: vi.fn()
    };

    getHandler({}, methodRes);
    deleteHandler({}, methodRes);
    expect(methodRes.status).toHaveBeenCalledWith(405);
    expect(methodRes.set).toHaveBeenCalledWith('Allow', 'POST');
    expect(methodRes.send).toHaveBeenCalledWith('Method Not Allowed');

    const errorRes = {
      headersSent: false,
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    errorHandler(new Error('boom'), {}, errorRes, vi.fn());
    expect(errorRes.status).toHaveBeenCalledWith(500);
    expect(errorRes.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });

    const sentRes = {
      headersSent: true,
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    errorHandler(new Error('boom'), {}, sentRes, vi.fn());
    expect(sentRes.status).not.toHaveBeenCalled();
    expect(sentRes.json).not.toHaveBeenCalled();
  });
});
