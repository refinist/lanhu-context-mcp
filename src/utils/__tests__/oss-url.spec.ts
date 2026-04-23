// Unit tests for stripOssProcess.
import { stripOssProcess } from '../oss-url.ts';

describe('stripOssProcess', () => {
  test('returns the original URL when there is no query string', () => {
    expect(stripOssProcess('https://cdn.example.com/image.png')).toBe(
      'https://cdn.example.com/image.png'
    );
  });

  test('removes x-oss-process while keeping other signed query params', () => {
    expect(
      stripOssProcess(
        'https://cdn.example.com/image.png?Expires=1&x-oss-process=image/resize,w_100&Signature=abc'
      )
    ).toBe('https://cdn.example.com/image.png?Expires=1&Signature=abc');
  });

  test('removes the query string entirely when x-oss-process is the only param', () => {
    expect(
      stripOssProcess(
        'https://cdn.example.com/image.png?x-oss-process=image/resize,w_100'
      )
    ).toBe('https://cdn.example.com/image.png');
  });
});
