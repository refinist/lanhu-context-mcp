# Tool

`get_design_context`

## Input

| Field | Type     | Required | Description                                                                      |
| ----- | -------- | -------- | -------------------------------------------------------------------------------- |
| `url` | `string` | Yes      | Lanhu design detail URL containing `tid`, `pid/project_id`, and `image_id/docId` |

### URL example

```text
https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

## Output

On success, the tool returns an MCP `content` array.

`content` array items can be one of three types:

| Item type       | Description                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `text`          | Text blocks including `HTML+CSS / HTML+Tailwind`, asset mappings, `Design Tokens`, and guidance text (inline only) |
| `image`         | Design preview, with `mimeType` set to `image/png` and `data` as base64 (inline only)                              |
| `resource_link` | `file://` URI pointing to a local artifact, with `name` / `mimeType` (files mode only)                             |

### Success example (inline, default)

```json
{
  "content": [
    {
      "type": "text",
      "text": "HTML+CSS Code:\n<div class=\"page\">...</div>"
    },
    {
      "type": "text",
      "text": "Project: Example Project\nDesign: Home\nSUPER CRITICAL: The generated code must be adapted to match the target project's technology stack and styling system.\n1. Analyze the target codebase..."
    },
    {
      "type": "image",
      "mimeType": "image/png",
      "data": "{base64}"
    }
  ]
}
```

Since the default `PROMPT_LANG` is `en-US`, the example above shows English guidance text. Actual responses may also include asset mappings and `Design Tokens` text blocks.

### Success example (`mode=files`)

The design context is packed into `context.md` under `<outDir>/<design-name>-<imageId8>/`, alongside `preview.png` when present, and the tool result returns only `resource_link` items:

```json
{
  "content": [
    {
      "type": "resource_link",
      "uri": "file:///abs/path/.lanhu-context-mcp.local/Home-9217845f/context.md",
      "name": "context.md",
      "mimeType": "text/markdown"
    },
    {
      "type": "resource_link",
      "uri": "file:///abs/path/.lanhu-context-mcp.local/Home-9217845f/preview.png",
      "name": "preview.png",
      "mimeType": "image/png"
    }
  ]
}
```

The body of `context.md` carries exactly the same content inline mode would emit as multiple `text` blocks (HTML, asset mapping, design tokens, guide) — only here it is joined into a single markdown file the AI can consume with a single Read call.
