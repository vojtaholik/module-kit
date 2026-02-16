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
