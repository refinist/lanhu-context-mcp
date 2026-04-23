import axios, { type AxiosInstance } from 'axios';
import { BASE_URL, DDS_BASE_URL } from '../config.ts';
import type { LanhuApiConfig } from '../types/config.ts';

export type { LanhuClients } from '../types/lanhu.ts';

export let client!: AxiosInstance;
export let ddsClient!: AxiosInstance;

export function createLanhuClients(config: LanhuApiConfig): void {
  client = axios.create({
    baseURL: BASE_URL,
    timeout: config.httpTimeout,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Referer: 'https://lanhuapp.com/web/',
      Accept: 'application/json, text/plain, */*',
      Cookie: config.lanhuToken,
      'sec-ch-ua':
        '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'request-from': 'web',
      'real-path': '/item/project/detailDetach'
    },
    maxRedirects: 5
  });

  ddsClient = axios.create({
    baseURL: DDS_BASE_URL,
    timeout: config.httpTimeout,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://dds.lanhuapp.com/',
      Cookie: config.ddsToken,
      Authorization: 'Basic dW5kZWZpbmVkOg=='
    },
    maxRedirects: 5
  });
}
