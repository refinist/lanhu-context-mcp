# Lanhu Context MCP: Turning Lanhu Designs into Context for AI to Generate Code and Recreate Pages

<p style="color: var(--vp-c-text-2); font-size: 0.9em;">Author: REFINIST · Updated 2026-04-24 15:55</p>

## Why Build Lanhu Context MCP?

Lanhu designs are still widely used across many teams. Lanhu already ships its own design-to-code output, and the results are not bad, but in practice there are still a few recurring problems:

- there is no Tailwind support yet
- class names are not semantic enough, with names like `text-1` and `text-2` becoming hard to maintain later
- conversion quality depends heavily on design consistency; the cleaner the source design, the more stable the result usually is
- Lanhu also has to support multiple design sources such as PS, Figma, and Sketch, so the underlying conversion path is inherently complex and errors are hard to avoid completely
- some outer containers end up with fixed heights, which is not friendly for responsive layouts
- slice downloading, naming, and file organization still involve a lot of manual work

**So in the AI era, is there a better way to deal with these problems?**

That is the idea behind `Lanhu Context MCP`. It does not try to generate final business code directly. Instead, it packages a single Lanhu design into context for AI to generate code and recreate pages more reliably, adds structured information, slice download handling, and implementation guidance, and then leaves the remaining engineering work to AI. In this project, that context mainly includes:

- **`HTML+CSS` design spec**: the main reference for downstream implementation, keeping as much structure, sizing, and style detail from the design as possible
- **slice download handling**: original slice URLs, target local paths, and download commands so AI can pull assets into the repo in batches instead of leaving that work to the user
- **`Design Tokens`**: extra visual information such as gradients, shadows, radii, and similar details that are still useful outside the main structured spec
- **design preview**: a visual reference for result checking
- **implementation guidance for the downstream model**: explicit priorities, adaptation rules, and constraints for the next step

## MCP Alone Is Not Enough

If you only have an MCP, this workflow still is not fully connected.

With Lanhu, you often have to open the design detail page before you can copy a usable link, and even then the copied link can still be missing a critical `tid` parameter. In that case, the input is already incomplete before the AI even starts implementing anything.

That is why <a href="/en/ecosystem/lanhu-helper" target="_blank" rel="noreferrer">Lanhu Helper</a> later became a separate Chrome extension. What it does is not complicated, but it is practical: it lets you more directly **copy the selected-layer link** and **copy a sample prompt**, reduces the steps of manually finding and filling in parameters, and makes the "Lanhu design -> MCP -> AI" workflow connect more smoothly.

The handling of **copying the selected-layer link** and **copying a sample prompt** also takes a cue from `Figma MCP`: you should not only process the design itself, but also smooth out the part of the workflow before the handoff to AI. As long as there are obvious breakpoints in the input chain, it is hard for MCP's value to really come through.

### Figma MCP Screenshot Examples

![Figma MCP copy1](/images/figma-mcp-copy-1.png)

![Figma MCP copy2](/images/figma-mcp-copy-2.png)

### Lanhu Helper's Complementary Capability

Lanhu Helper also has a practical complementary capability: it supports **custom sample prompt templates**, so you can configure commonly used fixed prompts in advance and avoid typing them repeatedly.

![Lanhu Helper screenshot-3](/images/screenshot-3.png)

## Comparing with Figma MCP

If you place `Lanhu Context MCP` in the broader design-to-code context, the most natural comparison is usually `Figma MCP`.

There are real differences between them, but the more important point is not which one is "naturally stronger." Their core workflow idea is actually very similar.

For many teams, the issue is not only technical choice, but also practical cost:

- Figma can introduce additional licensing cost
- if the design team already collaborates in Lanhu, forcing a move to Figma or Sketch creates migration cost of its own
- even if the final implementation is still handed to AI, adding one more design-tool migration step does not necessarily make the workflow easier

So `Lanhu Context MCP` is not about proving itself stronger than `Figma MCP`. It is about filling in the missing part of the Lanhu workflow.

At the core, both are doing the same thing:

**turn the design into context for AI to generate code and recreate pages, then leave the final integration to AI.**

| Dimension                         | Figma MCP                                                   | Lanhu Context MCP                                                                                 | Notes                                                                              |
| --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Design source                     | Figma design                                                | Lanhu design                                                                                      |                                                                                    |
| Intermediate context handed to AI | React-like structure, Tailwind, prompts, preview screenshot | `HTML+CSS / HTML+Tailwind`, slice download handling, `Design Tokens`, prompts, preview screenshot | The Lanhu side additionally includes slice download handling and download commands |
| Goal                              | Reduce AI guesswork around the design                       | Reduce AI guesswork around the design                                                             |                                                                                    |
| Final integration                 | Still depends on AI adapting to the repo                    | Still depends on AI adapting to the repo                                                          |                                                                                    |

So the two variables that usually matter most are:

1. whether the design is converted into stable intermediate context
2. how strong the downstream model's understanding, judgment, and implementation ability are

In other words, MCP makes the input more like real input, but the final implementation quality still depends heavily on AI.

In practice, the variable that more often creates the real gap is the second one: the model's own capability.

## Model Quality Still Matters

This MCP returns structured context for code generation and page recreation, not final business code, so stronger models usually lead to steadier implementation.

Stronger models are usually better at a few things:

- renaming slices and classes into something closer to business semantics
- turning fixed-height or rigid design structures into more reasonable page layouts
- using the preview for a second correction pass instead of copying mechanically

::: tip
If you are doing this in `Codex`, after comparing a few models and reasoning settings, my own takeaway is that stronger reasoning settings usually feel more stable, especially when you want one more visual review pass after generation.
:::

## Tailwind

As mentioned earlier, Lanhu's native conversion currently does not support Tailwind. That is one of the gaps `Lanhu Context MCP` is trying to fill.

One important point here: this is not asking AI to rewrite `HTML+CSS` into Tailwind on the fly. The conversion is done by the tool first, and only then is the result handed to AI for the next implementation step.

If your project already uses Tailwind, you can enable Tailwind output directly:

- `--tailwindcss`

The benefit is straightforward: the intermediate result becomes closer to your actual tech stack, so the model does not need to do a large rewrite first and the later cleanup step is usually smoother.

Of course, `HTML+Tailwind` is still only an intermediate result, not final business components.

## A More Reasonable Expectation

Lanhu design-to-code is not a perfect source input to begin with.

Even with this MCP, it should not be treated as a one-call generator for final business code.

What it actually solves is:

- turning screenshot-guessing into structured specification
- automating manual work such as finding params, handling slices, and piecing together links
- shifting AI effort from "guess the design" to "adapt the result to your project"

A better expectation is this:

it does not replace judgment in the final integration stage, but it can compress a lot of repetitive, low-value correction work.

So the better mindset is:

**treat it as a tool that pushes design implementation forward by many steps, not as a one-shot endpoint.**
