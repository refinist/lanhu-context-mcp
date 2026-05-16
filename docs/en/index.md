---
layout: home

hero:
  name: Lanhu Context MCP
  text: 'One tool from Lanhu design to code recreation'
  tagline: 'Turn a Lanhu design into context for AI to generate code and recreate pages'
  image:
    src: /lanhu-context-mark.svg
    alt: Lanhu Context MCP
  actions:
    - theme: brand
      text: Getting Started
      link: /en/guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/refinist/lanhu-context-mcp

features:
  - title: '🔗 End-to-End Flow'
    details: 'From design URL parsing and structure extraction to asset preparation and code-generation context output, get_design_context handles the main path in one place'
  - title: '📦 Ready to Use'
    details: 'Distributed as an npm package, so you can invoke it directly with `npx lanhu-context-mcp` for a cleaner MCP setup'
  - title: '🎛️ Files / Inline Modes'
    details: 'Files mode writes the design context to local files and returns only resource_links, <strong>sidestepping the tool-result token cap enforced by some MCP clients</strong> (not always user-tunable)'
  - title: '🌐 Cross-Platform'
    details: 'The output is framework-agnostic, making it easier for AI to keep transforming the CSS into Less, CSS-in-JS, or continue implementation into web stacks such as Vue and React, as well as Android and iOS targets'
  - title: '🎨 Tailwind Output'
    details: 'Style output can be reshaped into a form that AI can use more easily when generating code, helping <strong>reduce token usage</strong> and context noise'
  - title: '🆚 On Par with Figma MCP'
    details: 'If you are familiar with Figma MCP, you can think of it as the Lanhu counterpart to the same kind of workflow: turn design data into context for AI to generate code and recreate pages'
  - title: '🧩 Browser Helper'
    details: 'A companion Lanhu browser extension that quickly copies the selected layer link and prompt snippet'
---
