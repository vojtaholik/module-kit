import { html as beautifyHtml } from "js-beautify";
import { minify } from "html-minifier-terser";
import type { StaticKitConfig } from "@vojtaholik/static-kit-core";

/**
 * Post-process rendered HTML based on config.htmlOutput setting.
 *
 *   "formatted" → js-beautify (pretty-print with 2-space indent)
 *   "minified"  → html-minifier-terser (collapse whitespace, strip comments)
 */
export async function processHtmlOutput(
  html: string,
  mode: StaticKitConfig["htmlOutput"]
): Promise<string> {
  if (mode === "minified") {
    return minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      conservativeCollapse: true,
      minifyCSS: false,
      minifyJS: false,
    });
  }

  return beautifyHtml(html, {
    indent_size: 2,
    indent_char: " ",
    preserve_newlines: false,
    indent_inner_html: true,
    extra_liners: [],
    wrap_line_length: 0,
  });
}
