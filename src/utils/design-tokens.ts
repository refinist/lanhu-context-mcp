// Extract design-token hints for high-risk sketch elements such as gradients,
// non-uniform radii, borders, and shadows.

import { roundNum } from './css-helpers.ts';
import type { BorderObj, FillObj, ShadowObj } from '../types/design-tokens.ts';

const NOISE_TYPES = new Set(['color', 'gradient', 'colorStop', 'colorControl']);

function getDimensions(
  obj: Record<string, unknown>
): [number, number, number, number] {
  const frame = (obj.ddsOriginFrame || obj.layerOriginFrame || {}) as Record<
    string,
    number
  >;
  const x = frame.x ?? (obj.left as number) ?? 0;
  const y = frame.y ?? (obj.top as number) ?? 0;
  const w = frame.width ?? (obj.width as number) ?? 0;
  const h = frame.height ?? (obj.height as number) ?? 0;
  return [x || 0, y || 0, w || 0, h || 0];
}

function simplifyFill(fill: FillObj): string | null {
  if (fill.isEnabled === false) return null;
  const fillType = fill.fillType ?? 0;
  if (fillType === 0) {
    return `solid(${fill.color?.value ?? 'unknown'})`;
  }
  if (fillType === 1) {
    const gradient = fill.gradient || {};
    const stops = gradient.colorStops || [];
    const from = gradient.from || {};
    const to = gradient.to || {};
    const dx = (to.x ?? 0.5) - (from.x ?? 0.5);
    const dy = (to.y ?? 0) - (from.y ?? 0);
    const angle = Math.round((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
    const parts = stops.map(s => {
      const c = s.color?.value ?? 'unknown';
      const p = Math.round((s.position ?? 0) * 100);
      return `${c} ${p}%`;
    });
    return `linear-gradient(${angle}deg, ${parts.join(', ')})`;
  }
  return null;
}

function simplifyBorder(border: BorderObj): string | null {
  if (border.isEnabled === false) return null;
  const color = border.color?.value ?? 'unknown';
  const thickness = roundNum(border.thickness ?? 1);
  const posMap: Record<string, string> = {
    内边框: 'inside',
    外边框: 'outside',
    中心边框: 'center'
  };
  const pos = posMap[border.position ?? ''] ?? border.position ?? 'center';
  return `${thickness}px ${pos} ${color}`;
}

function simplifyShadow(shadow: ShadowObj): string | null {
  if (shadow.isEnabled === false) return null;
  const color = shadow.color?.value ?? 'unknown';
  return `${color} ${roundNum(shadow.offsetX ?? 0)}px ${roundNum(shadow.offsetY ?? 0)}px ${roundNum(shadow.blurRadius ?? 0)}px ${roundNum(shadow.spread ?? 0)}px`;
}

function hasOnlyTransparentSolid(fills: FillObj[]): boolean {
  for (const f of fills) {
    if (f.isEnabled === false) continue;
    if ((f.fillType ?? 0) === 0) {
      const val = f.color?.value ?? '';
      if (val.includes('rgba') && val.replace(/\s/g, '').includes(',0)'))
        continue;
      const alpha = f.color?.alpha ?? f.color?.a ?? 1;
      if (alpha === 0) continue;
    }
    return false;
  }
  return true;
}

function isHighRisk(obj: Record<string, unknown>): boolean {
  const objType = String(obj.type ?? obj.ddsType ?? '').toLowerCase();
  if (NOISE_TYPES.has(objType)) return false;

  const [, , w, h] = getDimensions(obj);
  if (w < 8 || h < 8) return false;

  // Skip invisible elements.
  const opacity = obj.opacity as number | undefined;
  if (opacity != null && opacity === 0) return false;

  const fills = (obj.fills ?? []) as FillObj[];
  if (fills.some(f => f.isEnabled !== false && f.fillType === 1)) return true;

  const borders = (obj.borders ?? []) as BorderObj[];
  if (borders.some(b => b.isEnabled !== false)) return true;

  const radius = obj.radius;
  if (Array.isArray(radius) && new Set(radius).size > 1) return true;

  if (opacity != null && opacity < 100) {
    if (hasOnlyTransparentSolid(fills) && !obj.borders && !obj.shadows)
      return false;
    return true;
  }

  const shadows = (obj.shadows ?? []) as ShadowObj[];
  if (shadows.some(s => s.isEnabled !== false)) return true;

  return false;
}

export function extractDesignTokens(
  sketchData: Record<string, unknown>
): string {
  const tokens: string[] = [];
  const visited = new WeakSet<Record<string, unknown>>();

  function buildPath(parentPath: string, name: string): string {
    return parentPath ? `${parentPath}/${name}` : name;
  }

  function walk(obj: Record<string, unknown>, parentPath: string = ''): void {
    if (!obj || typeof obj !== 'object') return;
    if (visited.has(obj)) return;
    visited.add(obj);
    if (obj.isVisible === false) return;

    const name = String(obj.name ?? '');
    const currentPath = buildPath(parentPath, name);

    if (isHighRisk(obj)) {
      const objType = obj.type ?? obj.ddsType ?? 'unknown';
      const [x, y, w, h] = getDimensions(obj);
      const lines: string[] = [
        `[${objType}] "${name}" @(${Math.round(x)},${Math.round(y)}) ${Math.round(w)}x${Math.round(h)}`
      ];
      if (parentPath) lines[0] += `  path: ${currentPath}`;

      const radius = obj.radius;
      if (radius != null) {
        if (Array.isArray(radius)) {
          const rounded = (radius as number[]).map(r => roundNum(r));
          lines.push(
            new Set(rounded).size === 1
              ? `  radius: ${rounded[0]}`
              : `  radius: ${JSON.stringify(rounded)}`
          );
        } else {
          lines.push(`  radius: ${roundNum(radius as number)}`);
        }
      }

      for (const f of (obj.fills ?? []) as FillObj[]) {
        const s = simplifyFill(f);
        if (s) lines.push(`  fill: ${s}`);
      }
      for (const b of (obj.borders ?? []) as BorderObj[]) {
        const s = simplifyBorder(b);
        if (s) lines.push(`  border: ${s}`);
      }
      const opacity = obj.opacity as number | undefined;
      if (opacity != null && opacity < 100)
        lines.push(`  opacity: ${opacity}%`);
      for (const sh of (obj.shadows ?? []) as ShadowObj[]) {
        const s = simplifyShadow(sh);
        if (s) lines.push(`  shadow: ${s}`);
      }

      tokens.push(lines.join('\n'));
    }

    for (const child of (obj.layers ?? []) as Record<string, unknown>[]) {
      walk(child, currentPath);
    }
  }

  const artboard = sketchData.artboard as Record<string, unknown> | undefined;
  if (artboard?.layers) {
    for (const layer of artboard.layers as Record<string, unknown>[]) {
      walk(layer);
    }
  } else if (sketchData.info) {
    for (const item of sketchData.info as Record<string, unknown>[]) {
      walk(item);
      for (const value of Object.values(item)) {
        if (typeof value === 'object' && value && !Array.isArray(value)) {
          walk(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
          for (const v of value) {
            if (typeof v === 'object' && v) walk(v as Record<string, unknown>);
          }
        }
      }
    }
  }

  return tokens.length > 0 ? tokens.join('\n') : '';
}
