import { describe, expect, test } from "bun:test";
import { processHtmlOutput } from "../src/html-output.ts";

const html = `<!DOCTYPE html><html><head><title>t</title></head><body><!-- c --><div><p>a</p>   <p>b</p></div></body></html>`;

describe("processHtmlOutput", () => {
  test("formatted: pretty-prints with 2-space indent", async () => {
    const out = await processHtmlOutput(html, "formatted");
    expect(out).toContain("\n  <head>");
    expect(out).toContain("\n      <p>a</p>");
  });

  test("minified: collapses whitespace and drops comments", async () => {
    const out = await processHtmlOutput(html, "minified");
    expect(out).not.toContain("<!-- c -->");
    expect(out).not.toContain("   ");
    expect(out).toContain("<p>a</p> <p>b</p>");
  });
});
