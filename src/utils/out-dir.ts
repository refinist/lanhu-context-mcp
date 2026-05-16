import { isAbsolute, resolve as resolvePath } from 'path';

export type OutDirSource = 'config' | 'cwd';

export interface ResolvedOutDir {
  path: string;
  source: OutDirSource;
}

export const DEFAULT_OUT_DIR_NAME = '.lanhu-context-mcp.local';

/**
 * Resolve outDir from server config (--out-dir CLI flag / OUT_DIR env),
 * falling back to <cwd>/.lanhu-context-mcp.local.
 *
 * The `.local` suffix matches common gitignore conventions (e.g. Vite's
 * `.env.local`), so users with `*.local` in their gitignore exclude the
 * generated artifacts automatically.
 */
export function resolveOutDir(configDefault?: string): ResolvedOutDir {
  const trimmed = configDefault?.trim();
  if (trimmed) {
    return { path: toAbsolute(trimmed), source: 'config' };
  }

  return {
    path: resolvePath(process.cwd(), DEFAULT_OUT_DIR_NAME),
    source: 'cwd'
  };
}

function toAbsolute(p: string): string {
  return isAbsolute(p) ? p : resolvePath(process.cwd(), p);
}
