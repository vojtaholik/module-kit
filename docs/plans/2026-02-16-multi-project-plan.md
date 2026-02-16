# Multi-Project npm Toolkit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish Static Block Kit as `@vojtaholik` npm packages so anyone can scaffold and run independent projects.

**Architecture:** Rename packages to `@vojtaholik/*` scope, move `src/` to `example/`, update config defaults to root-relative, fix hardcoded paths, update scaffolder for npm deps, add a publish script.

**Tech Stack:** Bun, TypeScript, Zod v4, npm registry

---

### Task 1: Rename packages to @vojtaholik scope

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/cli/package.json`
- Modify: `packages/create-static-kit/package.json`
- Modify: `package.json` (root)
- Modify: all files importing `@static-block-kit/core`

**Step 1: Update packages/core/package.json**

Change name and add publishConfig:

```json
{
  "name": "@vojtaholik/static-kit-core",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./src/index.ts",
      "types": "./src/index.ts"
    }
  },
  "files": ["src"],
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "parse5": "^8.0.0",
    "zod": "^4.1.13"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

**Step 2: Update packages/cli/package.json**

Change name, update core dep, add bin entry for `static-kit`:

```json
{
  "name": "@vojtaholik/static-kit-cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "static-kit": "./src/cli.ts"
  },
  "files": ["src"],
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "@vojtaholik/static-kit-core": "workspace:*",
    "lightningcss": "^1.28.2",
    "browserslist": "^4.24.4"
  },
  "peerDependencies": {
    "typescript": "^5"
  }
}
```

**Step 3: Update packages/create-static-kit/package.json**

```json
{
  "name": "@vojtaholik/create-static-kit",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "create-static-kit": "./src/index.ts"
  },
  "files": ["src", "template"],
  "publishConfig": {
    "access": "public"
  }
}
```

**Step 4: Update root package.json**

```json
{
  "name": "static-kit-monorepo",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "bun run --watch --watch-ignore='**/gen/**' packages/cli/src/cli.ts dev",
    "build": "bun run packages/cli/src/cli.ts build",
    "gen": "bun run packages/cli/src/cli.ts gen",
    "sprite": "bun run packages/cli/src/cli.ts sprite",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "publish-packages": "bun run scripts/publish.ts"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "bun-types": "^1.3.4",
    "typescript": "^5"
  },
  "dependencies": {
    "@vojtaholik/static-kit-core": "workspace:*",
    "parse5": "^8.0.0",
    "zod": "^4.1.13"
  }
}
```

**Step 5: Find and replace all imports of `@static-block-kit/core`**

Replace `@static-block-kit/core` → `@vojtaholik/static-kit-core` in every file:

Files to update (search for `@static-block-kit/core`):
- `packages/cli/src/commands/dev.ts`
- `packages/cli/src/commands/build.ts`
- `packages/cli/src/commands/gen.ts`
- `packages/cli/src/config-loader.ts`
- `packages/core/src/index.ts` (no change — this IS core)
- `src/blocks/*.block.ts` (all block files)
- `src/blocks/index.ts`
- `src/site/pages/*.page.ts`
- `src/site/pages/index.ts`
- `src/cms-blocks.ts`
- `static-kit.config.ts`
- `packages/create-static-kit/template/**/*.ts`

Use project-wide find-and-replace: `@static-block-kit/core` → `@vojtaholik/static-kit-core`

**Step 6: Run bun install to update lockfile**

```bash
bun install
```

**Step 7: Run typecheck**

```bash
bun run typecheck
```

Expected: PASS

**Step 8: Run tests**

```bash
bun test
```

Expected: PASS

**Step 9: Commit**

```bash
git add -A
git commit -m "refactor: rename packages to @vojtaholik scope"
```

---

### Task 2: Rename src/ → example/

**Files:**
- Move: `src/` → `example/`
- Modify: `static-kit.config.ts` (root)
- Modify: `tsconfig.json` (root)

**Step 1: Move the directory**

```bash
git mv src example
```

**Step 2: Update root static-kit.config.ts**

```ts
import { defineConfig } from "@vojtaholik/static-kit-core";

export default defineConfig({
  blocksDir: "example/blocks",
  pagesDir: "example/site/pages",
  publicDir: "example/public",
  outDir: "dist",
  publicPath: "/public",
  devPort: 3000,
});
```

**Step 3: Update tsconfig.json include paths**

```json
{
  "include": ["packages/**/*.ts", "example/**/*.ts", "static-kit.config.ts"]
}
```

**Step 4: Verify build**

```bash
bun run gen && bun run build
```

