# Lanhu Helper

## What Is Lanhu Helper?

`Lanhu Helper` is a companion plugin for this MCP, currently shipped as a Chrome extension.  
It does not call the MCP directly, and it does not replace the MCP. Its job is simpler and very practical: quickly get the exact link for the currently selected layer inside Lanhu.

That link can be used directly as input to `lanhu-context-mcp`, so you do not need to manually inspect the Lanhu page, find `image_id`, or piece together the detail URL yourself.

This also helps with a common Lanhu navigation issue where the `tid` param is missing from the address bar. Since `tid` is a required input, losing it can break the tool call.

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

### Prompt Template Preset

The right-click menu also includes a `设置提示词模板` entry so you can customize what `复制示例提示词` generates.

You can prefill common task descriptions, code paths, or stack-specific requirements in the template, and keep only `{link}` as the placeholder. After saving, the extension will automatically replace `{link}` with the current layer link whenever you copy the prompt.

## Installation

### Install from the Chrome Web Store

We recommend installing `Lanhu Helper` from the Chrome Web Store first.

### Install from the zip package (Early access)

If you want earlier access to new features, you can also install it manually from the zip package below. Chrome Web Store review usually takes time, so the latest version may not appear in the store immediately.

[Download lanhu-helper-v0.0.4.zip](/downloads/lanhu-helper-v0.0.4.zip)

Installation steps:

1. Download the zip above
2. Unzip it locally
3. Open `chrome://extensions`
4. Turn on `Developer mode`
5. Click `Load unpacked`
6. Select the extracted extension directory

## Screenshots

The images below show the current right-click menu. The extension's shortcut actions appear at the top of the menu.

![Lanhu Helper screenshot-1](/images/screenshot-1.png)

![Lanhu Helper screenshot-2](/images/screenshot-2.png)

![Lanhu Helper screenshot-3](/images/screenshot-3.png)
