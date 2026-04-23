// Unit tests for parseLanhuUrl.
import { parseLanhuUrl } from '../url-parser.ts';

describe('parseLanhuUrl — full URL', () => {
  const FULL_URL =
    'https://lanhuapp.com/web/#/item/project/detailDetach?tid=team-1&pid=proj-1&image_id=img-1&versionId=v-1';

  test('parses tid / pid / image_id / versionId', () => {
    const r = parseLanhuUrl(FULL_URL);
    expect(r.teamId).toBe('team-1');
    expect(r.projectId).toBe('proj-1');
    expect(r.docId).toBe('img-1');
    expect(r.versionId).toBe('v-1');
  });

  test('docId accepts the docId parameter name', () => {
    const url =
      'https://lanhuapp.com/web/#/item/project/detailDetach?tid=t&pid=p&docId=d123';
    const r = parseLanhuUrl(url);
    expect(r.docId).toBe('d123');
  });

  test('projectId accepts the project_id parameter name', () => {
    const url =
      'https://lanhuapp.com/web/#/item/project/detailDetach?tid=t&project_id=p123&image_id=i123';
    const r = parseLanhuUrl(url);
    expect(r.projectId).toBe('p123');
    expect(r.docId).toBe('i123');
  });

  test('parses params from fragment without a leading ?', () => {
    const r = parseLanhuUrl(
      'https://lanhuapp.com/web/#tid=t-fragment&pid=p-fragment&image_id=i-fragment'
    );
    expect(r).toEqual({
      teamId: 't-fragment',
      projectId: 'p-fragment',
      docId: 'i-fragment',
      versionId: undefined
    });
  });

  test('throws when URL has no # fragment', () => {
    expect(() =>
      parseLanhuUrl('https://lanhuapp.com/web/item/project')
    ).toThrow('Invalid Lanhu URL');
  });
});

describe('parseLanhuUrl — missing required params', () => {
  test('throws when tid is missing', () => {
    expect(() =>
      parseLanhuUrl('https://lanhuapp.com/web/#/item?pid=proj-1&image_id=img-1')
    ).toThrow('tid');
  });

  test('throws when pid is missing', () => {
    expect(() =>
      parseLanhuUrl('https://lanhuapp.com/web/#/item?tid=team-1&image_id=img-1')
    ).toThrow('pid');
  });

  test('throws when image_id and docId are both missing', () => {
    expect(() =>
      parseLanhuUrl('https://lanhuapp.com/web/#/item?tid=team-1&pid=proj-1')
    ).toThrow('image_id');
  });
});

describe('parseLanhuUrl — short format', () => {
  test('accepts ?tid=...&pid=... style', () => {
    const r = parseLanhuUrl('?tid=t1&pid=p1&image_id=i1');
    expect(r.teamId).toBe('t1');
    expect(r.projectId).toBe('p1');
    expect(r.docId).toBe('i1');
  });

  test('accepts a param string without a leading ?', () => {
    const r = parseLanhuUrl('tid=t2&pid=p2&image_id=i2');
    expect(r.teamId).toBe('t2');
    expect(r.projectId).toBe('p2');
    expect(r.docId).toBe('i2');
  });

  test('accepts project_id as an alias for pid', () => {
    const r = parseLanhuUrl('tid=t2&project_id=p2&image_id=i2');
    expect(r.teamId).toBe('t2');
    expect(r.projectId).toBe('p2');
    expect(r.docId).toBe('i2');
  });

  test('ignores fragments without an = sign', () => {
    const r = parseLanhuUrl('?tid=t3&flag&pid=p3&image_id=i3');
    expect(r.teamId).toBe('t3');
    expect(r.projectId).toBe('p3');
    expect(r.docId).toBe('i3');
  });
});
