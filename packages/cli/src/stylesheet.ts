/**
 * Stylesheet pipeline
 *
 * Resolves a requested/emitted `.css` path in publicDir to its source
 * (plain CSS or, when `cssPreprocessor: "scss"` is enabled, a `.scss`/`.sass`
 * sibling), compiles it with Sass if needed, then runs the result through
 * lightningcss (nesting, prefixes, optional minify).
 *
 * SCSS is opt-in:
 * - `cssPreprocessor` defaults to "none" — nothing changes for existing sites.
 * - `sass` (or `sass-embedded`) is an optional peer dependency, loaded lazily
 *   only when the flag is on, with a clear install hint when missing.
 * - Output keeps the `.css` path (`css/styles.scss` → `css/styles.css`), so
 *   templates keep linking `.css` and cache-busting keeps working.
 * - Partials (`_foo.scss`) are never emitted; sources are never copied to dist.
 */

import { dirname, join, basename } from "node:path";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Glob } from "bun";
import type { StaticKitConfig } from "@vojtaholik/static-kit-core";
import { processCSSString } from "./css-processor.ts";

export type CssPreprocessor = StaticKitConfig["cssPreprocessor"];

/** Source extensions handled by the Sass compiler (syntax is picked per extension) */
export const SASS_EXTENSIONS = [".scss", ".sass"] as const;

export function isSassSource(path: string): boolean {
  return SASS_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function isSassPartial(path: string): boolean {
  return isSassSource(path) && basename(path).startsWith("_");
}

/** `css/styles.scss` → `css/styles.css` */
export function toCssPath(sassPath: string): string {
  return sassPath.replace(/\.s[ac]ss$/, ".css");
}

// ---------------------------------------------------------------------------
// Lazy Sass loader — minimal local typing so we don't depend on sass types
// ---------------------------------------------------------------------------

interface SassCompileOptions {
  style?: "expanded" | "compressed";
  loadPaths?: string[];
  importers?: unknown[];
  quietDeps?: boolean;
}

interface SassModule {
  compile(path: string, options?: SassCompileOptions): { css: string; loadedUrls: URL[] };
  NodePackageImporter?: new (entryPointDirectory?: string) => unknown;
}

const SASS_PACKAGES = ["sass-embedded", "sass"] as const;

let sassModulePromise: Promise<SassModule> | null = null;

/**
 * Load a Sass implementation. Prefers `sass-embedded` (native, faster),
 * falls back to `sass` (pure JS). Both expose the same modern API.
 */
export function loadSass(): Promise<SassModule> {
  if (!sassModulePromise) {
    sassModulePromise = (async () => {
      for (const pkg of SASS_PACKAGES) {
        try {
          const mod = (await import(pkg)) as SassModule & { default?: SassModule };
          return typeof mod.compile === "function" ? mod : (mod.default as SassModule);
        } catch (err) {
          if (!isModuleNotFound(err, pkg)) throw err;
        }
      }
      throw new Error(
        [
          `cssPreprocessor is set to "scss" but no Sass compiler is installed.`,
          `Install one of:`,
          `  bun add -d sass            # pure JS, zero native deps`,
          `  bun add -d sass-embedded   # native dart-sass, faster on big projects`,
        ].join("\n")
      );
    })().catch((err) => {
      // Don't cache failures — user may install the package and retry (dev server)
      sassModulePromise = null;
      throw err;
    });
  }
  return sassModulePromise;
}

function isModuleNotFound(err: unknown, pkg: string): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === "ERR_MODULE_NOT_FOUND" ||
    e?.code === "MODULE_NOT_FOUND" ||
    (typeof e?.message === "string" &&
      /cannot find (module|package)/i.test(e.message) &&
      e.message.includes(pkg))
  );
}

// ---------------------------------------------------------------------------
// Compilation
// ---------------------------------------------------------------------------

export interface CompileSassOptions {
  /** Absolute path to the .scss/.sass entry file */
  file: string;
  /** publicDir — added to loadPaths so `@use "css/tokens"` works from anywhere */
  publicDir: string;
  /** Project root — its node_modules is added to loadPaths */
  cwd?: string;
}

export interface SassCompileResult {
  css: string;
  /** Absolute paths of every file that took part (entry + @use/@import graph) */
  loadedFiles: string[];
}

/**
 * Compile a Sass file to expanded CSS. Nesting/prefixing/minification are
 * intentionally left to lightningcss so both pipelines stay identical.
 */
