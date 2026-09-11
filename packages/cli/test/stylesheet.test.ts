import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  compileStylesheet,
  compileStylesheetCached,
  invalidateStylesheetCache,
  isSassPartial,
  isSassSource,
  resolveStylesheet,
  sassHintIfDisabled,
  toCssPath,
} from "../src/stylesheet.ts";

let publicDir: string;

beforeAll(async () => {
  publicDir = await mkdtemp(join(tmpdir(), "static-kit-scss-"));
  await mkdir(join(publicDir, "css"), { recursive: true });
  await Bun.write(
    join(publicDir, "css/_tokens.scss"),
    `$accent: #f0f;\n@mixin pad { padding: 1rem; }\n`
  );
  await Bun.write(
    join(publicDir, "css/styles.scss"),
    `@use "tokens";\n.btn { @include tokens.pad; color: tokens.$accent; &:hover { color: red; } }\n`
  );
  await Bun.write(join(publicDir, "css/plain.css"), `.a { color: blue; }\n`);
  await Bun.write(join(publicDir, "css/broken.scss"), `.x { color: ; }\n`);
  // Ambiguous pair
  await Bun.write(join(publicDir, "css/both.css"), `.b { color: green; }\n`);
  await Bun.write(join(publicDir, "css/both.scss"), `.b { color: green; }\n`);
});

afterAll(async () => {
  await rm(publicDir, { recursive: true, force: true });
});

describe("path helpers", () => {
  test("detects sass sources and partials", () => {
    expect(isSassSource("css/a.scss")).toBe(true);
    expect(isSassSource("css/a.sass")).toBe(true);
    expect(isSassSource("css/a.css")).toBe(false);
    expect(isSassPartial("css/_a.scss")).toBe(true);
    expect(isSassPartial("css/a.scss")).toBe(false);
    expect(isSassPartial("_dir/a.scss")).toBe(false);
  });

  test("maps sass path to css path", () => {
    expect(toCssPath("css/styles.scss")).toBe("css/styles.css");
    expect(toCssPath("css/styles.sass")).toBe("css/styles.css");
  });
});

describe("resolveStylesheet", () => {
  test("scss disabled ignores .scss siblings", async () => {
    expect(await resolveStylesheet(publicDir, "css/styles.css", false)).toBeNull();
    expect(await resolveStylesheet(publicDir, "css/plain.css", false)).toEqual({
      kind: "css",
      path: join(publicDir, "css/plain.css"),
    });
  });

  test("scss enabled finds the .scss source for a .css path", async () => {
    expect(await resolveStylesheet(publicDir, "css/styles.css", true)).toEqual({
      kind: "sass",
      path: join(publicDir, "css/styles.scss"),
    });
  });

  test("plain .css still wins when it is the only source", async () => {
    expect(await resolveStylesheet(publicDir, "css/plain.css", true)).toEqual({
      kind: "css",
      path: join(publicDir, "css/plain.css"),
    });
  });

  test("throws when both .css and .scss would produce the same file", async () => {
    await expect(resolveStylesheet(publicDir, "css/both.css", true)).rejects.toThrow(
      /Ambiguous stylesheet/
    );
  });

  test("returns null for missing stylesheet", async () => {
    expect(await resolveStylesheet(publicDir, "css/nope.css", true)).toBeNull();
  });

  test("partials never resolve (dev matches build)", async () => {
    expect(await resolveStylesheet(publicDir, "css/_tokens.css", true)).toBeNull();
  });
});

describe("compileStylesheet", () => {
  test("compiles scss (with @use partial) and runs lightningcss", async () => {
    const source = { kind: "sass" as const, path: join(publicDir, "css/styles.scss") };
    const { css, deps } = await compileStylesheet({ source, publicDir, minify: false });
    expect(css).toContain("padding: 1rem");
    expect(css).toContain("#f0f");
    // Nested &:hover flattened — either by sass or by lightningcss
    expect(css).toMatch(/\.btn:hover\s*\{/);
    expect(css).not.toContain("@include");
    // Dependency graph includes the entry and the @use'd partial
    expect(deps).toContain(join(publicDir, "css/styles.scss"));
    expect(deps).toContain(join(publicDir, "css/_tokens.scss"));
  });

  test("minifies when asked", async () => {
    const source = { kind: "sass" as const, path: join(publicDir, "css/styles.scss") };
    const { css } = await compileStylesheet({ source, publicDir, minify: true });
    expect(css).not.toContain("\n");
    expect(css).toContain(".btn{");
  });

  test("surfaces sass errors with file location", async () => {
    const source = { kind: "sass" as const, path: join(publicDir, "css/broken.scss") };
    await expect(compileStylesheet({ source, publicDir, minify: false })).rejects.toThrow(
      /broken\.scss/
    );
  });

  test("cached variant re-compiles when the entry or a partial changes", async () => {
    const partial = join(publicDir, "css/_cached-tokens.scss");
    const entry = join(publicDir, "css/cached.scss");
    await Bun.write(partial, `$c: red;\n`);
    await Bun.write(entry, `@use "cached-tokens" as t;\n.c { color: t.$c; }\n`);
    const source = { kind: "sass" as const, path: entry };

    const first = await compileStylesheetCached({ source, publicDir, minify: false });
    expect(first).toContain("red");

    // Untouched → served from cache (same string instance)
    const again = await compileStylesheetCached({ source, publicDir, minify: false });
    expect(again).toBe(first);

    // Partial changed → mtime validation catches it without any watcher event
    await Bun.write(partial, `$c: blue;\n`);
    await utimes(partial, new Date(), new Date(Date.now() + 5000)); // guard against same-ms mtime
    const fresh = await compileStylesheetCached({ source, publicDir, minify: false });
    expect(fresh).toContain("#00f");

    // Explicit invalidation still works
    invalidateStylesheetCache();
    const after = await compileStylesheetCached({ source, publicDir, minify: false });
    expect(after).toContain("#00f");
  });
});

describe("sassHintIfDisabled", () => {
  test("hints when sass files exist but scss is off", async () => {
    const hint = await sassHintIfDisabled(publicDir, false);
    expect(hint).toMatch(/scss: true/);
  });

  test("silent when scss is on or no sass files", async () => {
    expect(await sassHintIfDisabled(publicDir, true)).toBeNull();
    const empty = await mkdtemp(join(tmpdir(), "static-kit-empty-"));
    expect(await sassHintIfDisabled(empty, false)).toBeNull();
    await rm(empty, { recursive: true, force: true });
  });
});
