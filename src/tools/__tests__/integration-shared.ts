import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
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
