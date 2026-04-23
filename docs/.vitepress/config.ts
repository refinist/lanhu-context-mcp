import { defineConfig } from 'vitepress';

const GITHUB_LINK = 'https://github.com/refinist/Lanhu-Context-MCP';

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
          text: '最后更新'
        },
        footer: {
          copyright: 'Copyright © 2026 REFINIST'
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
          text: 'Last updated'
        },
        footer: {
          copyright: 'Copyright © 2026 REFINIST'
        }
      }
    }
  }
});