Expected: Build completes, `dist/` contains rendered HTML.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rename src/ to example/"
```

---

### Task 3: Update config defaults + fix hardcoded cms-blocks path

**Files:**
- Modify: `packages/core/src/config.ts`
- Modify: `packages/cli/src/commands/dev.ts:69-75`
- Modify: `static-kit.config.ts` (root)

**Step 1: Update config schema defaults and add cmsBlocksFile**

In `packages/core/src/config.ts`:

```ts
export const configSchema = z.object({
  blocksDir: z.string().default("blocks"),
  pagesDir: z.string().default("site/pages"),
  publicDir: z.string().default("public"),
  outDir: z.string().default("dist"),
  publicPath: z.string().default("/public"),
  devPort: z.number().default(3000),
  cmsBlocksFile: z.string().optional(),
});
```

**Step 2: Fix hardcoded path in dev.ts**

Replace lines 69-75 in `packages/cli/src/commands/dev.ts`:

```ts
let cmsBlocks: Record<string, unknown> = {};
try {
  const cmsPath = config.cmsBlocksFile
    ? join(cwd, config.cmsBlocksFile)
    : join(cwd, "cms-blocks.ts");
  const cmsBlocksModule = await import(`file://${cmsPath}`);
  cmsBlocks = cmsBlocksModule.cmsBlocks ?? cmsBlocksModule.default ?? {};
} catch {
  // No cms-blocks file, that's fine
}
```

**Step 3: Update example site config**

```ts
import { defineConfig } from "@vojtaholik/static-kit-core";

export default defineConfig({
  blocksDir: "example/blocks",
  pagesDir: "example/site/pages",
  publicDir: "example/public",
  outDir: "dist",
  publicPath: "/public",
  devPort: 3000,
  cmsBlocksFile: "example/cms-blocks.ts",
});
```

**Step 4: Typecheck + verify dev server starts**

```bash
bun run typecheck
bun run dev
```

Expected: Both pass, dev server starts, Ctrl+C to stop.

**Step 5: Commit**

```bash
git add packages/core/src/config.ts packages/cli/src/commands/dev.ts static-kit.config.ts
git commit -m "fix: root-relative config defaults, configurable cms-blocks path"
```

---

### Task 4: Update create-static-kit scaffolder

**Files:**
- Rewrite: `packages/create-static-kit/src/index.ts`
- Modify: `packages/create-static-kit/template/package.json`
- Modify: `packages/create-static-kit/template/static-kit.config.ts`

**Step 1: Update template/package.json for npm deps**

```json
{
  "name": "my-static-kit-site",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch --watch-ignore='**/gen/**' static-kit dev",
    "build": "static-kit build",
    "gen": "static-kit gen",
    "sprite": "static-kit sprite",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vojtaholik/static-kit-core": "^0.1.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "bun-types": "^1.3.4",
    "@vojtaholik/static-kit-cli": "^0.1.0",
    "typescript": "^5"
  }
}
```

**Step 2: Update template/static-kit.config.ts**

```ts
import { defineConfig } from "@vojtaholik/static-kit-core";

export default defineConfig({
  blocksDir: "blocks",
  pagesDir: "site/pages",
  publicDir: "public",
  outDir: "dist",
  publicPath: "/public",
  devPort: 3000,
});
```

**Step 3: Update all imports in template files**

Replace `@static-block-kit/core` → `@vojtaholik/static-kit-core` in all template `*.ts` files.

**Step 4: Restructure template — move src/ contents up**

```bash
cd packages/create-static-kit/template
git mv src/blocks blocks
git mv src/site site
git mv src/public public
git mv src/cms-blocks.ts cms-blocks.ts
rm -rf src
cd ../../..
```

**Step 5: Update scaffolder index.ts**

```ts
#!/usr/bin/env bun
/**
 * Create Static Kit - Project Scaffolder
 *
 * Usage:
 *   bun create @vojtaholik/static-kit my-site
 */

