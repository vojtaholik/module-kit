import { describe, expect, test } from "bun:test";
import { pageOutputFile } from "../src/paths.ts";

describe("pageOutputFile", () => {
  test("flat (default)", () => {
    expect(pageOutputFile("/", false)).toBe("index.html");
    expect(pageOutputFile("/about", false)).toBe("about.html");
    expect(pageOutputFile("/blog/post", false)).toBe("blog/post.html");
    expect(pageOutputFile("/about/", false)).toBe("about.html");
  });

  test("trailingSlash: directory indexes", () => {
    expect(pageOutputFile("/", true)).toBe("index.html");
    expect(pageOutputFile("/about", true)).toBe("about/index.html");
    expect(pageOutputFile("/blog/post/", true)).toBe("blog/post/index.html");
  });
});
