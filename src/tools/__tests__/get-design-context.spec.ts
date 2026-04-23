import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createMcpServer } from '../../mcp.ts';
import * as promptsEnUS from '../../prompts/en-US.ts';
import * as promptsZhCN from '../../prompts/zh-CN.ts';
import * as lanhuApi from '../../services/lanhu-api.ts';
import * as cssToTailwind from '../../utils/css-to-tailwind.ts';
import * as designTokens from '../../utils/design-tokens.ts';
import * as schemaToHtml from '../../utils/schema-to-html.ts';
import * as urlParser from '../../utils/url-parser.ts';
import { registerGetDesignContext } from '../get-design-context.ts';
import type { ServerConfig } from '../../config.ts';

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
    unitScale: 2,
    promptLang: 'en-US',
    ...overrides
  };
}

function createToolHarness(config: Partial<ServerConfig> = {}) {
  let handler:
    | ((args: { url: string }) => Promise<Record<string, unknown>>)
    | undefined;
  const server = {
    registerTool: vi.fn(
      (
        _name: string,
        _schema: Record<string, unknown>,
        h: (args: { url: string }) => Promise<Record<string, unknown>>
      ) => {
        handler = h;
      }
    )
  };

  registerGetDesignContext({
    server: server as never,
    config: makeConfig(config)
  });

  return {
    handler: handler!,
    server
  };
}

async function setupClientServer(cfg?: Partial<ServerConfig>) {
  const server = createMcpServer(makeConfig(cfg));
  const client = new Client({ name: 'lanhu-test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport)
  ]);
  return { server, client };
}

