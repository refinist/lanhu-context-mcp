export type DownloadAsset = {
  filename: string;
  href: string;
  version: string;
};

declare const __LATEST_LANHU_HELPER_DOWNLOAD__: DownloadAsset | null;

export const latestLanhuHelperDownload = __LATEST_LANHU_HELPER_DOWNLOAD__;
