import { isAbsolute, resolve as resolvePath } from 'path';
import { cli } from 'cleye';
import { config as loadEnv } from 'dotenv';
import { envBool } from './utils/env-utils.ts';
import type { ServerConfig } from './types/config.ts';

export type { LanhuApiConfig, ServerConfig } from './types/config.ts';

export const BASE_URL = 'https://lanhuapp.com';
export const DDS_BASE_URL = 'https://dds.lanhuapp.com';
export const DEFAULT_ENV_FILE = '.env.local';

export function getServerConfig(): ServerConfig {
  const argv = cli({
    name: 'lanhu-context-mcp',
    flags: {
      lanhuToken: {
        type: String,
        description: 'Lanhu main-site token string'
      },
      ddsToken: {
        type: String,
        description: 'DDS token string, defaults to LANHU_TOKEN / --lanhu-token'
      },
      httpTimeout: {
        type: Number,
        description: 'HTTP request timeout in ms (default: 30000)'
      },
      stdio: {
        type: Boolean,
        description: 'Use stdio transport (default for MCP clients like Cursor)'
      },
      http: {
        type: Boolean,
        description: 'Use HTTP transport instead of stdio'
      },
      host: {
        type: String,
        description: 'HTTP host (default: 127.0.0.1, only used in HTTP mode)'
      },
      port: {
        type: Number,
        description: 'HTTP port (default: 5200, only used in HTTP mode)'
      },
      tailwindcss: {
        type: Boolean,
        description:
          'Convert CSS classes to Tailwind utility classes in HTML output'
      },
      skipSlices: {
        type: Boolean,
        description:
          'Skip slice (image) download mappings and keep remote URLs in HTML'
      },
      unitScale: {
        type: Number,
        description:
          'Unit scale multiplier for CSS px values, e.g. 2 for 1x designs (default: 1)'
      },
      promptLang: {
        type: String,
        description:
          'Language for tool prompts: en-US or zh-CN (default: en-US)'
      },
      envFile: {
        type: String,
        description:
          'Path to a custom env file with LANHU_TOKEN and related settings'
      },
      cwd: {
        type: String,
        description:
          'Override the working directory used for relative path resolution (env file, default out dir). Useful for clients that spawn the server globally without a project cwd (e.g. Qoder).'
      },
      mode: {
        type: String,
        description:
          'Default output mode when AI does not pass one: inline | files'
      },
      outDir: {
        type: String,
        description:
          'Default outDir when AI does not pass one (used in mode=files)'
      }
    }
  });

  // Honor --cwd / CWD so global MCP clients without project context (e.g.
  // Qoder) can still resolve relative paths against a real directory.
  // Must run before env-file resolution and outDir resolution downstream.
  const cwdOverride = argv.flags.cwd || process.env.CWD;
  if (cwdOverride) {
    const target = resolveRuntimePath(cwdOverride);
    try {
      process.chdir(target);
    } catch (e) {
      // process.chdir only throws standard Error instances (ENOENT/EACCES etc).
      console.error(
        `[config] Failed to chdir to "${target}": ${(e as Error).message}\n` +
          '  Provide a valid absolute path via --cwd or CWD.'
      );
      process.exit(1);
    }
  }

  // Load the selected env file before reading env vars.
  const envFilePath = argv.flags.envFile
    ? resolveRuntimePath(argv.flags.envFile)
    : process.env.ENV_FILE
      ? resolveRuntimePath(process.env.ENV_FILE)
      : resolveRuntimePath(DEFAULT_ENV_FILE);

  // MCP stdio transport requires stdout to contain only JSON-RPC frames.
  loadEnv({ path: envFilePath, quiet: true });

  const lanhuToken = argv.flags.lanhuToken || process.env.LANHU_TOKEN || '';
  const ddsToken = argv.flags.ddsToken || process.env.DDS_TOKEN || lanhuToken;
  const httpTimeout =
    argv.flags.httpTimeout || Number(process.env.HTTP_TIMEOUT) || 30000;
  const envStdioMode =
    process.env.STDIO === 'true' || process.env.STDIO === '1'
      ? true
      : process.env.STDIO === 'false' || process.env.STDIO === '0'
        ? false
        : undefined;
  const isStdioMode =
    argv.flags.http === true
      ? false
      : argv.flags.stdio === true
        ? true
        : (envStdioMode ?? true);
  const tailwindcss = argv.flags.tailwindcss ?? envBool('TAILWINDCSS');
  const skipSlices = argv.flags.skipSlices ?? envBool('SKIP_SLICES');
  const unitScale =
    argv.flags.unitScale ??
    (process.env.UNIT_SCALE ? Number(process.env.UNIT_SCALE) : 1);
  const rawLang = argv.flags.promptLang || process.env.PROMPT_LANG || 'en-US';
  const promptLang: 'en-US' | 'zh-CN' = rawLang === 'zh-CN' ? 'zh-CN' : 'en-US';
  const port =
    argv.flags.port ?? (process.env.PORT ? Number(process.env.PORT) : 5200);
  const host = argv.flags.host || process.env.HOST || '127.0.0.1';
  const isHttpMode = !isStdioMode;

  const rawMode = argv.flags.mode || process.env.MODE || '';
  const mode: 'inline' | 'files' | undefined =
    rawMode === 'inline' || rawMode === 'files' ? rawMode : undefined;
  const outDirRaw = argv.flags.outDir || process.env.OUT_DIR || '';
  const outDir = outDirRaw.trim() || undefined;

  if (!lanhuToken) {
    console.error(
      '[config] LANHU_TOKEN is required.\n' +
        '  Via CLI:  npx lanhu-context-mcp --lanhu-token "<your token>"\n' +
        '  Via env:  LANHU_TOKEN=<your token> npx lanhu-context-mcp\n' +
        `  Via file: add LANHU_TOKEN=<your token> to ${DEFAULT_ENV_FILE} in current directory`
    );
    process.exit(1);
  }

  return {
    lanhuToken,
    ddsToken,
    httpTimeout,
    port,
    host,
    isHttpMode,
    isStdioMode,
    tailwindcss,
    skipSlices,
    unitScale,
    promptLang,
    mode,
    outDir
  };
}

function resolveRuntimePath(p: string): string {
  return isAbsolute(p) ? p : resolvePath(process.cwd(), p);
}
