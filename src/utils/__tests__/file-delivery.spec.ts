// Unit tests for file delivery utilities.
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { resolve as resolvePath } from 'path';
import { afterEach, beforeEach } from 'vitest';
import { sanitizeDesignDirName, writeDesignFiles } from '../file-delivery.ts';

describe('sanitizeDesignDirName', () => {
  test('keeps simple ASCII names and appends 8-char image id prefix', () => {
    expect(sanitizeDesignDirName('Home', 'img-1234')).toBe('Home-img-1234');
  });

  test('replaces slashes and whitespace runs with single dash', () => {
    expect(sanitizeDesignDirName('foo / bar baz', 'i1')).toBe('foo-bar-baz-i1');
  });

  test('handles lanhu-style names with spaces and inline dashes', () => {
    // Real-world: "Home screen - Expenses" should collapse to one separator.
    expect(
      sanitizeDesignDirName(
        'Home screen - Expenses',
        '1bc19428-cd08-4bbf-96a3-43074e45a391'
      )
    ).toBe('Home-screen-Expenses-1bc19428');
  });

  test('keeps Windows-reserved characters as-is (rare in Lanhu names)', () => {
    // Files mode no longer strips <>:"|?* — trust the upstream name and only
    // normalize whitespace + path separators.
    expect(sanitizeDesignDirName('Home: Page', 'id12345678')).toBe(
      'Home:-Page-id123456'
    );
  });

  test('falls back to "design" when name becomes empty after normalization', () => {
    expect(sanitizeDesignDirName('   //  ', 'img1')).toBe('design-img1');
  });

  test('keeps unicode (chinese) characters intact', () => {
    expect(sanitizeDesignDirName('首页设计', 'img-abc')).toBe(
      '首页设计-img-abc'
    );
  });

  test('truncates image id to 8 chars even when the source is longer', () => {
    expect(
      sanitizeDesignDirName('X', '1bc19428-cd08-4bbf-96a3-43074e45a391')
    ).toBe('X-1bc19428');
  });

  test('keeps long design names without truncation', () => {
    const long = 'a'.repeat(200);
    expect(sanitizeDesignDirName(long, 'img12345')).toBe(`${long}-img12345`);
  });

  test('sanitizes image id by stripping disallowed chars (prevents path traversal)', () => {
    // 'img/../etc' → strip '/' and '.' → 'imgetc' → 8-char slice → 'imgetc'
    expect(sanitizeDesignDirName('Home', 'img/../etc')).toBe('Home-imgetc');
  });

  test('strips ASCII control characters (NUL, ESC, DEL) from the design name', () => {
    // \x00 / \x1b / \x7f are all stripped; surrounding text survives.
    expect(sanitizeDesignDirName('Ho\x00me\x1bScreen\x7f', 'imgABC123')).toBe(
      'HomeScreen-imgABC12'
    );
  });

  test('returns just the design name when image id is empty after sanitization', () => {
    // Only disallowed chars → safeImageId becomes '' → no trailing "-<id>".
    expect(sanitizeDesignDirName('Home', '!!!@@@')).toBe('Home');
  });
});

describe('writeDesignFiles', () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(resolvePath(tmpdir(), 'lanhu-test-'));
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true });
  });

  test('writes context.md verbatim and returns FileInfo', async () => {
    const body = 'HTML+CSS Code:\n<div>hello</div>\n\nguide body';
    const result = await writeDesignFiles({
      outDir: tmpRoot,
      imageId: 'img1',
      designName: 'Home',
      contextBody: body
    });

    expect(result.dir).toBe(resolvePath(tmpRoot, 'Home-img1'));
    expect(result.files.context.path).toContain('context.md');
    expect(result.files.context.mimeType).toBe('text/markdown');
    expect(result.files.preview).toBeUndefined();

    const written = await readFile(result.files.context.path, 'utf8');
    expect(written).toBe(body);
  });

  test('writes preview.png when buffer provided', async () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const result = await writeDesignFiles({
      outDir: tmpRoot,
      imageId: 'img2',
      designName: 'WithPreview',
      contextBody: 'body',
      previewBuffer: buf
    });
    expect(result.files.preview).toBeDefined();
    expect(result.files.preview!.mimeType).toBe('image/png');
    const back = await readFile(result.files.preview!.path);
    expect(back.equals(buf)).toBe(true);
  });

  test('omits preview when no buffer provided', async () => {
    const result = await writeDesignFiles({
      outDir: tmpRoot,
      imageId: 'img3',
      designName: 'NoPreview',
      contextBody: 'body'
    });
    expect(result.files.preview).toBeUndefined();
  });

  test('file URIs are file:// URLs of the same path', async () => {
    const result = await writeDesignFiles({
      outDir: tmpRoot,
      imageId: 'img4',
      designName: 'UriCheck',
      contextBody: 'body'
    });
    expect(result.files.context.uri.startsWith('file://')).toBe(true);
    expect(result.files.context.uri).toContain('context.md');
  });

  test('does not write index.md or metadata.json', async () => {
    const result = await writeDesignFiles({
      outDir: tmpRoot,
      imageId: 'img5',
      designName: 'NoIndex',
      contextBody: 'body'
    });
    await expect(
      readFile(resolvePath(result.dir, 'index.md'), 'utf8')
    ).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      readFile(resolvePath(result.dir, 'metadata.json'), 'utf8')
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
