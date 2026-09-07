# Static Kit

A static site generator with block-based content management and a Vue-like template DSL. Bun only.

## Quick Start

```bash
# Install dependencies
bun install

# Generate block render functions
bun run gen

# Start dev server
bun run dev

# Build for production
bun run build
```

## Project Structure

A project scaffolded with `bun create @vojtaholik/static-kit` looks like this (paths are configurable in `static-kit.config.ts`):

```
blocks/                    # Block implementations
├── *.block.html          # Template files (Vue-like DSL)
├── *.block.ts            # Block definitions (Zod schemas)
├── index.ts              # registerAllBlocks() + BlockPropsMap augmentation
└── gen/                  # Generated render functions (auto, git-ignored)
site/pages/
├── base.html             # HTML template with data-region slots
├── *.page.ts             # Page configurations
└── index.ts              # `pages` array + getPageByPath()
public/                    # Served at publicPath (default /public), mirrored to dist/public
├── css/styles.css        # Site design system
├── js/                   # Client-side JS
├── svg/                  # Source SVGs for sprite
└── sprite.svg            # Generated spritesheet
static-kit.config.ts
dist/                      # Build output (git-ignored)
```

This repo is the monorepo: `packages/core` (compiler, registry, renderer), `packages/cli` (dev/build/gen/sprite), `packages/create-static-kit` (scaffolder), and `example/` (a reference site the root scripts point at).

## Template DSL

Block templates use a Vue-like syntax compiled to TypeScript render functions.

### Interpolation

```html
<!-- Escaped output (safe) -->
<h1>{{ props.headline }}</h1>

<!-- Raw HTML (unescaped - use for rich text) -->
<div class="prose">{{{ props.body }}}</div>
```

### Conditionals (v-if)

```html
<!-- On elements - element only rendered if truthy -->
<p v-if="props.subtitle" class="subtitle">{{ props.subtitle }}</p>

<!-- With <template> wrapper - children rendered without wrapper element -->
<template v-if="props.eyebrow">
  <span class="eyebrow">{{ props.eyebrow }}</span>
  <hr class="divider" />
</template>

<!-- Optional chaining works -->
<template v-if="props.author?.avatar">
  <img :src="props.author.avatar.src" :alt="props.author.avatar.alt" />
</template>
```

**Note:** There is no `v-else` or `v-else-if`. Use separate `v-if` blocks or ternary expressions in interpolation.

### Branches (v-else-if / v-else)

Sibling elements can continue a `v-if` chain. Whitespace and comments between them are fine; any other node ends the chain.

```html
<p v-if="props.status === 'ok'">All good</p>
<p v-else-if="props.status === 'warn'">Careful</p>
<p v-else>Down</p>

<template v-if="props.image"><img :src="props.image.src" :alt="props.image.alt"></template>
<template v-else><div class="placeholder"></div></template>
```

`v-if` on the same element as `v-for` is evaluated per iteration. `v-else` cannot be combined with `v-for`.

### Loops (v-for)

```html
<!-- Basic iteration -->
<template v-for="item in props.items">
  <div class="item">{{ item.title }}</div>
</template>

<!-- With index -->
<template v-for="item, i in props.items">
  <div class="item" :data-index="i">{{ item.title }}</div>
</template>

<!-- On elements directly -->
<a v-for="link in props.links" :href="link.href" class="link">
  {{ link.label }}
</a>
```

The loop variable and index are scoped to the loop body.

### Dynamic Attributes

```html
<!-- Dynamic value binding -->
<a :href="props.link.href">{{ props.link.label }}</a>

<!-- Omitted only for null / undefined / false; 0 and "" are rendered -->
<img :src="props.image?.src" :alt="props.image?.alt" />

<!-- Static + dynamic class merge into one attribute -->
<div class="card" :class="props.featured ? 'card--featured' : null"></div>

<!-- Expression in binding -->
<div :class="`grid grid--${props.columns}`"></div>

<!-- :key is stripped (framework directive, not rendered) -->
<a v-for="link in props.links" :key="link.href" :href="link.href">
  {{ link.label }}
</a>
```

