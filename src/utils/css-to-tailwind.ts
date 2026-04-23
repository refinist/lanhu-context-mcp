// Convert Lanhu HTML with embedded CSS into Tailwind-based HTML.
// The flow is:
// 1. Extract CSS rules from the HTML <style> block.
// 2. Convert class rules into Tailwind @apply directives.
// 3. Build a className -> Tailwind classes map from the conversion result.
// 4. Replace HTML class attributes with mapped Tailwind classes.
// 5. Keep only non-class global reset rules in the final <style> block.

import { TailwindConverter } from 'css-to-tailwindcss';

// Map common Lanhu layout classes to their Tailwind equivalents.
// justify-* and align-* do not add flex on their own because flex-col/flex-row already include it.
const COMMON_CSS_TO_TAILWIND: Record<string, string> = {
  'flex-col': 'flex flex-col',
  'flex-row': 'flex flex-row',
  'justify-start': 'justify-start',
  'justify-center': 'justify-center',
  'justify-end': 'justify-end',
  'justify-evenly': 'justify-evenly',
  'justify-around': 'justify-around',
  'justify-between': 'justify-between',
  'align-start': 'items-start',
  'align-center': 'items-center',
  'align-end': 'items-end'
};

// Extract non-class global reset rules from CSS content, such as body, input, and button.
function extractResetCss(cssContent: string): string {
  const resetRules: string[] = [];
  // Match rule blocks that do not start with a class selector, such as body * or button:active.
  const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(cssContent)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();
    // Skip class-based rules.
    if (selector.startsWith('.')) continue;
    if (!body) continue;
    resetRules.push(
      `${selector} {\n  ${body.replace(/;\s*/g, ';\n  ').replace(/;\s*$/, ';')}\n}`
    );
  }
  return resetRules.join('\n');
}

// Convert HTML with a <style> block into Tailwind HTML.
export async function convertHtmlToTailwind(html: string): Promise<string> {
  // Extract the <style> content first.
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (!styleMatch) return html;

  const cssContent = styleMatch[1];

  // Split custom class rules from global rules.
  // Global rules such as body *, input, and button are kept out of the conversion step.
  const customRules: string[] = [];
  const ruleRegex = /\.([a-zA-Z_][\w-]*)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(cssContent)) !== null) {
    const className = match[1];
    const body = match[2].trim();
    // Skip empty rules and common classes handled by COMMON_CSS_TO_TAILWIND.
    if (!body || COMMON_CSS_TO_TAILWIND[className]) continue;
    customRules.push(`.${className} { ${body} }`);
  }

  // Convert custom CSS rules with css-to-tailwindcss.
  const classMap = new Map<string, string>();

  if (customRules.length > 0) {
    try {
      const converter = new TailwindConverter({
        remInPx: null,
        tailwindConfig: { content: [], theme: {} },
        arbitraryPropertiesIsEnabled: true
      });

      const cssToConvert = customRules.join('\n');
      const { nodes } = await converter.convertCSS(cssToConvert);
      // Extract the class mapping from the conversion result.
      for (const node of nodes) {
        if (node.rule) {
          // Strip the leading dot from the selector to get the class name.
          const selector = node.rule.selector || '';
          const cls = selector.replace(/^\./, '');
          if (!cls) continue;

          // Read Tailwind classes from the generated @apply directive.
          const tailwindClasses: string[] = [];
          if (node.rule.nodes) {
            for (const child of node.rule.nodes) {
              // @apply node
              if (
                child.type === 'atrule' &&
                (child as { name?: string }).name === 'apply'
              ) {
                const params = (child as { params?: string }).params || '';
                tailwindClasses.push(...params.split(/\s+/).filter(Boolean));
              }
            }
          }

          if (tailwindClasses.length > 0) {
            classMap.set(cls, tailwindClasses.join(' '));
          }
        }
      }
    } catch (err) {
      // Fall back to the original HTML and keep the failure visible in logs.
      console.error('[css-to-tailwind] conversion failed:', err);
      return html;
    }
  }

  // Add mappings for common Lanhu classes.
  for (const [cls, tw] of Object.entries(COMMON_CSS_TO_TAILWIND)) {
    classMap.set(cls, tw);
  }

  // Replace HTML class attributes with Tailwind classes.
  let result = html;

  result = result.replace(/class="([^"]*)"/g, (_match, classValue: string) => {
    const classes = classValue.split(/\s+/).filter(Boolean);
    const newClasses: string[] = [];

    for (const cls of classes) {
      const twClass = classMap.get(cls);
      if (twClass) {
        newClasses.push(twClass);
      } else {
        // Keep unmapped classes unchanged.
        newClasses.push(cls);
      }
    }

    // De-duplicate merged classes.
    const unique = [...new Set(newClasses.flatMap(c => c.split(/\s+/)))];
    return `class="${unique.join(' ')}"`;
  });

  // Replace the <style> block with a reduced version that keeps only global reset rules.
  const resetCss = extractResetCss(cssContent);
  if (resetCss) {
    result = result.replace(
      /<style[^>]*>[\s\S]*?<\/style>/,
      `<style>\n${resetCss}\n</style>`
    );
  } else {
    result = result.replace(/<style[^>]*>[\s\S]*?<\/style>\s*/, '');
  }

  return result;
}
