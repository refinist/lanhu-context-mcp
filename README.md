# lanhu-context-mcp

简体中文 | [English](./README.en.md)

[![npm](https://img.shields.io/npm/v/lanhu-context-mcp.svg?colorA=2878ff&colorB=000000)](https://npmjs.com/package/lanhu-context-mcp) [![downloads/month](https://img.shields.io/npm/dm/lanhu-context-mcp.svg?colorA=2878ff&colorB=000000)](https://npmjs.com/package/lanhu-context-mcp) [![Unit Test](https://img.shields.io/github/actions/workflow/status/refinist/lanhu-context-mcp/unit-test.yml?colorA=2878ff&colorB=000000&label=Unit%20Test)](https://github.com/refinist/lanhu-context-mcp/actions/workflows/unit-test.yml) [![codecov](https://img.shields.io/codecov/c/github/refinist/lanhu-context-mcp?colorA=2878ff&colorB=000000)](https://codecov.io/github/refinist/lanhu-context-mcp)

✨ 把蓝湖设计稿整理成让 AI 生成代码还原页面的上下文。

## Features

- 🎨 支持输出 `HTML+CSS` 或 `HTML+Tailwind`，可以按项目技术栈选择更合适的形态
- 🖼️ 返回切图资源映射和下载命令，减少手动逐个处理图片资源的步骤
- 🧱 补充 `Design Tokens` 和设计预览图，方便下游模型继续实现和视觉校验
- 🧭 附带面向下游 AI 的实现指引，明确优先级、适配方式和约束条件
- ⚙️ 支持通过 CLI 参数和环境变量配置 `Tailwind` 输出、跳过切图、单位缩放和提示语言

## 文档

完整文档请访问 [lanhu.refineup.com](https://lanhu.refineup.com)。

## 快速开始

### 环境要求

- Node.js `^20.19.0 || >=22.12.0`

### 设计稿转码

- 设计稿需要先开启转码功能，然后上传到蓝湖

### Step 1. 准备环境变量

先创建一个 `.env.local` 文件。

你需要一个可用的蓝湖登录 Token，可参考 [获取蓝湖 Token](https://lanhu.refineup.com/guide/get-lanhu-token)。

```dotenv
LANHU_TOKEN=your_lanhu_token_here
```

### Step 2. 配置 MCP

把下面对应客户端的 MCP 配置写入对应文件：

Codex（.codex/config.toml）

```toml
[mcp_servers.lanhu-context-mcp]
cwd = "/absolute/path/to/current-project"
command = "npx"
args = ["-y", "lanhu-context-mcp"]
```

Claude Code（.mcp.json） / Cursor（.cursor/mcp.json）

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp"]
    }
  }
}
```

`Codex` 的 MCP 配置比较特殊，需要额外设置 `cwd`，并把它填写为当前项目的绝对路径。由于这个路径通常因人而异，通常不建议把 `.codex/config.toml` 提交到 Git，建议做好 Git 排除并由每位开发者在本地自行维护。

**Windows**

如果在 Windows 下直接使用上面的 `npx` 配置启动失败，可以改用下面的写法：

Codex（WSL2）

```toml
[mcp_servers.lanhu-context-mcp]
cwd = "/absolute/path/to/current-project"
command = "npx"
args = ["-y", "lanhu-context-mcp"]
```

Codex（原生）

```toml
[mcp_servers.lanhu-context-mcp]
cwd = "C:\\absolute\\path\\to\\current-project"
command = "C:\\Program Files\\nodejs\\npx.cmd"
args = ["-y", "lanhu-context-mcp"]

[mcp_servers.lanhu-context-mcp.env]
APPDATA = "C:\\Users\\{your-name}\\AppData\\Roaming"
LOCALAPPDATA = "C:\\Users\\{your-name}\\AppData\\Local"
USERPROFILE = "C:\\Users\\{your-name}"
HOME = "C:\\Users\\{your-name}"
SYSTEMROOT = "C:\\Windows"
COMSPEC = "C:\\Windows\\System32\\cmd.exe"
```

Claude Code（.mcp.json） / Cursor（.cursor/mcp.json）

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "lanhu-context-mcp"]
    }
  }
}
```

`Codex` 原生 fallback 参考：
[openai/codex#2555](https://github.com/openai/codex/issues/2555#issuecomment-3381914894)

### Step 3. 安装 Lanhu Helper 谷歌浏览器插件

安装 [Lanhu Helper](https://lanhu.refineup.com/ecosystem/lanhu-helper) 后，可以直接从蓝湖右键复制选中图层链接或示例提示词。

### Step 4. 将蓝湖链接和提示词发给 AI

```text
请根据这个蓝湖设计稿实现
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

提示词可以按你的想法来写，但蓝湖 URL 必须确保完整且正确，否则无法正常调用 Tool。

[查看更丰富的文档](https://lanhu.refineup.com/guide/getting-started)

## 生态

[Lanhu Helper](https://lanhu.refineup.com/ecosystem/lanhu-helper) — 配套的蓝湖 Chrome 浏览器扩展，可以从蓝湖右键复制选中图层链接和示例提示词

## License

[MIT](./LICENSE)

Copyright (c) 2026-present, [REFINIST](https://github.com/refinist)
