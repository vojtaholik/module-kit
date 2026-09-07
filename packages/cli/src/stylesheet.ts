/**
 * Stylesheet pipeline
 *
 * Resolves a requested/emitted `.css` path in publicDir to its source
 * (plain CSS or, when `scss: true` is enabled, a `.scss`/`.sass`
 * sibling), compiles it with Sass if needed, then runs the result through
 * lightningcss (nesting, prefixes, optional minify).
 *
 * SCSS is opt-in:
 * - `scss` defaults to false — nothing changes for existing sites.
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
import { processCSS, processCSSString } from "./css-processor.ts";

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
 *
 * Any failure to load a candidate (not installed, or installed but its
 * platform binary is missing) moves on to the next one; the hint is thrown
 * only when none loads, with the underlying errors attached.
 */
export function loadSass(cwd = process.cwd()): Promise<SassModule> {
  if (!sassModulePromise) {
    sassModulePromise = (async () => {
      const failures: string[] = [];
      for (const pkg of SASS_PACKAGES) {
        try {
          // Resolve from the user's project, not from wherever the CLI lives
          let specifier: string = pkg;
          try {
            specifier = Bun.resolveSync(pkg, cwd);
          } catch {
            // not in the project tree — let import() try the CLI's own resolution
          }
          return (await import(specifier)) as SassModule;
        } catch (err) {
          failures.push(`${pkg}: ${String((err as Error)?.message ?? err).split("\n")[0]}`);
        }
      }
      throw new Error(
        [
          `scss: true is set but no Sass compiler could be loaded.`,
          `Install one of:`,
          `  bun add -d sass            # pure JS, zero native deps`,
          `  bun add -d sass-embedded   # native dart-sass, faster on big projects`,
          ``,
          `Tried:`,
          ...failures.map((f) => `  - ${f}`),
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
  const cwd = options.cwd ?? process.cwd();
  const sass = await loadSass(cwd);

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
    // loadedUrls always includes the entry point
    const loadedFiles = result.loadedUrls
      .filter((u) => u.protocol === "file:")
      .map((u) => fileURLToPath(u));
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
 * - scss disabled: only the real `.css` file counts.
 * - scss enabled: a real `.css` wins if it's alone; a `.scss`/`.sass`
 *   sibling is used otherwise. Having both is an error — it would be
 *   ambiguous which one ends up in dist.
 * - Partials (`_foo.scss`) never resolve — they are inputs only, in dev
 *   exactly like in build.
 */
export async function resolveStylesheet(
  publicDir: string,
  relCssPath: string,
  scss: boolean
): Promise<StylesheetSource | null> {
  const cssPath = join(publicDir, relCssPath);
  const cssExists = await Bun.file(cssPath).exists();

  if (!scss) {
    return cssExists ? { kind: "css", path: cssPath } : null;
  }

  const sassCandidates: string[] = [];
  for (const ext of SASS_EXTENSIONS) {
    const candidate = cssPath.replace(/\.css$/, ext);
    if (isSassPartial(candidate)) continue;
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

  if (source.kind === "sass") {
    const result = await compileSass({
      file: source.path,
      publicDir: options.publicDir,
      cwd: options.cwd,
    });
    const css = processCSSString(result.css, {
      filename: toCssPath(source.path),
      minify: options.minify,
    });
    return { css, deps: result.loadedFiles };
  }

  // Plain CSS: hand lightningcss the raw bytes, exactly as before scss existed
  const bytes = new Uint8Array(await Bun.file(source.path).arrayBuffer());
  const result = processCSS({ filename: source.path, code: bytes, minify: options.minify });
  return { css: new TextDecoder().decode(result.code), deps: [source.path] };
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

  // Deps are only known after compiling, so mtimes are snapshotted afterwards.
  // A write that lands *during* the compile would then be recorded with its
  // new mtime next to stale CSS — so refuse to cache when any dep was touched
  // at or after the compile started; the next request recompiles.
  const compileStart = Date.now();
  const { css, deps } = await compileStylesheet(options);
  const mtimes = await snapshotMtimes(deps);
  const touchedDuringCompile = [...mtimes.values()].some((m) => m >= compileStart);
  if (!touchedDuringCompile) compiledCache.set(key, { css, mtimes });
  return css;
}

export function invalidateStylesheetCache(): void {
  compiledCache.clear();
}

// ---------------------------------------------------------------------------
// Discoverability — nudge when .scss files exist but scss is off
// ---------------------------------------------------------------------------

/**
 * Returns a hint message when Sass sources exist in publicDir but scss is
 * disabled (they'd be copied verbatim / served raw).
 * Returns null when there's nothing to say.
 */
export async function sassHintIfDisabled(
  publicDir: string,
  scss: boolean
): Promise<string | null> {
  if (scss) return null;

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
    `but scss is not enabled — they won't be compiled.\n` +
    `   Enable with scss: true in static-kit.config.ts and run: bun add -d sass`
  );
}
