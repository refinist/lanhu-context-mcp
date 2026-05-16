// Unit tests for resolveOutDir two-tier fallback (config default > cwd).
import { resolve as resolvePath } from 'path';
import { DEFAULT_OUT_DIR_NAME, resolveOutDir } from '../out-dir.ts';

describe('resolveOutDir', () => {
  test('uses config default when provided (absolute path)', () => {
    const r = resolveOutDir('/var/lanhu');
    expect(r.source).toBe('config');
    expect(r.path).toBe('/var/lanhu');
  });

  test('resolves config default to absolute when relative', () => {
    const r = resolveOutDir('./out');
    expect(r.source).toBe('config');
    expect(r.path).toBe(resolvePath(process.cwd(), 'out'));
  });

  test('treats blank/whitespace config default as missing', () => {
    const r = resolveOutDir('   ');
    expect(r.source).toBe('cwd');
  });

  test('falls back to cwd when nothing set', () => {
    const r = resolveOutDir(undefined);
    expect(r.source).toBe('cwd');
    expect(r.path).toBe(resolvePath(process.cwd(), DEFAULT_OUT_DIR_NAME));
  });
});
