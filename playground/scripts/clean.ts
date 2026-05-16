#!/usr/bin/env node
// Reset playground scaffolding: wipe src/pages/* and src/assets/* (except css/ and logo.svg).
// Run: node playground/scripts/clean.ts  (or `pnpm play:clean` from repo root)

import { readdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const playgroundRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = resolve(playgroundRoot, 'src/assets');
const pagesDir = resolve(playgroundRoot, 'src/pages');
const lanhuOutDir = resolve(playgroundRoot, '.lanhu-context-mcp.local');
const assetsKeep = new Set(['css', 'logo.svg']);

async function removeIfExists(target: string) {
  try {
    await stat(target);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`[clean] skip (missing): ${target}`);
      return;
    }
    throw e;
  }
  await rm(target, { recursive: true, force: true });
  console.log(`[clean] removed: ${target}`);
}

async function clearDir(dir: string, keep: Set<string> = new Set()) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`[clean] skip (missing): ${dir}`);
      return;
    }
    throw e;
  }

  const removed: string[] = [];
  for (const entry of entries) {
    if (keep.has(entry.name)) continue;
    const target = resolve(dir, entry.name);
    await rm(target, { recursive: true, force: true });
    removed.push(entry.name);
  }

  if (removed.length === 0) {
    console.log(`[clean] nothing to remove in ${dir}`);
  } else {
    console.log(`[clean] removed from ${dir}: ${removed.join(', ')}`);
  }
}

await clearDir(assetsDir, assetsKeep);
await clearDir(pagesDir);
await removeIfExists(lanhuOutDir);
