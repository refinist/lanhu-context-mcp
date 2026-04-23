// Unit tests for convertLanhuToHtml and localizeImageUrls.
import { convertLanhuToHtml, localizeImageUrls } from '../schema-to-html.ts';
import type { SchemaNode } from '../../types/lanhu.ts';

// Fixture helpers
function textNode(className: string, text: string): SchemaNode {
  return {
    type: 'lanhutext',
    props: { className, text },
    children: []
  };
}

function imageNode(className: string, src: string): SchemaNode {
  return {
    type: 'lanhuimage',
    props: { className, src },
    children: []
  };
}

function divNode(
  className: string,
  children: SchemaNode[] = [],
  style?: Record<string, unknown>
): SchemaNode {
  return {
    type: 'div',
    props: { className, style: style ?? {} },
    children
  };
}

function buttonNode(
  className: string,
  children: SchemaNode[] = []
): SchemaNode {
  return {
    type: 'lanhubutton',
    props: { className },
    children
  };
}

// convertLanhuToHtml
describe('convertLanhuToHtml — basic structure', () => {
  test('undefined roots still return the shared style block', () => {
    const html = convertLanhuToHtml(undefined as unknown as SchemaNode);
    expect(html).toContain('<style>');
    expect(html).toContain('.flex-col');
    expect(html).not.toContain('<div');
  });

  test('output contains <style> block and HTML content', () => {
    const node = divNode('page', []);
    const html = convertLanhuToHtml(node);
    expect(html).toContain('<style>');
    expect(html).toContain('</style>');
    expect(html).toContain('<div');
  });

  test('<style> block includes common layout classes', () => {
    const html = convertLanhuToHtml(divNode('root', []));
    expect(html).toContain('.flex-col');
    expect(html).toContain('.flex-row');
    expect(html).toContain('.justify-center');
  });

  test('div node emits the correct class attribute', () => {
    const html = convertLanhuToHtml(divNode('my-box', []));
    expect(html).toContain('class="my-box"');
  });
});

describe('convertLanhuToHtml — node types', () => {
  test('lanhutext node renders as <span>', () => {
    const html = convertLanhuToHtml(textNode('label', 'Hello'));
    expect(html).toContain('<span');
    expect(html).toContain('Hello');
  });

  test('lanhuimage node renders as <img>', () => {
    const html = convertLanhuToHtml(
      imageNode('icon', 'https://example.com/img.png')
    );
    expect(html).toContain('<img');
    expect(html).toContain('src="https://example.com/img.png"');
    expect(html).toContain('referrerpolicy="no-referrer"');
  });

  test('lanhubutton node renders as <button>', () => {
    const html = convertLanhuToHtml(buttonNode('btn'));
    expect(html).toContain('<button');
    expect(html).toContain('</button>');
  });
});

describe('convertLanhuToHtml — CSS rule generation', () => {
  test('nodes with style emit matching CSS rules', () => {
    const node = divNode('box', [], { width: 100, height: 50 });
    const html = convertLanhuToHtml(node);
    expect(html).toContain('.box');
    expect(html).toContain('width: 100px');
    expect(html).toContain('height: 50px');
  });

  test('nodes without style still emit an empty CSS rule', () => {
    const node = divNode('empty', []);
    const html = convertLanhuToHtml(node);
    expect(html).toContain('.empty');
  });

  test('nodes without a class name do not emit a CSS rule', () => {
    const nodeWithoutClass: SchemaNode = {
      type: 'div',
      props: { style: { width: 100 } }
    };
    const html = convertLanhuToHtml(nodeWithoutClass);
    expect(html).not.toContain('.undefined');
    expect(html).toContain('<div class=""></div>');
  });

  test('null style values are skipped from generated CSS', () => {
    const html = convertLanhuToHtml(divNode('nullable', [], { width: null }));
    expect(html).toContain('.nullable');
    expect(html).not.toContain('width:');
  });
});

describe('convertLanhuToHtml — flex classes', () => {
  test('flexDirection: column nodes get the flex-col class', () => {
    const node = divNode('wrap', [], {
      display: 'flex',
      flexDirection: 'column'
    });
    const html = convertLanhuToHtml(node);
    expect(html).toContain('flex-col');
  });

  test('flexDirection: row nodes get the flex-row class', () => {
    const node = divNode('row', [], {
      display: 'flex',
      flexDirection: 'row'
    });
    const html = convertLanhuToHtml(node);
    expect(html).toContain('flex-row');
  });
});

