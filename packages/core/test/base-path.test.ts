import { describe, test, expect } from "bun:test";
import { rewriteBasePath } from "../src/base-path.ts";

describe("rewriteBasePath", () => {
  test("returns html unchanged when basePath is empty", () => {
    const html = '<a href="/about">About</a>';
    expect(rewriteBasePath(html, "")).toBe(html);
  });

  test("prefixes absolute href paths", () => {
    const html = '<a href="/about">About</a>';
    expect(rewriteBasePath(html, "/app")).toBe('<a href="/app/about">About</a>');
  });

  test("rewrites root href", () => {
    const html = '<a href="/">Home</a>';
    expect(rewriteBasePath(html, "/app")).toBe('<a href="/app/">Home</a>');
  });

  test("does not touch external links", () => {
    const html = '<a href="https://example.com">Ext</a>';
    expect(rewriteBasePath(html, "/app")).toBe(html);
  });

  test("does not touch anchor links", () => {
    const html = '<a href="#section">Jump</a>';
    expect(rewriteBasePath(html, "/app")).toBe(html);
  });

  test("does not touch relative paths", () => {
    const html = '<a href="public/file.css">CSS</a>';
    expect(rewriteBasePath(html, "/app")).toBe(html);
  });

  test("does not touch mailto links", () => {
    const html = '<a href="mailto:a@b.com">Email</a>';
    expect(rewriteBasePath(html, "/app")).toBe(html);
  });

  test("does not touch tel links", () => {
    const html = '<a href="tel:+420123">Call</a>';
    expect(rewriteBasePath(html, "/app")).toBe(html);
  });

  test("does not double-prefix", () => {
    const html = '<a href="/app/about">About</a>';
    expect(rewriteBasePath(html, "/app")).toBe('<a href="/app/about">About</a>');
  });

  test("handles multiple links", () => {
    const html =
      '<a href="/">Home</a><a href="/about">A</a><a href="https://x.com">X</a>';
    const result = rewriteBasePath(html, "/base");
    expect(result).toBe(
      '<a href="/base/">Home</a><a href="/base/about">A</a><a href="https://x.com">X</a>'
    );
  });

  test("handles deep paths", () => {
    const html = '<a href="/reference/projekt-chlum">Ref</a>';
    expect(rewriteBasePath(html, "/tech")).toBe(
      '<a href="/tech/reference/projekt-chlum">Ref</a>'
    );
  });

  test("works on non-anchor elements with href", () => {
    const html = '<link rel="canonical" href="/about" />';
    expect(rewriteBasePath(html, "/app")).toBe(
      '<link rel="canonical" href="/app/about" />'
    );
  });
});
