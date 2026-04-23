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
  convertLanhuToHtml,
  localizeImageUrls
} from '../utils/schema-to-html.ts';
import { formatStopError } from '../utils/stop-instruction.ts';
import { parseLanhuUrl } from '../utils/url-parser.ts';
import type { ServerConfig } from '../types/config.ts';
import type { DesignMeta, LanhuUrlParams } from '../types/lanhu.ts';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

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

      const content: Array<
        | { type: 'text'; text: string }
        | { type: 'image'; data: string; mimeType: string }
      > = [];

      // Build the main HTML output from the DDS schema and optionally localize image assets.
      try {
        const schemaJson = await getDesignSchemaJson(designRequest);

        let htmlCode = convertLanhuToHtml(schemaJson, config.unitScale);
        const localized = config.skipSlices
          ? null
          : localizeImageUrls(htmlCode, design.name);
        if (localized) htmlCode = localized.html;

        if (config.tailwindcss) {
          htmlCode = await convertHtmlToTailwind(htmlCode);
        }

        const htmlLabel = config.tailwindcss
          ? p.HTML_CODE_LABEL_TAILWIND
          : p.HTML_CODE_LABEL;
        content.push({
          type: 'text',
          text: `${htmlLabel}${htmlCode}`
        });

        if (localized && Object.keys(localized.mapping).length > 0) {
          const entries = Object.entries(localized.mapping);
          const curlLines = entries
            .map(([l, r]) => `  curl -o "${l}" "${r}"`)
            .join('\n');
          content.push({
            type: 'text',
            text: p.imageMappingText(entries.length, curlLines)
          });
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
      try {
        const sketchJson = await getSketchJson(designRequest);
        const designTokens = extractDesignTokens(sketchJson);
        if (designTokens) {
          content.push({
            type: 'text',
            text: `${p.DESIGN_TOKENS_HEADER}\n${designTokens
              .split('\n')
              .map(l => `  ${l}`)
              .join('\n')}`
          });
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

      // Append the final implementation guidance after the generated assets.
      content.push({
        type: 'text',
        text: p.guideText(design.projectName, design.name)
      });

      // Attach the design preview image when the source payload exposes one.
      if (design.url) {
        try {
          const imgBuffer = await downloadImage({ imgUrl: design.url });
          content.push({
            type: 'image',
            data: imgBuffer.toString('base64'),
            mimeType: 'image/png'
          });
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

      return { content };
    }
  );
}
