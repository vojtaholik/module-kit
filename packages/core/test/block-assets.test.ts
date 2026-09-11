import { beforeEach, describe, expect, test } from "bun:test";
import {
  blockAssetMarker,
  clearBlockAssets,
  collectBlockAssets,
  getBlockAssets,
  registerBlockAssets,
} from "../src/block-assets.ts";

describe("block assets", () => {
  beforeEach(() => clearBlockAssets());

  test("register / get", () => {
    registerBlockAssets("hero", { styles: ["<style>a</style>"], scripts: [] });
    expect(getBlockAssets("hero")?.styles).toEqual(["<style>a</style>"]);
    expect(getBlockAssets("nope")).toBeUndefined();
  });

  test("collectBlockAssets strips markers and dedupes per block", () => {
    registerBlockAssets("hero", {
      styles: ["<style>h</style>"],
      scripts: ["<script>h()</script>"],
    });
    registerBlockAssets("card", { styles: ["<style>c</style>"], scripts: [] });

    const html = [
      blockAssetMarker("hero"),
      "<div>1</div>",
      blockAssetMarker("card"),
      blockAssetMarker("hero"),
      "<div>2</div>",
      blockAssetMarker("unregistered"),
    ].join("");

    const result = collectBlockAssets(html);
    expect(result.html).toBe("<div>1</div><div>2</div>");
    expect(result.styles).toEqual(["<style>h</style>", "<style>c</style>"]);
    expect(result.scripts).toEqual(["<script>h()</script>"]);
  });
});
