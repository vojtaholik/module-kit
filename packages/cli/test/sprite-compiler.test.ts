import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileSpritesheet } from "../src/sprite-compiler.ts";

async function withPublicDir(files: Record<string, string>, fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "sk-sprite-"));
  try {
    await mkdir(join(dir, "svg"), { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      await Bun.write(join(dir, "svg", name), content);
    }
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("compileSpritesheet", () => {
  test("one <symbol> per svg, sorted, id from filename, viewBox preserved", async () => {
    await withPublicDir(
      {
        "zeta.svg": '<svg viewBox="0 0 5 5"><circle r="1"/></svg>',
        "alpha.svg":
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M0 0'/></svg>",
      },
      async (dir) => {
        const { count, outputPath } = await compileSpritesheet({ publicDir: dir });
        expect(count).toBe(2);
        const out = await Bun.file(outputPath).text();
        expect(out.indexOf('id="alpha"')).toBeLessThan(out.indexOf('id="zeta"'));
        expect(out).toContain('<symbol id="alpha" viewBox="0 0 24 24">');
        expect(out).toContain("<path d='M0 0'/>");
        expect(out).toContain('<symbol id="zeta" viewBox="0 0 5 5">');
      }
    );
  });

  test("defaults viewBox and skips unparsable files", async () => {
    await withPublicDir({ "novb.svg": "<svg><rect/></svg>", "junk.svg": "nope" }, async (dir) => {
      const { count, outputPath } = await compileSpritesheet({ publicDir: dir });
      expect(count).toBe(1);
      const out = await Bun.file(outputPath).text();
      expect(out).toContain('<symbol id="novb" viewBox="0 0 24 24">');
    });
  });

  test("throws ENOENT when svg/ is missing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "sk-nosvg-"));
    try {
      await expect(compileSpritesheet({ publicDir: dir })).rejects.toMatchObject({
        code: "ENOENT",
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
