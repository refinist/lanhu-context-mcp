# 从两个 issue 谈起：cwd 和 mode=files 的设计思路

<p style="color: var(--vp-c-text-2); font-size: 0.9em;">作者：REFINIST · 更新于 2026-05-16 18:35</p>

最近社区给了两个挺有价值的反馈，分别对应到 `Lanhu Context MCP` 接入和运行时的两个真实痛点。这两个问题表面上很不一样，但在做完之后回头看，会发现它们其实是同一类问题：**MCP server 并不是孤立运行的，它对客户端的运行环境和上游协议都有依赖，任何一端的假设不成立，整条链路就会断**。

这一篇就把这两条反馈、各自的根因和最后落地的解决方案串起来记一下。

## Issue #3：Qoder 用户跑不起来

第一条反馈来自 [#3 qoder 支持这个 mcp 吗](https://github.com/refinist/lanhu-context-mcp/issues/3)。

现象很直接：在 Qoder 里配好 MCP，工具一调用就因为 `LANHU_TOKEN` 缺失直接退出。

根因不在 Qoder 本身，而在它的 MCP 配置模式：Qoder 目前只支持**用户级（全局）**的 MCP 配置——不像 Claude Code / Cursor / Codex 那样可以把 `.mcp.json` 放到项目根下，跟随项目切换。

全局 MCP 启动时没有项目上下文，进程的工作目录通常是 `/`，工具默认从当前目录读取的 `.env.local` 自然就读不到，token 缺失，server 启动即退出。

也就是说，问题的本质是 `.env.local` 因为找不到项目根而读不到，**不是 Qoder 不支持 MCP**。

### 两种解法

最直接的办法是把 token 直接写在 MCP 配置的 `env` 字段里——这样进程一启动就能从 `process.env` 拿到 token，绕过 `.env.local` 这一步：

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp"],
      "env": {
        "LANHU_TOKEN": "your_lanhu_token_here"
      }
    }
  }
}
```

**更推荐的做法是用新增的 `--cwd` 参数**显式告诉 server「当前项目根在哪儿」：

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "lanhu-context-mcp",
        "--cwd",
        "/absolute/path/to/your-project"
      ]
    }
  }
}
```

server 一启动就 `process.chdir` 到指定路径，然后所有下游逻辑（`.env.local` 读取、`.lanhu-context-mcp.local/` 写入）都自然走 cwd-relative 路径，跟项目级 MCP 配置的行为完全一致。token 还是放在你项目根的 `.env.local` 里，配置文件干净，新增配置项也不用动 MCP 配置。

## Issue #5：tool 输出超过 102.8KB

第二条反馈来自 [#5 token 上限(102.8KB)](https://github.com/refinist/lanhu-context-mcp/issues/5)。

大设计稿一调用，inline 模式下 tool 结果里会塞进：HTML 全文 + 切图 curl 映射 + Design Tokens + Guide + 预览图。光是 HTML 文本部分，中等复杂度的稿子就很容易冲到几万 token，部分 MCP 客户端会强制限制 tool 输出长度（比如 [Claude Code 的 `MAX_MCP_OUTPUT_TOKENS` 默认 25000](https://code.claude.com/docs/en/mcp#mcp-output-limits-and-warnings)），结果就是被截断、模型看到不完整的上下文，行为不可预期。

### 一条岔路：调高客户端上限

Figma 那边遇到过同类问题。他们的 [Known issues with MCP clients](https://developers.figma.com/docs/figma-mcp-server/mcp-clients-issues/) 文档里给的建议是直接调高客户端的上限：

> Add or update the `MAX_MCP_OUTPUT_TOKENS` variable with a higher value (e.g., `50000` or `100000`).

这条建议在 Claude Code 这种**用户可调**的客户端里是有效的，但有两个问题：

- 不是所有客户端都暴露这个开关——有些客户端的上限是**写死的**
- 即便能调，让用户去改全局环境变量，是把工具自己的副作用外推到了用户身上

所以我没有选这条岔路。

### 我们的解法：mode=files

新增 `--mode files` 之后，整个流程变成：

- HTML / 切图映射 / Design Tokens / Guide 串联成单份 `context.md`，落到 `<outDir>/<design-name>-<imageId8>/`
- 预览图作为独立的 `preview.png` 写到同一目录
- tool result 里**只回两个 `resource_link`**——指向上面两个文件的 `file://` URI

也就是说：tool 输出 token 消耗从"几万"压到"几十"，AI 模型用自己的 Read 工具按需读 `context.md`，整个数据流不再经过 MCP 协议这一层瓶颈。

```json
{
  "mcpServers": {
    "lanhu-context-mcp": {
      "command": "npx",
      "args": ["-y", "lanhu-context-mcp", "--mode", "files"]
    }
  }
}
```

这个解法的核心权衡是**让客户端少做事，让工具自己处理大数据**。MCP 协议本身就支持 `resource_link` 这种语义——指向资源而不是嵌入资源——只是大多数 tool 实现没充分用它而已。

### 顺手能解决一类 UX 问题

走了这条路之后还有一个意外收获：**产物可被多次复用**。

inline 模式下每次调用 tool 都要重新把整份上下文塞进 result，AI 看完一遍就丢了；files 模式下，AI 第一次拿到 `resource_link`，知道 context.md 在哪儿，后续如果还要回看（比如检查某个 class 的样式、回顾切图清单），可以再 Read 一次同一份文件，不用让用户再发一次 MCP 调用。
