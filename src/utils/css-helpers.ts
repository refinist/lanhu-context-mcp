import type { SchemaNode } from '../types/lanhu.ts';

// CSS properties that should not receive a px suffix.
const UNITLESS_PROPERTIES = new Set([
  'zIndex',
  'fontWeight',
  'opacity',
  'flex',
  'flexGrow',
  'flexShrink',
  'order'
]);

// Round floating-point numbers to 3 decimal places.
export function roundNum(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Convert a camelCase key into kebab-case.
export function camelToKebab(s: string): string {
  return s.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
}

// Scale a numeric value before formatting it.
function scaled(n: number, scale: number): number {
  return scale === 1 ? n : roundNum(n * scale);
}

// Format a CSS value, adding px when needed and scaling pixel-based numbers.
export function formatCssValue(
  key: string,
  value: unknown,
  scale: number = 1
): string {
  if (value == null) return '';

  if (typeof value === 'number') {
    if (value === 0) return '0';
    if (UNITLESS_PROPERTIES.has(key)) return String(roundNum(value));
    return `${scaled(value, scale)}px`;
  }

  if (typeof value === 'string') {
    // Normalize rgba alpha values.
    if (value.includes('rgba(')) {
      return value.replace(
        /rgba\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/g,
        (_match, r, g, b, a) => {
          const alpha = a.includes('.') ? parseFloat(a) : parseInt(a);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      );
    }
    // Treat plain numeric strings as pixel values when the property is not unitless.
    if (/^\d+$/.test(value) && !UNITLESS_PROPERTIES.has(key)) {
      return value === '0' ? '0' : `${scaled(Number(value), scale)}px`;
    }
  }

  // Trim long floating-point values embedded in strings and apply the configured scale.
  return String(value).replace(/-?\d+\.\d{4,}/g, m =>
    String(scaled(parseFloat(m), scale))
  );
}

// Merge individual padding sides into a shorthand value.
export function mergePadding(
  styles: Record<string, unknown>,
  scale: number = 1
): void {
  const pt = styles.paddingTop;
  const pr = styles.paddingRight;
  const pb = styles.paddingBottom;
  const pl = styles.paddingLeft;

  if (pt != null && pr != null && pb != null && pl != null) {
    const ptv = scaled((pt as number) || 0, scale);
    const prv = scaled((pr as number) || 0, scale);
    const pbv = scaled((pb as number) || 0, scale);
    const plv = scaled((pl as number) || 0, scale);

    if (ptv === pbv && plv === prv) {
      styles.padding = ptv === plv ? `${ptv}px` : `${ptv}px ${prv}px`;
    } else {
      styles.padding = `${ptv}px ${prv}px ${pbv}px ${plv}px`;
    }

    delete styles.paddingTop;
    delete styles.paddingRight;
    delete styles.paddingBottom;
    delete styles.paddingLeft;
  }
}

// Merge individual margin sides into a shorthand value.
export function mergeMargin(
  styles: Record<string, unknown>,
  scale: number = 1
): void {
  const mt = styles.marginTop;
  const mr = styles.marginRight;
  const mb = styles.marginBottom;
  const ml = styles.marginLeft;

  if (mt != null || mr != null || mb != null || ml != null) {
    const mtv = scaled((mt as number) || 0, scale);
    const mrv = scaled((mr as number) || 0, scale);
    const mbv = scaled((mb as number) || 0, scale);
    const mlv = scaled((ml as number) || 0, scale);

    if (mtv === 0 && mrv === 0 && mbv === 0 && mlv === 0) {
      // Skip an all-zero margin shorthand.
    } else if (mtv === mbv && mlv === mrv) {
      styles.margin = mtv === mlv ? `${mtv}px` : `${mtv}px ${mrv}px`;
    } else {
      styles.margin = `${mtv}px ${mrv}px ${mbv}px ${mlv}px`;
    }

    delete styles.marginTop;
    delete styles.marginRight;
    delete styles.marginBottom;
    delete styles.marginLeft;
  }
}

// Check whether the node should be treated as a flex container.
function shouldUseFlex(node: SchemaNode): boolean {
  if (!node) return false;
  const nodeStyle = node.style || {};
  const propsStyle = node.props?.style || {};
  const style = { ...nodeStyle, ...propsStyle };
  return style.display === 'flex' || style.flexDirection != null;
}

// Derive Lanhu flex helper classes from the node style.
export function getFlexClasses(node: SchemaNode): string[] {
  const classes: string[] = [];
  if (!shouldUseFlex(node)) return classes;

  const nodeStyle = node.style || {};
  const propsStyle = node.props?.style || {};
  const style = { ...nodeStyle, ...propsStyle };
  const className = node.props?.className || '';

  // Flex direction
  const flexDirection = style.flexDirection;
  if (flexDirection === 'column' || className.includes('flex-col')) {
    classes.push('flex-col');
  } else if (flexDirection === 'row' || className.includes('flex-row')) {
    classes.push('flex-row');
  }

  // Main-axis alignment
  const justify =
    node.alignJustify?.justifyContent || (style.justifyContent as string);
  const justifyMap: Record<string, string> = {
    'space-between': 'justify-between',
    center: 'justify-center',
    'flex-end': 'justify-end',
    'flex-start': 'justify-start',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly'
  };
  if (justify && justifyMap[justify]) classes.push(justifyMap[justify]);

  // Cross-axis alignment
  const align = node.alignJustify?.alignItems || (style.alignItems as string);
  const alignMap: Record<string, string> = {
    'flex-start': 'align-start',
    center: 'align-center',
    'flex-end': 'align-end'
  };
  if (align && alignMap[align]) classes.push(alignMap[align]);

  return classes;
}

// Remove style entries already represented by generated flex helper classes.
export function cleanStyles(
  node: SchemaNode,
  flexClasses: string[],
  scale: number = 1
): Record<string, unknown> {
  const propsStyle = node.props?.style || {};
  const styles: Record<string, unknown> = {};

  const standardJustify = new Set([
    'flex-start',
    'center',
    'flex-end',
    'space-between',
    'space-around',
    'space-evenly'
  ]);
  const standardAlign = new Set(['flex-start', 'center', 'flex-end']);

  for (const [key, value] of Object.entries(propsStyle)) {
    if (
      (key === 'display' || key === 'flexDirection') &&
      flexClasses.length > 0
    ) {
      continue;
    }
    if (key === 'justifyContent' && flexClasses.length > 0) {
      if (standardJustify.has(value as string)) continue;
    }
    if (key === 'alignItems' && flexClasses.length > 0) {
      if (standardAlign.has(value as string)) continue;
    }
    if (key === 'position' && value === 'static') continue;
    if (key === 'overflow' && value === 'visible') continue;

    styles[key] = value;
  }

  // Merge spacing properties into shorthand forms when possible.
  if (
    ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].some(
      k => k in styles
    )
  ) {
    mergePadding(styles, scale);
  }
  if (
    ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].some(
      k => k in styles
    )
  ) {
    mergeMargin(styles, scale);
  }

  return styles;
}
