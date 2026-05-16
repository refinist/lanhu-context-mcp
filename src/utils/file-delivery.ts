import { mkdir, writeFile } from 'fs/promises';
import { resolve as resolvePath } from 'path';
import { pathToFileURL } from 'url';

export interface FileInfo {
  path: string;
  uri: string;
  mimeType: string;
  sizeBytes: number;
}

export interface DeliveryFiles {
  context: FileInfo;
  preview?: FileInfo;
}

export interface FileDeliveryInput {
  outDir: string;
  imageId: string;
  designName: string;
  /**
   * Full markdown body for context.md — same content inline mode would emit,
   * already joined by the caller.
   */
  contextBody: string;
  previewBuffer?: Buffer;
}

export interface FileDeliveryResult {
  dir: string;
  files: DeliveryFiles;
}

const IMAGE_ID_PREFIX_LENGTH = 8;

function stripControlChars(s: string): string {
  // ASCII control range (0x00–0x1f) plus DEL (0x7f).
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Build a directory name from a Lanhu design name + imageId for files mode.
 *
 * Keeps the directory name close to the original design name: only normalizes
 * whitespace into a single dash and guards against path traversal. Inline
 * mode does no sanitization (the name is rendered as text only), so the two
 * modes are independent — touch this function freely without affecting inline.
 *
 * The imageId is truncated to the first 8 chars (UUID prefix) — enough to
 * disambiguate same-named designs within a project, while keeping the
 * directory name short and readable.
 */
export function sanitizeDesignDirName(
  designName: string,
  imageId: string
): string {
  const cleaned = stripControlChars(designName)
    .replace(/[\\/]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  const safeName = cleaned || 'design';
  const safeImageId = imageId
    .replace(/[^A-Za-z0-9_-]/g, '')
    .slice(0, IMAGE_ID_PREFIX_LENGTH);
  return safeImageId ? `${safeName}-${safeImageId}` : safeName;
}

export async function writeDesignFiles(
  input: FileDeliveryInput
): Promise<FileDeliveryResult> {
  const dirName = sanitizeDesignDirName(input.designName, input.imageId);
  const designDir = resolvePath(input.outDir, dirName);

  await mkdir(designDir, { recursive: true });

  const contextPath = resolvePath(designDir, 'context.md');
  const context = await writeText(
    contextPath,
    input.contextBody,
    'text/markdown'
  );

  let preview: FileInfo | undefined;
  if (input.previewBuffer) {
    const previewPath = resolvePath(designDir, 'preview.png');
    preview = await writeBinary(previewPath, input.previewBuffer, 'image/png');
  }

  return {
    dir: designDir,
    files: { context, preview }
  };
}

async function writeText(
  filePath: string,
  body: string,
  mimeType: string
): Promise<FileInfo> {
  await writeFile(filePath, body, 'utf8');
  return {
    path: filePath,
    uri: pathToFileURL(filePath).href,
    mimeType,
    sizeBytes: Buffer.byteLength(body, 'utf8')
  };
}

async function writeBinary(
  filePath: string,
  body: Buffer,
  mimeType: string
): Promise<FileInfo> {
  await writeFile(filePath, body);
  return {
    path: filePath,
    uri: pathToFileURL(filePath).href,
    mimeType,
    sizeBytes: body.byteLength
  };
}
