// stdio integration tests for get_design_context.
// These tests require access to the real Lanhu APIs:
// RUN_INTEGRATION=1 LANHU_TEST_URL="<design detail URL>" npx vitest run src/tools/__tests__/get-design-context.stdio.integration.spec.ts

import { join } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  describeGetDesignContextIntegration,
  makeIntegrationConfig
} from './integration-shared.ts';
import type { ServerConfig } from '../../config.ts';

const tsxCliPath = join(
  process.cwd(),
  'node_modules',
  'tsx',
  'dist',
  'cli.mjs'
);
const runScriptPath = join(process.cwd(), 'src', 'run.ts');

function buildStdioArgs(config: ServerConfig): string[] {
  const args = [
    tsxCliPath,
    runScriptPath,
    '--stdio',
    '--lanhu-token',
    config.lanhuToken,
    '--dds-token',
    config.ddsToken,
    '--http-timeout',
    String(config.httpTimeout),
    '--unit-scale',
    String(config.unitScale),
    '--prompt-lang',
    config.promptLang
  ];

  if (config.tailwindcss) {
    args.push('--tailwindcss');
  }

  if (config.skipSlices) {
    args.push('--skip-slices');
  }

  return args;
}

async function setupStdioClientServer(cfg?: Partial<ServerConfig>) {
  const stdioConfig = makeIntegrationConfig(cfg);
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: buildStdioArgs(stdioConfig),
    cwd: process.cwd(),
    stderr: 'pipe'
  });
  const stderrChunks: string[] = [];
  transport.stderr?.on('data', chunk => {
    stderrChunks.push(String(chunk));
  });

  const client = new Client({ name: 'lanhu-test-client', version: '1.0.0' });

  try {
    await client.connect(transport);
  } catch (error) {
    await transport.close();
    const stderrOutput = stderrChunks.join('').trim();
    if (stderrOutput) {
      throw new Error(
        `Failed to start stdio integration server:\n${stderrOutput}`
      );
    }
    throw error;
  }

  return {
    client,
    async close() {
      await client.close();
    }
  };
}

describeGetDesignContextIntegration('stdio', setupStdioClientServer);
