#!/usr/bin/env bun
/**
 * Release @vojtaholik/static-kit-* packages.
 *
 * Bumps versions, commits, tags, and pushes.
 * GitHub Actions handles the actual npm publish.
 *
 * Usage:
 *   bun run release              # patch bump (2.0.0 → 2.0.1)
 *   bun run release minor        # minor bump (2.0.0 → 2.1.0)
 *   bun run release major        # major bump (2.0.0 → 3.0.0)
 *   bun run release --no-bump    # release current version as-is
 */

import { join } from "node:path";

const root = join(import.meta.dirname!, "..");
const args = process.argv.slice(2);
const noBump = args.includes("--no-bump");
const bump = (args.find(a => ["patch", "minor", "major"].includes(a)) || "patch") as "patch" | "minor" | "major";

const packages = [
  "packages/core",
  "packages/cli",
  "packages/create-static-kit",
];

// Read current version
const corePkg = await Bun.file(join(root, "packages/core/package.json")).json();
const currentVersion: string = corePkg.version;
const [major, minor, patch] = currentVersion.split(".").map(Number);

let newVersion: string;
if (noBump) {
  newVersion = currentVersion;
} else {
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
}

console.log(`\n📦 Release @vojtaholik/static-kit v${newVersion}`);
console.log(`   ${noBump ? "(no bump)" : `${currentVersion} → ${newVersion} (${bump})`}\n`);

// Typecheck + test
console.log("🔍 Running typecheck...");
let result = Bun.spawnSync(["bun", "run", "typecheck"], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
if (result.exitCode !== 0) { console.error("❌ Typecheck failed"); process.exit(1); }

console.log("\n🧪 Running tests...");
result = Bun.spawnSync(["bun", "test"], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
if (result.exitCode !== 0) { console.error("❌ Tests failed"); process.exit(1); }

// Bump versions
if (!noBump) {
  console.log(`\n📝 Bumping to ${newVersion}...`);
  for (const pkgDir of packages) {
    const pkgPath = join(root, pkgDir, "package.json");
    const pkg = await Bun.file(pkgPath).json();
    pkg.version = newVersion;
    await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`   ✓ ${pkg.name}@${newVersion}`);
  }

  // Update template deps
  const templatePkgPath = join(root, "packages/create-static-kit/template/package.json");
  const templatePkg = await Bun.file(templatePkgPath).json();
  for (const depType of ["dependencies", "devDependencies"] as const) {
    const deps = templatePkg[depType];
    if (!deps) continue;
    for (const name of Object.keys(deps)) {
      if (name.startsWith("@vojtaholik/")) {
        deps[name] = `^${newVersion}`;
      }
    }
  }
  await Bun.write(templatePkgPath, JSON.stringify(templatePkg, null, 2) + "\n");
}

// Commit (only if there are changes), tag, push
console.log("\n🚀 Tagging and pushing...");
if (!noBump) {
  Bun.spawnSync(["git", "add", "-A"], { cwd: root });
  Bun.spawnSync(["git", "commit", "-m", `release: v${newVersion}`], {
    cwd: root,
    stdio: ["inherit", "inherit", "inherit"],
  });
}
const tag = `v${newVersion}`;
const tagResult = Bun.spawnSync(["git", "tag", tag], { cwd: root });
if (tagResult.exitCode !== 0) {
  console.error(`❌ Tag ${tag} already exists. Delete it first: git tag -d ${tag}`);
  process.exit(1);
}
Bun.spawnSync(["git", "push"], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });
Bun.spawnSync(["git", "push", "--tags"], { cwd: root, stdio: ["inherit", "inherit", "inherit"] });

console.log(`\n✅ v${newVersion} pushed! GitHub Actions will publish to npm.\n`);
