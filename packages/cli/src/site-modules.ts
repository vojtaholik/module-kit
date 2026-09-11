/**
 * Loading the user's blocks/ and pages/ modules.
 *
 * Both dev and build go through here so they behave the same: `await import()`
 * works for any module graph, including ones with top-level await (e.g. a
 * syntax highlighter initialised at module scope). `require()` does not —
 * Bun throws "require() async module ... is unsupported".
 *
 * For hot reload the dev server evicts the modules from `require.cache` first.
 * Bun shares that cache between require() and import(), so the eviction also
 * re-evaluates every transitive import under the watched dirs on the next
 * `await import()`. (A `?t=` cache-busting query on the entry alone would only
 * re-run the entry and keep its children stale.)
 */

import { join } from "node:path";
import { blockRegistry, type PageConfig } from "@vojtaholik/static-kit-core";

export interface SiteModules {
  pages: PageConfig[];
  getPageByPath: (path: string) => PageConfig | undefined;
  registerAllBlocks: () => void;
}

/** Drop every cached module whose path starts with one of `dirs` */
export function evictModules(...dirs: string[]): void {
  for (const key of Object.keys(require.cache)) {
    if (dirs.some((dir) => key.startsWith(dir))) {
      delete require.cache[key];
    }
  }
}

/**
 * Import blocks/index.ts and pages/index.ts. Does not touch the block
 * registry — call `registerAllBlocks()` from the result when you're ready.
 */
export async function loadSiteModules(blocksDir: string, pagesDir: string): Promise<SiteModules> {
  const blocksModule = await import(join(blocksDir, "index.ts"));
  const pagesModule = await import(join(pagesDir, "index.ts"));

  const pages: PageConfig[] = pagesModule.pages ?? [];
  const getPageByPath: SiteModules["getPageByPath"] =
    typeof pagesModule.getPageByPath === "function"
      ? pagesModule.getPageByPath
      : (path) => pages.find((p) => p.path === path);
  const registerAllBlocks: () => void =
    typeof blocksModule.registerAllBlocks === "function"
      ? blocksModule.registerAllBlocks
      : () => {};

  return { pages, getPageByPath, registerAllBlocks };
}

/**
 * Evict, re-import, then swap the registry. If the import fails (syntax
 * error, missing module) the previous registry stays intact, so the dev
 * server keeps serving the last good state while the error is fixed.
 */
export async function reloadSiteModules(blocksDir: string, pagesDir: string): Promise<SiteModules> {
  evictModules(blocksDir, pagesDir);
  const modules = await loadSiteModules(blocksDir, pagesDir);
  blockRegistry.clear();
  modules.registerAllBlocks();
  return modules;
}
