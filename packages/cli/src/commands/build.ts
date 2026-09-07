#!/usr/bin/env bun
/**
 * Static Kit - Build Pipeline
 *
 * 1. Run template compiler (gen-blocks)
 * 2. Load and validate all page configs
 * 3. Render each page to HTML (no dev overlay)
 * 4. Copy publicDir to dist/{publicPath}/ (1:1 structure);
 *    CSS goes through lightningcss, .scss/.sass → .css when scss is enabled
 * 5. Write HTML files to dist/ (flat structure)
 */

import { mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  compileBlockTemplates,
  type PageConfig,
  renderPage,
  rewriteBasePath,
} from "@vojtaholik/static-kit-core";
import { Glob } from "bun";
import { loadConfig, resolvePath } from "../config-loader.ts";
import { processHtmlOutput } from "../html-output.ts";
import { pageOutputFile } from "../paths.ts";
import { compileSpritesheet } from "../sprite-compiler.ts";
import {
  compileStylesheet,
  isSassPartial,
  isSassSource,
  resolveStylesheet,
  sassHintIfDisabled,
  toCssPath,
} from "../stylesheet.ts";

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
    typed: config.typedTemplates,
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
      assetBase: config.publicPath,
      cacheBust: buildTimestamp,
      vlna: config.vlna,
      // A missing block or invalid props must fail the build, not silently
      // drop a section from the page
      strict: true,
    });
    html = rewriteBasePath(html, config.basePath);
    html = await processHtmlOutput(html, config.htmlOutput);

    const outPath = join(outDir, pageOutputFile(page.path, config.trailingSlash));

    // Write HTML
    await Bun.write(outPath, html);
    console.log(`  ✓ ${page.path} → ${outPath}`);
  }

  // Step 4: Copy publicDir to dist/public/ (1:1 mirrored structure)
  console.log("\n📦 Copying public assets...");
  const outPublicDir = join(outDir, publicPathDir);

  const sassHint = await sassHintIfDisabled(publicDir, config.scss);
  if (sassHint) console.warn(`  ℹ ${sassHint}`);

  const shouldMinify = config.cssOutput === "minified";

  const publicGlob = new Glob("**/*");
  for await (const file of publicGlob.scan(publicDir)) {
    const srcFile = join(publicDir, file);

    // Stylesheets: .css always, .scss/.sass when enabled. Partials are inputs
    // only. resolveStylesheet owns the "which source produces this .css" rule
    // and throws on a .css/.scss twin (ambiguous output).
    if (file.endsWith(".css") || (config.scss && isSassSource(file))) {
      if (isSassPartial(file)) continue;
      const cssFile = toCssPath(file);
      const source = await resolveStylesheet(publicDir, cssFile, config.scss);
      if (!source) throw new Error(`Stylesheet vanished during build: ${srcFile}`);
      const { css } = await compileStylesheet({ source, publicDir, minify: shouldMinify, cwd });
      const destFile = join(outPublicDir, cssFile);
      await mkdir(dirname(destFile), { recursive: true });
      await Bun.write(destFile, css);
      const from = source.kind === "sass" ? `from ${file}` : "";
      const note = [from, shouldMinify ? "minified" : ""].filter(Boolean).join(", ");
      console.log(`  ✓ ${config.publicPath}/${cssFile}${note ? ` (${note})` : ""}`);
      continue;
    }

    const destFile = join(outPublicDir, file);
    const bunFile = Bun.file(srcFile);
    if (await bunFile.exists()) {
      await mkdir(dirname(destFile), { recursive: true });
      await Bun.write(destFile, await bunFile.arrayBuffer());
      console.log(`  ✓ ${config.publicPath}/${file}`);
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
