import { mkdirSync, writeFileSync } from 'fs';
import { mkdir, readFile, stat } from 'fs/promises';
import { join, resolve as resolvePath } from 'path';
import {
  CallToolResultSchema,
  type CallToolResult
} from '@modelcontextprotocol/sdk/types';
import { config } from 'dotenv';
import { DEFAULT_ENV_FILE, type ServerConfig } from '../../config.ts';
import { envBool } from '../../utils/env-utils.ts';
import type { Client } from '@modelcontextprotocol/sdk/client';

config({ path: process.env.ENV_FILE ?? DEFAULT_ENV_FILE });

export interface IntegrationHarness {
  client: Client;
  close: () => Promise<void>;
}

export type IntegrationHarnessFactory = (
  cfg?: Partial<ServerConfig>
) => Promise<IntegrationHarness>;

export function makeIntegrationConfig(
  overrides: Partial<ServerConfig> = {}
): ServerConfig {
  return {
    lanhuToken: process.env.LANHU_TOKEN ?? 'fake-token',
    ddsToken: process.env.DDS_TOKEN ?? process.env.LANHU_TOKEN ?? 'fake-token',
    httpTimeout: 30_000,
    port: 5200,
    host: '127.0.0.1',
    isHttpMode: false,
    isStdioMode: true,
    tailwindcss: envBool('TAILWINDCSS'),
    skipSlices: envBool('SKIP_SLICES'),
    unitScale: 2,
    promptLang: process.env.PROMPT_LANG === 'zh-CN' ? 'zh-CN' : 'en-US',
    ...overrides
  };
}

export function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  return client.request(
    { method: 'tools/call', params: { name, arguments: args } },
    CallToolResultSchema
  );
}

