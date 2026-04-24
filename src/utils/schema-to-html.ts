import {
  camelToKebab,
  cleanStyles,
  formatCssValue,
  getFlexClasses
} from './css-helpers.ts';
import type { SchemaNode } from '../types/lanhu.ts';

// Shared CSS helpers used by converted Lanhu layouts.
const COMMON_CSS = `
.flex-col {
  display: flex;
  flex-direction: column;
}
.flex-row {
  display: flex;
  flex-direction: row;
}
.justify-start {
  display: flex;
  justify-content: flex-start;
}
.justify-center {
  display: flex;
  justify-content: center;
}
.justify-end {
  display: flex;
  justify-content: flex-end;
}
.justify-evenly {
  display: flex;
  justify-content: space-evenly;
}
.justify-around {
  display: flex;
  justify-content: space-around;
}
.justify-between {
  display: flex;
  justify-content: space-between;
}
.align-start {
  display: flex;
  align-items: flex-start;
}
.align-center {
  display: flex;
  align-items: center;
}
.align-end {
  display: flex;
  align-items: flex-end;
}
`;

// Read loop data from either loop or loopData.
function getLoopArr(node: SchemaNode): unknown[] {
  const arr = node.loop || node.loopData;
  return Array.isArray(arr) ? arr : [];
}

// Recursively generate CSS rules for each node class.
function generateCss(
  node: SchemaNode,
  cssRules: Map<string, string>,
  scale: number,
  loopSuffixes?: string[]
): void {
  if (!node) return;

  const loopArr = node.loopType ? getLoopArr(node) : [];
  if (loopArr.length > 0 && !loopSuffixes) {
    loopSuffixes = loopArr.map((_, i) => String(i));
  }

  const className = node.props?.className;
  if (className) {
    const flexClasses = getFlexClasses(node);
    const styles = cleanStyles(node, flexClasses, scale);
    const entries = Object.entries(styles);

    let content = '';
    if (entries.length > 0 || node.type === 'lanhutext') {
      const cssProps: string[] = [];
      for (const [key, value] of entries) {
        const cssKey = camelToKebab(key);
        const cssValue = formatCssValue(key, value, scale);
        if (cssValue) {
          cssProps.push(`  ${cssKey}: ${cssValue};`);
        }
      }
      content = cssProps.join('\n');
    }

    if (loopSuffixes) {
      for (const suf of loopSuffixes) {
        cssRules.set(`${className}-${suf}`, content);
      }
    } else {
      cssRules.set(className, content);
    }
  }

  const children = node.children || [];
  for (const child of children) {
    generateCss(child, cssRules, scale, loopSuffixes);
  }
}

// Previous implementation kept for reference in case we need to restore it:
// function resolveLoopPlaceholder(
//   value: string,
//   loopItem: Record<string, unknown>
// ): string {
//   if (!value || typeof loopItem !== 'object') return value || '';
//   const s = String(value).trim();
//   const m = s.match(/^this\.item\.(\w+)$/);
//   return m ? String(loopItem[m[1]] ?? '') : value;
// }
// Resolve a this.item.xxx placeholder against the current loop item.
function resolveLoopPlaceholder(value: string, loopItem: unknown): string {
  if (!loopItem || typeof loopItem !== 'object') return value;
  const key = String(value).trim().slice('this.item.'.length);
  return String(Reflect.get(loopItem, key) ?? '');
}

