import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

const GITHUB_LINK = 'https://github.com/refinist/lanhu-context-mcp';
const DOWNLOADS_DIR = fileURLToPath(
  new URL('../public/downloads', import.meta.url)
);

type DownloadAsset = {
  filename: string;
  href: string;
  version: string;
};

function parseVersionSegments(filename: string): number[] | null {
  const match = /^lanhu-helper-v?(\d+(?:\.\d+)*)\.zip$/i.exec(filename);

  if (!match) {
    return null;
  }

  return match[1].split('.').map(part => Number.parseInt(part, 10));
}

function compareVersionSegments(a: number[], b: number[]): number {
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;

    if (left !== right) {
      return left - right;
    }
  }

  return 0;
}

function getLatestLanhuHelperDownload(): DownloadAsset | null {
  const files = fs.readdirSync(DOWNLOADS_DIR, { withFileTypes: true });
  const candidates = files
    .filter(file => file.isFile())
    .map(file => {
      const segments = parseVersionSegments(file.name);

      if (!segments) {
        return null;
      }

      return {
        filename: file.name,
        href: `/downloads/${file.name}`,
        version: segments.join('.'),
        segments
      };
    })
    .filter(candidate => candidate !== null)
    .sort((left, right) =>
      compareVersionSegments(right.segments, left.segments)
    );

  if (!candidates.length) {
    return null;
  }

  const latest = candidates[0];

  return {
    filename: latest.filename,
    href: latest.href,
    version: latest.version
  };
}

const latestLanhuHelperDownload = getLatestLanhuHelperDownload();

function withPrefix(prefix: string, path: string): string {
  return prefix ? `${prefix}${path}` : path;
}

function createGuideSidebar(
  prefix: string,
  sections: Array<{
    text: string;
    items?: Array<{ text: string; link: string }>;
    link?: string;
  }>
) {
  return sections.map(section =>
    section.link
      ? {
          text: section.text,
          link: withPrefix(prefix, section.link)
        }
      : {
          text: section.text,
          items: (section.items ?? []).map(item => ({
            text: item.text,
            link: withPrefix(prefix, item.link)
          }))
        }
  );
}

function createEcosystemSidebar(
  prefix: string,
  title: string,
  labels: string[]
) {
  return [
    {
      text: title,
      items: [
        {
          text: labels[0],
          link: withPrefix(prefix, '/ecosystem/lanhu-helper')
        }
      ]
    }
  ];
}

function createBlogSidebar(
  prefix: string,
  title: string,
  items: Array<{ text: string; link: string }>
) {
  return [
    {
      text: title,
      items: items.map(item => ({
        text: item.text,
        link: withPrefix(prefix, item.link)
      }))
    }
  ];
}

function createReferenceSidebar(
  prefix: string,
  title: string,
  labels: string[]
) {
  return [
    {
      text: title,
      items: [
        { text: labels[0], link: withPrefix(prefix, '/reference/') },
        { text: labels[1], link: withPrefix(prefix, '/reference/tool') }
      ]
    }
  ];
}