describe('convertLanhuToHtml — nested children', () => {
  test('children are nested correctly', () => {
    const node = divNode('parent', [
      textNode('child-text', 'hi'),
      imageNode('child-img', 'https://x.com/a.png')
    ]);
    const html = convertLanhuToHtml(node);
    expect(html).toContain('class="parent"');
    expect(html).toContain('class="child-text"');
    expect(html).toContain('class="child-img"');
  });
});

describe('convertLanhuToHtml — loop and placeholders', () => {
  test('loop node expands children and emits indexed class names', () => {
    const node: SchemaNode = {
      type: 'div',
      loopType: true,
      loopData: [{ title: 'A', image: 'https://a.com/a.png' }],
      props: { className: 'list', style: {} },
      children: [
        {
          type: 'lanhutext',
          props: { className: 'title', text: 'this.item.title' },
          children: []
        },
        {
          type: 'lanhuimage',
          props: { className: 'thumb', src: 'this.item.image' },
          children: []
        }
      ]
    };

    const html = convertLanhuToHtml(node);

    expect(html).toContain('.title-0');
    expect(html).toContain('.thumb-0');
    expect(html).toContain('class="title-0"');
    expect(html).toContain('>A</span>');
    expect(html).toContain('src="https://a.com/a.png"');
  });

  test('this.item placeholders are cleared when not in a loop context', () => {
    const html = convertLanhuToHtml(
      divNode('parent', [
        textNode('title', 'this.item.title'),
        imageNode('thumb', 'this.item.image')
      ])
    );

    expect(html).toContain('<span class="title"></span>');
    expect(html).toContain('src=""');
  });

  test('button children inherit the loop context', () => {
    const node: SchemaNode = {
      type: 'div',
      loopType: true,
      loop: [{ label: 'Save' }],
      props: { className: 'root', style: {} },
      children: [
        {
          type: 'lanhubutton',
          props: { className: 'cta' },
          children: [
            {
              type: 'lanhutext',
              props: { className: 'cta-label', text: 'this.item.label' },
              children: []
            }
          ]
        }
      ]
    };

    const html = convertLanhuToHtml(node);

    expect(html).toContain('<button class="cta-0">');
    expect(html).toContain('>Save</span>');
  });

  test('invalid loop data falls back to normal child rendering', () => {
    const html = convertLanhuToHtml({
      type: 'div',
      loopType: true,
      loopData: 'invalid' as unknown as [],
      props: { className: 'root', style: {} },
      children: [textNode('title', 'this.item.title')]
    });
    expect(html).toContain('<div class="root">');
    expect(html).toContain('<span class="title"></span>');
    expect(html).not.toContain('title-0');
  });

  test('primitive loop items keep unresolved placeholders as-is', () => {
    const html = convertLanhuToHtml({
      type: 'div',
      loopType: true,
      loopData: [1],
      props: { className: 'list', style: {} },
      children: [textNode('title', 'this.item.title')]
    });
    expect(html).toContain('>this.item.title</span>');
  });

  test('missing loop item fields resolve to empty strings', () => {
    const html = convertLanhuToHtml({
      type: 'div',
      loopType: true,
      loopData: [{}],
      props: { className: 'list', style: {} },
      children: [
        textNode('title', 'this.item.title'),
        imageNode('thumb', 'this.item.image')
      ]
    });
    expect(html).toContain('<span class="title-0"></span>');
    expect(html).toContain('src=""');
  });
});

describe('convertLanhuToHtml — empty node data', () => {
  test('text and image nodes fall back to empty strings', () => {
    const labelNode: SchemaNode = {
      type: 'lanhutext',
      props: { className: 'label' }
    };
    const thumbNode: SchemaNode = {
      type: 'lanhuimage',
      props: { className: 'thumb' }
    };
    const html = convertLanhuToHtml(divNode('wrap', [labelNode, thumbNode]));
    expect(html).toContain('<span class="label"></span>');
    expect(html).toContain('src=""');
  });

  test('buttons without a children field still render correctly', () => {
    const html = convertLanhuToHtml({
      type: 'lanhubutton',
      props: { className: 'cta' }
    });
    expect(html).toContain('<button class="cta">');
    expect(html).toContain('</button>');
  });

  test('buttons and divs without children still render correctly', () => {
    const emptyContainer = divNode('root', [
      buttonNode('cta'),
      divNode('empty')
    ]);
    const html = convertLanhuToHtml(emptyContainer);
    expect(html).toContain('<button class="cta">\n\n  </button>');
    expect(html).toContain('<div class="empty"></div>');
  });
});

