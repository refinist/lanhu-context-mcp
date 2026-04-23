import axios from 'axios';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createLanhuClients, type LanhuClients } from '../clients.ts';
import {
  downloadImage,
  getDesignMeta,
  getDesignSchemaJson,
  getSketchJson,
  type LanhuDesignRequest
} from '../lanhu-api.ts';
import type { LanhuApiConfig } from '../../config.ts';

const TEST_CONFIG: LanhuApiConfig = {
  lanhuToken: 'lanhu-token',
  ddsToken: 'dds-token',
  httpTimeout: 1234
};

function makeDesignRequest(imageId: string): LanhuDesignRequest {
  return {
    teamId: 'team-1',
    projectId: 'project-1',
    imageId
  };
}

function createAxiosInstanceMock() {
  const transportGet = vi.fn();
  const get = vi.fn(async (...args: unknown[]) =>
    withResponseConfig(await transportGet(...args), args)
  );

  return {
    get,
    transportGet,
    instance: { get } as unknown as LanhuClients['client']
  };
}

function withResponseConfig(response: unknown, args: unknown[]): unknown {
  if (!response || typeof response !== 'object' || 'config' in response) {
    return response;
  }

  return {
    ...response,
    config: {
      method: 'get',
      url: typeof args[0] === 'string' ? args[0] : undefined
    }
  };
}

function setupMocks(): {
  clientGet: ReturnType<typeof vi.fn>;
  ddsGet: ReturnType<typeof vi.fn>;
  clientRequest: ReturnType<typeof vi.fn>;
  ddsRequest: ReturnType<typeof vi.fn>;
} {
  const client = createAxiosInstanceMock();
  const dds = createAxiosInstanceMock();
  vi.spyOn(axios, 'create')
    .mockReturnValueOnce(client.instance)
    .mockReturnValueOnce(dds.instance);
  createLanhuClients(TEST_CONFIG);
  return {
    clientGet: client.transportGet,
    ddsGet: dds.transportGet,
    clientRequest: client.get,
    ddsRequest: dds.get
  };
}