function callTool(client: Client, name: string, args: Record<string, unknown>) {
  return client.request(
    { method: 'tools/call', params: { name, arguments: args } },
    CallToolResultSchema
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('get_design_context — protocol', () => {
  let client: Client;

  beforeAll(async () => {
    ({ client } = await setupClientServer());
  });

  afterAll(async () => {
    await client.close();
  });

  test('tool should be registered', async () => {
    const { tools } = await client.listTools();
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('get_design_context');
  });

  test('tool should have url parameter', async () => {
    const { tools } = await client.listTools();
    const tool = tools.find(t => t.name === 'get_design_context');
    expect(tool).toBeDefined();
    expect(tool!.inputSchema.properties).toHaveProperty('url');
    expect(tool!.inputSchema.properties).not.toHaveProperty('link');
    expect(tool!.inputSchema.properties).not.toHaveProperty('text');
    expect(tool!.inputSchema.required).toContain('url');
  });

  test('should return isError when url has no image_id', async () => {
    const result = await callTool(client, 'get_design_context', {
      url: 'https://lanhuapp.com/web/#/item/project/detailDetach?tid=123&pid=456'
    });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('image_id');
  });

  test('should return isError when url has no tid', async () => {
    const result = await callTool(client, 'get_design_context', {
      url: 'https://lanhuapp.com/web/#/item/project/detailDetach?pid=456&image_id=789'
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('tid');
  });

  test('should return isError when url has no pid', async () => {
    const result = await callTool(client, 'get_design_context', {
      url: 'https://lanhuapp.com/web/#/item/project/detailDetach?tid=123&image_id=789'
    });

    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toContain('pid');
  });
});

describe('get_design_context — lang', () => {
  test('lang:en-US → tool description is English', async () => {
    const { client } = await setupClientServer({ promptLang: 'en-US' });
    const { tools } = await client.listTools();
    const tool = tools.find(t => t.name === 'get_design_context')!;
    expect(tool.description).toBe(promptsEnUS.TOOL_DESCRIPTION);
    await client.close();
  });

  test('lang:zh-CN → tool description is Chinese', async () => {
    const { client } = await setupClientServer({ promptLang: 'zh-CN' });
    const { tools } = await client.listTools();
    const tool = tools.find(t => t.name === 'get_design_context')!;
    expect(tool.description).toBe(promptsZhCN.TOOL_DESCRIPTION);
    await client.close();
  });

  test('lang:zh-CN → missing image_id uses the parser error message', async () => {
    const { client } = await setupClientServer({ promptLang: 'zh-CN' });
    const result = await callTool(client, 'get_design_context', {
      url: 'https://lanhuapp.com/web/#/item/project/detailDetach?tid=123&pid=456'
    });
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toBe(
      `URL parsing failed: missing required param image_id (docId)${
        promptsZhCN.ERROR_STOP_INSTRUCTION
      }`
    );
    await client.close();
  });

  test('lang:en-US → missing image_id uses the parser error message', async () => {
    const { client } = await setupClientServer({ promptLang: 'en-US' });
    const result = await callTool(client, 'get_design_context', {
      url: 'https://lanhuapp.com/web/#/item/project/detailDetach?tid=123&pid=456'
    });
    expect(result.isError).toBe(true);
    const text = (result.content[0] as { type: 'text'; text: string }).text;
    expect(text).toBe(
      `URL parsing failed: missing required param image_id (docId)${
        promptsEnUS.ERROR_STOP_INSTRUCTION
      }`
    );
    await client.close();
  });
});

describe('registerGetDesignContext', () => {
  test('returns a stop instruction when URL parsing throws a non-Error value', async () => {
    const { handler } = createToolHarness({ promptLang: 'en-US' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockImplementation(() => {
      throw 'bad-url';
    });

    const result = await handler({ url: 'https://example.com' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: `bad-url${promptsEnUS.ERROR_STOP_INSTRUCTION}`
        }
      ]
    });
  });

  test('returns a stop instruction when fetching design meta fails', async () => {
    const { handler } = createToolHarness({ promptLang: 'zh-CN' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockImplementation(() => {
      throw new Error('meta-failed');
    });

    const result = await handler({ url: 'https://example.com' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: `meta-failed${promptsZhCN.ERROR_STOP_INSTRUCTION}`
        }
      ]
    });
  });

  test('returns a stop instruction when fetching design meta throws a non-Error value', async () => {
    const { handler } = createToolHarness({ promptLang: 'en-US' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockImplementation(() => {
      throw 'meta-string-error';
    });

    const result = await handler({ url: 'https://example.com' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: `meta-string-error${promptsEnUS.ERROR_STOP_INSTRUCTION}`
        }
      ]
    });
  });

  test('returns HTML, mappings, tokens, guide text, and preview on the happy path', async () => {
    const { handler } = createToolHarness({
      promptLang: 'en-US',
      tailwindcss: true
    });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    const getDesignMetaSpy = vi
      .spyOn(lanhuApi, 'getDesignMeta')
      .mockResolvedValue({
        id: 'img-1',
        name: 'Home Screen',
        url: 'https://example.com/preview.png',
        projectName: 'Demo Project'
      });
    const getDesignSchemaJsonSpy = vi
      .spyOn(lanhuApi, 'getDesignSchemaJson')
      .mockResolvedValue({
        root: true
      });
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue(
      '<div>raw-html</div>'
    );
    vi.spyOn(schemaToHtml, 'localizeImageUrls').mockReturnValue({
      html: '<div>localized-html</div>',
      mapping: {
        './src/assets/home-screen/icon-1.png':
          'https://example.com/assets/icon.png'
      }
    });
    vi.spyOn(cssToTailwind, 'convertHtmlToTailwind').mockResolvedValue(
      '<div>tailwind-html</div>'
    );
    const getSketchJsonSpy = vi
      .spyOn(lanhuApi, 'getSketchJson')
      .mockResolvedValue({
        sketch: true
      });
    vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue(
      'line-1\nline-2'
    );
    const downloadImageSpy = vi
      .spyOn(lanhuApi, 'downloadImage')
      .mockResolvedValue(Buffer.from('preview'));

    const result = await handler({ url: 'https://example.com' });
    const content = result.content as Array<Record<string, unknown>>;
    const designRequest = {
      teamId: 'team-1',
      projectId: 'project-1',
      imageId: 'img-1'
    };

    expect(getDesignMetaSpy).toHaveBeenCalledWith(designRequest);
    expect(getDesignSchemaJsonSpy).toHaveBeenCalledWith(designRequest);
    expect(getSketchJsonSpy).toHaveBeenCalledWith(designRequest);
    expect(downloadImageSpy).toHaveBeenCalledWith({
      imgUrl: 'https://example.com/preview.png'
    });

    expect(content[0]).toEqual({
      type: 'text',
      text: `${promptsEnUS.HTML_CODE_LABEL_TAILWIND}<div>tailwind-html</div>`
    });
    expect(content[1]).toEqual({
      type: 'text',
      text: promptsEnUS.imageMappingText(
        1,
        '  curl -o "./src/assets/home-screen/icon-1.png" "https://example.com/assets/icon.png"'
      )
    });
    expect(content[2]).toEqual({
      type: 'text',
      text: `${promptsEnUS.DESIGN_TOKENS_HEADER}\n  line-1\n  line-2`
    });
    expect(content[3]).toEqual({
      type: 'text',
      text: promptsEnUS.guideText('Demo Project', 'Home Screen')
    });
    expect(content[4]).toEqual({
      type: 'image',
      data: Buffer.from('preview').toString('base64'),
      mimeType: 'image/png'
    });
  });

  test('STOPs when HTML schema fetch fails', async () => {
    const { handler } = createToolHarness({ promptLang: 'zh-CN' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Home Screen',
      url: 'https://example.com/preview.png',
      projectName: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockRejectedValue(
      new Error('schema-broken')
    );

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: 'text',
        text:
          promptsZhCN.ERROR_HTML_GENERATION('schema-broken') +
          promptsZhCN.ERROR_STOP_INSTRUCTION
      }
    ]);
  });

  test('STOPs when design tokens fetch fails', async () => {
    const { handler } = createToolHarness({ promptLang: 'zh-CN' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Home Screen',
      projectName: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({
      root: true
    });
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue(
      '<div>plain-html</div>'
    );
    vi.spyOn(schemaToHtml, 'localizeImageUrls').mockReturnValue({
      html: '<div>plain-html</div>',
      mapping: {}
    });
    vi.spyOn(lanhuApi, 'getSketchJson').mockRejectedValue(
      new Error('token-broken')
    );

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: 'text',
        text:
          promptsZhCN.ERROR_DESIGN_TOKENS('token-broken') +
          promptsZhCN.ERROR_STOP_INSTRUCTION
      }
    ]);
  });

  test('stringifies non-Error design token failures', async () => {
    const { handler } = createToolHarness({ promptLang: 'en-US' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Home Screen',
      projectName: 'Demo Project'
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({
      root: true
    });
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue(
      '<div>plain-html</div>'
    );
    vi.spyOn(schemaToHtml, 'localizeImageUrls').mockReturnValue({
      html: '<div>plain-html</div>',
      mapping: {}
    });
    vi.spyOn(lanhuApi, 'getSketchJson').mockRejectedValue('token-string-error');

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: 'text',
        text:
          promptsEnUS.ERROR_DESIGN_TOKENS('token-string-error') +
          promptsEnUS.ERROR_STOP_INSTRUCTION
      }
    ]);
  });

  test('STOPs when preview image download fails', async () => {
    const { handler } = createToolHarness({ promptLang: 'zh-CN' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Home Screen',
      url: 'https://example.com/preview.png',
      projectName: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({
      root: true
    });
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue(
      '<div>plain-html</div>'
    );
    vi.spyOn(schemaToHtml, 'localizeImageUrls').mockReturnValue({
      html: '<div>plain-html</div>',
      mapping: {}
    });
    vi.spyOn(lanhuApi, 'getSketchJson').mockResolvedValue({});
    vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue('');
    vi.spyOn(lanhuApi, 'downloadImage').mockRejectedValue('preview-broken');

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: 'text',
        text:
          promptsZhCN.ERROR_IMAGE_DOWNLOAD('preview-broken') +
          promptsZhCN.ERROR_STOP_INSTRUCTION
      }
    ]);
  });

  test('formats preview download failures from Error objects', async () => {
    const { handler } = createToolHarness({ promptLang: 'en-US' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Preview Failure',
      url: 'https://example.com/preview.png',
      projectName: 'Demo Project'
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({
      root: true
    });
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue(
      '<div>plain-html</div>'
    );
    vi.spyOn(schemaToHtml, 'localizeImageUrls').mockReturnValue({
      html: '<div>plain-html</div>',
      mapping: {}
    });
    vi.spyOn(lanhuApi, 'getSketchJson').mockResolvedValue({
      sketch: true
    });
    vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue('');
    vi.spyOn(lanhuApi, 'downloadImage').mockRejectedValue(
      new Error('preview-error')
    );

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: 'text',
        text:
          promptsEnUS.ERROR_IMAGE_DOWNLOAD('preview-error') +
          promptsEnUS.ERROR_STOP_INSTRUCTION
      }
    ]);
  });

  test('stringifies non-Error HTML generation failures', async () => {
    const { handler } = createToolHarness({ promptLang: 'en-US' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Broken Design'
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockRejectedValue(
      'schema-string-error'
    );
    vi.spyOn(lanhuApi, 'getSketchJson').mockResolvedValue({});
    vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue('');

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    expect(result.content).toEqual([
      {
        type: 'text',
        text:
          promptsEnUS.ERROR_HTML_GENERATION('schema-string-error') +
          promptsEnUS.ERROR_STOP_INSTRUCTION
      }
    ]);
  });

  test('omits optional items when there is no mapping, token, or preview', async () => {
    const { handler } = createToolHarness({ promptLang: 'zh-CN' });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Simple Design',
      projectName: 'Project Z'
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({
      root: true
    });
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue(
      '<div>plain-html</div>'
    );
    vi.spyOn(schemaToHtml, 'localizeImageUrls').mockReturnValue({
      html: '<div>plain-html</div>',
      mapping: {}
    });
    const tailwindSpy = vi.spyOn(cssToTailwind, 'convertHtmlToTailwind');
    vi.spyOn(lanhuApi, 'getSketchJson').mockResolvedValue({
      sketch: true
    });
    vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue('');
    const downloadSpy = vi.spyOn(lanhuApi, 'downloadImage');

    const result = await handler({ url: 'https://example.com' });

    expect(tailwindSpy).not.toHaveBeenCalled();
    expect(downloadSpy).not.toHaveBeenCalled();
    expect(result.content).toEqual([
      {
        type: 'text',
        text: `${promptsZhCN.HTML_CODE_LABEL}<div>plain-html</div>`
      },
      {
        type: 'text',
        text: promptsZhCN.guideText('Project Z', 'Simple Design')
      }
    ]);
  });

  test('skipSlices: skips localizeImageUrls, omits mapping block, keeps remote URLs in HTML', async () => {
    const { handler } = createToolHarness({
      promptLang: 'en-US',
      skipSlices: true
    });
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Skip Slices',
      projectName: 'Demo Project'
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({
      root: true
    });
    const remoteHtml =
      '<div><img src="https://example.com/assets/icon.png" /></div>';
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue(remoteHtml);
    const localizeSpy = vi.spyOn(schemaToHtml, 'localizeImageUrls');
    vi.spyOn(lanhuApi, 'getSketchJson').mockResolvedValue({});
    vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue('');

    const result = await handler({ url: 'https://example.com' });
    const content = result.content as Array<Record<string, unknown>>;

    expect(localizeSpy).not.toHaveBeenCalled();
    expect(content[0]).toEqual({
      type: 'text',
      text: `${promptsEnUS.HTML_CODE_LABEL}${remoteHtml}`
    });
    for (const item of content) {
      if (item.type === 'text') {
        expect(item.text).not.toContain('Image download mappings');
        expect(item.text).not.toContain('curl -o');
      }
    }
  });
});
