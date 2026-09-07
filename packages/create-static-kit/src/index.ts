#!/usr/bin/env bun
/**
 * Create Static Kit - Project Scaffolder
 *
 * Usage:
 *   bun create @vojtaholik/static-kit my-site
 */

import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templateDir = join(__dirname, "..", "template");

const args = process.argv.slice(2);
const force = args.includes("--force");
const targetDir = args.find((a) => !a.startsWith("--")) || ".";
const targetPath = join(process.cwd(), targetDir);

// Refuse to scaffold over existing files unless --force
const existing = await readdir(targetPath).catch(() => [] as string[]);
const meaningful = existing.filter((f) => f !== ".git" && f !== ".DS_Store");
if (meaningful.length > 0 && !force) {
  console.error(
    `✖ ${targetPath} is not empty (${meaningful.slice(0, 5).join(", ")}${meaningful.length > 5 ? ", …" : ""}).\n` +
      `  Pick an empty directory or pass --force to overwrite matching files.`
  );
  process.exit(1);
}

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
