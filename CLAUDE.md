# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Static Block Kit — a static site generator with block-based content and a Vue-like template DSL. Bun monorepo with three packages: `core` (template compiler, block registry, HTML renderer), `cli` (dev/build/gen/sprite commands), and `create-static-kit` (scaffolding).

## Commands

```bash
bun install              # install deps
bun run dev              # dev server w/ HMR on :3000
bun run build            # production build → dist/
bun run gen              # compile *.block.html → gen/*.render.ts
bun run sprite           # compile src/public/svg/*.svg → sprite.svg
bun run typecheck        # tsc --noEmit
bun test                 # run all tests
bun test packages/core/test/template-compiler.test.ts  # single test
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  src/site/pages/*.page.ts  (PageConfig)             │
│    → regions → blocks[] → { type, props, layout }   │
└──────────────┬──────────────────────────────────────┘
               │ renderPage()
┌──────────────▼──────────────────────────────────────┐
│  packages/core/src/html-renderer.ts                 │
│    parse5 template (base.html) + region injection   │
│    → blockRegistry.get(type) → definition.renderHtml│
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  packages/core/src/block-registry.ts                │
│    BlockRegistry (Map<type, BlockDefinition>)       │
│    defineBlock({ type, propsSchema, renderHtml })   │
│    renderSlot() for block delegation                │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  src/blocks/*.block.html  →  bun run gen  →         │
│  src/blocks/gen/*.render.ts (auto-generated)        │
│  compiled by: packages/core/src/template-compiler.ts│
└─────────────────────────────────────────────────────┘
```

### Data flow for a block

1. **Define** — `foo.block.ts`: Zod schema + `defineBlock()` importing generated render fn
2. **Template** — `foo.block.html`: Vue-like DSL (`{{ }}`, `v-if`, `v-for`, `:attr`, `<render-slot>`)
3. **Generate** — `bun run gen` compiles HTML → TypeScript render function in `gen/`
4. **Register** — `src/blocks/index.ts`: `registerAllBlocks()` adds to global `blockRegistry`
5. **Render** — `renderPage()` reads page template, finds `data-region` elements, calls each block's `renderHtml()`

### Key types

- `BlockDefinition<T>` — `{ type, propsSchema: ZodType, renderHtml: (RenderBlockInput) => string }`
- `RenderBlockInput` — `{ props, ctx: RenderContext, addr: SchemaAddress }`
- `RenderContext` — `{ pageId, assetBase, isDev, layout: LayoutProps }`
- `PageConfig` — `{ id, path, title, template, density?, regions: Record<string, RegionConfig> }`
- `SchemaAddress` — `{ pageId, region, blockId, propPath? }` — encoded as `pageId::region::blockId[::propPath]`

### Layout system

Blocks receive layout hints via `ctx.layout`: `tone` (surface/raised/accent/inverted), `contentAlign`, `contentWidth`, `density`. These come from the block's `layout` field in page config and are parsed through `layoutPropsSchema`.

## Conventions

- **Runtime**: Bun exclusively — no Node, npm, Vite, webpack. Use `Bun.file()`, `Bun.serve()`, `Bun.$`.
- **Zod v4**: Import as `import { z } from "zod/v4"` (not `"zod"`).
- **Generated files**: `src/blocks/gen/` is auto-generated. Never edit. Run `bun run gen` after changing `*.block.html`.
- **Template DSL**: `{{ expr }}` escaped, `{{{ expr }}}` raw, `v-if`/`v-for` directives, `:attr` dynamic bindings. No `v-else`. Use `<template>` as invisible wrapper. `<render-slot>` for block delegation.
- **Block creation**: Always create both `.block.html` + `.block.ts`, register in `src/blocks/index.ts`, run `bun run gen`.
- **Config**: `static-kit.config.ts` at root defines `blocksDir`, `pagesDir`, `publicDir`, `outDir`, `devPort`.
- **CSS design system**: Tokens and layout primitives in `src/public/css/styles.css`. Tone modifiers: `.section--tone-{value}`.
