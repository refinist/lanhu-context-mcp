import { z } from 'zod';
import * as promptsEnUS from '../prompts/en-US.ts';
import * as promptsZhCN from '../prompts/zh-CN.ts';
import {
  downloadImage,
  getDesignMeta,
  getDesignSchemaJson,
  getSketchJson
} from '../services/lanhu-api.ts';
import { convertHtmlToTailwind } from '../utils/css-to-tailwind.ts';
import { extractDesignTokens } from '../utils/design-tokens.ts';
import {
  writeDesignFiles,
  type FileDeliveryResult,
  type FileInfo
} from '../utils/file-delivery.ts';
import { resolveOutDir } from '../utils/out-dir.ts';
import {
  convertLanhuToHtml,
  localizeImageUrls
} from '../utils/schema-to-html.ts';
import { formatStopError } from '../utils/stop-instruction.ts';
import { parseLanhuUrl } from '../utils/url-parser.ts';
import type { ServerConfig } from '../types/config.ts';
import type { DesignMeta, LanhuUrlParams } from '../types/lanhu.ts';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

type ContentItem =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | {
      type: 'resource_link';
      uri: string;
      name: string;
      mimeType: string;
    };

export function registerGetDesignContext({
  server,
  config
}: {
  server: McpServer;
  config: ServerConfig;
}): void {
  const p = config.promptLang === 'zh-CN' ? promptsZhCN : promptsEnUS;

  server.registerTool(
    'get_design_context',
    {
      description: p.TOOL_DESCRIPTION,
      inputSchema: {
        url: z.string().describe(p.URL_INPUT_DESCRIPTION)
      }
    },
    async ({ url }) => {
      // Parse the incoming Lanhu URL into the ids needed by downstream APIs.
      let params: LanhuUrlParams;
      try {
        params = parseLanhuUrl(url);
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: formatStopError(error, p.ERROR_STOP_INSTRUCTION)
            }
          ]
        };
      }

      const imageId = params.docId;
      const designRequest = {
        teamId: params.teamId,
        projectId: params.projectId,
        imageId
      };

      // Fetch the basic design metadata first so later steps can reuse its name and preview URL.
      let design: DesignMeta;
      try {
        design = await getDesignMeta(designRequest);
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: formatStopError(error, p.ERROR_STOP_INSTRUCTION)
            }
          ]
        };
      }

      // Build the main HTML output from the DDS schema and optionally localize image assets.
      let htmlCode: string;
      let htmlLabel: string;
      let mappingEntries: Array<[string, string]> | undefined;
      let mappingText: string | undefined;
      try {
        const schemaJson = await getDesignSchemaJson(designRequest);

        htmlCode = convertLanhuToHtml(schemaJson, config.unitScale);
        const localized = config.skipSlices
          ? null
          : localizeImageUrls(htmlCode, design.name);
        if (localized) htmlCode = localized.html;

        if (config.tailwindcss) {
          htmlCode = await convertHtmlToTailwind(htmlCode);
        }

        htmlLabel = config.tailwindcss
          ? p.HTML_CODE_LABEL_TAILWIND
          : p.HTML_CODE_LABEL;

        if (localized && Object.keys(localized.mapping).length > 0) {
          mappingEntries = Object.entries(localized.mapping) as Array<
            [string, string]
          >;
          const curlLines = mappingEntries
            .map(([l, r]) => `  curl -o "${l}" "${r}"`)
            .join('\n');
          mappingText = p.imageMappingText(mappingEntries.length, curlLines);
        }
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: formatStopError(
                p.ERROR_HTML_GENERATION(
                  e instanceof Error ? e.message : String(e)
                ),
                p.ERROR_STOP_INSTRUCTION
              )
            }
          ]
        };
      }

      // Extract sketch-based design tokens as an extra reference block when available.
      let designTokens: string | undefined;
      try {
        const sketchJson = await getSketchJson(designRequest);
        const tokens = extractDesignTokens(sketchJson);
        if (tokens) {
          designTokens = `${p.DESIGN_TOKENS_HEADER}\n${tokens
            .split('\n')
            .map(l => `  ${l}`)
            .join('\n')}`;
        }
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: formatStopError(
                p.ERROR_DESIGN_TOKENS(
                  e instanceof Error ? e.message : String(e)
                ),
                p.ERROR_STOP_INSTRUCTION
              )
            }
          ]
        };
      }

      const guideText = p.guideText(design.projectName, design.name);

      // Attach the design preview image when the source payload exposes one.
      let previewBuffer: Buffer | undefined;
      if (design.url) {
        try {
          previewBuffer = await downloadImage({ imgUrl: design.url });
        } catch (e) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: formatStopError(
                  p.ERROR_IMAGE_DOWNLOAD(
                    e instanceof Error ? e.message : String(e)
                  ),
                  p.ERROR_STOP_INSTRUCTION
                )
              }
            ]
          };
        }
      }

      const resolvedMode = config.mode ?? 'inline';

      if (resolvedMode === 'files') {
        const resolved = resolveOutDir(config.outDir);

        // Same content blocks inline emits, joined into a single markdown bundle.
        const bundleBlocks: string[] = [`${htmlLabel}${htmlCode}`];
        if (mappingText) bundleBlocks.push(mappingText);
        if (designTokens) bundleBlocks.push(designTokens);
        bundleBlocks.push(guideText);
        const contextBody = bundleBlocks.join('\n\n');

        let result: FileDeliveryResult;
        try {
          result = await writeDesignFiles({
            outDir: resolved.path,
            imageId,
            designName: design.name,
            contextBody,
            previewBuffer
          });
        } catch (e) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: formatStopError(
                  e instanceof Error ? e.message : String(e),
                  p.ERROR_STOP_INSTRUCTION
                )
              }
            ]
          };
        }

        const content: ContentItem[] = [];
        pushResourceLink(content, result.files.context, 'context.md');
        if (result.files.preview) {
          pushResourceLink(content, result.files.preview, 'preview.png');
        }

        return { content };
      }

      // Default (inline) path — preserves the original content layout exactly.
      const content: ContentItem[] = [];
      content.push({
        type: 'text',
        text: `${htmlLabel}${htmlCode}`
      });
      if (mappingText) {
        content.push({ type: 'text', text: mappingText });
      }
      if (designTokens) {
        content.push({ type: 'text', text: designTokens });
      }
      content.push({ type: 'text', text: guideText });
      if (previewBuffer) {
        content.push({
          type: 'image',
          data: previewBuffer.toString('base64'),
          mimeType: 'image/png'
        });
      }

      return { content };
    }
  );
}

function pushResourceLink(
  content: ContentItem[],
  file: FileInfo,
  name: string
): void {
  content.push({
    type: 'resource_link',
    uri: file.uri,
    name,
    mimeType: file.mimeType
  });
}
