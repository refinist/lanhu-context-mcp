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

`content` array items can be one of two types:

| Item type | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| `text`    | Text blocks including `HTML+CSS / HTML+Tailwind`, asset mappings, `Design Tokens`, and guidance text |
| `image`   | Design preview, with `mimeType` set to `image/png` and `data` as base64                              |

### Simple success example

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
