// Unit tests for extractDesignTokens.
import { extractDesignTokens } from '../design-tokens.ts';

// Helpers
function makeLayer(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return { name: 'Layer', type: 'rect', ...overrides };
}

function makeSketch(layers: Record<string, unknown>[]) {
  return { artboard: { layers } };
}

// No high-risk elements
describe('extractDesignTokens — no high-risk elements', () => {
  test('empty artboard returns an empty string', () => {
    const result = extractDesignTokens(makeSketch([]));
    expect(result).toBe('');
  });

  test('plain opaque solid fill does not trigger a token', () => {
    const layer = makeLayer({
      fills: [
        { isEnabled: true, fillType: 0, color: { value: '#fff', alpha: 1 } }
      ]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toBe('');
  });

  test('nodes with isVisible: false are skipped', () => {
    const layer = makeLayer({
      isVisible: false,
      shadows: [{ isEnabled: true, color: { value: '#000' } }]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toBe('');
  });

  test('noise types, tiny nodes, and opacity=0 nodes are all ignored', () => {
    const result = extractDesignTokens(
      makeSketch([
        makeLayer({
          type: 'color',
          ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
          fills: [{ fillType: 1, gradient: { colorStops: [] } }]
        }),
        makeLayer({
          ddsOriginFrame: { x: 0, y: 0, width: 4, height: 4 },
          borders: [{ isEnabled: true, color: { value: '#f00' } }]
        }),
        makeLayer({
          ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
          opacity: 0,
          shadows: [{ isEnabled: true, color: { value: '#000' } }]
        })
      ])
    );
    expect(result).toBe('');
  });

  test('opacity < 100 with only transparent fills does not trigger a token', () => {
    const layer = makeLayer({
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      opacity: 50,
      fills: [
        {
          isEnabled: true,
          fillType: 0,
          color: { value: 'rgba(0, 0, 0, 0)', alpha: 0 }
        }
      ]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toBe('');
  });

  test('opacity < 100 with a plain solid fill emits a solid fill token', () => {
    const layer = makeLayer({
      name: 'SolidOpacity',
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      opacity: 50,
      fills: [
        {
          isEnabled: true,
          fillType: 0,
          color: { value: '#fff', alpha: 1 }
        }
      ]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('fill: solid(#fff)');
    expect(result).toContain('opacity: 50%');
  });

  test('unsupported fillType is ignored but opacity can still trigger a token', () => {
    const layer = makeLayer({
      name: 'UnsupportedFill',
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      opacity: 50,
      fills: [{ isEnabled: true, fillType: 2 }]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('UnsupportedFill');
    expect(result).toContain('opacity: 50%');
    expect(result).not.toContain('fill:');
  });
});

// Gradient fills
describe('extractDesignTokens — gradient fills', () => {
  test('fillType=1 (gradient) triggers a token', () => {
    const layer = makeLayer({
      name: 'GradBox',
      ddsOriginFrame: { x: 0, y: 0, width: 100, height: 50 },
      fills: [
        {
          isEnabled: true,
          fillType: 1,
          gradient: {
            from: { x: 0, y: 0 },
            to: { x: 0, y: 1 },
            colorStops: [
              { color: { value: '#fff' }, position: 0 },
              { color: { value: '#000' }, position: 1 }
            ]
          }
        }
      ]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('linear-gradient');
    expect(result).toContain('GradBox');
  });

  test('gradient token includes angle information', () => {
    const layer = makeLayer({
      ddsOriginFrame: { x: 0, y: 0, width: 10, height: 10 },
      fills: [
        {
          isEnabled: true,
          fillType: 1,
          gradient: {
            from: { x: 0.5, y: 0 },
            to: { x: 0.5, y: 1 },
            colorStops: []
          }
        }
      ]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toMatch(/\d+deg/);
  });

  test('gradient fallbacks handle missing gradient fields and stop data', () => {
    const layer = makeLayer({
      name: 'GradientFallbacks',
      ddsOriginFrame: { x: 0, y: 0, width: 60, height: 30 },
      fills: [
        { isEnabled: true, fillType: 1 },
        { isEnabled: true, fillType: 1, gradient: { colorStops: [{}] } }
      ]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('GradientFallbacks');
    expect(result).toContain('fill: linear-gradient');
    expect(result).toContain('unknown 0%');
  });
});

// Borders
describe('extractDesignTokens — borders', () => {
  test('valid border triggers a token', () => {
    const layer = makeLayer({
      name: 'BorderBox',
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      borders: [{ isEnabled: true, color: { value: '#f00' }, thickness: 2 }]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('border:');
    expect(result).toContain('2px');
  });

  test('borders with isEnabled: false do not trigger a token', () => {
    const layer = makeLayer({
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      borders: [{ isEnabled: false, color: { value: '#f00' }, thickness: 2 }]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toBe('');
  });

  test('border position and missing color are formatted correctly', () => {
    const layer = makeLayer({
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      borders: [{ isEnabled: true, thickness: 1.2345, position: '内边框' }]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('1.235px inside unknown');
  });
});

// Shadows
describe('extractDesignTokens — shadows', () => {
  test('valid shadow triggers a token', () => {
    const layer = makeLayer({
      name: 'ShadowBox',
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      shadows: [
        {
          isEnabled: true,
          color: { value: 'rgba(0,0,0,0.3)' },
          offsetX: 2,
          offsetY: 4,
          blurRadius: 8,
          spread: 0
        }
      ]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('shadow:');
    expect(result).toContain('2px');
    expect(result).toContain('4px');
  });

  test('disabled shadows do not trigger a token', () => {
    const layer = makeLayer({
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      shadows: [{ isEnabled: false, color: { value: '#000' } }]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toBe('');
  });

  test('fallback token formatting handles missing fill and shadow fields', () => {
    const result = extractDesignTokens(
      makeSketch([
        makeLayer({
          name: 'FallbackBox',
          type: undefined,
          ddsType: 'shape',
          ddsOriginFrame: { x: 0, y: 0, width: 60, height: 30 },
          radius: [6, 6, 6, 6],
          fills: [
            { isEnabled: false, fillType: 1, gradient: { colorStops: [] } },
            { isEnabled: true, color: {} }
          ],
          borders: [{ isEnabled: true, color: { value: '#111' } }],
          shadows: [{ isEnabled: true }]
        })
      ])
    );
    expect(result).toContain('[shape] "FallbackBox"');
    expect(result).toContain('radius: 6');
    expect(result).toContain('fill: solid(unknown)');
    expect(result).toContain('shadow: unknown 0px 0px 0px 0px');
  });
});

// Non-uniform radius
describe('extractDesignTokens — non-uniform radius', () => {
  test('different per-corner radius triggers a token', () => {
    const layer = makeLayer({
      name: 'AsymRadius',
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      radius: [4, 8, 4, 0]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('radius:');
    expect(result).toContain('[4,8,4,0]');
  });

  test('uniform radius does not trigger a token', () => {
    const layer = makeLayer({
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      radius: [8, 8, 8, 8]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toBe('');
  });
});

// Opacity
describe('extractDesignTokens — opacity', () => {
  test('element with opacity < 100 and content triggers a token', () => {
    const layer = makeLayer({
      name: 'OpacityBox',
      ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
      opacity: 50,
      borders: [{ isEnabled: true, color: { value: '#000' }, thickness: 1 }]
    });
    const result = extractDesignTokens(makeSketch([layer]));
    expect(result).toContain('opacity: 50%');
  });

  test('scalar radius, nested path, and info fallback are all extracted', () => {
    const result = extractDesignTokens({
      info: [
        {
          name: 'Parent',
          layers: [
            {
              name: 'Child',
              type: 'rect',
              layerOriginFrame: { x: 1, y: 2, width: 60, height: 30 },
              radius: 6,
              borders: [{ isEnabled: true, color: { value: '#111' } }]
            }
          ],
          nested: {
            name: 'Nested',
            type: 'rect',
            ddsOriginFrame: { x: 0, y: 0, width: 60, height: 30 },
            fills: [
              { isEnabled: true, fillType: 1, gradient: { colorStops: [] } }
            ]
          }
        }
      ]
    });

    expect(result).toContain('path: Parent/Child');
    expect(result).toContain('radius: 6');
    expect(result).toContain('[rect] "Nested"');
    expect(result.match(/\[rect\] "Child"/g)).toHaveLength(1);
  });

  test('transparent solid fallbacks ignore disabled fills and alpha=0 from a', () => {
    const result = extractDesignTokens(
      makeSketch([
        makeLayer({
          ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
          opacity: 50,
          fills: [
            {
              isEnabled: false,
              fillType: 0,
              color: { value: '#fff', alpha: 1 }
            },
            { isEnabled: true, color: { a: 0 } }
          ]
        })
      ])
    );
    expect(result).toBe('');
  });

  test('missing alpha defaults to opaque and still triggers an opacity token', () => {
    const result = extractDesignTokens(
      makeSketch([
        makeLayer({
          name: 'OpaqueFallback',
          ddsOriginFrame: { x: 0, y: 0, width: 50, height: 50 },
          opacity: 50,
          fills: [{ isEnabled: true, color: {} }]
        })
      ])
    );
    expect(result).toContain('OpaqueFallback');
    expect(result).toContain('fill: solid(unknown)');
    expect(result).toContain('opacity: 50%');
  });

  test('info fallback walks mixed arrays and unknown node types', () => {
    const result = extractDesignTokens({
      info: [
        {
          group: [
            null,
            1,
            'skip',
            {
              name: 'ArrayChild',
              type: 'rect',
              ddsOriginFrame: { x: 0, y: 0, width: 60, height: 30 },
              fills: [
                { isEnabled: true, fillType: 1, gradient: { colorStops: [] } }
              ],
              borders: [{ isEnabled: false, color: { value: '#111' } }],
              shadows: [{ isEnabled: false, color: { value: '#222' } }]
            },
            {
              name: 'UnknownChild',
              type: undefined,
              ddsOriginFrame: { x: 0, y: 0, width: 60, height: 30 },
              borders: [{ isEnabled: true, color: { value: '#333' } }]
            }
          ]
        }
      ]
    });

    expect(result).toContain('[rect] "ArrayChild"');
    expect(result).toContain('[unknown] "UnknownChild"');
    expect(result).not.toContain('#111');
    expect(result).not.toContain('#222');
  });

  test('empty payloads and null artboard layers are ignored', () => {
    expect(extractDesignTokens({})).toBe('');
    expect(extractDesignTokens({ artboard: { layers: [null] } })).toBe('');
  });
});
