#!/usr/bin/env bun
/**
 * Static Kit - SVG Sprite CLI Command
 *
 * Compiles individual SVG files from publicDir/svg/ into a single spritesheet.
 *
 * Usage in HTML:
 *   <svg><use href="/public/sprite.svg#icon-name"/></svg>
 */

import { loadConfig, resolvePath } from "../config-loader.ts";
import { compileSpritesheet } from "../sprite-compiler.ts";

const cwd = process.cwd();
const config = await loadConfig(cwd);
const publicDir = resolvePath(config, "publicDir", cwd);

console.log("🎨 Compiling SVG spritesheet...\n");

try {
  const { count, outputPath } = await compileSpritesheet({ publicDir });
  console.log(`  ✓ Compiled ${count} SVGs → ${outputPath}`);
  console.log("\n✅ Sprite compilation complete!");
} catch (err) {
  if ((err as NodeJS.ErrnoException).code === "ENOENT") {
    console.log("  ℹ No svg/ directory found, skipping sprite compilation");
  } else {
    console.error("Sprite compilation failed:", err);
    process.exit(1);
  }
}
