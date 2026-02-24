#!/usr/bin/env bun
/**
 * Static Kit - Build Pipeline
 *
 * 1. Run template compiler (gen-blocks)
 * 2. Load and validate all page configs
 * 3. Render each page to HTML (no dev overlay)
 * 4. Copy publicDir to dist/{publicPath}/ (1:1 structure)
 * 5. Write HTML files to dist/ (flat structure)
 */

import { mkdir, rm, cp } from "node:fs/promises";
import { join, dirname } from "node:path";
import { Glob } from "bun";
import {
  renderPage,
  compileBlockTemplates,
  type PageConfig,
} from "@vojtaholik/static-kit-core";
import { loadConfig, resolvePath } from "../config-loader.ts";
import { processCSS } from "../css-processor.ts";
import { compileSpritesheet } from "../sprite-compiler.ts";
import { processHtmlOutput } from "../html-output.ts";

const cwd = process.cwd();
const config = await loadConfig(cwd);

const blocksDir = resolvePath(config, "blocksDir", cwd);
const pagesDir = resolvePath(config, "pagesDir", cwd);
const publicDir = resolvePath(config, "publicDir", cwd);
const outDir = resolvePath(config, "outDir", cwd);

// Strip leading slash from publicPath for filesystem operations
const publicPathDir = config.publicPath.replace(/^\//, "");

async function build() {
  console.log("🔨 Building static site...\n");

  // Clean dist directory
  console.log("Cleaning output directory...");
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // Step 1: Compile templates
  console.log("\n📝 Compiling block templates...");
  await compileBlockTemplates({
    blocksDir,
    genDir: join(blocksDir, "gen"),
  });

  // Step 1.5: Compile SVG spritesheet
  console.log("\n🎨 Compiling SVG spritesheet...");
  try {
    const { count } = await compileSpritesheet({ publicDir });
    console.log(`  ✓ ${count} SVGs compiled`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    console.log("  ℹ No svg/ directory found, skipping");
  }

  // Step 2: Import fresh modules (after template compilation)
  const blocksModule = await import(join(blocksDir, "index.ts"));
  const pagesModule = await import(join(pagesDir, "index.ts"));

  // Register blocks
  if (typeof blocksModule.registerAllBlocks === "function") {
    blocksModule.registerAllBlocks();
  }

  const pages: PageConfig[] = pagesModule.pages;

  // Step 3: Render all pages (flat structure in dist/)
  console.log("\n📄 Rendering pages...");
  const buildTimestamp = Date.now();
  for (const page of pages) {
    let html = await renderPage(page, {
      templateDir: pagesDir,
      isDev: false,
      assetBase: "/",
      cacheBust: buildTimestamp,
    });
    html = await processHtmlOutput(html, config.htmlOutput);

    // Flat output: /about -> dist/about.html, / -> dist/index.html
    const fileName =
      page.path === "/" ? "index.html" : `${page.path.replace(/^\//, "")}.html`;
    const outPath = join(outDir, fileName);

    // Write HTML
    await Bun.write(outPath, html);
    console.log(`  ✓ ${page.path} → ${outPath}`);
  }

  // Step 4: Copy publicDir to dist/public/ (1:1 mirrored structure)
  console.log("\n📦 Copying public assets...");
  const outPublicDir = join(outDir, publicPathDir);

  const devOnlyFiles = new Set(["js/dev-overlay.js"]);
  const publicGlob = new Glob("**/*");
  for await (const file of publicGlob.scan(publicDir)) {
    if (devOnlyFiles.has(file)) continue;
    const srcFile = join(publicDir, file);
    const destFile = join(outPublicDir, file);

    const bunFile = Bun.file(srcFile);
    if (await bunFile.exists()) {
      await mkdir(dirname(destFile), { recursive: true });

      // Process CSS files through lightningcss
      if (file.endsWith(".css")) {
        const cssBytes = new Uint8Array(await bunFile.arrayBuffer());
        const result = processCSS({
          filename: srcFile,
          code: cssBytes,
          minify: true,
        });
        await Bun.write(destFile, result.code);
        console.log(`  ✓ ${config.publicPath}/${file} (minified)`);
      } else {
        await Bun.write(destFile, await bunFile.arrayBuffer());
        console.log(`  ✓ ${config.publicPath}/${file}`);
      }
    }
  }

  // Done
  console.log("\n✅ Build complete!");
  console.log(`   Output: ${outDir}/`);

  // List output files
  console.log("\n   Files:");
  const glob = new Glob("**/*");
  for await (const file of glob.scan(outDir)) {
    const stat = await Bun.file(join(outDir, file)).size;
    console.log(`   - ${file} (${formatBytes(stat)})`);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
