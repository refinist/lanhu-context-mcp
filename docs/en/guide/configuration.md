# Common Settings

These settings support both CLI flags and environment variables. When both are present, CLI flags take precedence; if a value is not passed explicitly, it falls back to the environment variable and then to the default value.

## `tailwindcss`

Switches the primary output from `HTML+CSS` to `HTML+Tailwind`. This also follows the same general direction as Figma MCP's more `React-like + Tailwind` style of output: turn design context into a format that AI can continue working with more easily. **For AI workflows, Tailwind is usually friendlier.**

Lanhu's default output is `HTML + CSS (class)` in shape. Instead of asking the model to fully rewrite that into Tailwind on its own, this project first runs a programmatic conversion with [`css-to-tailwindcss`](https://github.com/jackardios/css-to-tailwindcss). That helps reduce token usage and also lowers the chance of errors during the rewrite step.

When to use:

- your project already uses Tailwind
- you want the AI to keep refining on top of utility classes instead of maintaining a large block of custom CSS

Example:

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

- ~~The current `css-to-tailwindcss` conversion path only supports Tailwind 3.~~
- ~~If you need Tailwind 4, you can first consume `HTML+Tailwind` and then let the AI convert it one more time; the author has not deeply tested that flow yet.~~
- Converting straight to Tailwind 4 is now supported: pick the target version with the [`tw-version`](#tw-version) option below; the v4 path uses [`css-to-tailwindcss4`](https://github.com/refinist/css-to-tailwindcss4), written by the author for exactly this.
- Tailwind 3 is already very usable, and both conversion paths will keep improving going forward.

:::

## `tw-version`

Picks the target Tailwind major version used when `tailwindcss` is enabled: `3` (default) or `4`. Only takes effect together with `tailwindcss`.

- `3` (default): keeps using [`css-to-tailwindcss`](https://github.com/jackardios/css-to-tailwindcss) — identical behavior to previous releases.
- `4`: uses [`css-to-tailwindcss4`](https://github.com/refinist/css-to-tailwindcss4), which emits Tailwind CSS v4 utility names and syntax (gradients like `bg-linear-to-r from-[#ff6034] to-[#ee0a24]`, font-weight keywords as `font-bold`, slash opacity like `text-white/50`). Its output is regression-tested against the real Tailwind v4 compiler.

When to use:

- your project is on Tailwind CSS v4 (CSS-first configuration)
- you don't want the AI to rewrite v3 output into v4 as a second pass

Example:

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": ["-y", "lanhu-context-mcp", "--tailwindcss", "--tw-version", "4"]
  }
}
```

```dotenv [.env.local]
TAILWINDCSS=1
TW_VERSION=4
```

:::

::: tip
The v4 path is powered by [`css-to-tailwindcss4`](https://github.com/refinist/css-to-tailwindcss4), maintained by the author and kept up to date with new Tailwind releases. The default stays `3`, so existing users are unaffected. If you hit conversion issues, please report them at [css-to-tailwindcss4 issues](https://github.com/refinist/css-to-tailwindcss4/issues).
:::

## `unit-scale`

Scales `px` values in the output by a multiplier.

When to use:

- if you use tools like `px2rem` and the rendered result ends up uniformly too large or too small, `unitScale` is a good first pass for global calibration
- if the design is effectively 2x and you want 1x values in code, try `0.5`; if the design is effectively 1x and you want 2x output, try `2` as the same kind of scaling adjustment you may already have used in Lanhu-based workflows

Example:

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

Skips slice downloads and leaves the HTML untouched, which means image URLs stay as remote URLs when images are present.

When to use:

- you only want to inspect structure and layout first, without handling image assets yet
- you want to control slice downloading and image handling yourself

Example:

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

Points to a custom env file for loading `LANHU_TOKEN` and other runtime settings.

When to use:

- you do not want all configuration to live in the default `.env.local`

Example:

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

Override the server process' working directory. The server exits early with a clear message if the path does not exist or is not accessible.

When to use:

- the client spawns the MCP child process with a working directory that does not point at the current project (`process.cwd()` is typically `/` or the client's launch directory), breaking both `.env.local` lookup and the default `.lanhu-context-mcp.local/` write. **As of writing, TRAE / Codex / Qoder all require passing it explicitly.**
- you want `.env.local` and `.lanhu-context-mcp.local/` anchored to a specific project root, not wherever the client happened to launch from

Example:

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

::: tip No need to hardcode the path
Editors that support variable substitution (VSCode and friends) can use a built-in variable instead of an absolute path, so the config is shareable across the team and nobody has to edit it by hand:

```json
"args": ["-y", "lanhu-context-mcp", "--cwd", "${workspaceFolder}"]
```

:::

## `mode`

Switches the tool output shape. Either `inline` or `files`. Defaults to `inline`.

- `inline` (default): everything is returned in the tool result — HTML, asset mapping, design tokens, guide, preview image (base64).
- `files`: the same content is packed into a single `context.md` (plus `preview.png`) under `<outDir>/<design-name>-<imageId8>/`, and the tool result returns only two `resource_link` entries. **Best for large designs and for sidestepping the tool-result token cap enforced by some MCP clients (not always user-tunable).**

When to use:

- you keep hitting tool-result truncation in inline mode (some clients enforce a hard cap on MCP tool output — e.g. Claude Code's `MAX_MCP_OUTPUT_TOKENS` defaults to 25000)
- you want artifacts on disk so you (or the AI) can inspect / Read them on demand

Example:

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

The artifacts directory where files-mode output lands. Defaults to `<cwd>/.lanhu-context-mcp.local`.

The `.local` suffix follows the Vite / Next.js convention so that common gitignore templates (`*.local`) exclude these artifacts automatically.

When to use:

- you want artifacts in a specific location, e.g. consolidated under `~/lanhu-output`
- your MCP client's working directory is unpredictable (see `cwd` above) and you want to anchor output explicitly

Example:

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
