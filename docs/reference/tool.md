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

`content` 数组元素可能有三种类型：

| 元素类型        | 说明                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------- |
| `text`          | 文本块，包括 `HTML+CSS / HTML+Tailwind`、图片映射、`Design Tokens`、使用指引（仅 inline） |
| `image`         | 设计图预览，`mimeType` 为 `image/png`，`data` 为 base64（仅 inline）                      |
| `resource_link` | 指向本地文件的 `file://` URI，含 `name` / `mimeType`（仅 `mode=files`）                   |

### 成功返回示例（inline 默认）

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

### 成功返回示例（`mode=files`）

设计稿上下文打包成 `context.md` 写到 `<outDir>/<design-name>-<imageId8>/` 下，配合 `preview.png`（如有），tool result 只回 `resource_link`：

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

`context.md` 内部包含的内容和 inline 模式的多个 `text` 文本块完全一致（HTML / 图片映射 / Design Tokens / 使用指引），只是被串联成单份 markdown 落盘，AI 用 Read 工具一次读取即可消费。