describe('convertLanhuToHtml — scaling and formatting', () => {
  test('unitScale scales output px values', () => {
    const node = divNode('box', [], { width: 10, left: -0.30000001192092896 });
    const html = convertLanhuToHtml(node, 2);
    expect(html).toContain('width: 20px');
    expect(html).toContain('left: -0.6px');
  });
});

// localizeImageUrls
describe('localizeImageUrls', () => {
  test('replaces https src with a local path', () => {
    const html = '<img src="https://cdn.example.com/icon.png" />';
    const { html: result, mapping } = localizeImageUrls(html, 'MyDesign');
    expect(result).toContain('./src/assets/mydesign/icon-1.png');
    expect(result).not.toContain('https://cdn.example.com');
    expect(mapping['./src/assets/mydesign/icon-1.png']).toBe(
      'https://cdn.example.com/icon.png'
    );
  });

  test('folder name uses design name only, without id suffix', () => {
    const html = '<img src="https://cdn.example.com/icon.png" />';
    const { html: result } = localizeImageUrls(html, 'MyDesign');
    expect(result).toContain('./src/assets/mydesign/icon-1.png');
    expect(result).not.toMatch(/mydesign-[a-z0-9]+/);
  });

  test('replaces background-image url with a local path', () => {
    const html =
      '<div style="background-image: url(https://cdn.example.com/bg.png)"></div>';
    const { html: result, mapping } = localizeImageUrls(html, 'Design');
    expect(result).toContain('./src/assets/design/icon-1.png');
    expect(Object.keys(mapping)).toHaveLength(1);
  });

  test('protocol-relative URLs starting with // are prefixed with https:', () => {
    const html = '<img src="//cdn.example.com/img.jpg" />';
    const { mapping } = localizeImageUrls(html, 'D');
    expect(Object.values(mapping)[0]).toMatch(/^https:\/\//);
  });

  test('multiple images are numbered in order', () => {
    const html =
      '<img src="https://a.com/1.png" /><img src="https://b.com/2.png" />';
    const { mapping } = localizeImageUrls(html, 'Page');
    expect(Object.keys(mapping)).toContain('./src/assets/page/icon-1.png');
    expect(Object.keys(mapping)).toContain('./src/assets/page/icon-2.png');
  });

  test('mapping is empty when there are no remote URLs', () => {
    const html = '<img src="./local.png" />';
    const { html: result, mapping } = localizeImageUrls(html, 'Design');
    expect(result).toBe(html);
    expect(Object.keys(mapping)).toHaveLength(0);
  });

  test('invalid design names fall back to untitled-design', () => {
    const html = '<img src="https://cdn.example.com/icon.unknown" />';
    const { html: result, mapping } = localizeImageUrls(html, '***');
    expect(result).toContain('./src/assets/untitled-design/icon-1.png');
    expect(mapping['./src/assets/untitled-design/icon-1.png']).toBe(
      'https://cdn.example.com/icon.unknown'
    );
  });

  test('remote images without an extension default to .png', () => {
    const html = '<img src="https://cdn.example.com/icon" />';
    const { html: result, mapping } = localizeImageUrls(html, 'Design');
    expect(result).toContain('./src/assets/design/icon-1.png');
    expect(mapping['./src/assets/design/icon-1.png']).toBe(
      'https://cdn.example.com/icon'
    );
  });

  test('trailing dots in remote URLs also default to .png', () => {
    const html = '<img src="https://cdn.example.com/icon." />';
    const { html: result, mapping } = localizeImageUrls(html, 'Design');
    expect(result).toContain('./src/assets/design/icon-1.png');
    expect(mapping['./src/assets/design/icon-1.png']).toBe(
      'https://cdn.example.com/icon.'
    );
  });
});
