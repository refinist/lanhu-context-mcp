# 常用配置

这些配置同时支持 CLI 参数和环境变量；当两边同时存在时，优先以 CLI 参数为准，未显式传入时再回退到环境变量和默认值。

## `tailwindcss`

把主输出从 `HTML+CSS` 切换成 `HTML+Tailwind`。这个方向也和 Figma MCP 这类 `React like + Tailwind` 的输出思路比较一致，本质上都是先把设计上下文整理成更适合 AI 继续加工的形式。**对 AI 来说，Tailwind 通常会更友好**。

蓝湖默认是 `HTML + CSS（class）` 的输出形态，这里没有把“改写成 Tailwind”完全交给模型自己处理，而是先用 [`css-to-tailwindcss`](https://github.com/jackardios/css-to-tailwindcss) 做一次程序化转换。这样可以尽量减少 token 消耗，也能降低中间改写过程里的错误。

何时使用：

- 你的项目本身就在用 Tailwind
- 你希望 AI 后续继续在 utility class 基础上改写，而不是维护一大段自定义 CSS

示例：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": ["-y", "lanhu-context-mcp", "--tailwindcss"]
  }
}
```

```dotenv [.env.local]
TAILWINDCSS=1
```

:::

::: tip

- 当前 `css-to-tailwindcss` 这条转换链路只支持转到 Tailwind 3。
- 如果你需要 Tailwind 4，可以先拿到 `HTML+Tailwind`，再让 AI 继续转换一轮；这部分作者还没有深入尝试具体效果。
- 目前 Tailwind 3 已经很好用，后续也会继续推进 [`css-to-tailwindcss`](https://github.com/jackardios/css-to-tailwindcss) 这个开源工具的升级。
  :::

## `unit-scale`

按倍率缩放输出里的 `px` 数值。

何时使用：

- 当你接了 `px2rem` 等转换工具，发现当前设计稿落地后的尺寸整体偏大或偏小，可以先通过 `unitScale` 做一次整体校准
- 设计稿是 2x，你希望按 1x 数值落代码，可以试 `0.5`，设计稿是 1x，你希望按 2x 数值输出，可以试 `2`，这和之前你在蓝湖上开发时的配置处理是一个意思

示例：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": ["-y", "lanhu-context-mcp", "--unit-scale", "2"]
  }
}
```

```dotenv [.env.local]
UNIT_SCALE=2
```

:::

## `skip-slices`

跳过切图下载，不对HTML 做任何处理（也就是如果有图片会保留远程图片 URL）。

何时使用：

- 你现在只想先看结构和布局，不想先处理图片资产
- 你想要自己来控制切图下载，切图处理

示例：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": ["-y", "lanhu-context-mcp", "--skip-slices"]
  }
}
```

```dotenv [.env.local]
SKIP_SLICES=1
```

:::

## `env-file`

指定一个自定义 env 文件路径，用来加载 `LANHU_TOKEN` 和其他运行配置。

何时使用：

- 你不想把所有配置都堆在默认的 `.env.local`

示例：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": ["-y", "lanhu-context-mcp", "--env-file", ".env.staging"]
  }
}
```

:::

## `cwd`

显式覆盖 server 进程的工作目录。路径不存在或无权限时 server 启动阶段直接退出并打印清晰提示。

何时使用：

- 客户端只能在全局（用户级）配置 MCP，没有项目上下文，进程 cwd 通常会是 `/`，导致 `.env.local` 读不到、`.lanhu-context-mcp.local/` 写在根目录失败。**目前发现 Qoder 就是典型场景**
- 你希望 `.env.local` 和 `.lanhu-context-mcp.local/` 锚定到特定项目根，而不是客户端启动时的目录

示例：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": [
      "-y",
      "lanhu-context-mcp",
      "--cwd",
      "/absolute/path/to/your-project"
    ]
  }
}
```

```dotenv [.env.local]
CWD=/absolute/path/to/your-project
```

:::

## `mode`

切换工具的产出形态，可选 `inline` 或 `files`。未指定时默认 `inline`。

- `inline`（默认）：在 tool result 中直接返回全部内容——HTML / 切图映射 / Design Tokens / Guide / 预览图（base64）。
- `files`：把上述内容打包成 `context.md`，配合 `preview.png`，写到 `<outDir>/<design-name>-<imageId8>/` 下，tool result 仅返回两个 `resource_link`。**适合大设计稿，规避部分 MCP 客户端的 tool 输出 token 上限（有些客户端不可调整）**。

何时使用：

- inline 模式下经常碰到 tool 输出被截断（部分 MCP 客户端会强制限制 tool 结果 token，例如 Claude Code 的 `MAX_MCP_OUTPUT_TOKENS` 默认 25000）
- 你希望产物落到磁盘，便于检查或 AI 自己 Read 文件按需消费

示例：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": ["-y", "lanhu-context-mcp", "--mode", "files"]
  }
}
```

```dotenv [.env.local]
MODE=files
```

:::

## `out-dir`

`mode=files` 下设计稿上下文文件的产出目录。默认是 `<cwd>/.lanhu-context-mcp.local`。

`.local` 后缀沿用 Vite / Next.js 等约定，便于被通用的 gitignore 模板（`*.local`）自动屏蔽。

何时使用：

- 你希望产物落在指定路径，比如统一收纳到 `~/lanhu-output`
- 你的 MCP 客户端工作目录不可预期（见上方 `cwd`），需要显式锚定输出位置

示例：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": [
      "-y",
      "lanhu-context-mcp",
      "--mode",
      "files",
      "--out-dir",
      "/Users/you/lanhu-output"
    ]
  }
}
```

```dotenv [.env.local]
OUT_DIR=/Users/you/lanhu-output
```

:::