### The `<template>` Element

The `<template>` tag is an invisible wrapper - it renders its children without any wrapper element in the output. Use it for:

- Conditional groups: `<template v-if="...">`
- Loop wrappers: `<template v-for="...">`

### Slot Delegation (render-slot)

Delegate rendering of array items to another registered block:

```html
<template v-for="item, i in props.items">
  <render-slot
    :block="props.itemBlock"
    :props="item"
    :prop-path="`props.items[${i}]`"
  >
    <!-- Fallback content if block not found or validation fails -->
    <div class="fallback">{{ item.title }}</div>
  </render-slot>
</template>
```

**Attributes:**

- `:block` (required) - Block type string to delegate to
- `:props` (required) - Props object to pass to the child block
- `:prop-path` - Explicit CMS path (e.g., `"props.items[0]"`)
- `:index` - Alternative: builds path from array index

The fallback children are rendered when:

- No block type specified
- Block type not registered
- Props fail validation (errors shown in dev overlay)

**Example: Grid with customizable item blocks**

```html
<!-- grid.block.html -->
<section class="section">
  <div class="grid">
    <template v-for="item, i in props.items">
      <render-slot
        :block="props.itemBlock"
        :props="item"
        :prop-path="`props.items[${i}]`"
      ></render-slot>
    </template>
  </div>
</section>
```

```typescript
// Page config
{
  type: "grid",
  props: {
    itemBlock: "teaser",  // Use teaser block for each item
    items: [
      { title: "Post 1", link: { href: "/post-1" } },
      { title: "Post 2", link: { href: "/post-2" } },
    ]
  }
}
```

### Block-level `<style>` and `<script>`

A `<style>` or `<script>` at the **top level** of a block template is hoisted out of the block's output and injected once per page: styles before `</head>`, scripts before `</body>`, in the order blocks first appear. Ten instances of a block on one page still produce one style and one script tag. Nested tags (inside another element) are rendered inline as-is.

```html
<style>
  .counter { display: flex; gap: .5rem; }
</style>

<div class="counter" data-counter>
  <button data-dec>−</button>
  <output>{{ props.start }}</output>
  <button data-inc>+</button>
</div>

<script>
  document.querySelectorAll("[data-counter]").forEach((el) => { /* ... */ });
</script>
```

Hoisted content is static — no `{{ }}` inside it. Put per-instance data in `data-*` attributes and read them from the script.

### Typed templates

When `hero.block.ts` exports `HeroProps` (`<Name>Props` in PascalCase, next to `hero.block.html`), the generated `gen/hero.render.ts` types `props` against it. `{{ props.titel }}` is then a `tsc` error, and `v-if="props.image"` narrows `props.image.src` like normal TypeScript. Blocks without a matching export fall back to `any`. Disable with `typedTemplates: false` in config.

### Available Context Variables

- `props` - Block props (Zod-validated, typed when `<Name>Props` is exported)
- `ctx` - Render context (`pageId`, `assetBase`, `isDev`, `layout`)
- `addr` - Schema address for CMS editing
- `encodeSchemaAddress(addr)` - Helper to encode address for data attributes
- `asset(path)` - URL under `publicPath`: `asset("images/hero.jpg")` → `/public/images/hero.jpg`, then `basePath` is applied at build. Prefer this over hand-written asset paths so nested routes and subdirectory deploys keep working.
- Loop variables (`item`, `i`, etc.) - within v-for scope

`data-block-id` and `data-schema-address` are emitted only in dev; production HTML never carries them.

## Creating Blocks

### 1. Create the template (`blocks/my-block.block.html`)

```html
<section
  class="section section--tone-{{ ctx.layout.tone }}"
  data-block-id="{{ addr.blockId }}"
  data-schema-address="{{ encodeSchemaAddress(addr) }}"
>
  <div class="container">
    <h2>{{ props.title }}</h2>
    <div class="prose">{{{ props.content }}}</div>
    <template v-if="props.cta">
      <a :href="props.cta.href" class="btn">{{ props.cta.label }}</a>
    </template>
  </div>
</section>
```

