// Unit tests for convertHtmlToTailwind.
import { convertHtmlToTailwind } from '../css-to-tailwind.ts';

// Basic behavior
describe('convertHtmlToTailwind — basic behavior', () => {
  test('returns HTML unchanged when there is no <style> block', async () => {
    const html = '<div class="foo">hello</div>';
    const result = await convertHtmlToTailwind(html);
    expect(result).toBe(html);
  });

  test('removes <style> block when it contains only whitespace', async () => {
    const html = '<style>\n</style>\n<div class="foo"></div>';
    const result = await convertHtmlToTailwind(html);
    expect(result).not.toContain('<style>');
  });
});

// Common Lanhu class mapping
describe('convertHtmlToTailwind — Lanhu common class mapping', () => {
  function makeHtml(cls: string) {
    return `<style>\n.${cls} { display: flex; }\n</style>\n<div class="${cls}"></div>`;
  }

  test('flex-col → flex flex-col', async () => {
    const result = await convertHtmlToTailwind(makeHtml('flex-col'));
    expect(result).toContain('class="flex flex-col"');
  });

  test('flex-row → flex flex-row', async () => {
    const result = await convertHtmlToTailwind(makeHtml('flex-row'));
    expect(result).toContain('class="flex flex-row"');
  });

  test('justify-center → justify-center (does not duplicate flex)', async () => {
    const result = await convertHtmlToTailwind(makeHtml('justify-center'));
    // justify-center should remain, but it should not inject flex by itself.
    const classMatch = result.match(/class="([^"]*)"/);
    const classes = classMatch ? classMatch[1].split(/\s+/) : [];
    expect(classes).toContain('justify-center');
    // flex should only come from flex-col or flex-row.
    expect(classes.filter(c => c === 'flex').length).toBe(0);
  });

  test('align-center → items-center', async () => {
    const result = await convertHtmlToTailwind(makeHtml('align-center'));
    expect(result).toContain('class="items-center"');
  });

  test('align-start → items-start', async () => {
    const result = await convertHtmlToTailwind(makeHtml('align-start'));
    expect(result).toContain('class="items-start"');
  });

  test('align-end → items-end', async () => {
    const result = await convertHtmlToTailwind(makeHtml('align-end'));
    expect(result).toContain('class="items-end"');
  });

  test('justify-between → justify-between', async () => {
    const result = await convertHtmlToTailwind(makeHtml('justify-between'));
    expect(result).toContain('class="justify-between"');
  });
});

// Combined class deduplication
describe('convertHtmlToTailwind — combined class deduplication', () => {
  test('flex-col + justify-center does not emit a duplicate flex', async () => {
    const html = `<style>
.flex-col { display: flex; flex-direction: column; }
.justify-center { display: flex; justify-content: center; }
</style>
<div class="flex-col justify-center"></div>`;

    const result = await convertHtmlToTailwind(html);
    const classMatch = result.match(/class="([^"]*)"/);
    const classes = classMatch ? classMatch[1].split(/\s+/) : [];

    // flex should only appear once, inherited from flex-col.
    expect(classes.filter(c => c === 'flex').length).toBe(1);
    expect(classes).toContain('flex-col');
    expect(classes).toContain('justify-center');
  });
});

// Reset CSS preservation
describe('convertHtmlToTailwind — reset CSS preservation', () => {
  const htmlWithReset = `<style>
body * {
  box-sizing: border-box;
}
input {
  border: 0;
}
button:active {
  opacity: 0.6;
}
.foo {
  width: 100px;
  height: 50px;
}
</style>
<div class="foo"></div>`;

  test('non-class reset rules are preserved in the <style> block', async () => {
    const result = await convertHtmlToTailwind(htmlWithReset);
    expect(result).toContain('<style>');
    expect(result).toContain('body *');
    expect(result).toContain('input');
    expect(result).toContain('button:active');
  });

  test('class rules are removed from the <style> block', async () => {
    const result = await convertHtmlToTailwind(htmlWithReset);
    expect(result).not.toContain('.foo');
  });
});

// Custom property conversion
describe('convertHtmlToTailwind — custom property conversion', () => {
  test('width/height are converted to Tailwind arbitrary value classes', async () => {
    const html = `<style>
.box {
  width: 100px;
  height: 50px;
}
</style>
<div class="box"></div>`;

    const result = await convertHtmlToTailwind(html);
    const classMatch = result.match(/class="([^"]*)"/);
    const classes = classMatch ? classMatch[1] : '';

    // css-to-tailwindcss should generate classes like w-[100px] and h-[50px].
    expect(classes).toMatch(/w-\[?100px\]?|w-\[100px\]/);
    expect(classes).toMatch(/h-\[?50px\]?|h-\[50px\]/);
  });

  test('classes that cannot be mapped keep their original name', async () => {
    // An empty CSS body cannot produce any @apply rule, so the original class stays.
    const html = `<style>
.unknown-cls {
}
</style>
<div class="unknown-cls"></div>`;

    const result = await convertHtmlToTailwind(html);
    expect(result).toContain('unknown-cls');
  });
});
