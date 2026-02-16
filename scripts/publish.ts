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
const currentVersion: string = corePkg.version;
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

console.log("\n🧪 Running tests...");
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

  // Update workspace dep versions to exact new version for publishing
  for (const depType of ["dependencies", "devDependencies", "peerDependencies"] as const) {
    const deps = pkg[depType];
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      if (typeof version === "string" && version === "workspace:*" && name.startsWith("@vojtaholik/")) {
        deps[name] = `^${newVersion}`;
      }
    }
  }

  await Bun.write(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`   ✓ ${pkg.name}@${newVersion}`);
}

// Also update template/package.json dep versions
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

// Step 3: Publish in order (core first since cli depends on it)
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
