/**
 * Rewrite internal links in HTML to include a base path prefix.
 * Only matches href attributes with absolute paths (starting with /).
 */
export function rewriteBasePath(html: string, basePath: string): string {
  if (!basePath) return html;

  return html.replace(/href="(\/[^"]*)"/g, (match, path: string) => {
    // Already prefixed
    if (path.startsWith(`${basePath}/`) || path === basePath) {
      return match;
    }
    const newPath = path === "/" ? `${basePath}/` : `${basePath}${path}`;
    return `href="${newPath}"`;
  });
}
