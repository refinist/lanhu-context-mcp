# Lanhu Helper

## 安装方式

直接从 Chrome 网上应用店安装 [Lanhu Helper](https://chromewebstore.google.com/detail/lanhu-helper/fdeeagdmeiddheeegkeaoklicgjblcin) 即可，点击「添加至 Chrome」一键完成。

## 什么是 Lanhu Helper？

`Lanhu Helper` 是配套这个 MCP 使用的蓝湖插件，当前以 Chrome 扩展形式提供。  
它本身不调用 MCP，也不替代 MCP。在蓝湖的图层上右键，菜单顶部会多出四项，顺序是：复制示例提示词、复制选中图层链接、复制 Token、设置提示词模板。页面空白处右键不会出现这些项。

图层链接可以直接作为 `lanhu-context-mcp` 的输入。扩展会用当前页面的 `tid`、`pid/project_id` 和选中图层的 `image_id` 拼出详情页链接。蓝湖跳转后地址栏经常丢掉 `tid`，而 `tid` 是 tool 的必要入参，菜单里复制出来的链接会尽量把这项补上。

「复制 Token」复制的是当前已登录页面可读的 Cookie，写入项目 `.env.local` 的 `LANHU_TOKEN` 即可。

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

### 复制 Token

在已登录的蓝湖页面里，在图层上右键，选择「复制 Token」。扩展会读取当前页面可读的 Cookie，复制到剪贴板，并提示按下面的格式写入项目 `.env.local`：

```dotenv
LANHU_TOKEN=刚才复制的内容
```

这段内容就是 `lanhu-context-mcp` 需要的 `LANHU_TOKEN`。它只在点击菜单时读取当前页 Cookie，复制到剪贴板后即结束，不会另存，也不会上传。

页面没有可读 Cookie 时，会提示「当前页面没有可读的 Token」。先确认已经登录蓝湖，再试一次。

### 提示词模板预设

右键菜单里还提供了 `设置提示词模板` 入口，可以自定义“复制示例提示词”生成的内容。

你可以把常用的任务描述、代码路径、技术栈要求等预先写进模板里，只保留 `{link}` 作为占位符。保存后，扩展会在复制提示词时自动把 `{link}` 替换成当前图层链接。

## 使用截图

右键菜单顶部现在依次是「复制示例提示词」「复制选中图层链接」「复制 Token」和「设置提示词模板」。下面的截图拍摄时还没有「复制 Token」，其余几项的位置和样式与现在一致：

![Lanhu Helper screenshot-1](/images/screenshot-1.png)

![Lanhu Helper screenshot-2](/images/screenshot-2.png)

![Lanhu Helper screenshot-3](/images/screenshot-3.png)
