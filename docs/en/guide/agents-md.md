# AGENTS.md

`AGENTS.md` is a good place for rules you do not want to repeat to the AI every time.

For design implementation, many mismatches do not happen because the model cannot write the code. They happen because its default assumptions do not match your repo rules. Putting those rules into the repo up front is usually more reliable than adding one more line to the prompt each time.

The prompts built into `Lanhu Context MCP` are intentionally kept more general, so developers can use `AGENTS.md` to add stronger and more stable constraints for their own repositories.

Think of it this way: the MCP tool is like a component with its own built-in default prompt. `AGENTS.md` is the MCP tool's global prompt.

::: tip Claude
`Claude Code` actually reads `CLAUDE.md`, not `AGENTS.md`. If your repository already uses `AGENTS.md` to provide shared rules for other coding agents, the approach closer to the official recommendation is to create a `CLAUDE.md`, import `@AGENTS.md` at the top, and then add any Claude-specific constraints below that import if needed.

Official docs: <https://code.claude.com/docs/en/memory#agents-md>
:::

## Ignore non-business top display areas in the design by default

Designers may include things like status bars in the mockup for presentation purposes. You can remove that with a prompt rule, although the better fix is still to ask the designer to remove it from the source design.

```md
- When implementing from a design, ignore all non-business top display areas by default unless the current task explicitly asks to keep them. Non-business top display areas include but are not limited to: system status bars, device chrome, presentation-only headers, back buttons, page titles, top-right capsule buttons, and device frames.
```

## Avoid keeping fixed outer-container heights from the design canvas

Lanhu tends to convert exact design heights directly into CSS. On mobile, device sizes vary too much for that to be a good default. In practice you usually want adaptive height, not a locked canvas height. Testing shows that **some models will correct this on their own**. If the model you use does not, add a rule like this:

```md
- If the outermost container has a fixed height that comes only from the design canvas, remove it or replace it with something like min-h-screen so the content can expand naturally, unless that fixed height is clearly part of the design intent, such as a fixed header or banner.
```

## Rewrite Lanhu class names into something semantic and maintainable

If you are not using Tailwind, some default class names from Lanhu can be hard to maintain later, for example `text-1` or `text-2`. For long-term maintenance, it helps to add a rule like this:

```md
- Rewrite class names into something reasonably semantic. The current names may be auto-incremented names like text-1 and text-2, so clean them up into maintainable names for later development.
```

## Strictly define where downloaded slices should be saved

The MCP tool already includes a built-in prompt rule that places downloaded slices under `src/assets/{design-name}/{icon-index}.{ext}`. It also tries to make file names somewhat semantic, although the result still depends on the model. If you want to further customize the slice download path or naming rules, add a prompt like this:

```md
- Save downloaded slices to `src/assets/foo/bar/{design-name}/`. Icon names must not be generic names like icon-1 or icon-2. Use semantic names instead.
```

## Recommended `AGENTS.md` template

Adjust this to match your actual project requirements:

```md
# Repository Guidelines

## Hard constraints for design implementation

- When implementing from a design, ignore all non-business top display areas by default unless the current task explicitly asks to keep them. Non-business top display areas include but are not limited to: system status bars, device chrome, presentation-only headers, back buttons, page titles, top-right capsule buttons, and device frames.
- If the outermost container has a fixed height that comes only from the design canvas, remove it or replace it with something like min-h-screen so the content can expand naturally, unless that fixed height is clearly part of the design intent, such as a fixed header or banner.

## Naming conventions for pages

- `.vue` files under the `pages` directory must use kebab-case file names.
```

::: tip
You can add your own project-specific hard constraints under **Hard constraints for design implementation**.
:::