describe('lanhu-api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('createLanhuClients creates clients with headers', async () => {
    const lanhu = createAxiosInstanceMock();
    const dds = createAxiosInstanceMock();
    lanhu.transportGet.mockResolvedValueOnce({
      data: {
        code: '00000',
        result: {
          name: 'Init Home',
          image_url: 'https://example.com/init.png',
          project_name: 'Init Project'
        }
      }
    });

    const createSpy = vi
      .spyOn(axios, 'create')
      .mockReturnValueOnce(lanhu.instance)
      .mockReturnValueOnce(dds.instance);

    createLanhuClients(TEST_CONFIG);

    expect(createSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        baseURL: 'https://lanhuapp.com',
        timeout: 1234,
        maxRedirects: 5,
        headers: expect.objectContaining({
          Cookie: 'lanhu-token',
          Referer: 'https://lanhuapp.com/web/',
          'request-from': 'web',
          'real-path': '/item/project/detailDetach'
        })
      })
    );
    expect(createSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        baseURL: 'https://dds.lanhuapp.com',
        timeout: 1234,
        maxRedirects: 5,
        headers: expect.objectContaining({
          Cookie: 'dds-token',
          Referer: 'https://dds.lanhuapp.com/',
          Authorization: 'Basic dW5kZWZpbmVkOg=='
        })
      })
    );

    await expect(getDesignMeta(makeDesignRequest('img-1'))).resolves.toEqual({
      id: 'img-1',
      name: 'Init Home',
      url: 'https://example.com/init.png',
      projectName: 'Init Project'
    });
  });

  test('getDesignSchemaJson chains multi_info lookup and DDS schema fetch', async () => {
    const { clientGet, ddsGet, clientRequest, ddsRequest } = setupMocks();
    clientGet.mockResolvedValueOnce({
      data: {
        code: '00000',
        result: {
          images: [
            { id: 'other', latest_version: 'v-0' },
            { id: 'img-1', latest_version: 'v-1' }
          ]
        }
      }
    });
    ddsGet
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          data: { data_resource_url: '/schema.json' }
        }
      })
      .mockResolvedValueOnce({
        data: { root: { id: 'schema-1' } }
      });

    await expect(
      getDesignSchemaJson(makeDesignRequest('img-1'))
    ).resolves.toEqual({ root: { id: 'schema-1' } });

    expect(clientRequest).toHaveBeenCalledWith('/api/project/multi_info', {
      params: {
        team_id: 'team-1',
        project_id: 'project-1',
        img_limit: 500,
        detach: 1
      }
    });
    expect(ddsRequest).toHaveBeenNthCalledWith(
      1,
      '/api/dds/image/store_schema_revise',
      { params: { version_id: 'v-1' } }
    );
    expect(ddsRequest).toHaveBeenNthCalledWith(2, '/schema.json');
  });

  test('getDesignSchemaJson only keeps local version lookup guards', async () => {
    const { clientGet } = setupMocks();
    clientGet
      .mockResolvedValueOnce({ data: { code: '10001', msg: 'bad request' } })
      .mockResolvedValueOnce({
        data: { code: '00000', result: { images: [{ id: 'img-1' }] } }
      })
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          result: { images: [{ id: 'other', latest_version: 'v-2' }] }
        }
      });

    await expect(
      getDesignSchemaJson(makeDesignRequest('img-1'))
    ).rejects.toThrow('Design not found: image_id=img-1');
    await expect(
      getDesignSchemaJson(makeDesignRequest('img-1'))
    ).rejects.toThrow('Design has no latest_version');
    await expect(
      getDesignSchemaJson(makeDesignRequest('img-1'))
    ).rejects.toThrow('Design not found: image_id=img-1');
  });

  test('getDesignSchemaJson requires data_resource_url from DDS lookup', async () => {
    const { clientGet, ddsGet } = setupMocks();
    clientGet.mockResolvedValue({
      data: {
        code: '00000',
        result: { images: [{ id: 'img-1', latest_version: 'v-1' }] }
      }
    });
    ddsGet
      .mockResolvedValueOnce({ data: { code: '10001', msg: 'broken' } })
      .mockResolvedValueOnce({ data: { code: '00000', data: {} } });

    await expect(
      getDesignSchemaJson(makeDesignRequest('img-1'))
    ).rejects.toThrow('store_schema_revise did not return data_resource_url');
    await expect(
      getDesignSchemaJson(makeDesignRequest('img-1'))
    ).rejects.toThrow('store_schema_revise did not return data_resource_url');
  });

  test('getDesignMeta picks preview URLs and project names from the payload', async () => {
    const { clientGet } = setupMocks();
    clientGet
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          result: {
            name: 'Home',
            image_url: 'https://example.com/preview.png',
            project_name: 'Project A',
            versions: []
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          result: {
            versions: [{ imageUrl: 'https://example.com/version-preview.png' }],
            projectName: 'Project B'
          }
        }
      });

    await expect(getDesignMeta(makeDesignRequest('img-1'))).resolves.toEqual({
      id: 'img-1',
      name: 'Home',
      url: 'https://example.com/preview.png',
      projectName: 'Project A'
    });
    await expect(getDesignMeta(makeDesignRequest('img-2'))).resolves.toEqual({
      id: 'img-2',
      name: 'img-2',
      url: 'https://example.com/version-preview.png',
      projectName: 'Project B'
    });
  });

  test('getDesignMeta falls back across preview candidates and can return undefined metadata', async () => {
    const { clientGet } = setupMocks();
    clientGet
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          result: { imageUrl: 'https://example.com/root-image-url.png' }
        }
      })
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          result: {
            versions: [{ url: 'https://example.com/version-url.png' }]
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          result: {
            versions: [
              { image_url: 'https://example.com/version-image-url.png' }
            ]
          }
        }
      })
      .mockResolvedValueOnce({
        data: { code: '00000', result: {} }
      });

    await expect(getDesignMeta(makeDesignRequest('img-1'))).resolves.toEqual({
      id: 'img-1',
      name: 'img-1',
      url: 'https://example.com/root-image-url.png',
      projectName: undefined
    });
    await expect(getDesignMeta(makeDesignRequest('img-2'))).resolves.toEqual({
      id: 'img-2',
      name: 'img-2',
      url: 'https://example.com/version-url.png',
      projectName: undefined
    });
    await expect(getDesignMeta(makeDesignRequest('img-3'))).resolves.toEqual({
      id: 'img-3',
      name: 'img-3',
      url: 'https://example.com/version-image-url.png',
      projectName: undefined
    });
    await expect(getDesignMeta(makeDesignRequest('img-4'))).resolves.toEqual({
      id: 'img-4',
      name: 'img-4',
      url: undefined,
      projectName: undefined
    });
  });

  test('getDesignMeta uses the image detail endpoint', async () => {
    const { clientGet, clientRequest } = setupMocks();
    clientGet.mockResolvedValueOnce({
      data: {
        code: '00000',
        result: {
          name: 'Real Detail',
          url: 'https://example.com/detail.png',
          project_name: 'Real Project'
        }
      }
    });

    await expect(getDesignMeta(makeDesignRequest('img-1'))).resolves.toEqual({
      id: 'img-1',
      name: 'Real Detail',
      url: 'https://example.com/detail.png',
      projectName: 'Real Project'
    });
    expect(clientRequest).toHaveBeenNthCalledWith(1, '/api/project/image', {
      params: {
        team_id: 'team-1',
        project_id: 'project-1',
        image_id: 'img-1',
        dds_status: 1
      }
    });
  });

  test('getSketchJson returns the referenced JSON and validates version data', async () => {
    const { clientGet, clientRequest } = setupMocks();
    clientGet
      .mockResolvedValueOnce({
        data: {
          code: '00000',
          result: {
            versions: [{ json_url: 'https://example.com/sketch.json' }]
          }
        }
      })
      .mockResolvedValueOnce({
        data: { artboard: { id: 'artboard-1' } }
      })
      .mockResolvedValueOnce({
        data: { code: '00000', result: { versions: [] } }
      })
      .mockResolvedValueOnce({
        data: { code: '00000', result: { versions: [{}] } }
      });

    await expect(getSketchJson(makeDesignRequest('img-1'))).resolves.toEqual({
      artboard: { id: 'artboard-1' }
    });
    expect(clientRequest).toHaveBeenNthCalledWith(
      2,
      'https://example.com/sketch.json'
    );

    await expect(getSketchJson(makeDesignRequest('img-1'))).rejects.toThrow(
      'No versions found for design'
    );
    await expect(getSketchJson(makeDesignRequest('img-1'))).rejects.toThrow(
      'No json_url in design version'
    );
  });

  test('downloadImage strips x-oss-process and returns a Buffer', async () => {
    const { clientGet, clientRequest } = setupMocks();
    clientGet.mockResolvedValue({
      data: Uint8Array.from([1, 2, 3])
    });

    const buffer = await downloadImage({
      imgUrl: 'https://example.com/preview.png?x-oss-process=image/resize'
    });

    expect(clientRequest).toHaveBeenCalledWith(
      'https://example.com/preview.png',
      {
        responseType: 'arraybuffer'
      }
    );
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect([...buffer]).toEqual([1, 2, 3]);
  });

  test('downloadImage preserves OSS signed query params', async () => {
    const { clientGet, clientRequest } = setupMocks();
    clientGet.mockResolvedValue({ data: Uint8Array.from([9]) });

    await downloadImage({
      imgUrl:
        'https://example.com/a.png?OSSAccessKeyId=k&Expires=1&Signature=s&x-oss-process=image/resize'
    });

    expect(clientRequest).toHaveBeenCalledWith(
      'https://example.com/a.png?OSSAccessKeyId=k&Expires=1&Signature=s',
      { responseType: 'arraybuffer' }
    );
  });
});
