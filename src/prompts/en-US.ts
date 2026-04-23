export const TOOL_DESCRIPTION =
  'Analyze a Lanhu design and return HTML+CSS design spec, image download mappings, design tokens, and a preview screenshot.';

export const URL_INPUT_DESCRIPTION =
  'Lanhu design detail URL containing tid, pid (project_id), and image_id parameters.';

export const ERROR_STOP_INSTRUCTION =
  '\nSTOP: Do NOT attempt to continue, guess, or work around this error. Report the error message above to the developer and wait for them to resolve it.';

export const HTML_CODE_LABEL = 'HTML+CSS Code:\n';
export const HTML_CODE_LABEL_TAILWIND =
  'HTML+Tailwind Code (all Tailwind classes are production-ready — use every class exactly as-is):\n';

export function imageMappingText(count: number, curlLines: string): string {
  return (
    `Image download mappings (${count} total):\n` +
    `An example path structure is ./src/assets/{design-name}/{icon-index}.{ext}.\n` +
    `The {design-name} and {icon-index} segments are default placeholders only. In actual implementation, you must replace {design-name} with the real page name. Icon names must not be generic names like icon-1 or icon-2; they must be semantic. Kebab-case is the default recommended naming format. If the target repository specifies otherwise, follow that convention and update all related references accordingly.\n` +
    `${curlLines}\n` +
    `For Windows, convert the curl commands above to Invoke-WebRequest.\n` +
    `If the target folder already exists, append a numeric suffix to avoid overwriting (e.g. foo-bar-2).`
  );
}

export const DESIGN_TOKENS_HEADER = 'Design Tokens (supplementary reference)';

export function guideText(
  projectName: string | undefined,
  designName: string
): string {
  const headerLines: string[] = [];
  if (projectName) headerLines.push(`Project: ${projectName}`);
  headerLines.push(`Design: ${designName}`);
  return (
    `${headerLines.join('\n')}\n` +
    `SUPER CRITICAL: The generated code must be adapted to match the target project's technology stack and styling system.\n` +
    `1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens.\n` +
    `2. Convert HTML+CSS syntax to the target framework/library.\n` +
    `3. Transform all styles to the target styling system while preserving exact visual design.\n` +
    `4. Follow the project's existing patterns and conventions.\n` +
    `5. The provided code is web-native with px-based values for pixel-perfect accuracy.\n` +
    `   - For web projects: all style values must be used EXACTLY as given — do NOT simplify, merge, or rewrite any CSS property values. If the code above is Tailwind, use the Tailwind classes directly — do NOT convert them into custom CSS classes, inline styles, or any other form; and do NOT convert arbitrary px classes to named utilities (e.g. ml-[16px] must stay ml-[16px], NOT ml-4).\n` +
    `   - For non-web projects (Android, iOS, Flutter, etc.): treat the px values as the design spec and convert to platform-native units/APIs (dp, pt, SwiftUI modifiers, etc.) as appropriate.\n` +
    `6. Priority: HTML+CSS > Design Tokens > Design Preview.\n` +
    `7. If image download mappings are included above, make sure all images are downloaded before writing any code.\n` +
    `8. If Design Tokens are included above, use them only as supplementary reference when HTML+CSS is clearly missing a property.\n` +
    `9. After finishing the code, you MUST perform a visual self-check by comparing your generated output against the provided design preview image and spec — mentally review overall layout, key elements, and critical visuals (colors / spacing / font sizes). Do NOT launch a browser, start a dev/preview server, or take screenshots unless the user explicitly requests that workflow. Only apply targeted adjustments when there is a clearly noticeable deviation (e.g. broken layout, missing elements, obvious visual mismatch); if no obvious deviation exists, do NOT adjust on your own — keep the output as-is. End your reply with a one-line self-check conclusion in the format "Visual self-check: No noticeable deviation" or "Visual self-check: Adjusted — <list specific items>".`
  );
}

export const ERROR_HTML_GENERATION = (msg: string): string =>
  `Failed to generate HTML: ${msg}`;

export const ERROR_IMAGE_DOWNLOAD = (msg: string): string =>
  `Failed to download design preview: ${msg}`;

export const ERROR_DESIGN_TOKENS = (msg: string): string =>
  `Failed to extract design tokens: ${msg}`;
