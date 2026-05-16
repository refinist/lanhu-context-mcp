// Tests for mode="files" of get_design_context.
import { access, mkdtemp, readFile, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { resolve as resolvePath } from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as lanhuApi from '../../services/lanhu-api.ts';
import * as designTokens from '../../utils/design-tokens.ts';
import * as fileDelivery from '../../utils/file-delivery.ts';
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
    unitScale: 1,
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

  return { handler: handler! };
}

function setupHappyPathMocks() {
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
    projectName: 'Demo Project'
  });
  vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({ root: true });
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
  vi.spyOn(lanhuApi, 'getSketchJson').mockResolvedValue({ sketch: true });
  vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue(
    'line-1\nline-2'
  );
  vi.spyOn(lanhuApi, 'downloadImage').mockResolvedValue(
    Buffer.from('preview-png')
  );
}

describe('get_design_context — mode=files', () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(resolvePath(tmpdir(), 'lanhu-tool-'));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(tmpRoot, { recursive: true, force: true });
  });

  test('writes a single context.md bundle plus preview.png and returns resource_links', async () => {
    setupHappyPathMocks();
    const { handler } = createToolHarness({
      promptLang: 'en-US',
      mode: 'files',
      outDir: tmpRoot
    });

    const result = await handler({ url: 'https://example.com' });

    const content = result.content as Array<Record<string, unknown>>;
    // No text or image items — just resource_links.
    expect(content.every(c => c.type === 'resource_link')).toBe(true);

    const resourceLinks = content as Array<{
      name: string;
      uri: string;
      description?: string;
    }>;
    const linkNames = resourceLinks.map(l => l.name);
    expect(linkNames).toEqual(['context.md', 'preview.png']);
    for (const link of resourceLinks) {
      expect(link.description).toBeUndefined();
      expect(link.uri.startsWith('file://')).toBe(true);
    }

    expect(result.structuredContent).toBeUndefined();

    const designDir = resolvePath(tmpRoot, 'Home-Screen-img-1');
    // Legacy per-section files must NOT exist.
    for (const name of [
      'context.html',
      'assets.md',
      'design-tokens.md',
      'guide.md',
      'index.md',
      'metadata.json'
    ]) {
      await expect(access(resolvePath(designDir, name))).rejects.toThrow();
    }

    const bundle = await readFile(resolvePath(designDir, 'context.md'), 'utf8');
    // Bundle carries the same blocks inline mode would emit.
    expect(bundle).toContain('HTML+CSS Code:');
    expect(bundle).toContain('<div>localized-html</div>');
    expect(bundle).toContain('Image download mappings');
    expect(bundle).toContain('curl -o');
    expect(bundle).toContain('Design Tokens');
    expect(bundle).toContain('Project: Demo Project');
    expect(bundle).toContain('Design: Home Screen');

    const preview = await stat(resolvePath(designDir, 'preview.png'));
    expect(preview.size).toBeGreaterThan(0);
  });

  test('writes under server config.outDir', async () => {
    setupHappyPathMocks();
    const { handler } = createToolHarness({ mode: 'files', outDir: tmpRoot });

    const result = await handler({ url: 'https://example.com' });

    const content = result.content as Array<Record<string, unknown>>;
    const links = content.filter(c => c.type === 'resource_link') as Array<{
      uri: string;
    }>;
    for (const link of links) {
      expect(link.uri).toContain(tmpRoot);
    }
  });

  test('falls back to cwd/.lanhu-context-mcp.local when config.outDir is unset', async () => {
    setupHappyPathMocks();
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpRoot);
    const { handler } = createToolHarness({ mode: 'files' });

    const result = await handler({ url: 'https://example.com' });

    const content = result.content as Array<Record<string, unknown>>;
    const links = content.filter(c => c.type === 'resource_link') as Array<{
      uri: string;
    }>;
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.uri).toContain('.lanhu-context-mcp.local');
      expect(link.uri).toContain(tmpRoot);
    }
    cwdSpy.mockRestore();
  });

  test('default (no config.mode) preserves inline behavior (no files written)', async () => {
    setupHappyPathMocks();
    const { handler } = createToolHarness();

    const result = await handler({ url: 'https://example.com' });

    const content = result.content as Array<Record<string, unknown>>;
    // Last item should still be the inline image.
    const last = content[content.length - 1] as {
      type: string;
      mimeType?: string;
    };
    expect(last.type).toBe('image');
    expect(last.mimeType).toBe('image/png');
    // No resource_link items in inline mode.
    expect(content.find(c => c.type === 'resource_link')).toBeUndefined();
  });

  test('config.mode="inline" preserves inline behavior', async () => {
    setupHappyPathMocks();
    const { handler } = createToolHarness({ mode: 'inline' });

    const result = await handler({ url: 'https://example.com' });

    const content = result.content as Array<Record<string, unknown>>;
    expect(content.find(c => c.type === 'resource_link')).toBeUndefined();
    expect(content.find(c => c.type === 'image')).toBeDefined();
  });

  test('returns a stop error when writeDesignFiles throws', async () => {
    setupHappyPathMocks();
    vi.spyOn(fileDelivery, 'writeDesignFiles').mockRejectedValue(
      new Error('disk full')
    );
    const { handler } = createToolHarness({ mode: 'files', outDir: tmpRoot });

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe('text');
    expect(content[0].text).toContain('disk full');
    expect(content[0].text).toContain('STOP');
  });

  test('stringifies non-Error writeDesignFiles rejections', async () => {
    setupHappyPathMocks();
    vi.spyOn(fileDelivery, 'writeDesignFiles').mockRejectedValue(
      'plain string failure'
    );
    const { handler } = createToolHarness({ mode: 'files', outDir: tmpRoot });

    const result = await handler({ url: 'https://example.com' });

    expect(result.isError).toBe(true);
    const content = result.content as Array<{ type: string; text: string }>;
    expect(content[0].text).toContain('plain string failure');
  });

  test('omits mappingText/designTokens/preview blocks and link when absent', async () => {
    // Override happy-path defaults: no image mapping, no tokens, no preview URL.
    vi.spyOn(urlParser, 'parseLanhuUrl').mockReturnValue({
      teamId: 'team-1',
      projectId: 'project-1',
      docId: 'img-1',
      versionId: undefined
    });
    vi.spyOn(lanhuApi, 'getDesignMeta').mockResolvedValue({
      id: 'img-1',
      name: 'Bare',
      url: '',
      projectName: 'Demo'
    });
    vi.spyOn(lanhuApi, 'getDesignSchemaJson').mockResolvedValue({ root: true });
    vi.spyOn(schemaToHtml, 'convertLanhuToHtml').mockReturnValue('<div></div>');
    vi.spyOn(schemaToHtml, 'localizeImageUrls').mockReturnValue({
      html: '<div></div>',
      mapping: {}
    });
    vi.spyOn(lanhuApi, 'getSketchJson').mockResolvedValue({ sketch: true });
    // Empty string → handler treats it as "no tokens" and skips the block.
    vi.spyOn(designTokens, 'extractDesignTokens').mockReturnValue('');

    const { handler } = createToolHarness({ mode: 'files', outDir: tmpRoot });
    const result = await handler({ url: 'https://example.com' });

    const content = result.content as Array<{
      type: string;
      name?: string;
      uri?: string;
    }>;
    // Only context.md — no preview link.
    expect(content).toHaveLength(1);
    expect(content[0].type).toBe('resource_link');
    expect(content[0].name).toBe('context.md');

    const designDir = resolvePath(tmpRoot, 'Bare-img-1');
    const bundle = await readFile(resolvePath(designDir, 'context.md'), 'utf8');
    // Bundle should NOT contain the mapping block header or the design-tokens
    // block header (guide text mentions "Design Tokens" in passing, so match
    // the actual section header instead).
    expect(bundle).not.toContain('Image download mappings');
    expect(bundle).not.toContain('Design Tokens (supplementary reference)');
    // HTML block + guide still present.
    expect(bundle).toContain('HTML+CSS Code:');
    expect(bundle).toContain('Design: Bare');
  });
});