export async function compileSass(options: CompileSassOptions): Promise<SassCompileResult> {
  const sass = await loadSass();
  const cwd = options.cwd ?? process.cwd();

  const importers: unknown[] = [];
  // `@use "pkg:some-package/styles"` — resolves via package.json exports
  if (sass.NodePackageImporter) {
    try {
      importers.push(new sass.NodePackageImporter(cwd));
    } catch {
      // Older sass without a working importer — loadPaths still cover node_modules
    }
  }

  try {
    const result = sass.compile(options.file, {
      style: "expanded",
      loadPaths: [dirname(options.file), options.publicDir, join(cwd, "node_modules")],
      importers,
      quietDeps: true,
    });
    const loadedFiles = result.loadedUrls
      .filter((u) => u.protocol === "file:")
      .map((u) => fileURLToPath(u));
    if (!loadedFiles.includes(options.file)) loadedFiles.unshift(options.file);
    return { css: result.css, loadedFiles };
  } catch (err) {
    // sass.Exception#toString() already carries the snippet + file:line;
    // rethrow as a plain Error so callers don't print dart-sass internals.
    throw new Error(`Sass compile error:\n${String(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Resolution — one place decides what a `.css` path maps to
// ---------------------------------------------------------------------------

export interface StylesheetSource {
  kind: "css" | "sass";
  /** Absolute path to the source file */
  path: string;
}

/**
 * Given a `.css` path relative to publicDir, find what should produce it.
 *
 * - preprocessor "none": only the real `.css` file counts.
 * - preprocessor "scss": a real `.css` wins if it's alone; a `.scss`/`.sass`
 *   sibling is used otherwise. Having both is an error — it would be
 *   ambiguous which one ends up in dist.
 */
export async function resolveStylesheet(
  publicDir: string,
  relCssPath: string,
  preprocessor: CssPreprocessor
): Promise<StylesheetSource | null> {
  const cssPath = join(publicDir, relCssPath);
  const cssExists = await Bun.file(cssPath).exists();

  if (preprocessor === "none") {
    return cssExists ? { kind: "css", path: cssPath } : null;
  }

  const sassCandidates: string[] = [];
  for (const ext of SASS_EXTENSIONS) {
    const candidate = cssPath.replace(/\.css$/, ext);
    if (await Bun.file(candidate).exists()) sassCandidates.push(candidate);
  }

  const found = [...(cssExists ? [cssPath] : []), ...sassCandidates];
  if (found.length > 1) {
    throw new Error(
      `Ambiguous stylesheet for "${relCssPath}": multiple sources would produce it:\n` +
        found.map((f) => `  - ${f}`).join("\n") +
        `\nKeep exactly one of them.`
    );
  }

  if (cssExists) return { kind: "css", path: cssPath };
  const sassPath = sassCandidates[0];
  return sassPath ? { kind: "sass", path: sassPath } : null;
}

// ---------------------------------------------------------------------------
// Full pipeline: source → (sass) → lightningcss
// ---------------------------------------------------------------------------

export interface CompileStylesheetOptions {
  source: StylesheetSource;
  publicDir: string;
  minify: boolean;
  cwd?: string;
}

export interface CompiledStylesheet {
  css: string;
  /** Files whose change should invalidate this output */
  deps: string[];
}

export async function compileStylesheet(
  options: CompileStylesheetOptions
): Promise<CompiledStylesheet> {
  const { source } = options;
  let raw: string;
  let deps: string[];

  if (source.kind === "sass") {
    const result = await compileSass({
      file: source.path,
      publicDir: options.publicDir,
      cwd: options.cwd,
    });
    raw = result.css;
    deps = result.loadedFiles;
  } else {
    raw = await Bun.file(source.path).text();
    deps = [source.path];
  }

  const css = processCSSString(raw, {
    filename: source.kind === "sass" ? toCssPath(source.path) : source.path,
    minify: options.minify,
  });
  return { css, deps };
}

// ---------------------------------------------------------------------------
// Dev cache
//
// Validated by mtime of every file in the @use graph, so it stays correct even
// when the fs watcher misses an event (rename-style saves from sed/vim/etc).
// The watcher additionally clears it eagerly for instant hot reloads.
// ---------------------------------------------------------------------------

interface CacheEntry {
  css: string;
  mtimes: Map<string, number>;
}

const compiledCache = new Map<string, CacheEntry>();

async function snapshotMtimes(files: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  await Promise.all(
    files.map(async (f) => {
      try {
        out.set(f, (await stat(f)).mtimeMs);
      } catch {
        out.set(f, -1); // deleted → always differs from a real mtime
      }
    })
  );
  return out;
}

async function isFresh(entry: CacheEntry): Promise<boolean> {
  const now = await snapshotMtimes([...entry.mtimes.keys()]);
  for (const [file, mtime] of entry.mtimes) {
    if (now.get(file) !== mtime) return false;
  }
  return true;
}

/** Cached variant of compileStylesheet for the dev server (Sass compile isn't free). */
export async function compileStylesheetCached(
  options: CompileStylesheetOptions
): Promise<string> {
  // Plain CSS is cheap; only cache Sass output
  if (options.source.kind !== "sass") return (await compileStylesheet(options)).css;

  const key = options.source.path;
  const hit = compiledCache.get(key);
  if (hit && (await isFresh(hit))) return hit.css;

  // Snapshot mtimes *before* compiling so a write during compile invalidates next time
  const { css, deps } = await compileStylesheet(options);
  compiledCache.set(key, { css, mtimes: await snapshotMtimes(deps) });
  return css;
}

export function invalidateStylesheetCache(): void {
  compiledCache.clear();
}

// ---------------------------------------------------------------------------
// Discoverability — nudge when .scss files exist but the flag is off
// ---------------------------------------------------------------------------

/**
 * Returns a hint message when Sass sources exist in publicDir but the
 * preprocessor is disabled (they'd be copied verbatim / served raw).
 * Returns null when there's nothing to say.
 */
export async function sassHintIfDisabled(
  publicDir: string,
  preprocessor: CssPreprocessor
): Promise<string | null> {
  if (preprocessor !== "none") return null;

  const glob = new Glob("**/*.{scss,sass}");
  const found: string[] = [];
  try {
    for await (const file of glob.scan(publicDir)) {
      found.push(file);
      if (found.length >= 3) break;
    }
  } catch {
    return null; // publicDir missing — not our concern here
  }
  if (found.length === 0) return null;

  return (
    `Found Sass sources (${found.join(", ")}${found.length >= 3 ? ", …" : ""}) ` +
    `but cssPreprocessor is "none" — they won't be compiled.\n` +
    `   Enable with cssPreprocessor: "scss" in static-kit.config.ts and run: bun add -d sass`
  );
}
