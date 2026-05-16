# lanhu-context-mcp · playground

一个开箱即用的 Vue 3 + Vite + Tailwind 工程，专门用来**演示和验收** [`lanhu-context-mcp`](../README.md) 在主流 AI 编程客户端里的实际效果。

跑通后你会得到：把一份蓝湖设计稿链接丢给 AI → AI 调用 `get_design_context` 拿到 HTML/CSS/Tailwind + 切图映射 + Design Tokens + 预览图 → 在 `src/pages/` 里产出一个能直接预览的页面。

## 技术栈

- Vue 3 + `<script setup>` + TypeScript
- Vite + unplugin-vue-router（文件路由）
- TailwindCSS + `postcss-pxtorem`（移动端 rem 适配，`rootValue: 37.5` 对应 750 设计稿）
- vant 组件库（可选使用）

## 适用客户端

这个 playground 已经在以下客户端里验证可跑通：

| 客户端          | 配置位置                                     | 备注         |
| --------------- | -------------------------------------------- | ------------ |
| **Claude Code** | 项目级 `.mcp.json` 或 `~/.claude.json`       | 推荐         |
| **Codex**       | `.codex/config.toml`（项目或用户级）         | 需声明 `cwd` |
| **Cursor**      | `.cursor/mcp.json`（项目或用户级）           | —            |
| **Qoder**       | **目前只能配在全局**（用户级），项目级不生效 | 见下方说明   |

详细的客户端配置示例参考根目录 [`README.md`](../README.md#step-2-配置-mcp)。

## 快速开始

### 1. 安装依赖

在仓库根目录跑：

```sh
pnpm install
```

### 2. 配置环境变量

playground 跑 MCP 时必须能读到 `LANHU_TOKEN`，否则 `get_design_context` 调用会直接报错退出。两种配法任选其一：

- **推荐**：在 playground 目录下新建 `.env.local`：
  ```dotenv
  LANHU_TOKEN=你的蓝湖_token
  ```
- 或者在 MCP 配置里通过 `env` 字段传入（Qoder 必须走这种方式，下面单独说）。

获取 Token 的方法见 [获取蓝湖 Token](https://lanhu.refineup.com/guide/get-lanhu-token)。

### 3. （建议）清理上次产物

每次开始新一轮演示之前，建议先执行清理，避免上一次的设计稿目录、切图、生成页面污染当前实验：

```sh
# 在仓库根目录
pnpm play:clean

# 或者在 playground 目录
pnpm clean
```

清理脚本会：

- 删除 `src/pages/` 下所有页面（保留空目录）
- 删除 `src/assets/` 下除 `css/` 和 `logo.svg` 之外的全部内容（之前的切图）
- 删除 `.lanhu-context-mcp.local/`（MCP files 模式生成的设计稿上下文目录）

幂等可重复执行。脚本本体在 [`scripts/clean.ts`](./scripts/clean.ts)。

### 4. 启动开发服务

```sh
# 根目录
pnpm play

# 或 playground 目录
pnpm dev
```

### 5. 在 AI 客户端里使用

打开你接入了 `lanhu-context-mcp` 的客户端，对话里贴一个蓝湖设计稿链接，让它调用 `get_design_context` 工具。生成的页面建议放在 `src/pages/<page-name>.vue`（kebab-case），切图放在 `src/assets/imgs/<page-name>/`。

## Qoder 用户特别说明

Qoder 目前不支持项目级 MCP 配置——必须在用户级（全局）添加。这意味着 `lanhu-context-mcp` 服务对所有项目共享，**默认的工作目录通常是 `/`**，落盘 `.lanhu-context-mcp.local/` 时会因为没有权限直接报错（`ENOENT: mkdir '/.lanhu-context-mcp.local'`）。

解决办法：在 MCP 配置里通过 `--cwd`（或 `env.CWD`）告诉 server 把工作目录切到你的 playground / 项目根，同时通过 `env` 显式传入 `LANHU_TOKEN`（stdio 子进程不会继承 shell 环境变量）：

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "lanhu-context-mcp",
        "--cwd",
        "/absolute/path/to/your-project"
      ],
      "env": {
        "LANHU_TOKEN": "你的蓝湖_token"
      }
    }
  }
}
```

也可以把 `--cwd` 改写在 env 段里：

```json
"env": {
  "LANHU_TOKEN": "你的蓝湖_token",
  "CWD": "/absolute/path/to/your-project"
}
```

优先级：`--cwd` > `CWD` env > 当前进程 cwd。路径不存在 / 不可访问时 server 启动阶段就会带清晰提示退出。

## 约定

继续看 [`AGENTS.md`](./AGENTS.md) 了解 AI 实现设计稿时遵守的硬约束（顶部展示区域忽略、容器高度、切图路径、页面命名等）。
