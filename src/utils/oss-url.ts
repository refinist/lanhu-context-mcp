// Remove the x-oss-process parameter while preserving other query params,
// such as Expires, Signature, and OSSAccessKeyId in signed URLs.
export function stripOssProcess(imgUrl: string): string {
  const qIdx = imgUrl.indexOf('?');
  if (qIdx === -1) return imgUrl;
  const base = imgUrl.slice(0, qIdx);
  const query = imgUrl.slice(qIdx + 1);
  const kept = query
    .split('&')
    .filter(part => part && !/^x-oss-process=/i.test(part));
  return kept.length > 0 ? `${base}?${kept.join('&')}` : base;
}
