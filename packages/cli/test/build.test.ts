import { beforeAll, describe, expect, test } from "bun:test";
import { rm } from "node:fs/promises";
import { join } from "node:path";

const cli = join(import.meta.dir, "../src/cli.ts");
const fixture = join(import.meta.dir, "fixtures/site");
const dist = join(fixture, "dist");

async function runCli(...args: string[]) {
  const proc = Bun.spawn(["bun", "run", cli, ...args], {
    cwd: fixture,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

const read = (rel: string) => Bun.file(join(dist, rel)).text();
const exists = (rel: string) => Bun.file(join(dist, rel)).exists();

describe("static-kit build (fixture site)", () => {
  let result: Awaited<ReturnType<typeof runCli>>;

  beforeAll(async () => {
    await rm(dist, { recursive: true, force: true });
    result = await runCli("build");
  }, 60_000);

  test("exits 0", () => {
    expect(result.stderr).not.toContain("Build failed");
    expect(result.exitCode).toBe(0);
  });

  test("trailingSlash: true writes directory indexes", async () => {
    expect(await exists("index.html")).toBe(true);
    expect(await exists("about/index.html")).toBe(true);
    expect(await exists("about.html")).toBe(false);
  });

  test("typed templates: generated render function imports the props type", async () => {
    const gen = await Bun.file(join(fixture, "blocks/gen/hero.render.ts")).text();
    expect(gen).toContain('import type { HeroProps } from "../hero.block.ts";');
    expect(gen).toContain("TypedRenderInput<HeroProps>");
  });

  test("renders blocks, v-else, and applies basePath to href/src", async () => {
    const html = await read("index.html");
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("no subtitle");
    expect(html).toContain("<p>sub</p>");
    expect(html).toContain('href="/sub/"');
    expect(html).toContain('href="/sub/public/css/styles.css?v=');
    // asset() → publicPath, then basePath prefix
    expect(html).toContain('src="/sub/public/images/logo.png"');
  });

  test("hoisted block <style>/<script> appear once per page", async () => {
    const html = await read("index.html");
    expect(html.match(/color: red/g)?.length).toBe(1);
    expect(html.match(/document\.querySelector\("\.hero"\)/g)?.length).toBe(1);
    expect(html).not.toContain("__sk-asset");
    expect(html.indexOf("<style>")).toBeLessThan(html.indexOf("</head>"));
    expect(html.indexOf("<script>")).toBeGreaterThan(html.lastIndexOf("</main>"));
  });

  test("strips dev-only attributes and fills empty <title>", async () => {
    const html = await read("index.html");
    expect(html).not.toContain("data-block-id");
    expect(html).not.toContain("data-region");
    expect(html).toContain("<title>Home</title>");
  });

  test("injects page.meta", async () => {
    const html = await read("index.html");
    expect(html).toContain('<meta name="description" content="Fixture home">');
    expect(html).toContain('<meta property="og:title" content="Home OG">');
  });

  test("compiles CSS through lightningcss (nesting lowered, minified)", async () => {
    const css = await read("public/css/styles.css");
    expect(css).toContain(".hero h1");
    expect(css).not.toContain("\n");
  });

  test("compiles sprite from svg/", async () => {
    const sprite = await read("public/sprite.svg");
    expect(sprite).toContain('<symbol id="arrow" viewBox="0 0 10 10">');
    expect(sprite).not.toContain('id="bad"');
  });
});

describe("static-kit build (strict failures)", () => {
  test("fails on invalid block props", async () => {
    const pagesFile = join(fixture, "site/pages/index.ts");
    const original = await Bun.file(pagesFile).text();
    await Bun.write(
      pagesFile,
      original.replace('props: { title: "About" }', "props: { title: 42 }")
    );
    try {
      const result = await runCli("build");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Invalid props for block "hero-1" (hero) on page "about"');
    } finally {
      await Bun.write(pagesFile, original);
    }
  }, 60_000);
});
