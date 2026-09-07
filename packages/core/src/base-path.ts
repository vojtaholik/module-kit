/**
 * Rewrite internal URLs in HTML to include a base path prefix.
 *
 * Covers href, src, poster and action attributes with absolute paths
 * (starting with a single "/"), plus every candidate inside srcset.
 * Protocol-relative URLs ("//cdn...") are left alone.
 */
const URL_ATTRS = ["href", "src", "poster", "action"];
// Lookbehind so data-src / data-href (not real URL attributes) are skipped
const ATTR_RE = new RegExp(`(?<![\\w-])(${URL_ATTRS.join("|")})="(/[^"]*)"`, "g");
const SRCSET_RE = /\bsrcset="([^"]*)"/g;

export function rewriteBasePath(html: string, basePath: string): string {
  if (!basePath) return html;

  const prefix = (path: string): string => {
    if (path.startsWith("//")) return path; // protocol-relative
    if (path.startsWith(`${basePath}/`) || path === basePath) return path;
    return path === "/" ? `${basePath}/` : `${basePath}${path}`;
  };

  return html
    .replace(ATTR_RE, (_, attr: string, path: string) => `${attr}="${prefix(path)}"`)
    .replace(SRCSET_RE, (_, value: string) => {
      const rewritten = value
        .split(",")
        .map((candidate) => {
          const trimmed = candidate.trim();
          if (!trimmed.startsWith("/")) return trimmed;
          const [url, ...descriptor] = trimmed.split(/\s+/);
          return [prefix(url!), ...descriptor].join(" ");
        })
        .join(", ");
      return `srcset="${rewritten}"`;
    });
}
