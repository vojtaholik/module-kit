import { beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { blockRegistry } from "@vojtaholik/static-kit-core";
import { loadSiteModules, reloadSiteModules } from "../src/site-modules.ts";

// A throwaway site whose page registry uses top-level await, both in the entry
// and in a transitive import — the case require() could not load.
// Created inside the repo (not os.tmpdir()) so "@vojtaholik/static-kit-core"
// resolves through the monorepo's node_modules.
const scratchRoot = join(import.meta.dir, "fixtures/.scratch");

async function makeSite(label: string) {
  await mkdir(scratchRoot, { recursive: true });
  const dir = await mkdtemp(join(scratchRoot, "site-"));
  const blocksDir = join(dir, "blocks");
  const pagesDir = join(dir, "pages");
  await mkdir(blocksDir);
  await mkdir(pagesDir);
  await writeSite(blocksDir, pagesDir, label);
  return { dir, blocksDir, pagesDir };
}

async function writeSite(blocksDir: string, pagesDir: string, label: string) {
  await Bun.write(
    join(blocksDir, "index.ts"),
    `import { blockRegistry, defineBlock } from "@vojtaholik/static-kit-core";
import { z } from "zod/v4";
export function registerAllBlocks() {
  blockRegistry.register(defineBlock({ type: "b-${label}", propsSchema: z.object({}), renderHtml: () => "" }));
}`
  );
  await Bun.write(
    join(pagesDir, "_highlighter.ts"),
    `export const highlighter = await new Promise<string>((r) => setTimeout(() => r("hl-${label}"), 1));`
  );
  await Bun.write(
    join(pagesDir, "index.ts"),
    `import { highlighter } from "./_highlighter.ts";
await Promise.resolve();
export const pages = [{ id: "${label}", path: "/", title: highlighter, template: "base.html", regions: {} }];
export function getPageByPath(path: string) { return pages.find((p) => p.path === path); }`
  );
}

describe("site modules", () => {
  beforeEach(() => blockRegistry.clear());

  test("loadSiteModules handles top-level await anywhere in the graph", async () => {
    const site = await makeSite("v1");
    try {
      const { pages, getPageByPath, registerAllBlocks } = await loadSiteModules(
        site.blocksDir,
        site.pagesDir
      );
      expect(pages[0]?.title).toBe("hl-v1");
      expect(getPageByPath("/")?.id).toBe("v1");
      registerAllBlocks();
      expect(blockRegistry.has("b-v1")).toBe(true);
    } finally {
      await rm(site.dir, { recursive: true, force: true });
    }
  });

  test("reloadSiteModules picks up edits in entry and transitive modules", async () => {
    const site = await makeSite("v1");
    try {
      let modules = await reloadSiteModules(site.blocksDir, site.pagesDir);
      expect(modules.pages[0]?.title).toBe("hl-v1");
      expect(blockRegistry.types()).toEqual(["b-v1"]);

      await writeSite(site.blocksDir, site.pagesDir, "v2");
      modules = await reloadSiteModules(site.blocksDir, site.pagesDir);
      expect(modules.pages[0]?.title).toBe("hl-v2"); // transitive _highlighter.ts re-evaluated
      expect(modules.pages[0]?.id).toBe("v2");
      expect(blockRegistry.types()).toEqual(["b-v2"]); // old registration gone
    } finally {
      await rm(site.dir, { recursive: true, force: true });
    }
  });

  test("a failed reload keeps the previous registry", async () => {
    const site = await makeSite("v1");
    try {
      await reloadSiteModules(site.blocksDir, site.pagesDir);
      await Bun.write(join(site.pagesDir, "index.ts"), "export const pages = [;");
      await expect(reloadSiteModules(site.blocksDir, site.pagesDir)).rejects.toThrow();
      expect(blockRegistry.types()).toEqual(["b-v1"]);
    } finally {
      await rm(site.dir, { recursive: true, force: true });
    }
  });

  test("falls back when pages/index.ts has no getPageByPath", async () => {
    const site = await makeSite("v1");
    try {
      await Bun.write(
        join(site.pagesDir, "index.ts"),
        `export const pages = [{ id: "x", path: "/x", title: "X", template: "base.html", regions: {} }];`
      );
      const { getPageByPath } = await loadSiteModules(site.blocksDir, site.pagesDir);
      expect(getPageByPath("/x")?.id).toBe("x");
      expect(getPageByPath("/nope")).toBeUndefined();
    } finally {
      await rm(site.dir, { recursive: true, force: true });
    }
  });
});
