# 获取蓝湖 Token

这里说的蓝湖 Token，实际就是从浏览器请求头里的 `Cookie` 值中复制出来的那一整段内容。

## 前提

- 你已经能正常登录蓝湖
- 推荐使用 Chrome

## 操作步骤

1. 打开 `https://lanhuapp.com` 并确认自己处于登录状态
2. 打开浏览器开发者工具，切到 `Network（网络）`
3. 刷新当前页面
4. 顶部过滤栏，选择 `Fetch/XHR`，然后在请求列表里随便点一个 `lanhuapp.com` 域名的请求，
5. 在 `Headers` 里的 `Request Headers` 区域找到 `Cookie`
6. 只复制 `Cookie` 后面的整段内容，不要带上 `Cookie` 这几个字，这一整段内容就是这里使用的 Token

拿到 Token 后，直接按[快速开始的环境变量步骤](/guide/getting-started#step-1-准备环境变量)写入即可。

::: warning 注意
Token 会过期。遇到认证失败、蓝湖要求重新登录、或者服务突然无法访问时，重新登录蓝湖并重新复制一次即可。
:::

::: danger 安全提示
蓝湖 Token 等同于登录凭证。不要把 Token 提交到公开仓库，不要分享给他人，只在本地环境里使用。
:::
