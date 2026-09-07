/**
 * Map a page path to its output file inside outDir.
 *   "/"      → index.html
 *   "/about" → about.html            (trailingSlash: false)
 *   "/about" → about/index.html      (trailingSlash: true)
 */
export function pageOutputFile(pagePath: string, trailingSlash: boolean): string {
  const clean = pagePath.replace(/^\/+/, "").replace(/\/+$/, "");
  if (clean === "") return "index.html";
  return trailingSlash ? `${clean}/index.html` : `${clean}.html`;
}
