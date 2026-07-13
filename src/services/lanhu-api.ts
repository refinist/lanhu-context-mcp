import {
  pickLatestVersionId,
  pickPreviewUrl,
  pickProjectName
} from '../utils/lanhu-response.ts';
import { stripOssProcess } from '../utils/oss-url.ts';
import { client, ddsClient } from './clients.ts';
import type {
  DesignMeta,
  DownloadImageRequest,
  LanhuApiResponse,
  LanhuDesignRequest,
  SchemaNode
} from '../types/lanhu.ts';

export type {
  DesignMeta,
  DownloadImageRequest,
  LanhuDesignRequest
} from '../types/lanhu.ts';

// Lanhu reports business failures (invalid token, missing image, no access)
// as HTTP 200 with a null payload; surface its code/msg instead of letting
// the null crash downstream destructuring.
function unwrapEnvelope<T>(
  body: LanhuApiResponse<T>,
  field: 'result' | 'data',
  endpoint: string
): T {
  const value = body[field];
  if (value != null) return value;

  const detail = [body.code, body.msg]
    .filter(v => v !== undefined && v !== null && v !== '')
    .join(' ');
  throw new Error(
    `Lanhu API ${endpoint} returned empty ${field}${
      detail ? ` (${detail})` : ''
    }. Verify the Lanhu URL is complete (tid/pid/image_id must be full ids, not truncated) and LANHU_TOKEN is valid.`
  );
}

// Fetch raw design detail payload for a single image.
async function getDesignResult({
  teamId,
  projectId,
  imageId
}: LanhuDesignRequest): Promise<Record<string, unknown>> {
  const { data } = await client.get<LanhuApiResponse<Record<string, unknown>>>(
    '/api/project/image',
    {
      params: {
        team_id: teamId,
        project_id: projectId,
        image_id: imageId,
        dds_status: 1
      }
    }
  );

  return unwrapEnvelope(data, 'result', '/api/project/image');
}

// Resolve the latest version id for a design from the project listing.
async function getVersionIdByImageId({
  teamId,
  projectId,
  imageId
}: LanhuDesignRequest): Promise<string> {
  const { data } = await client.get<LanhuApiResponse<Record<string, unknown>>>(
    '/api/project/multi_info',
    {
      params: {
        team_id: teamId,
        project_id: projectId,
        img_limit: 500,
        detach: 1
      }
    }
  );

  return pickLatestVersionId(
    unwrapEnvelope(data, 'result', '/api/project/multi_info'),
    imageId
  );
}

// Load the DDS schema document behind a version id.
async function fetchDdsSchema({
  versionId
}: {
  versionId: string;
}): Promise<SchemaNode> {
  const { data: body } = await ddsClient.get<
    LanhuApiResponse<{ data_resource_url?: string }>
  >('/api/dds/image/store_schema_revise', {
    params: { version_id: versionId }
  });

  const schemaUrl = unwrapEnvelope(
    body,
    'data',
    '/api/dds/image/store_schema_revise'
  ).data_resource_url;
  if (!schemaUrl) {
    throw new Error('store_schema_revise did not return data_resource_url');
  }

  const { data: schema } = await ddsClient.get<SchemaNode>(schemaUrl);
  return schema;
}

// Return the normalized DDS schema JSON for a design.
export async function getDesignSchemaJson(
  request: LanhuDesignRequest
): Promise<SchemaNode> {
  const versionId = await getVersionIdByImageId(request);
  return await fetchDdsSchema({ versionId });
}

// Return display-ready design metadata for a single image.
export async function getDesignMeta(
  request: LanhuDesignRequest
): Promise<DesignMeta> {
  const { name, ...result } = await getDesignResult(request);
  return {
    id: request.imageId,
    name: String(name ?? request.imageId),
    url: pickPreviewUrl(result),
    projectName: pickProjectName(result)
  };
}

// Fetch the sketch-style JSON payload for token extraction.
export async function getSketchJson(
  request: LanhuDesignRequest
): Promise<Record<string, unknown>> {
  const { versions = [] } = (await getDesignResult(request)) as {
    versions?: Array<{ json_url?: string }>;
  };
  if (versions.length === 0) {
    throw new Error('No versions found for design');
  }

  const jsonUrl = versions[0]?.json_url;
  if (!jsonUrl) {
    throw new Error('No json_url in design version');
  }

  const { data } = await client.get<Record<string, unknown>>(jsonUrl);
  return data;
}

// Download a preview image as a Buffer.
export async function downloadImage({
  imgUrl
}: DownloadImageRequest): Promise<Buffer> {
  const cleanUrl = stripOssProcess(imgUrl);
  const { data } = await client.get(cleanUrl, {
    responseType: 'arraybuffer'
  });
  return Buffer.from(data);
}
