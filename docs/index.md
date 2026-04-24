---
layout: home

hero:
  name: Lanhu Context MCP
  text: '一个 Tool 打通从蓝湖设计稿到代码实现的链路'
  tagline: '把蓝湖设计稿整理成让 AI 生成代码还原页面的上下文'
  image:
    src: /lanhu-context-mark.svg
    alt: Lanhu Context MCP
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/refinist/lanhu-context-mcp

features:
  - title: '🔗 主链路一体化'
    details: '从设计稿链接解析、结构提取到图片资源准备与代码生成上下文交付，用 get_design_context 一次拿全'
  - title: '📦 开箱即接'
    details: '作为 npm 包分发，可直接通过 `npx lanhu-context-mcp` 调用，接入 MCP 客户端更直接'
  - title: '🌐 多端延展'
    details: '输出不绑定具体框架，也方便 AI 继续将 CSS 转成 Less、CSS-in-JS，或进一步实现到 vue、React 等 Web 技术栈，以及 Android、iOS 等目标端'
  - title: '🎨 Tailwind 输出'
    details: '把样式进一步整理成更适合 AI 生成代码时使用的表达，<strong>减少 token 消耗</strong>和上下文噪音'
  - title: '🆚 与 Figma MCP 同级'
    details: '如果你熟悉 Figma MCP，可以把它理解成蓝湖场景下的同类方案：先把设计稿整理成让 AI 生成代码还原页面的上下文，再继续推进到项目实现'
  - title: '🧩 插件提效'
    details: '配套蓝湖浏览器插件，快速复制选中图层链接和示例提示词'
---