// Recursively generate HTML from the schema tree.
function generateHtml(
  node: SchemaNode,
  indent: number = 2,
  loopContext?: { list: unknown[]; index: number }
): string {
  if (!node) return '';

  const loopItem =
    loopContext != null
      ? (loopContext.list[loopContext.index] as Record<string, unknown>)
      : null;
  const loopIndex = loopContext?.index;

  const spaces = ' '.repeat(indent);
  const flexClasses = getFlexClasses(node);
  let className = node.props?.className || '';
  if (loopIndex != null && className) {
    className = `${className}-${loopIndex}`;
  }
  const allClasses = [className, ...flexClasses].filter(Boolean).join(' ');

  const nodeType = node.type;

  // Render text nodes as spans.
  if (nodeType === 'lanhutext') {
    let text = node.data?.value || node.props?.text || '';
    if (loopItem && text && /^this\.item\.\w+$/.test(String(text).trim())) {
      text = resolveLoopPlaceholder(String(text), loopItem);
    } else if (text && /^this\.item\.\w+$/.test(String(text).trim())) {
      text = '';
    }
    // uiType 'InputArea' overrides the default <span> output with an <input>
    // so text nodes marked as input fields in Lanhu keep their form semantics.
    // Loop-bound placeholders (matching item.*.lanhutextN) keep the <span>
    // fallback since an <input> cannot meaningfully interpolate them.
    if (
      node.uiType === 'InputArea' &&
      !/item\.(?:specialSlot\d+\.)?lanhutext\d+/.test(text)
    ) {
      const placeholder = String(node.uiTypeProb?.placeholder ?? text ?? '');
      const w = node.style?.width ?? node.props?.style?.width;
      const h = node.style?.height ?? node.props?.style?.height;
      const inlineStyle =
        w != null && h != null ? ` style="width:${w}px;height:${h}px"` : '';
      return `${spaces}<input class="${allClasses}" placeholder="${placeholder}"${inlineStyle} />`;
    }
    return `${spaces}<span class="${allClasses}">${text}</span>`;
  }

  // Render image nodes as img tags.
  if (nodeType === 'lanhuimage') {
    let src = node.data?.value || node.props?.src || '';
    if (loopItem && src && /^this\.item\.\w+$/.test(String(src).trim())) {
      src = resolveLoopPlaceholder(String(src), loopItem);
    } else if (src && /^this\.item\.\w+$/.test(String(src).trim())) {
      src = '';
    }
    return `${spaces}<img\n${spaces}  class="${allClasses}"\n${spaces}  referrerpolicy="no-referrer"\n${spaces}  src="${src}"\n${spaces}/>`;
  }

  // Render button nodes with their children.
  if (nodeType === 'lanhubutton') {
    const children = node.children || [];
    const childrenHtml = children
      .map(c => generateHtml(c, indent + 2, loopContext))
      .join('\n');
    return `${spaces}<button class="${allClasses}">\n${childrenHtml}\n${spaces}</button>`;
  }

  // Render all other nodes as divs.
  const tag = 'div';
  const children = node.children || [];
  const loopArr = node.loopType ? getLoopArr(node) : [];

  // Expand loop children once per loop item.
  if (loopArr.length > 0 && !loopContext) {
    const parts: string[] = [];
    for (let i = 0; i < loopArr.length; i++) {
      const ctx = { list: loopArr, index: i };
      for (const child of children) {
        parts.push(generateHtml(child, indent + 2, ctx));
      }
    }
    const childrenHtml = parts.join('\n');
    return `${spaces}<${tag} class="${allClasses}">\n${childrenHtml}\n${spaces}</${tag}>`;
  }

  if (children.length > 0) {
    const childrenHtml = children
      .map(c => generateHtml(c, indent + 2, loopContext))
      .join('\n');
    return `${spaces}<${tag} class="${allClasses}">\n${childrenHtml}\n${spaces}</${tag}>`;
  }
  return `${spaces}<${tag} class="${allClasses}"></${tag}>`;
}

// Convert a Lanhu schema JSON tree into HTML and CSS.
export function convertLanhuToHtml(
  jsonData: SchemaNode,
  unitScale: number = 1
): string {
  const cssRules = new Map<string, string>();

  // Generate CSS rules first so the style block is ready before the markup.
  generateCss(jsonData, cssRules, unitScale);

  // Assemble the final CSS string.
  const cssParts: string[] = [];
  for (const [className, props] of cssRules) {
    if (props) {
      cssParts.push(`.${className} {\n${props}\n}`);
    } else {
      cssParts.push(`.${className} {\n}`);
    }
  }
  const cssString = cssParts.join('\n') + COMMON_CSS;

  // Generate the HTML body markup.
  const bodyHtml = generateHtml(jsonData, 0);

  const indentedCss = cssString.trimEnd().replace(/^/gm, '  ');
  return `<style>\n${indentedCss}\n</style>\n${bodyHtml}`;
}

// Replace remote image URLs with local asset paths and return the mapping.
export function localizeImageUrls(
  html: string,
  designName: string
): { html: string; mapping: Record<string, string> } {
  const mapping: Record<string, string> = {};
  let counter = 0;

  // Normalize the design name so it can be used as a folder name.
  const safeName =
    designName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled-design';
  const result = html.replace(
    /(src="|background(?:-image)?:\s*url\()([^"')]+)(["')])/g,
    (match, prefix: string, url: string, suffix: string) => {
      if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('//')
      ) {
        counter++;
        const rawExt = url.split('?')[0].split('.').pop() || '';
        const ext = /^(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/i.test(rawExt)
          ? rawExt.toLowerCase()
          : 'png';
        const localPath = `./src/assets/${safeName}/icon-${counter}.${ext}`;
        mapping[localPath] = url.startsWith('//') ? `https:${url}` : url;
        return `${prefix}${localPath}${suffix}`;
      }
      return match;
    }
  );

  return { html: result, mapping };
}
