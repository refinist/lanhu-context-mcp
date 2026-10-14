# Lanhu Helper

## Installation

Just install [Lanhu Helper](https://chromewebstore.google.com/detail/lanhu-helper/kicpebokhdkhmoeplbbfjlfngnioijio) directly from the Chrome Web Store. Click "Add to Chrome" to finish in one step.

## What Is Lanhu Helper?

`Lanhu Helper` is a companion plugin for this MCP, currently shipped as a Chrome extension.  
It does not call the MCP directly, and it does not replace the MCP. Right-click a Lanhu layer and the top of that menu gains four items, in this order: Copy Sample Prompt, Copy Selected Layer Link, Copy Token, and Set Prompt Template. Right-clicking empty page space does not show them.

The layer link can be used directly as input to `lanhu-context-mcp`. The extension builds the detail URL from the current page's `tid`, `pid/project_id`, and the selected layer's `image_id`. Lanhu navigation often drops `tid` from the address bar, and `tid` is required for the tool call. The link copied from the menu keeps that value when the page still has it.

“复制 Token” (Copy Token) copies the cookie readable on the current logged-in page. Paste it into `LANHU_TOKEN` in the project's `.env.local`.

## Features

### Copy Selected Layer Link

The extension reads the currently selected layer id, combines it with the current page's `tid` and `pid/project_id`, then builds a complete design detail URL and copies it to your clipboard.

This link is already in a format that `lanhu-context-mcp` can consume directly, so you do not need to manually inspect params or fill in `image_id`. It also helps reduce issues caused by missing `tid` values after Lanhu navigation.

### Copy Sample Prompt

The extension can generate a prompt that is ready to paste into your AI chat, with the real Lanhu detail URL already included.

The default template is roughly:

```text
Please implement based on this Lanhu design
@{link}
```

When copied, `{link}` is replaced with the real detail URL for the current selected layer.

### Copy Token

On a logged-in Lanhu page, right-click a layer and choose “复制 Token” (Copy Token). The extension reads the cookie available on the current page, copies it to the clipboard, and tells you to write it into the project's `.env.local` like this:

```dotenv
LANHU_TOKEN=the value you just copied
```

That value is the `LANHU_TOKEN` `lanhu-context-mcp` expects. The extension reads the current page cookie only when you click the menu item, then stops at the clipboard. It does not store or upload the value.

If the page has no readable cookie, the toast says there is no readable token. Log in to Lanhu, then try again.

### Prompt Template Preset

The right-click menu also includes a `设置提示词模板` (`Set Prompt Template`) entry so you can customize what `复制示例提示词` (`Copy Sample Prompt`) generates.

You can prefill common task descriptions, code paths, or stack-specific requirements in the template, and keep only `{link}` as the placeholder. After saving, the extension will automatically replace `{link}` with the current layer link whenever you copy the prompt.

## Screenshots

The right-click menu now lists “复制示例提示词” (Copy Sample Prompt), “复制选中图层链接” (Copy Selected Layer Link), “复制 Token” (Copy Token), and “设置提示词模板” (Set Prompt Template) at the top, in that order. The screenshots below were taken before “复制 Token” was added. The other items still appear in the same place and style:

![Lanhu Helper screenshot-1](/images/screenshot-1.png)

![Lanhu Helper screenshot-2](/images/screenshot-2.png)

![Lanhu Helper screenshot-3](/images/screenshot-3.png)
