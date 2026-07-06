# 1.0.0 里程碑：正式支持 Tailwind CSS v4

<p style="color: var(--vp-c-text-2); font-size: 0.9em;">作者：REFINIST · 更新于 2026-07-06 11:47</p>

`Lanhu Context MCP` 发布 1.0.0 了。

按语义化版本的约定，0.x 的意思是"API 随时可能变，别太当真"，而 1.0.0 是一个正式的承诺：**这个工具已经成熟到可以放心接入日常工作流，我会对它的参数和行为负责**。从 0.0.1 到现在，它经历了 cwd、mode=files 这些真实反馈的打磨，这次带来的是整条链路里分量最重的一块拼图——所以值得用"里程碑"这个词。

## 这个版本最大的事：`tw-version 4`

从 1.0.0 开始，转换目标可以直接选 Tailwind CSS v4：

::: code-group

```json [CLI]
{
  "lanhu-context-mcp": {
    "command": "npx",
    "args": ["-y", "lanhu-context-mcp", "--tailwindcss", "--tw-version", "4"]
  }
}
```

```dotenv [.env.local]
TAILWINDCSS=1
TW_VERSION=4
```

:::

在此之前，`--tailwindcss` 只能产出 Tailwind 3 的类名。项目已经在 v4 上的用户，要么拿着 v3 产物再让 AI 改写一轮（多花 token，还容易改错），要么干脆退回 `HTML+CSS`。现在这一步没有了：设计稿进来，直接出 v4。

为什么产物必须区分 3 和 4？因为两代 Tailwind 之间是有破坏性差异的。同一个视觉效果，两代的写法（以下差异都在真实的 Tailwind v4 编译器上验证过）：

```text
背景色 60% 透明度
  v3:  bg-white bg-opacity-60
  v4:  bg-white/60          ← bg-opacity-* 一族在 v4 已被移除，旧写法零输出

渐变
  v3:  bg-gradient-to-r from-white to-black
  v4:  bg-linear-to-r from-white to-black

小阴影
  v3:  shadow-sm
  v4:  shadow-xs            ← v4 里 shadow-sm 这个名字还在，但对应的是 v3 的 shadow

隐藏 outline（保留无障碍焦点样式）
  v3:  outline-none
  v4:  outline-hidden       ← v4 的 outline-none 还在，但行为变成了真·outline-style: none
```

这些差异分三个层级：**彻底移除**（`bg-opacity-*`，v4 里直接零输出）、**同名不同义**（`shadow-sm`、`outline-none`——不报错、不失效，只是悄悄变成另一个样式，最难察觉）、**改名**（`bg-gradient-to-r` → `bg-linear-to-r`）。所以把 v3 类名交给 v4 项目不是"能凑合用"，而是轻则丢样式、重则错样式。`tw-version 4` 产出的就是右列这些 v4 原生写法。

## 背后的事：为什么要自己写一个转换库

v3 链路一直站在 [`css-to-tailwindcss`](https://github.com/jackardios/css-to-tailwindcss) 的肩膀上，这个库面向 Tailwind 3 做得很好。问题出在 **Tailwind v4 对 v3 是一次破坏性更新（breaking changes）**，而且破坏的恰恰是转换器赖以工作的那几层地基：

- **配置体系推倒重来**：`tailwind.config.js` 换成了 CSS-first 的 `@theme`——v3 转换器解析主题的整套逻辑（`resolveConfig`）在 v4 里没有对应物
- **类名层的移除、换义、改名**：就是上一节对照表里那批差异——`bg-opacity-*` 一族被移除、`shadow-sm` / `rounded` 尺度整体挪位、`outline-none` 同名换了行为
- **语法层也有新东西**：CSS 变量的 paren 写法 `bg-(--brand)`、斜杠透明度成为透明度的唯一写法

这意味着"把 v3 转换器升级一下"这条路走不通——类名映射表、主题解析、值匹配策略都要面向 v4 重建。当时也没有任何现成的库能转到 v4，所以就有了 [`css-to-tailwindcss4`](https://github.com/refinist/css-to-tailwindcss4)。

写的过程里有一个认知值得记下来：**CSS 转 Tailwind 这类工具，最隐蔽的坑不是转不出来，而是转出一个"看起来很对、但目标版本里根本不存在或含义不同"的类**。Tailwind 对不认识的类是静默丢弃的——用户不会看到报错，只会发现某块样式悄悄没了。几个真实的例子：

- `font-weight: bold` 如果转成 `font-[bold]`，在 v4 里会被推断成 **font-family**，编译出 `font-family: bold`
- 渐变如果只转出 `bg-linear-to-r` 而丢掉色标，编译产物里的 `--tw-gradient-stops` 是未定义的，页面上什么都不渲染
- `background-size` 的任意值如果发成 `bg-[50%_100%]`，会被编译成 **background-position**——属性都换了

这类问题靠读代码和字符串断言是查不出来的。所以 `css-to-tailwindcss4` 的测试体系里有一个专门的回归装置：**把转换产物直接喂给真实的 Tailwind v4 编译器，断言每一个类都真的生成了 CSS**。上面那些坑，就是被这个装置逐个坐实、逐个修掉的。

## 兼容性

**默认行为完全不变。** 不传 `tw-version` 就还是 Tailwind 3，老用户升级 1.0.0 无感。v3 和 v4 两条链路会长期并存：v3 继续依赖 `css-to-tailwindcss`，v4 由 `css-to-tailwindcss4` 驱动，后者会随 Tailwind 的新版本持续跟进（依赖机器人 + 编译回归测试会在 Tailwind 发新版时自动暴露兼容性问题）。

## 一点小小的"埋怨"

配套的谷歌插件 [Lanhu Helper](https://chromewebstore.google.com/detail/lanhu-helper/fdeeagdmeiddheeegkeaoklicgjblcin?hl=zh-CN&utm_source=ext_sidebar) 安装量已经 150+ 了，但 [lanhu-context-mcp](https://github.com/refinist/lanhu-context-mcp) 的 star 还停在 20 出头——用的人比点 star 的人多得多 🤣。如果这个项目帮你省过事，欢迎顺手[点个 star](https://github.com/refinist/lanhu-context-mcp)：对独立维护者来说，这是最直接的正反馈，也能让更多还在蓝湖里手动切图对样式的同学发现这条链路。

## 接下来

设计稿到代码这条链路上，还有不少可以做的事。遇到转换问题，欢迎到 [lanhu-context-mcp issues](https://github.com/refinist/lanhu-context-mcp/issues) 或 [css-to-tailwindcss4 issues](https://github.com/refinist/css-to-tailwindcss4/issues) 反馈——这个项目一直是被真实反馈推着变好的，cwd 和 mode=files 如此，这次的 v4 也不会例外。