### 2. Define the block (`blocks/my-block.block.ts`)

```typescript
import { z } from "zod/v4";
import { defineBlock } from "@vojtaholik/static-kit-core";
import { renderMyBlock } from "./gen/my-block.render.ts";

export const myBlockPropsSchema = z.object({
  title: z.string(),
  content: z.string(),
  cta: z
    .object({
      href: z.string(),
      label: z.string(),
    })
    .optional(),
});

export type MyBlockProps = z.infer<typeof myBlockPropsSchema>;

export const myBlockBlock = defineBlock({
  type: "myBlock",
  propsSchema: myBlockPropsSchema,
  renderHtml: renderMyBlock,
  sourceFile: import.meta.url, // Enables click-to-open in dev inspector
});
```

### 3. Register the block (`blocks/index.ts`)

```typescript
import { blockRegistry } from "@vojtaholik/static-kit-core";
import { myBlockBlock } from "./my-block.block.ts";

export function registerAllBlocks() {
  // ... existing blocks
  blockRegistry.register(myBlockBlock);
}
```

### 4. Generate render function

```bash
bun run gen
```

This compiles `my-block.block.html` → `gen/my-block.render.ts`

## Creating Pages

Add page configs in `site/pages/`:

```typescript
import type { PageConfig } from "@vojtaholik/static-kit-core";

export const myPage: PageConfig = {
  id: "my-page",
  path: "/my-page",
  title: "My Page",
  template: "base.html",
  density: "comfortable",
  meta: {
    description: "Injected as <meta name=…>; og:/twitter: keys become property=…",
    "og:title": "My Page",
  },
  regions: {
    main: {
      blocks: [
        {
          id: "block-1",
          type: "myBlock",
          props: {
            title: "Hello World",
            content: "<p>Welcome!</p>",
          },
          layout: {
            tone: "surface",
            contentAlign: "center",
          },
        },
      ],
    },
  },
};
```

Then add it to the `pages` array in `site/pages/index.ts`. Block `id`s must be unique within a page — the renderer throws on a duplicate. `<title>` and any `meta` tags are filled from the config; a matching tag already in the template is updated in place.

## Layout Props

Blocks can receive layout styling hints via `layout`:

```typescript
{
  id: "my-block",
  type: "myBlock",
  props: { /* ... */ },
  layout: {
    tone: "inverted",       // surface | raised | accent | inverted
    contentAlign: "center", // left | center | split
    contentWidth: "narrow", // narrow | default | wide
  }
}
```

Access in templates via `ctx.layout.tone`, `ctx.layout.contentAlign`, etc.

## SVG Sprite System

Compile individual SVGs into a single spritesheet for efficient icon usage.

### Setup

1. Place SVG files in `public/svg/`:

```
public/svg/
├── magic-wand.svg
├── avatar-outline.svg
└── search.svg
```

2. Compile the spritesheet:

```bash
bun run sprite
```

This generates `public/sprite.svg` with each SVG as a `<symbol>`:

```xml
<svg xmlns="http://www.w3.org/2000/svg" style="display:none;">
  <symbol id="magic-wand" viewBox="0 0 24 24">
    <!-- SVG content -->
  </symbol>
  <symbol id="avatar-outline" viewBox="0 0 14 14">
    <!-- SVG content -->
  </symbol>
</svg>
```

### Usage in HTML

```html
<!-- Reference by symbol id (filename without .svg) -->
<svg width="24" height="24">
  <use href="public/sprite.svg#magic-wand" />
</svg>

<!-- With currentColor for CSS color inheritance -->
<svg class="icon" width="16" height="16">
  <use href="public/sprite.svg#avatar-outline" />
</svg>
```

### Tips

- SVG `viewBox` is preserved from the source file (defaults to `0 0 24 24`)
- Use `stroke="currentColor"` or `fill="currentColor"` in source SVGs to inherit CSS color
- Symbol id matches the filename (e.g., `my-icon.svg` → `#my-icon`)
- The sprite runs during `bun run build` automatically

## Design System

The CSS in `public/css/styles.css` provides:

