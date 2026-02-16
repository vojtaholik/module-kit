#!/usr/bin/env bun
/**
 * Generate block render functions from templates
 */

import { join } from "node:path";
import { compileBlockTemplates } from "@vojtaholik/static-kit-core";
import { loadConfig } from "../config-loader.ts";

const cwd = process.cwd();
const config = await loadConfig(cwd);

console.log("🔨 Compiling block templates...");

await compileBlockTemplates({
  blocksDir: join(cwd, config.blocksDir),
  genDir: join(cwd, config.blocksDir, "gen"),
});

console.log("✅ Done!");
