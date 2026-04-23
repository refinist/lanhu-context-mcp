import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('convertHtmlToTailwind — fallback on converter failure', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns the original HTML when Tailwind conversion throws', async () => {
    const convertCSS = vi.fn().mockRejectedValue(new Error('convert failed'));

    vi.doMock('css-to-tailwindcss', () => ({
      TailwindConverter: class {
        convertCSS = convertCSS;
      }
    }));

    const { convertHtmlToTailwind } = await import('../css-to-tailwind.ts');

    const html = `<style>
.box {
  width: 100px;
}
</style>
<div class="box"></div>`;

    await expect(convertHtmlToTailwind(html)).resolves.toBe(html);
    expect(convertCSS).toHaveBeenCalledTimes(1);
  });

  test('keeps original classes when converter output has no usable @apply rules', async () => {
    const convertCSS = vi.fn().mockResolvedValue({
      nodes: [
        {},
        { rule: { selector: '', nodes: [] } },
        {
          rule: {
            selector: '.box',
            nodes: [{ type: 'decl', prop: 'color', value: 'red' }]
          }
        }
      ]
    });

    vi.doMock('css-to-tailwindcss', () => ({
      TailwindConverter: class {
        convertCSS = convertCSS;
      }
    }));

    const { convertHtmlToTailwind } = await import('../css-to-tailwind.ts');

    const html = `<style>
.box {
  width: 100px;
}
</style>
<div class="box"></div>`;

    const result = await convertHtmlToTailwind(html);

    expect(result).toContain('class="box"');
    expect(result).not.toContain('<style>');
  });

  test('applies mocked @apply classes and preserves reset CSS', async () => {
    const convertCSS = vi.fn().mockResolvedValue({
      nodes: [
        {
          rule: {
            selector: '.box',
            nodes: [
              {
                type: 'atrule',
                name: 'apply',
                params: 'w-[100px] h-[50px]'
              }
            ]
          }
        }
      ]
    });

    vi.doMock('css-to-tailwindcss', () => ({
      TailwindConverter: class {
        convertCSS = convertCSS;
      }
    }));

    const { convertHtmlToTailwind } = await import('../css-to-tailwind.ts');

    const html = `<style>
body * {
  box-sizing: border-box;
}
.box {
  width: 100px;
  height: 50px;
}
</style>
<div class="box"></div>`;

    const result = await convertHtmlToTailwind(html);

    expect(result).toContain('class="w-[100px] h-[50px]"');
    expect(result).toContain('<style>');
    expect(result).toContain('body *');
  });

  test('skips empty reset rules and ignores apply nodes without params', async () => {
    const convertCSS = vi.fn().mockResolvedValue({
      nodes: [
        {
          rule: {
            selector: '.box',
            nodes: [{ type: 'atrule', name: 'apply' }]
          }
        },
        {
          rule: {
            selector: '.ghost'
          }
        }
      ]
    });

    vi.doMock('css-to-tailwindcss', () => ({
      TailwindConverter: class {
        convertCSS = convertCSS;
      }
    }));

    const { convertHtmlToTailwind } = await import('../css-to-tailwind.ts');

    const html = `<style>
body {}
.box {
  width: 100px;
}
</style>
<div class="box"></div>`;

    const result = await convertHtmlToTailwind(html);

    expect(result).toContain('class="box"');
    expect(result).not.toContain('<style>');
  });
});
