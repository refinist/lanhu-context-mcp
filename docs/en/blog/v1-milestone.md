# The 1.0.0 Milestone: Tailwind CSS v4 Support

<p style="color: var(--vp-c-text-2); font-size: 0.9em;">Author: REFINIST · Updated 2026-07-06 11:47</p>

`Lanhu Context MCP` has reached 1.0.0.

By semver convention, 0.x means "the API may change at any time — don't lean on it too hard", while 1.0.0 is a formal commitment: **this tool is mature enough to plug into your daily workflow, and I take responsibility for its options and behavior**. From 0.0.1 until now it has been shaped by real feedback — cwd, mode=files — and this release lands the heaviest missing piece of the whole chain. That is why "milestone" is the right word.

## The headline: `tw-version 4`

Starting with 1.0.0, the conversion target can be Tailwind CSS v4 directly:

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

Before this, `--tailwindcss` could only emit Tailwind 3 class names. If your project was already on v4, you either had the AI rewrite the v3 output one more time (more tokens, more mistakes) or fell back to plain `HTML+CSS`. That step is now gone: a design goes in, v4 comes out.

Why must the output distinguish 3 from 4? Because the two generations have breaking differences between them. The same visual effect, written for each generation (every difference below was verified against the real Tailwind v4 compiler):

```text
Background at 60% opacity
  v3:  bg-white bg-opacity-60
  v4:  bg-white/60          ← the bg-opacity-* family is removed in v4; the old form emits nothing

Gradient
  v3:  bg-gradient-to-r from-white to-black
  v4:  bg-linear-to-r from-white to-black

Small shadow
  v3:  shadow-sm
  v4:  shadow-xs            ← shadow-sm still exists in v4, but it now maps to v3's shadow

Hide outline (keep the accessible focus style)
  v3:  outline-none
  v4:  outline-hidden       ← v4's outline-none still exists, but now truly sets outline-style: none
```

These differences come in three tiers: **outright removal** (`bg-opacity-*` — zero output in v4), **same name, different meaning** (`shadow-sm`, `outline-none` — no error, no missing class, just silently a different style; the hardest to notice), and **renames** (`bg-gradient-to-r` → `bg-linear-to-r`). Handing v3 class names to a v4 project isn't "close enough" — it means lost styles at best and wrong styles at worst. `tw-version 4` emits the right-hand column: native v4 forms.

## The story behind it: why a new conversion library

The v3 path has always stood on the shoulders of [`css-to-tailwindcss`](https://github.com/jackardios/css-to-tailwindcss), which does its job for Tailwind 3 very well. The problem is that **Tailwind v4 is a breaking-changes release relative to v3**, and what it breaks is precisely the foundation a converter stands on:

- **The configuration system was rebuilt**: `tailwind.config.js` became CSS-first `@theme` — the v3 converter's entire theme-resolution logic (`resolveConfig`) has no counterpart in v4
- **Class names removed, re-meant, or renamed**: exactly the batch in the table above — the `bg-opacity-*` family removed, the `shadow-sm` / `rounded` scales shifted wholesale, `outline-none` keeping its name but changing behavior
- **New syntax on top**: the paren form for CSS variables like `bg-(--brand)`, and slash opacity becoming the only way to write opacity

Which means "just upgrade the v3 converter" was never an option — the class-name mapping tables, theme parsing, and value-matching strategies all had to be rebuilt for v4. No existing library converted to v4 at the time, so [`css-to-tailwindcss4`](https://github.com/refinist/css-to-tailwindcss4) was born.

One insight from building it is worth writing down: **for CSS-to-Tailwind tooling, the most insidious failure is not failing to convert — it is emitting a class that looks right but does not exist (or means something else) in the target version**. Tailwind silently drops classes it does not recognize: no error, just styles quietly missing. A few real examples:

- `font-weight: bold` converted to `font-[bold]` is inferred as **font-family** in v4 and compiles to `font-family: bold`
- a gradient converted to `bg-linear-to-r` without its color stops leaves `--tw-gradient-stops` undefined — nothing renders
- an arbitrary `background-size` emitted as `bg-[50%_100%]` compiles to **background-position** — a different property entirely

You cannot catch this class of bug by reading code or asserting on strings. So `css-to-tailwindcss4` ships a dedicated regression harness: **feed every emitted class to the real Tailwind v4 compiler and assert that each one actually generates CSS**. Every pitfall above was confirmed — and then fixed — by exactly this harness.

## Compatibility

**Default behavior is unchanged.** Without `tw-version`, you still get Tailwind 3 — existing users upgrade to 1.0.0 without noticing. The v3 and v4 paths will coexist long-term: v3 keeps relying on `css-to-tailwindcss`, v4 is powered by `css-to-tailwindcss4`, and the latter will track new Tailwind releases (a dependency bot plus the compile-regression suite surface compatibility issues automatically whenever Tailwind ships a new version).

## A small "complaint"

The companion Chrome extension [Lanhu Helper](https://chromewebstore.google.com/detail/lanhu-helper/fdeeagdmeiddheeegkeaoklicgjblcin?hl=zh-CN&utm_source=ext_sidebar) has passed 150 installs, yet [lanhu-context-mcp](https://github.com/refinist/lanhu-context-mcp) is still sitting at around 20 stars — far more people use it than star it 🤣. If this project has saved you some work, please consider [dropping a star](https://github.com/refinist/lanhu-context-mcp): for an independent maintainer it is the most direct form of encouragement, and it helps more people still hand-slicing Lanhu designs discover this workflow.

## What's next

There is plenty left to build along the design-to-code chain. If you hit conversion issues, please report them at [lanhu-context-mcp issues](https://github.com/refinist/lanhu-context-mcp/issues) or [css-to-tailwindcss4 issues](https://github.com/refinist/css-to-tailwindcss4/issues) — this project has always been improved by real feedback: cwd and mode=files came from it, and v4 support will be no different.
