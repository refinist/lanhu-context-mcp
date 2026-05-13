# lanhu-context-mcp

[简体中文](./README.md) | English

[![npm](https://img.shields.io/npm/v/lanhu-context-mcp.svg?colorA=2878ff&colorB=000000)](https://npmjs.com/package/lanhu-context-mcp) [![downloads/month](https://img.shields.io/npm/dm/lanhu-context-mcp.svg?colorA=2878ff&colorB=000000)](https://npmjs.com/package/lanhu-context-mcp) [![Unit Test](https://img.shields.io/github/actions/workflow/status/refinist/lanhu-context-mcp/unit-test.yml?colorA=2878ff&colorB=000000&label=Unit%20Test)](https://github.com/refinist/lanhu-context-mcp/actions/workflows/unit-test.yml) [![codecov](https://img.shields.io/codecov/c/github/refinist/lanhu-context-mcp?colorA=2878ff&colorB=000000)](https://codecov.io/github/refinist/lanhu-context-mcp)

✨ Turns Lanhu designs into context for AI to generate code and recreate pages.

## Features

- 🎨 Supports both `HTML+CSS` and `HTML+Tailwind` output, so you can choose the form that fits your stack better
- 🖼️ Returns slice asset mappings and download commands to reduce manual image handling
- 🧱 Includes `Design Tokens` and a design preview for downstream implementation and visual checking
- 🧭 Attaches implementation guidance for downstream AI, including priorities, adaptation rules, and constraints
- ⚙️ Supports CLI flags and environment variables for `Tailwind` output, skipping slices, unit scaling, and prompt language

## Documentation

For full documentation, visit [lanhu.refineup.com](https://lanhu.refineup.com).

## Getting Started

### Requirements

- Node.js `^20.19.0 || >=22.12.0`

### Design Transcoding

- Enable transcoding for the design before uploading it to Lanhu

### Step 1. Prepare environment variables

First, create a `.env.local` file.

You need a valid Lanhu login token. See [Get a Lanhu Token](https://lanhu.refineup.com/en/guide/get-lanhu-token).

```dotenv
LANHU_TOKEN=your_lanhu_token_here
```

### Step 2. Configure MCP

Add the matching MCP config to the corresponding file. For Qoder, open the MCP Services page, click Add, and paste the config:

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

Qoder (global MCP service)

```json
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

`Codex` needs one extra field here: set `cwd` to the absolute path of your current project. Because that path usually differs across developers, `.codex/config.toml` should usually stay local and not be committed to Git.

From current testing, `Qoder` seems to support MCP services as a global configuration only, so it does not follow the project's `.env.local` automatically. Project-level configuration would be ideal if supported later; for now, put `LANHU_TOKEN` directly in the Qoder MCP service config.

**Windows**

If the `npx` config above fails to start on Windows, use the following fallback:

Codex (WSL2)

```toml
[mcp_servers.lanhu-context-mcp]
cwd = "/absolute/path/to/current-project"
command = "npx"
args = ["-y", "lanhu-context-mcp"]
```

Codex (Native)

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

Claude Code (`.mcp.json`) / Cursor (`.cursor/mcp.json`)

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

Qoder (global MCP service)

```json
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

`Codex` native fallback reference:
[openai/codex#2555](https://github.com/openai/codex/issues/2555#issuecomment-3381914894)

### Step 3. Install the Lanhu Helper Chrome extension

Install [Lanhu Helper](https://lanhu.refineup.com/en/ecosystem/lanhu-helper) so you can copy the selected-layer link or sample prompt directly from Lanhu.

### Step 4. Send the Lanhu link and prompt to AI

```text
Please implement based on this Lanhu design
@https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

```text
https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

You can write the prompt however you like, but the Lanhu URL must be complete and correct or the tool cannot be called properly.

[See more documentation](https://lanhu.refineup.com/en/guide/getting-started)

## Ecosystem

[Lanhu Helper](https://lanhu.refineup.com/en/ecosystem/lanhu-helper) — Companion Chrome extension for Lanhu. Right-click inside Lanhu to copy the selected layer's URL and ready-made prompts.

## License

[MIT](./LICENSE)

Copyright (c) 2026-present, [REFINIST](https://github.com/refinist)
