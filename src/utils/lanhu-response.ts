// Pick the latest_version for the target image from a multi_info response.
export function pickLatestVersionId(
  result: Record<string, unknown>,
  imageId: string
): string {
  const images = (result.images || []) as Record<string, unknown>[];
  for (const img of images) {
    if (img.id === imageId) {
      const vid = img.latest_version;
      if (vid) return String(vid);
      throw new Error('Design has no latest_version');
    }
  }
  throw new Error(`Design not found: image_id=${imageId}`);
}

// Pick the first non-empty preview URL from the design result.
// Fallback order: top-level fields, then fields from versions[0].
export function pickPreviewUrl(
  result: Record<string, unknown>
): string | undefined {
  const versions = (result.versions || []) as Record<string, unknown>[];
  const latestVersion = versions[0] || {};
  const candidates = [
    result.url,
    result.image_url,
    result.imageUrl,
    latestVersion.url,
    latestVersion.image_url,
    latestVersion.imageUrl
  ];
  return candidates.find(v => typeof v === 'string' && v.length > 0) as
    | string
    | undefined;
}

// Pick the project name from snake_case or camelCase fields.
export function pickProjectName(
  result: Record<string, unknown>
): string | undefined {
  if (typeof result.project_name === 'string') return result.project_name;
  if (typeof result.projectName === 'string') return result.projectName;
  return undefined;
}