export default defineConfig({
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    breaks: true
  },
  themeConfig: {
    search: {
      provider: 'local'
    }
  },
  vite: {
    define: {
      __LATEST_LANHU_HELPER_DOWNLOAD__: JSON.stringify(
        latestLanhuHelperDownload
      )
    },
    ssr: {
      noExternal: ['vitepress-component-medium-zoom']
    }
  },
  head: [
    [
      'link',
      { rel: 'icon', type: 'image/svg+xml', href: '/lanhu-context-mark.svg' }
    ],
    ['meta', { name: 'theme-color', content: '#2878FF' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Lanhu Context MCP' }]
  ],
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'Lanhu Context MCP',
      description:
        '把蓝湖单张设计稿转换为 HTML+CSS 设计上下文的 MCP Server 文档站。',
      themeConfig: {
        logo: '/lanhu-context-mark.svg',
        nav: [
          { text: '指南', link: '/guide/what-is-lanhu-context-mcp' },
          { text: 'API', link: '/reference/' },
          { text: '生态', link: '/ecosystem/lanhu-helper' },
          { text: '博客', link: '/blog/lanhu-ai-context' }
        ],
        sidebar: {
          '/guide/': createGuideSidebar('', [
            {
              text: '介绍',
              items: [
                {
                  text: '什么是 Lanhu Context MCP？',
                  link: '/guide/what-is-lanhu-context-mcp'
                }
              ]
            },
            {
              text: '基础',
              items: [
                { text: '快速开始', link: '/guide/getting-started' },
                { text: '获取蓝湖 Token', link: '/guide/get-lanhu-token' }
              ]
            },
            {
              text: '进阶',
              items: [
                { text: '常用配置', link: '/guide/configuration' },
                { text: 'AGENTS.md', link: '/guide/agents-md' }
              ]
            }
          ]),
          '/ecosystem/': createEcosystemSidebar('', '生态', ['Lanhu Helper']),
          '/blog/': createBlogSidebar('', '博客', [
            {
              text: 'Lanhu Context MCP: 把蓝湖设计稿整理成 AI 可直接消费的实现上下文',
              link: '/blog/lanhu-ai-context'
            }
          ]),
          '/reference/': createReferenceSidebar('', 'API 参考', [
            '通用',
            '工具'
          ])
        },
        socialLinks: [{ icon: 'github', link: GITHUB_LINK }],
        search: {
          provider: 'local'
        },
        outline: {
          level: [2, 3],
          label: '本页内容'
        },
        docFooter: {
          prev: '上一页',
          next: '下一页'
        },
        lastUpdated: {
          text: '最后更新',
          formatOptions: {
            dateStyle: 'medium',
            timeStyle: 'medium',
            forceLocale: true
          }
        },
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © 2026-present REFINIST'
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'Lanhu Context MCP',
      description:
        'Documentation for the MCP server that turns a single Lanhu design into HTML and CSS design context.',
      themeConfig: {
        logo: '/lanhu-context-mark.svg',
        nav: [
          { text: 'Guide', link: '/en/guide/what-is-lanhu-context-mcp' },
          { text: 'API', link: '/en/reference/' },
          { text: 'Ecosystem', link: '/en/ecosystem/lanhu-helper' },
          { text: 'Blog', link: '/en/blog/lanhu-ai-context' }
        ],
        sidebar: {
          '/en/guide/': createGuideSidebar('/en', [
            {
              text: 'Introduction',
              items: [
                {
                  text: 'What Is Lanhu Context MCP',
                  link: '/guide/what-is-lanhu-context-mcp'
                }
              ]
            },
            {
              text: 'Essentials',
              items: [
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Get a Lanhu Token', link: '/guide/get-lanhu-token' }
              ]
            },
            {
              text: 'Advanced',
              items: [
                { text: 'Common Settings', link: '/guide/configuration' },
                { text: 'AGENTS.md', link: '/guide/agents-md' }
              ]
            }
          ]),
          '/en/ecosystem/': createEcosystemSidebar('/en', 'Ecosystem', [
            'Lanhu Helper'
          ]),
          '/en/blog/': createBlogSidebar('/en', 'Blog', [
            {
              text: 'Lanhu Context MCP: Turning Lanhu Designs into AI-Ready Implementation Context',
              link: '/blog/lanhu-ai-context'
            }
          ]),
          '/en/reference/': createReferenceSidebar('/en', 'API Reference', [
            'General',
            'Tool'
          ])
        },
        socialLinks: [{ icon: 'github', link: GITHUB_LINK }],
        search: {
          provider: 'local'
        },
        outline: {
          level: [2, 3],
          label: 'On this page'
        },
        docFooter: {
          prev: 'Previous page',
          next: 'Next page'
        },
        lastUpdated: {
          text: 'Last updated',
          formatOptions: {
            dateStyle: 'medium',
            timeStyle: 'medium',
            forceLocale: true
          }
        },
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © 2026-present REFINIST'
        }
      }
    }
  }
});
