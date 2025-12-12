# Module Kit

A static site generator with block-based content management and a Vue-like template DSL.

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

```
src/
├── blocks/                # Block implementations
│   ├── *.block.html      # Template files (Vue-like DSL)
│   ├── *.block.ts        # Block definitions (Zod schemas)
│   └── gen/              # Generated render functions (auto)
├── cms-blocks.ts          # CMS schema definitions
├── site/
│   └── pages/            # Page templates & configs
│       ├── base.html     # HTML template with regions
│       ├── *.page.ts     # Page configurations
│       └── index.ts      # Page exports
└── public/
    ├── css/styles.css    # Site design system
    ├── js/               # Client-side JS
    ├── svg/              # Source SVGs for sprite
    └── sprite.svg        # Generated spritesheet

packages/
├── core/                  # Core library
│   ├── layout.ts         # Layout enums (tone, density, etc.)
│   ├── schema-address.ts # CMS editing addresses
│   ├── block-registry.ts # Block definition & registry
│   └── template-compiler.ts # HTML → TypeScript compiler
└── cli/                   # CLI commands (dev, build, gen, sprite)

dist/                      # Build output (git-ignored)
```

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

<!-- Conditional attribute (only rendered if truthy) -->
<img :src="props.image?.src" :alt="props.image?.alt" />

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

### Available Context Variables

- `props` - Block props (Zod-validated)
- `ctx` - Render context (`pageId`, `assetBase`, `isDev`, `layout`)
- `addr` - Schema address for CMS editing
- `encodeSchemaAddress(addr)` - Helper to encode address for data attributes
- Loop variables (`item`, `i`, etc.) - within v-for scope

## Creating Blocks

### 1. Create the template (`src/blocks/my-block.block.html`)

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

### 2. Define the block (`src/blocks/my-block.block.ts`)

```typescript
import { z } from "zod/v4";
import { defineBlock } from "@static-block-kit/core";
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

### 3. Register the block (`src/blocks/index.ts`)

```typescript
import { blockRegistry } from "@static-block-kit/core";
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

### 5. (Optional) Define CMS schema (`src/cms-blocks.ts`)

```typescript
export const cmsBlocks = {
  myBlock: {
    type: "myBlock",
    label: "My Block",
    fields: {
      title: { type: "text", label: "Title", required: true },
      content: { type: "richText", label: "Content", required: true },
      cta: {
        type: "object",
        label: "Call to Action",
        fields: {
          href: { type: "text", label: "URL", required: true },
          label: { type: "text", label: "Label", required: true },
        },
      },
    },
  },
};
```

## Creating Pages

Add page configs in `src/site/pages/`:

```typescript
import type { PageConfig } from "../../rendering/html-renderer";

export const myPage: PageConfig = {
  id: "my-page",
  path: "/my-page",
  title: "My Page",
  template: "base.html",
  density: "comfortable",
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

Then export from `src/site/pages/index.ts`.

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

1. Place SVG files in `src/public/svg/`:

```
src/public/svg/
├── magic-wand.svg
├── avatar-outline.svg
└── search.svg
```

2. Compile the spritesheet:

```bash
bun run sprite
```

This generates `src/public/sprite.svg` with each SVG as a `<symbol>`:

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

The CSS in `src/public/css/styles.css` provides:

- **Design tokens** - Colors, spacing, typography in `:root`
- **Layout primitives** - `.container`, `.grid`, `.stack`
- **Component styles** - `.section`, `.card`, `.btn`
- **Tone modifiers** - `.section--tone-surface`, `--raised`, `--accent`, `--inverted`
- **Density-based spacing** - Automatic via `ctx.layout.density`

Customize tokens in `:root` to match your brand.

## Dev Server Features

- **Hot reload** - Changes to templates, CSS, and pages trigger instant refresh
- **Alt+click inspector** - Click any block while holding Alt to see its schema address
- **Slot error toast** - Validation errors for `<render-slot>` shown in bottom-right corner
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

## License

MIT
