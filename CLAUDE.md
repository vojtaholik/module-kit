# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Static Kit — a static site generator with block-based content and a Vue-like template DSL. Published as `@vojtaholik/*` npm packages. Bun monorepo with three packages: `core` (template compiler, block registry, HTML renderer), `cli` (dev/build/gen/sprite commands), and `create-static-kit` (scaffolding).

## Packages

| Package | npm | Purpose |
|---------|-----|---------|
| `@vojtaholik/static-kit-core` | `packages/core/` | Engine, types, template compiler |
| `@vojtaholik/static-kit-cli` | `packages/cli/` | CLI: dev, build, gen, sprite |
| `@vojtaholik/create-static-kit` | `packages/create-static-kit/` | Project scaffolder |

## Commands

```bash
bun install              # install deps
bun run dev              # dev server w/ HMR on :3000 (example site)
bun run build            # production build → dist/
bun run gen              # compile *.block.html → gen/*.render.ts
bun run sprite           # compile example/public/svg/*.svg → sprite.svg
bun run typecheck        # tsc --noEmit
bun run lint             # biome check (format + lint)
bun run format           # biome check --write
bun test                 # run all tests
bun test packages/core/test/template-compiler.test.ts  # single test
bun run check            # lint + typecheck + test
bun run release [patch|minor|major]  # bump versions, tag, push; CI publishes
```

## Creating a new project

```bash
bun create @vojtaholik/static-kit my-site
cd my-site && bun install && bun run gen && bun run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  example/site/pages/*.page.ts  (PageConfig)         │
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
│  example/blocks/*.block.html  →  bun run gen  →     │
│  example/blocks/gen/*.render.ts (auto-generated)    │
│  compiled by: packages/core/src/template-compiler.ts│
└─────────────────────────────────────────────────────┘
```

### Data flow for a block

1. **Define** — `foo.block.ts`: Zod schema + `defineBlock()` importing generated render fn
2. **Template** — `foo.block.html`: Vue-like DSL (`{{ }}`, `v-if`, `v-for`, `:attr`, `<render-slot>`)
3. **Generate** — `bun run gen` compiles HTML → TypeScript render function in `gen/`
4. **Register** — `blocks/index.ts`: `registerAllBlocks()` adds to global `blockRegistry`
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
- **Imports**: `import { defineConfig } from "@vojtaholik/static-kit-core"` (not the old `@static-block-kit/core`).
- **Generated files**: `blocks/gen/` is auto-generated. Never edit. Run `bun run gen` after changing `*.block.html`.
- **Template DSL**: `{{ expr }}` escaped, `{{{ expr }}}` raw, `v-if`/`v-else-if`/`v-else`/`v-for` directives, `:attr` dynamic bindings (omitted only for `null`/`undefined`/`false`; `class` + `:class` merge). Use `<template>` as invisible wrapper. `<render-slot>` for block delegation. `asset("images/x.jpg")` for public asset URLs. Top-level `<style>`/`<script>` in a template are hoisted and injected once per page.
- **Typed templates**: export `<Name>Props` from `<name>.block.ts` and the generated render fn types `props` against it — template typos are tsc errors. Opt out with `typedTemplates: false`.
- **Dev-only attrs**: `data-block-id` / `data-schema-address` are compiled under `if (ctx.isDev)`; never rely on them in production CSS/JS.
- **Block creation**: Always create both `.block.html` + `.block.ts`, register in `blocks/index.ts`, run `bun run gen`.
- **Config**: `static-kit.config.ts` at root: `blocksDir`, `pagesDir`, `publicDir`, `outDir`, `publicPath`, `devPort`, `basePath`, `trailingSlash`, `htmlOutput`, `cssOutput`, `scss`, `typedTemplates`, `vlna`. Schema in `packages/core/src/config.ts`.
- **Build is strict**: unknown block type, invalid props, or duplicate block ids on a page fail `build`. Dev warns and skips the block.
- **Czech typography (vlna)**: runs only when `<html lang>` is `cs`/`sk` (or `vlna: true`). Don't add non-breaking spaces by hand.
- **CSS design system**: Tokens and layout primitives in `public/css/styles.css`. Tone modifiers: `.section--tone-{value}`.
- **SCSS is opt-in, never default**: `scss: true` in config + user installs `sass`/`sass-embedded` (optional peer deps of the CLI). Pipeline lives in `packages/cli/src/stylesheet.ts`: `.scss` → Sass → lightningcss → same path with `.css`. Partials (`_*.scss`) are never emitted. Both dev and build go through `resolveStylesheet()` + `compileStylesheet()` — keep them the single source of truth for what a `.css` path maps to.
- **Example site**: `example/` contains a reference site (JAP). Config paths point there: `example/blocks`, `example/site/pages`, `example/public`.
- **Publishing**: `bun run release [patch|minor|major]` bumps all packages (and the scaffold template's deps), runs checks, commits, tags and pushes; the publish workflow does the npm publish.
- **Site modules**: `blocks/index.ts` and `site/pages/index.ts` are loaded through `packages/cli/src/site-modules.ts` (`await import()` + `require.cache` eviction for hot reload) in both dev and build. Never `require()` user modules — Bun refuses modules with top-level await, and users are allowed to use it.
- **Tests**: core tests are unit tests; `packages/cli/test/build.test.ts` builds the fixture site in `packages/cli/test/fixtures/site` end to end. Add a block/page there when a build-time feature needs coverage.
