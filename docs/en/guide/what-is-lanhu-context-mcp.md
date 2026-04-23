# What Is Lanhu Context MCP

## What problem does it solve?

`Lanhu Context MCP` turns a single Lanhu design into context you can hand directly to AI for implementation.

Its goal is not to generate final business code immediately. It first delivers a stable design spec that downstream models can adapt into real project code.

If you are familiar with `Figma MCP`, the rough mental model is similar: instead of handing AI the code directly, you first organize design data into context you can hand directly to AI for implementation, then continue into implementation.

`Lanhu Context MCP` is partly inspired by that `Figma MCP` style of workflow, but it stays focused on the Lanhu-specific problem:

- the input is a single Lanhu design-detail URL
- the output is implementation-oriented design context, not a direct replacement for production code
- the goal is to feed Lanhu designs into AI more reliably and provide downstream models with more dependable context for continuing into web, Android, iOS, and other targets

## What it returns

After calling `get_design_context`, you will usually get:

- **`HTML+CSS` design spec**: the primary reference for downstream implementation, preserving structure, sizing, and styling details from the design
- **asset mappings**: original asset URLs, local target paths, and download commands so AI can batch-download slices into the project with less manual user handling
- **`Design Tokens`**: supplementary visual data such as gradients, shadows, and radii when that context is still useful beyond the main structured spec
- **design preview**: a final visual reference for downstream validation
- **implementation guidance for downstream models**: explicit rules about priority, adaptation, and implementation constraints

Together, this output is meant to continue into web, Android, iOS, and other target platforms.
