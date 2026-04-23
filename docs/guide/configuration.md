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