- **Design tokens** - Colors, spacing, typography in `:root`
- **Layout primitives** - `.container`, `.grid`, `.stack`
- **Component styles** - `.section`, `.card`, `.btn`
- **Tone modifiers** - `.section--tone-surface`, `--raised`, `--accent`, `--inverted`
- **Density-based spacing** - Automatic via `ctx.layout.density`

Customize tokens in `:root` to match your brand.

## SCSS (optional)

Plain CSS (with native nesting via lightningcss) is the default and needs nothing. If you want Sass, opt in:

```ts
// static-kit.config.ts
export default defineConfig({
  scss: true,
});
```

```bash
bun add -d sass   # or sass-embedded (native, faster on big projects)
```

How it works:

- `public/css/styles.scss` → `dist/public/css/styles.css`. Same path, `.css` extension. Your `base.html` keeps linking `styles.css`, cache-busting keeps working.
- Partials (`_tokens.scss`) are inputs only — never emitted, never copied to `dist/`.
- `.scss` and `.sass` (indented syntax) both work. `@use "pkg:some-package"` and bare `node_modules` imports resolve.
- Sass output still goes through lightningcss, so prefixing and `cssOutput: "minified"` behave exactly like plain CSS.
- Dev server compiles on request with an mtime-validated cache; editing any file in the `@use` graph hot-reloads.
- A compile error is printed in the terminal and the request fails with 500, so hot reload keeps the last working stylesheet while you fix it.
- `styles.css` **and** `styles.scss` side by side is an error — one output, one source.
- `.scss` files present but `scss` left off? The CLI prints a hint and copies them verbatim, as before.

## Czech typography (vlna)

Rendered HTML gets non-breaking spaces after short Czech prepositions (`k`, `s`, `v`, `bez`, `pro`, …) and widow prevention, based on ČSN 01 6910. By default this runs only when `<html lang>` is `cs` or `sk`. Override in config:

```ts
export default defineConfig({
  vlna: "auto", // default — follow <html lang>
  // vlna: true   // always on
  // vlna: false  // always off
});
```

## Configuration

`static-kit.config.ts` at the project root. Every key is optional:

```ts
import { defineConfig } from "@vojtaholik/static-kit-core";

export default defineConfig({
  blocksDir: "blocks",
  pagesDir: "site/pages",
  publicDir: "public",
  outDir: "dist",
  publicPath: "/public",      // URL prefix publicDir is served/copied under
  devPort: 3000,
  basePath: "",               // "/my-site" for subdirectory deploys; rewrites href/src/srcset/poster/action
  trailingSlash: false,       // true: /about → dist/about/index.html instead of dist/about.html
  htmlOutput: "formatted",    // or "minified"
  cssOutput: "formatted",     // or "minified"
  scss: false,                // see SCSS below
  typedTemplates: true,       // see Typed templates above
  vlna: "auto",               // see Czech typography below
});
```

`build` is strict: an unknown block type or props that fail their schema abort the build with the page, block id and issue. The dev server logs the same message and renders the page without that block.

## Dev Server Features

- **Hot reload** - Changes to templates, CSS, and pages trigger instant refresh
- **Alt+click inspector** - Click any block while holding Alt to see its schema address
- **Slot error toast** - Validation errors for `<render-slot>` shown in bottom-right corner
- **404 page** - Lists every page path and registered block type, so a typo in a route or a block that never got registered is obvious
- **API endpoints:**
  - `/__pages` - List all pages
  - `/__site` - Full site config
  - `/__inspect?address=...` - Decode schema address
  - `/__hmr` - SSE endpoint for hot reload

## CLI Commands

```bash
bun run dev      # Start dev server with hot reload
bun run build    # Production build to dist/
bun run gen      # Compile *.block.html → gen/*.render.ts
bun run sprite   # Compile svg/ → sprite.svg
```

Monorepo only:

```bash
bun run lint     # biome check (format + lint)
bun run format   # biome check --write
bun run check    # lint + typecheck + test
bun run release  # bump versions, tag, push; CI publishes to npm
```

## License

MIT
