# Two issues, one design story: how `cwd` and `mode=files` came about

<p style="color: var(--vp-c-text-2); font-size: 0.9em;">Author: REFINIST · Updated 2026-05-16 18:35</p>

The community recently filed two valuable bug reports against `Lanhu Context MCP`, one per layer — integration and runtime. On the surface they look unrelated, but stepping back they share the same root: **an MCP server does not run in isolation. It depends on the client's runtime environment and on the upstream protocol's constraints, and the moment either assumption breaks, the whole pipeline does too.**

This post walks through both reports, their root causes, and the design choices that shipped.

## Issue #3: Qoder users can't start the server

The first report is [#3 qoder 支持这个 mcp 吗](https://github.com/refinist/lanhu-context-mcp/issues/3) (does Qoder support this MCP?).

The symptom is straightforward: configure the MCP in Qoder, call the tool, and the server exits because `LANHU_TOKEN` is missing.

The root cause is not Qoder itself but its MCP configuration model. Qoder currently only supports **user-level (global)** MCP configuration — unlike Claude Code / Cursor / Codex, where you can drop `.mcp.json` into a project root and have it follow the project.

A global MCP starts without project context. The process working directory is typically `/`. The tool's default `.env.local` lookup happens relative to that cwd, so the file is never found, the token stays undefined, and the server exits.

In other words: the actual failure is that `.env.local` cannot be located because there is no project root, **not** that Qoder is incompatible with MCP.

### Two ways out

The most direct fix is to put the token straight into the MCP config's `env` field, so the process picks it up from `process.env` and skips `.env.local` entirely:

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

**The recommended fix is the new `--cwd` flag**, which lets you tell the server explicitly where the project root is:

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
      ]
    }
  }
}
```

On startup, the server `process.chdir`s into the given path. Every downstream lookup — `.env.local`, `.lanhu-context-mcp.local/`, anything else cwd-relative — then behaves exactly the same as it would under a project-level MCP config. Your token stays in `.env.local`, your MCP config stays small, and future settings don't need to be migrated into the `env` field one by one.

## Issue #5: tool output exceeds 102.8KB

The second report is [#5 token 上限(102.8KB)](https://github.com/refinist/lanhu-context-mcp/issues/5) (token cap at 102.8KB).

For a large design, the inline-mode tool result packs in: full HTML, slice curl mappings, design tokens, the implementation guide, and the preview image. The HTML text alone easily blows past tens of thousands of tokens on a medium-complexity design. Some MCP clients enforce a hard cap on tool output length — for example, [Claude Code's `MAX_MCP_OUTPUT_TOKENS` defaults to 25000](https://code.claude.com/docs/en/mcp#mcp-output-limits-and-warnings) — so the response gets truncated, the model sees an incomplete context, and behavior becomes unpredictable.

### The fork in the road: raise the client's cap

Figma ran into the same class of issue. Their [Known issues with MCP clients](https://developers.figma.com/docs/figma-mcp-server/mcp-clients-issues/) doc recommends raising the client-side cap:

> Add or update the `MAX_MCP_OUTPUT_TOKENS` variable with a higher value (e.g., `50000` or `100000`).

That advice works fine for clients like Claude Code that **expose the knob**, but it has two real problems:

- not every client exposes the setting — some have the cap **hard-coded**
- even when tunable, asking users to bump a global environment variable pushes the tool's side effects onto them

So I didn't take this path.

### Our path: `mode=files`

With the new `--mode files`, the flow becomes:

- HTML / slice mappings / design tokens / guide are concatenated into a single `context.md`, written to `<outDir>/<design-name>-<imageId8>/`
- The preview image is written separately as `preview.png` in the same directory
- The tool result returns **only two `resource_link` items** — `file://` URIs pointing to the two files above

The bulk data never enters the tool result at all. Token cost in the tool response drops from tens of thousands to a handful of dozens. The model uses its own Read tool to consume `context.md` on demand, and the heavy payload no longer flows through the MCP protocol's tool-result bottleneck.

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp", "--mode", "files"]
    }
  }
}
```

The underlying trade-off is **let the client do less and let the tool handle big data itself**. MCP already supports `resource_link` semantics — point at a resource instead of embedding it — most tool implementations just don't use it.

### A side benefit: artifacts become reusable

Going down this path quietly unlocked another small win: **artifacts can be revisited across turns**.

In inline mode, every tool call re-injects the full context into the result, and once the model reads it once, it's effectively gone from working memory. In files mode, the model gets the `resource_link` once, knows where `context.md` lives, and can Read the same file again later (to double-check a class style, revisit the slice list, etc.) without forcing the user to fire another MCP call.
