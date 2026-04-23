import { describe, expect, test } from 'vitest';
import {
  camelToKebab,
  cleanStyles,
  formatCssValue,
  getFlexClasses,
  mergeMargin,
  mergePadding,
  roundNum
} from '../css-helpers.ts';
import type { SchemaNode } from '../../types/lanhu.ts';

function makeNode(style: Record<string, unknown> = {}): SchemaNode {
  return {
    type: 'div',
    props: {
      className: 'demo',
      style
    },
    children: []
  };
}

describe('css helpers', () => {
  test('roundNum and camelToKebab format values predictably', () => {
    expect(roundNum(1.23456)).toBe(1.235);
    expect(camelToKebab('backgroundColor')).toBe('background-color');
  });

  test('formatCssValue handles numbers, strings, rgba, and scaled long decimals', () => {
    expect(formatCssValue('width', null)).toBe('');
    expect(formatCssValue('width', 0)).toBe('0');
    expect(formatCssValue('width', 10, 2)).toBe('20px');
    expect(formatCssValue('opacity', 0.55555)).toBe('0.556');
    expect(formatCssValue('display', false)).toBe('false');
    expect(formatCssValue('color', 'rgba(1, 2, 3, 1)')).toBe(
      'rgba(1, 2, 3, 1)'
    );
    expect(formatCssValue('width', '0')).toBe('0');
    expect(formatCssValue('width', '12', 2)).toBe('24px');
    expect(formatCssValue('zIndex', '12', 2)).toBe('12');
    expect(formatCssValue('color', 'red')).toBe('red');
    expect(formatCssValue('color', 'rgba(1, 2, 3, 0.3000000119)')).toBe(
      'rgba(1, 2, 3, 0.3000000119)'
    );
    expect(formatCssValue('left', '-0.30000001192092896px', 2)).toBe('-0.6px');
  });

  test('mergePadding collapses four sides into shorthand', () => {
    const stylesA: Record<string, unknown> = {
      paddingTop: 8,
      paddingRight: 8,
      paddingBottom: 8,
      paddingLeft: 8
    };
    mergePadding(stylesA);
    expect(stylesA).toEqual({ padding: '8px' });

    const stylesB: Record<string, unknown> = {
      paddingTop: 8,
      paddingRight: 12,
      paddingBottom: 8,
      paddingLeft: 12
    };
    mergePadding(stylesB);
    expect(stylesB).toEqual({ padding: '8px 12px' });

    const stylesC: Record<string, unknown> = {
      paddingTop: 2,
      paddingRight: 4,
      paddingBottom: 6,
      paddingLeft: 8
    };
    mergePadding(stylesC, 2);
    expect(stylesC).toEqual({ padding: '4px 8px 12px 16px' });
  });

  test('mergePadding keeps partial values unchanged and handles explicit zero sides', () => {
    const partialStyles: Record<string, unknown> = {
      paddingTop: 8,
      paddingRight: 12
    };
    mergePadding(partialStyles);
    expect(partialStyles).toEqual({
      paddingTop: 8,
      paddingRight: 12
    });

    const zeroStyles: Record<string, unknown> = {
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0
    };
    mergePadding(zeroStyles);
    expect(zeroStyles).toEqual({ padding: '0px' });
  });

  test('mergeMargin removes zero-only margins and builds shorthand for non-zero values', () => {
    const stylesA: Record<string, unknown> = {
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0
    };
    mergeMargin(stylesA);
    expect(stylesA).toEqual({});

    const stylesB: Record<string, unknown> = {
      marginTop: 8,
      marginRight: 12,
      marginBottom: 8,
      marginLeft: 12
    };
    mergeMargin(stylesB);
    expect(stylesB).toEqual({ margin: '8px 12px' });

    const stylesC: Record<string, unknown> = {
      marginTop: 1,
      marginRight: 2,
      marginBottom: 3,
      marginLeft: 4
    };
    mergeMargin(stylesC, 2);
    expect(stylesC).toEqual({ margin: '2px 4px 6px 8px' });
  });

  test('mergeMargin keeps unrelated objects unchanged and emits a single-value shorthand', () => {
    const untouchedStyles: Record<string, unknown> = { width: 100 };
    mergeMargin(untouchedStyles);
    expect(untouchedStyles).toEqual({ width: 100 });

    const uniformStyles: Record<string, unknown> = {
      marginTop: 6,
      marginRight: 6,
      marginBottom: 6,
      marginLeft: 6
    };
    mergeMargin(uniformStyles);
    expect(uniformStyles).toEqual({ margin: '6px' });
  });

  test('getFlexClasses infers layout classes from style and className hints', () => {
    expect(getFlexClasses(makeNode())).toEqual([]);

    expect(
      getFlexClasses(
        makeNode({
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center'
        })
      )
    ).toEqual(['flex-col', 'justify-between', 'align-center']);

    const classNameFallbackNode: SchemaNode = {
      type: 'div',
      props: {
        className: 'demo flex-row',
        style: { display: 'flex' }
      },
      alignJustify: {
        justifyContent: 'center',
        alignItems: 'flex-end'
      },
      children: []
    };
    expect(getFlexClasses(classNameFallbackNode)).toEqual([
      'flex-row',
      'justify-center',
      'align-end'
    ]);

    expect(
      getFlexClasses(
        makeNode({
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'stretch',
          alignItems: 'baseline'
        })
      )
    ).toEqual(['flex-row']);
  });

  test('getFlexClasses handles missing nodes, missing props, and unrecognized flex directions', () => {
    expect(getFlexClasses(undefined as unknown as SchemaNode)).toEqual([]);

    const topLevelStyleNode: SchemaNode = {
      type: 'div',
      style: { display: 'flex', flexDirection: 'column' },
      children: []
    };
    expect(getFlexClasses(topLevelStyleNode)).toEqual(['flex-col']);

    const flexWithoutDirection: SchemaNode = {
      type: 'div',
      props: {
        style: { display: 'flex' }
      },
      children: []
    };
    expect(getFlexClasses(flexWithoutDirection)).toEqual([]);
  });

  test('cleanStyles drops flex-covered defaults and merges padding/margin', () => {
    const node = makeNode({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      position: 'static',
      overflow: 'visible',
      width: 100,
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      marginTop: 1,
      marginRight: 2,
      marginBottom: 1,
      marginLeft: 2
    });

    expect(
      cleanStyles(node, ['flex-row', 'justify-center', 'align-end'])
    ).toEqual({
      width: 100,
      padding: '4px 8px',
      margin: '1px 2px'
    });
  });

  test('cleanStyles keeps non-standard flex values that are not covered by helper classes', () => {
    const node = makeNode({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'stretch',
      alignItems: 'baseline'
    });

    expect(cleanStyles(node, ['flex-row'])).toEqual({
      justifyContent: 'stretch',
      alignItems: 'baseline'
    });
  });

  test('cleanStyles handles nodes without props.style', () => {
    expect(cleanStyles({ type: 'div', children: [] }, [])).toEqual({});
  });
});
