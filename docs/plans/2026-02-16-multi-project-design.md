# Multi-Project Support: npm-Published Package Toolkit

**Date**: 2026-02-16
**Status**: Approved

## Problem

Static Block Kit currently supports a single project in `src/`. We need multiple independent projects (by anyone) using the same shared packages published to npm under `@vojtaholik`.

## Decision

Publish packages to npm under `@vojtaholik` scope. Projects install via `bun add`. The existing `src/` becomes `example/` as a reference implementation. A `bun run publish` script handles versioning and publishing.

## Package naming

| Current | New | Purpose |
|---------|-----|---------|
| `@static-block-kit/core` | `@vojtaholik/static-kit-core` | Engine, types, compiler |
| `static-block-kit` (cli) | `@vojtaholik/static-kit-cli` | dev/build/gen/sprite |
| `create-static-kit` | `@vojtaholik/create-static-kit` | Scaffolder |

## Architecture

```
module-kit/                          (public repo, toolkit source)
├── packages/
│   ├── core/                        @vojtaholik/static-kit-core
│   ├── cli/                         @vojtaholik/static-kit-cli
│   └── create-static-kit/           @vojtaholik/create-static-kit
├── example/                         reference site (current src/ renamed)
│   ├── blocks/
│   ├── site/pages/
│   └── public/
├── scripts/
│   └── publish.ts                   version bump + npm publish
├── static-kit.config.ts             config for example site
└── package.json                     workspace root
```

## New project experience

```bash
bun create @vojtaholik/static-kit my-site
cd my-site
bun install
bun run dev
```

## Scaffolded project structure

```
my-site/
├── package.json
│   {
│     "dependencies": {
│       "@vojtaholik/static-kit-core": "^0.1.0"
│     },
│     "devDependencies": {
│       "@vojtaholik/static-kit-cli": "^0.1.0"
│     },
│     "scripts": {
│       "dev": "static-kit dev",
│       "build": "static-kit build",
│       "gen": "static-kit gen",
│       "sprite": "static-kit sprite"
│     }
│   }
├── static-kit.config.ts
├── tsconfig.json
├── blocks/
├── site/pages/
└── public/
```

## Publish workflow

`bun run publish` at repo root:

1. Run `bun run typecheck` + `bun test`
2. Prompt for version bump (patch/minor/major)
3. Update version in all 3 package.json files
4. Publish `core` → `cli` → `create-static-kit` in order (cli depends on core)
5. Git commit + tag

## Changes required

### 1. Rename packages

- `@static-block-kit/core` → `@vojtaholik/static-kit-core`
- `static-block-kit` (cli) → `@vojtaholik/static-kit-cli`
- `create-static-kit` → `@vojtaholik/create-static-kit`

Update all import paths, package.json names, and cross-references.

### 2. Rename src/ → example/

Move current JAP site to `example/`. Update root config paths.

### 3. Update config defaults

Change defaults from `"src/blocks"` → `"blocks"`, `"src/site/pages"` → `"site/pages"`, `"src/public"` → `"public"`.

### 4. Fix hardcoded src/cms-blocks.ts

Make cms-blocks path configurable via config schema.

### 5. Update create-static-kit

Scaffold projects with npm deps (not file:), root-relative directory structure.

### 6. Add publish script

`scripts/publish.ts` — version sync + ordered npm publish.

### 7. Add bin entry to CLI

The CLI needs a proper `bin` entry so `npx static-kit dev` works from consumer projects.

## What stays unchanged

- Template engine, block registry, renderer logic
- Block definition format, template DSL
- `defineBlock()`, `renderPage()`, all core APIs
- Dev server, build pipeline, gen/sprite command logic
