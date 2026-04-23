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

- The current `css-to-tailwindcss` conversion path only supports Tailwind 3.
- If you need Tailwind 4, you can first consume `HTML+Tailwind` and then let the AI convert it one more time; the author has not deeply tested that flow yet.
- Tailwind 3 is already very usable, and there are plans to keep improving [`css-to-tailwindcss`](https://github.com/jackardios/css-to-tailwindcss) going forward.

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
