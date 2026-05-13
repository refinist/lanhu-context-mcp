# 快速开始

## 环境要求

- Node.js `^20.19.0 || >=22.12.0`

## 设计稿转码

- 设计稿需要开启转码功能然后上传到蓝湖

<img
  src="/images/design2code.png"
  alt="Lanhu Helper Design2code"
  width="300"
/>

## Step 1. 准备环境变量

先创建一个 `.env.local` 文件。

你需要一个可用的蓝湖登录 Token，可参考 [获取蓝湖 Token](/guide/get-lanhu-token)。

把 `.env.local` 里的 `LANHU_TOKEN` 改成浏览器里复制的蓝湖 Token：

```dotenv
LANHU_TOKEN=your_lanhu_token_here
```

::: tip
建议把蓝湖 Token 写在 `.env.local` 里。因为这类本地环境文件通常不会提交到 Git 仓库，相对更安全。
:::

## Step 2. 配置 MCP

把下面对应客户端的 MCP 配置写入对应文件；如果使用 Qoder，在 MCP 服务页点击“添加”后粘贴配置：

::: code-group

```toml [Codex（.codex/config.toml）]
[mcp_servers.lanhu-context-mcp]
cwd = "/absolute/path/to/current-project"
command = "npx"
args = ["-y", "lanhu-context-mcp"]
```

```json [Claude Code（.mcp.json）]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp"]
    }
  }
}
```

```json [Cursor（.cursor/mcp.json）]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp"]
    }
  }
}
```

```json [Qoder（全局 MCP 服务）]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp"],
      "env": {
        "LANHU_TOKEN": "your_lanhu_token_here"
      }
    }
  }
}
```

:::

::: warning Codex
`Codex` 的 MCP 配置比较特殊，需要额外设置 `cwd`，并把它填写为当前项目的绝对路径。由于这个路径通常因人而异，通常不建议把 `.codex/config.toml` 提交到 Git，建议做好 Git 排除并由每位开发者在本地自行维护。
:::

::: warning Qoder
目前观察下来，`Qoder` 好像只能在全局配置 MCP 服务，暂时不能像项目内 `.env.local` 那样跟随项目切换。如果后续能跟随项目配置会更理想；现阶段建议在 Qoder 的 MCP 服务配置里同时写入 `LANHU_TOKEN`。
:::

**Windows**

如果在 Windows 下直接使用上面的 `npx` 配置启动失败，可以改用下面的写法：

::: code-group

```toml [Codex（WSL2）]
[mcp_servers.lanhu-context-mcp]
cwd = "/absolute/path/to/current-project"
command = "npx"
args = ["-y", "lanhu-context-mcp"]
```

```toml [Codex（原生）]
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

```json [Claude Code]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "lanhu-context-mcp"]
    }
  }
}
```

```json [Cursor]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "lanhu-context-mcp"]
    }
  }
}
```

```json [Qoder]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "lanhu-context-mcp"],
      "env": {
        "LANHU_TOKEN": "your_lanhu_token_here"
      }
    }
  }
}
```

:::

::: tip
`Codex（原生）` 的 fallback 写法参考这里：<a href="https://github.com/openai/codex/issues/2555#issuecomment-3381914894" target="_blank" rel="noreferrer">openai/codex#2555</a>
:::

## Step 3. 安装 Lanhu Helper 谷歌浏览器插件

安装 <a href="/ecosystem/lanhu-helper" target="_blank" rel="noreferrer">Lanhu Helper</a> 谷歌浏览器插件，这样可以直接从蓝湖右键复制选中图层链接或示例提示词。

## Step 4. 将蓝湖链接和提示词发给 AI

```text
请根据这个蓝湖设计稿实现
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
请根据这个蓝湖设计稿新增一个页面
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
请根据这个蓝湖设计稿实现 pages/foo-bar.vue 页面
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

::: tip
提示词可以按你的想法来写，但蓝湖 URL 必须确保完整且正确，否则无法正常调用 Tool。
:::

🎉 enjoy ~
