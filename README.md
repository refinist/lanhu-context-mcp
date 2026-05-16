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

把下面对应客户端的 MCP 配置写入对应文件；如果使用 Qoder，在 MCP 服务页点击“添加”后粘贴配置：

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

Qoder（全局 MCP 服务）

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "lanhu-context-mcp",
        "--cwd",
        "/absolute/path/to/current-project"
      ],
      "env": {
        "LANHU_TOKEN": "your_lanhu_token_here"
      }
    }
  }
}
```

`Codex` 的 MCP 配置比较特殊，需要额外设置 `cwd`，并把它填写为当前项目的绝对路径。由于这个路径通常因人而异，通常不建议把 `.codex/config.toml` 提交到 Git，建议做好 Git 排除并由每位开发者在本地自行维护。

`Qoder` 目前只能在全局（用户级）配置 MCP，进程的工作目录通常是 `/`，会导致写入 `.lanhu-context-mcp.local/` 时因为没有权限直接报错。所以 Qoder 配置里必须显式指定 `--cwd`（或 `env.CWD`）把工作目录切到项目根，同时通过 `env` 传入 `LANHU_TOKEN`（stdio 子进程不会继承 shell 环境变量）。

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

Qoder（全局 MCP 服务）

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "lanhu-context-mcp",
        "--cwd",
        "C:\\absolute\\path\\to\\current-project"
      ],
      "env": {
        "LANHU_TOKEN": "your_lanhu_token_here"
      }
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

## 参与开发

欢迎提交 PR 或 issue。下面是把开发环境跑起来的流程。

### 1. 安装依赖

仓库使用 pnpm workspace（含 `playground` 子包），在根目录执行：

```sh
pnpm install
```

### 2. 准备 `.env.local`

复制示例文件，再去掉 `.example` 后缀填入凭据：

```sh
cp .env.local.example .env.local
```

字段说明：

| 字段             | 必填           | 用途                                                                                       |
| ---------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `LANHU_TOKEN`    | 是             | 调用蓝湖 API 的 Token，获取方式见 [这里](https://lanhu.refineup.com/guide/get-lanhu-token) |
| `LANHU_TEST_URL` | 跑集成测试时填 | 一条真实可访问的蓝湖设计稿详情链接，集成测试会向它发请求                                   |

### 3. 三层验证矩阵

不同改动建议跑不同层级的验证：

| 层级           | 命令                                             | 何时跑                                  | 依赖                                      |
| -------------- | ------------------------------------------------ | --------------------------------------- | ----------------------------------------- |
| 单元测试       | `pnpm test` / `pnpm test:coverage`               | 任何 PR 必过；目标覆盖率 100%           | 无                                        |
| 集成测试       | `pnpm test:integration` 及其 `:http/:stdio` 变体 | 改服务、工具、transport、协议层时建议跑 | `LANHU_TOKEN` + `LANHU_TEST_URL`          |
| 端到端验证场地 | 见下方 playground 一节                           | 改输出格式、提示词、文件落盘逻辑时手测  | `LANHU_TOKEN` + 任何接入 MCP 的 AI 客户端 |

集成测试更细的子集（仅 files 模式、仅 stdio 等）在 `package.json` 的 `test:integration:*` 脚本里。

### 4. playground — 端到端验证场地（E2E verification harness）

`playground/` 是一个 Vue 3 + Vite + Tailwind 工程，专门用来在**真实 MCP 客户端**（Claude Code / Cursor / Codex / Qoder）里跑实际蓝湖 API、把生成的页面落到 `src/pages/`、并通过 dev server 实时预览——验证 `get_design_context` 整条链路的真实行为，是单元/集成测试覆盖不到的层面。

常用命令：

```sh
# 启动 playground dev server
pnpm play

# 清理上一轮产物（src/pages 内页面 + src/assets 内切图 + .lanhu-context-mcp.local 目录）
pnpm play:clean
```

详细工作流和客户端配置看 [`playground/README.md`](./playground/README.md)。

### 5. 提 PR 前的检查清单

- [ ] `pnpm typecheck` 通过
- [ ] `pnpm test` 通过且覆盖率不下降（运行 `pnpm test:coverage` 确认）
- [ ] `pnpm lint` 通过
- [ ] 涉及对外行为或产出格式的改动，至少跑一次 `pnpm test:integration:files` 或在 playground 里实际验收

## License

[MIT](./LICENSE)

Copyright (c) 2026-present, [REFINIST](https://github.com/refinist)