export function describeGetDesignContextIntegration(
  transportName: 'http' | 'stdio',
  setupHarness: IntegrationHarnessFactory
): void {
  const describeIntegration =
    process.env.RUN_INTEGRATION === '1' ? describe : describe.skip;

  describeIntegration(
    `get_design_context — integration (${transportName})`,
    () => {
      let client: Client | undefined;
      let closeHarness: (() => Promise<void>) | undefined;
      let testUrl: string;

      beforeAll(async () => {
        testUrl = process.env.LANHU_TEST_URL ?? '';
        if (!testUrl)
          throw new Error('LANHU_TEST_URL is required for integration tests');

        const harness = await setupHarness();
        client = harness.client;
        closeHarness = harness.close;
      });

      afterAll(async () => {
        if (closeHarness) {
          await closeHarness();
          return;
        }

        if (client) {
          await client.close();
        }
      });

      test('should return multi-segment content array', async () => {
        const result = await callTool(client!, 'get_design_context', {
          url: testUrl
        });

        expect(result.content.length).toBeGreaterThanOrEqual(2);

        const htmlItem = result.content[0];
        expect(htmlItem.type).toBe('text');
        const htmlText = (htmlItem as { type: 'text'; text: string }).text;
        expect(htmlText).toMatch(/HTML\+(CSS|Tailwind)/);
        expect(htmlText).toContain('<div');

        const textItems = result.content.filter(
          c => c.type === 'text'
        ) as Array<{
          type: 'text';
          text: string;
        }>;
        const guideText = textItems[textItems.length - 1].text;
        expect(guideText).toContain('HTML+CSS > Design Tokens');
      }, 60_000);

      test('should have separate image mapping segment when images exist', async () => {
        const result = await callTool(client!, 'get_design_context', {
          url: testUrl
        });

        const textItems = result.content.filter(
          c => c.type === 'text'
        ) as Array<{
          type: 'text';
          text: string;
        }>;

        const mappingItem = textItems.find(c =>
          c.text.includes('Image asset mappings')
        );
        if (mappingItem) {
          const htmlItem = textItems.find(c => c.text.includes('<div'));
          expect(htmlItem).toBeDefined();
          expect(htmlItem!.text).not.toContain('Image asset mappings');
          expect(mappingItem.text).toContain('curl -o');
        }
      }, 60_000);

      test('should have design tokens as separate segment if present', async () => {
        const result = await callTool(client!, 'get_design_context', {
          url: testUrl
        });

        const textItems = result.content.filter(
          c => c.type === 'text'
        ) as Array<{
          type: 'text';
          text: string;
        }>;

        const tokenItem = textItems.find(c => c.text.includes('Design Tokens'));
        if (tokenItem) {
          const htmlItem = textItems.find(c => c.text.includes('<div'));
          expect(htmlItem).toBeDefined();
          expect(htmlItem!.text).not.toContain('Design Tokens');
        }
      }, 60_000);

      test('should have image preview as last content item if present', async () => {
        const result = await callTool(client!, 'get_design_context', {
          url: testUrl
        });

        const imageItems = result.content.filter(c => c.type === 'image');
        if (imageItems.length > 0) {
          const lastItem = result.content[result.content.length - 1];
          expect(lastItem.type).toBe('image');
          expect((lastItem as { mimeType: string }).mimeType).toBe('image/png');
        }
      }, 60_000);

      test('each content segment should be independent (no summaryText leakage)', async () => {
        const result = await callTool(client!, 'get_design_context', {
          url: testUrl
        });

        const textItems = result.content.filter(
          c => c.type === 'text'
        ) as Array<{
          type: 'text';
          text: string;
        }>;

        const htmlItem = textItems[0];
        expect(htmlItem.text).toContain('<div');

        const guideItem = textItems[textItems.length - 1];
        expect(guideItem.text).not.toContain('<div');
        expect(guideItem.text).not.toMatch(/HTML\+(CSS|Tailwind) Code:/);
      }, 60_000);

      test('tailwindcss mode: label changes and no class rules in <style>', async () => {
        const { client: twClient, close: closeTwHarness } = await setupHarness({
          tailwindcss: true
        });

        const result = await callTool(twClient, 'get_design_context', {
          url: testUrl
        });

        await closeTwHarness();

        const htmlItem = result.content[0] as { type: 'text'; text: string };
        expect(htmlItem.type).toBe('text');
        expect(htmlItem.text).toContain('HTML+Tailwind');
        expect(htmlItem.text).not.toContain('HTML+CSS Code:');

        const styleMatch = htmlItem.text.match(/<style>([\s\S]*?)<\/style>/);
        if (styleMatch) {
          const styleContent = styleMatch[1];
          expect(styleContent).not.toMatch(/^\s*\.[a-zA-Z]/m);
        }
      }, 60_000);

      describe('mode=files', () => {
        // Persist into tmp/integration/get-design-context.tool-output.files.{transport}/
        // so artifacts survive the test run for inspection. The globalSetup
        // (scripts/vitest-integration-setup.ts) wipes tmp/integration/ before
        // each integration run.
        //
        // tmpRoot ends in `.lanhu-context-mcp.local` so the on-disk layout
        // matches real-world usage where the tool defaults to
        // <projectRoot>/.lanhu-context-mcp.local.
        const transportDir = resolvePath(
          process.cwd(),
          'tmp',
          'integration',
          `get-design-context.tool-output.files.${transportName}`
        );
        const tmpRoot = resolvePath(transportDir, '.lanhu-context-mcp.local');

        let filesClient: Client;
        let closeFilesHarness: () => Promise<void>;

        beforeAll(async () => {
          const harness = await setupHarness({
            mode: 'files',
            outDir: tmpRoot
          });
          filesClient = harness.client;
          closeFilesHarness = harness.close;
        });

        afterAll(async () => {
          if (closeFilesHarness) await closeFilesHarness();
        });

        beforeEach(async () => {
          await mkdir(tmpRoot, { recursive: true });
        });

        test('returns only resource_links pointing to files that exist', async () => {
          const result = await callTool(filesClient, 'get_design_context', {
            url: testUrl
          });

          // Every content item should be a resource_link — no text, no image.
          expect(result.content.length).toBeGreaterThan(0);
          expect(result.content.every(c => c.type === 'resource_link')).toBe(
            true
          );

          expect(result.structuredContent).toBeUndefined();

          const links = result.content as Array<{
            uri: string;
            name: string;
            mimeType: string;
          }>;
          // context.md is always present; preview.png appears when the design
          // has a preview image.
          const names = links.map(l => l.name);
          expect(names).toContain('context.md');
          for (const link of links) {
            const filePath = link.uri.replace(/^file:\/\//, '');
            const info = await stat(filePath);
            expect(info.isFile()).toBe(true);
            expect(info.size).toBeGreaterThan(0);
          }
        }, 60_000);

        test('context.md bundles all inline blocks', async () => {
          const result = await callTool(filesClient, 'get_design_context', {
            url: testUrl
          });

          const ctx = (
            result.content as Array<{
              name?: string;
              uri?: string;
            }>
          ).find(c => c.name === 'context.md');
          expect(ctx).toBeDefined();
          const bundle = await readFile(
            ctx!.uri!.replace(/^file:\/\//, ''),
            'utf8'
          );
          // Same blocks inline mode emits should all appear in the bundle.
          expect(bundle).toMatch(/HTML\+(CSS|Tailwind) Code:/);
          expect(bundle).toMatch(/<div/);
          // Guide tail marker.
          expect(bundle).toContain('HTML+CSS > Design Tokens');
        }, 60_000);

        test('no inline HTML or base64 in tool result', async () => {
          const result = await callTool(filesClient, 'get_design_context', {
            url: testUrl
          });

          const imageItems = result.content.filter(c => c.type === 'image');
          expect(imageItems.length).toBe(0);

          const textItems = result.content.filter(c => c.type === 'text');
          expect(textItems.length).toBe(0);
        }, 60_000);

        test('should write tool-output.{json,txt} for debugging', async () => {
          const result = await callTool(filesClient, 'get_design_context', {
            url: testUrl
          });

          console.log(
            `[${transportName} files] content 数组共 ${result.content.length} 个 item`
          );

          writeFileSync(
            join(transportDir, 'tool-output.json'),
            JSON.stringify(result, null, 2),
            'utf-8'
          );

          // Compact human-readable view: one line per content item.
          const textLines = result.content.map(item => {
            if (item.type === 'resource_link') {
              const r = item as {
                type: 'resource_link';
                uri: string;
                name: string;
              };
              return `[Resource link: ${r.name}] ${r.uri}`;
            }
            if (item.type === 'text') {
              return (item as { type: 'text'; text: string }).text;
            }
            const img = item as {
              type: 'image';
              data: string;
              mimeType: string;
            };
            return `data:${img.mimeType};base64,${img.data}`;
          });

          writeFileSync(
            join(transportDir, 'tool-output.txt'),
            textLines.join('\n'),
            'utf-8'
          );
        }, 60_000);
      });

      test('should print content summary for debugging', async () => {
        const result = await callTool(client!, 'get_design_context', {
          url: testUrl
        });

        console.log(
          `[${transportName}] content 数组共 ${result.content.length} 个 item`
        );

        const textParts = result.content.map(item => {
          if (item.type === 'text') {
            return (item as { type: 'text'; text: string }).text;
          }

          const imageItem = item as {
            type: 'image';
            data: string;
            mimeType: string;
          };
          return `data:${imageItem.mimeType};base64,${imageItem.data}`;
        });

        const outputDir = join(process.cwd(), 'tmp', 'integration');
        mkdirSync(outputDir, { recursive: true });
        writeFileSync(
          join(
            outputDir,
            `get-design-context.tool-output.${transportName}.json`
          ),
          JSON.stringify(result, null, 2),
          'utf-8'
        );
        writeFileSync(
          join(
            outputDir,
            `get-design-context.tool-output.${transportName}.txt`
          ),
          textParts.join('\n'),
          'utf-8'
        );
      }, 60_000);
    }
  );
}
