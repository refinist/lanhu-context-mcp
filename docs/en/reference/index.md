# General

Supports configuration through CLI flags and environment variables.

## Configuration priority

Runtime values are resolved in this order:

1. CLI flags
2. environment variables
3. env file
4. code defaults

When loading from an env file, the file-selection priority is:

1. `--env-file`
2. `ENV_FILE`
3. default `.env.local`

## Configuration items

| Item                | CLI flag             | Env var        | Default                          | Description                                                                                                                                                                                                      |
| ------------------- | -------------------- | -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lanhu token         | `--lanhu-token`      | `LANHU_TOKEN`  | None                             | Primary Lanhu token. It is usually stored in `.env.local`. The process exits if missing                                                                                                                          |
| DDS token           | `--dds-token`        | `DDS_TOKEN`    | `LANHU_TOKEN`                    | DDS token, defaulting to the main token                                                                                                                                                                          |
| env file path       | `--env-file`         | `ENV_FILE`     | `.env.local`                     | Custom env file path, with `--env-file` taking priority                                                                                                                                                          |
| Request timeout     | `--http-timeout`     | `HTTP_TIMEOUT` | `30000`                          | Request timeout in milliseconds                                                                                                                                                                                  |
| Transport mode      | `--stdio` / `--http` | `STDIO`        | `true`                           | Uses stdio by default; switch to HTTP with `--http` or `STDIO=false`                                                                                                                                             |
| HTTP host           | `--host`             | `HOST`         | `127.0.0.1`                      | HTTP host                                                                                                                                                                                                        |
| HTTP port           | `--port`             | `PORT`         | `5200`                           | HTTP port                                                                                                                                                                                                        |
| Tailwind output     | `--tailwindcss`      | `TAILWINDCSS`  | `false`                          | Switches the main output from `HTML+CSS` to `HTML+Tailwind`                                                                                                                                                      |
| Skip slices         | `--skip-slices`      | `SKIP_SLICES`  | `false`                          | Skips asset mappings and keeps remote image URLs                                                                                                                                                                 |
| Unit scale          | `--unit-scale`       | `UNIT_SCALE`   | `1`                              | Multiplies CSS `px` values by a scale factor                                                                                                                                                                     |
| Guidance language   | `--prompt-lang`      | `PROMPT_LANG`  | `en-US`                          | Tool guidance language: `en-US` or `zh-CN`                                                                                                                                                                       |
| Working directory   | `--cwd`              | `CWD`          | process cwd                      | Override the server process working directory; the server exits early if the path does not exist or is not accessible. For clients that only allow global MCP configuration with no project context (e.g. Qoder) |
| Output mode         | `--mode`             | `MODE`         | `inline`                         | Tool output shape: `inline` returns everything in the tool result, `files` writes `context.md` + `preview.png` to disk and returns only `resource_link` items                                                    |
| Artifacts directory | `--out-dir`          | `OUT_DIR`      | `<cwd>/.lanhu-context-mcp.local` | Output directory for files-mode artifacts; absolute or relative paths supported                                                                                                                                  |
