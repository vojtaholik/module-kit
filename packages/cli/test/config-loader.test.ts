import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, resolvePath } from "../src/config-loader.ts";

describe("loadConfig", () => {
  test("returns defaults when no config file exists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "sk-cfg-"));
    try {
      const config = await loadConfig(dir);
      expect(config.blocksDir).toBe("blocks");
      expect(config.devPort).toBe(3000);
      expect(config.trailingSlash).toBe(false);
      expect(config.typedTemplates).toBe(true);
      expect(config.vlna).toBe("auto");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  test("loads and validates the fixture config", async () => {
    const config = await loadConfig(join(import.meta.dir, "fixtures/site"));
    expect(config.basePath).toBe("/sub");
    expect(config.trailingSlash).toBe(true);
    expect(config.cssOutput).toBe("minified");
  });

  test("resolvePath joins cwd and the configured dir", async () => {
    const config = await loadConfig(join(import.meta.dir, "fixtures/site"));
    expect(resolvePath(config, "blocksDir", "/root")).toBe("/root/blocks");
    expect(() => resolvePath(config, "devPort", "/root")).toThrow(/not a string/);
  });
});
