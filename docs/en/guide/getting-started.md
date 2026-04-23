# Getting Started

## Requirements

- Node.js `^20.19.0 || >=22.12.0`

## Design Transcoding

- Enable transcoding for the design file before uploading it to Lanhu.

## Step 1. Prepare environment variables

First, create a `.env.local` file.

You need a valid Lanhu login token. See [Get a Lanhu Token](/en/guide/get-lanhu-token).

Set `LANHU_TOKEN` in `.env.local` with the Lanhu token copied from your browser:

```dotenv
LANHU_TOKEN=your_lanhu_token_here
```

::: tip
We recommend keeping your Lanhu token in `.env.local`. Local env files like this are usually not committed to Git, which is safer.
:::

## Step 2. Configure MCP

Add the matching MCP config to the corresponding file for your client:

::: code-group

```toml [Codex (.codex/config.toml)]
[mcp_servers.lanhu-context-mcp]
cwd = "/absolute/path/to/current-project"
command = "npx"
args = ["-y", "lanhu-context-mcp"]
```

```json [Claude Code (.mcp.json)]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp"]
    }
  }
}
```

```json [Cursor (.cursor/mcp.json)]
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp"]
    }
  }
}
```

:::

::: warning Codex
`Codex` is a bit special here: set `cwd` to the absolute path of your current project. Because this path usually differs across developers, `.codex/config.toml` should usually be excluded from Git and maintained locally by each developer.
:::

**Windows**

If the `npx` config above fails to start on Windows, use the following fallback:

::: code-group

```toml [Codex (WSL2)]
[mcp_servers.lanhu-context-mcp]
cwd = "/absolute/path/to/current-project"
command = "npx"
args = ["-y", "lanhu-context-mcp"]
```

```toml [Codex (Native)]
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

:::

::: tip
`Codex (Native)` fallback: <a href="https://github.com/openai/codex/issues/2555#issuecomment-3381914894" target="_blank" rel="noreferrer">openai/codex#2555</a>
:::

## Step 3. Install the Lanhu Helper Chrome extension

Install <a href="/en/ecosystem/lanhu-helper" target="_blank" rel="noreferrer">Lanhu Helper</a> so you can copy the selected-layer link or sample prompt directly from Lanhu.

## Step 4. Send the Lanhu link and prompt to AI

```text
Please implement based on this Lanhu design
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
Please create a new page based on this Lanhu design
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
Please implement the pages/foo-bar.vue page based on this Lanhu design
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

::: tip
You can write the prompt however you like, but the Lanhu URL must be complete and correct, or the tool cannot be called properly.
:::
