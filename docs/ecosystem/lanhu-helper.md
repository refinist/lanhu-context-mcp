# Lanhu Helper

## 什么是 Lanhu Helper？

`Lanhu Helper` 是配套这个 MCP 使用的蓝湖插件，当前以 Chrome 扩展形式提供。  
它本身不调用 MCP，也不替代 MCP；它解决的是另一个很实际的问题：在蓝湖页面里快速拿到“当前选中图层”的精确链接。

这个链接正好可以作为 `lanhu-context-mcp` 的输入来源，让你不用手动在蓝湖页面里翻参数、找 `image_id`、拼详情页 URL。

同时也恰好用这种方式修复了蓝湖跳转链接时，经常有 `tid` 参数在导航栏缺失的问题（`tid` 作为关键的入参，缺失将会影响到 tool 的调用）。

## 功能点

### 复制选中图层链接

会读取你当前在蓝湖里选中的图层 id，并结合当前页面里的 `tid`、`pid/project_id` 自动拼出完整的设计稿详情链接，然后直接复制到剪贴板。

这个链接已经是 `lanhu-context-mcp` 可直接消费的输入格式，不需要你再手动翻参数、补 `image_id`，也能尽量规避蓝湖页面跳转时 `tid` 丢失的问题。

### 复制示例提示词

会基于当前选中图层生成一段可直接粘贴到 AI 对话里的提示词，并把真实的蓝湖详情链接一起带上。

默认模板大致是下面这种形式：

```text
请根据这个蓝湖设计稿实现
@{link}
```

实际复制时，`{link}` 会被替换成当前图层对应的真实详情链接。

### 提示词模板预设

右键菜单里还提供了 `设置提示词模板` 入口，可以自定义“复制示例提示词”生成的内容。

你可以把常用的任务描述、代码路径、技术栈要求等预先写进模板里，只保留 `{link}` 作为占位符。保存后，扩展会在复制提示词时自动把 `{link}` 替换成当前图层链接。

## 安装方式

### 从 Chrome 网上应用店安装

推荐优先从 Chrome 网上应用店安装 [Lanhu Helper](https://chromewebstore.google.com/detail/lanhu-helper/kicpebokhdkhmoeplbbfjlfngnioijio)。

### 从压缩包安装（抢先体验）

如果你想及时体验新功能，也可以使用下面这个压缩包手动安装。因为商店审核通常需要一定时间，最新版本不会立即同步到商店。

<LatestLanhuHelperDownloadLink
  prefix="点击下载"
  empty-text="当前暂无可下载文件"
/>

安装步骤：

1. 下载上面的 zip
2. 解压到本地目录
3. 打开 `chrome://extensions`
4. 打开右上角 `开发者模式`
5. 点击 `加载已解压的扩展程序`
6. 选择解压后的扩展目录

## 使用截图

下面这张图是当前版本的右键菜单效果，扩展提供的几个快捷动作都会显示在菜单顶部：

![Lanhu Helper screenshot-1](/images/screenshot-1.png)

![Lanhu Helper screenshot-2](/images/screenshot-2.png)

![Lanhu Helper screenshot-3](/images/screenshot-3.png)
