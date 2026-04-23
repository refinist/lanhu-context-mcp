# 工具

`get_design_context`

## 入参

| 字段  | 类型     | 必填 | 说明                                                                 |
| ----- | -------- | ---- | -------------------------------------------------------------------- |
| `url` | `string` | 是   | 蓝湖设计稿详情 URL，需包含 `tid`、`pid/project_id`、`image_id/docId` |

### URL 示例

```text
https://lanhuapp.com/web/#/item/project/detailDetach?tid={tid}&pid={pid}&project_id={project_id}&image_id={image_id}
```

## 出参

成功时返回 MCP 的 `content` 数组。

`content` 数组元素可能有两种类型：

| 元素类型 | 说明                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| `text`   | 文本块，包括 `HTML+CSS / HTML+Tailwind`、图片映射、`Design Tokens`、使用指引 |
| `image`  | 设计图预览，`mimeType` 为 `image/png`，`data` 为 base64                      |

### 成功返回示例

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

默认 `PROMPT_LANG` 为 `en-US`，所以上述示例展示的是英文指引文本。实际返回中，`content` 还可能包含图片映射和 `Design Tokens` 文本块。