import { cp, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templateDir = join(__dirname, "..", "template");

const targetDir = process.argv[2] || ".";
const targetPath = join(process.cwd(), targetDir);

console.log(`\n🚀 Creating Static Kit project in ${targetPath}\n`);

await mkdir(targetPath, { recursive: true });
await cp(templateDir, targetPath, { recursive: true });

if (targetDir !== ".") {
  const packageJsonPath = join(targetPath, "package.json");
  const packageJson = await Bun.file(packageJsonPath).json();
  packageJson.name = targetDir.split("/").pop();
  await Bun.write(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}

console.log(`✅ Done!

Next steps:
  ${targetDir !== "." ? `cd ${targetDir}` : ""}
  bun install
  bun run gen
  bun run dev

Happy building! 🎉
`);
```

**Step 6: Typecheck**

```bash
bun run typecheck
```

Expected: PASS

**Step 7: Commit**

```bash
git add packages/create-static-kit/
git commit -m "feat: update scaffolder for npm deps and flat structure"
```

---

### Task 5: Add publish script

**Files:**
- Create: `scripts/publish.ts`

**Step 1: Write the publish script**

```ts
#!/usr/bin/env bun
/**
 * Publish all @vojtaholik/static-kit-* packages to npm.
 *
 * Usage:
 *   bun run scripts/publish.ts [patch|minor|major]
 *
 * Steps:
 *   1. Typecheck + test
 *   2. Bump version in all packages
 *   3. Publish core → cli → create-static-kit
 *   4. Git commit + tag
 */

import { join } from "node:path";

const root = join(import.meta.dirname!, "..");
const bump = (process.argv[2] || "patch") as "patch" | "minor" | "major";

const packages = [
  "packages/core",
  "packages/cli",
  "packages/create-static-kit",
];

// Read current version from core
const corePkg = await Bun.file(join(root, "packages/core/package.json")).json();
const currentVersion = corePkg.version;
const [major, minor, patch] = currentVersion.split(".").map(Number);

let newVersion: string;
switch (bump) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`\n📦 Publishing @vojtaholik/static-kit packages`);
console.log(`   ${currentVersion} → ${newVersion} (${bump})\n`);

// Step 1: Typecheck + test
console.log("🔍 Running typecheck...");
const tc = Bun.spawnSync(["bun", "run", "typecheck"], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
if (tc.exitCode !== 0) {
  console.error("❌ Typecheck failed");
  process.exit(1);
}

console.log("🧪 Running tests...");
const test = Bun.spawnSync(["bun", "test"], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
if (test.exitCode !== 0) {
  console.error("❌ Tests failed");
  process.exit(1);
}

// Step 2: Bump version in all packages
console.log(`\n📝 Bumping versions to ${newVersion}...`);
for (const pkgDir of packages) {
  const pkgPath = join(root, pkgDir, "package.json");
  const pkg = await Bun.file(pkgPath).json();
  pkg.version = newVersion;

  // Update workspace dep versions to exact new version
  for (const depType of ["dependencies", "devDependencies", "peerDependencies"]) {
    if (!pkg[depType]) continue;
    for (const [name, version] of Object.entries(pkg[depType])) {
      if (
        typeof version === "string" &&
        version === "workspace:*" &&
        (name as string).startsWith("@vojtaholik/")
      ) {
        pkg[depType][name] = `^${newVersion}`;
      }
    }
  }

  await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`   ✓ ${pkg.name}@${newVersion}`);
}

// Also update template/package.json dep versions
const templatePkgPath = join(root, "packages/create-static-kit/template/package.json");
const templatePkg = await Bun.file(templatePkgPath).json();
for (const depType of ["dependencies", "devDependencies"]) {
  if (!templatePkg[depType]) continue;
  for (const name of Object.keys(templatePkg[depType])) {
    if (name.startsWith("@vojtaholik/")) {
      templatePkg[depType][name] = `^${newVersion}`;
    }
  }
}
await Bun.write(templatePkgPath, JSON.stringify(templatePkg, null, 2) + "\n");

// Step 3: Publish in order
console.log("\n🚀 Publishing to npm...");
for (const pkgDir of packages) {
  const pkgPath = join(root, pkgDir);
  console.log(`   Publishing ${pkgDir}...`);
  const pub = Bun.spawnSync(["npm", "publish", "--access", "public"], {
    cwd: pkgPath,
    stdio: ["inherit", "inherit", "inherit"],
  });
  if (pub.exitCode !== 0) {
    console.error(`❌ Failed to publish ${pkgDir}`);
    process.exit(1);
  }
}

// Step 4: Git commit + tag
console.log("\n📌 Committing and tagging...");
Bun.spawnSync(["git", "add", "-A"], { cwd: root });
Bun.spawnSync(["git", "commit", "-m", `release: v${newVersion}`], {
  cwd: root,
  stdio: ["inherit", "inherit", "inherit"],
});
Bun.spawnSync(["git", "tag", `v${newVersion}`], { cwd: root });

console.log(`\n✅ Published v${newVersion}!`);
console.log(`   Run \`git push && git push --tags\` to push.\n`);
```

**Step 2: Verify script loads without errors**

```bash
bun run scripts/publish.ts --help 2>&1 || true
```

(It will run typecheck and fail or proceed — just verify no syntax errors.)

**Step 3: Commit**

```bash
git add scripts/publish.ts
git commit -m "feat: add publish script for @vojtaholik packages"
```

---

### Task 6: End-to-end verification

**Step 1: Verify example site builds from repo root**

```bash
bun run gen && bun run build
```

Expected: Build completes.

**Step 2: Verify dev server starts**

```bash
timeout 5 bun run dev || true
```

Expected: Server starts on :3000.

**Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: PASS

**Step 4: Run tests**

```bash
bun test
```

Expected: PASS

**Step 5: Test scaffolder locally**

```bash
bun run packages/create-static-kit/src/index.ts /tmp/test-static-kit
cat /tmp/test-static-kit/package.json
```

Expected: package.json has `@vojtaholik/static-kit-core` and `@vojtaholik/static-kit-cli` deps with `^0.1.0`.

**Step 6: Clean up**

```bash
rm -rf /tmp/test-static-kit
```

**Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix: e2e adjustments"
```

---

### Task 7: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update all references**

- Package names: `@static-block-kit/core` → `@vojtaholik/static-kit-core`
- Paths: `src/blocks/` → `example/blocks/`, `src/site/pages/` → `example/site/pages/`, `src/public/` → `example/public/`
- Architecture diagram update
- Add `bun run publish-packages` to commands
- Add note about scaffolding new projects: `bun create @vojtaholik/static-kit my-site`

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for @vojtaholik npm packages"
```
