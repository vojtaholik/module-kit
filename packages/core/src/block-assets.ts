/**
 * Block-level assets
 *
 * Top-level `<style>` and `<script>` elements in a `*.block.html` template are
 * hoisted out of the render function at compile time and registered here.
 * The render function emits a marker comment instead; `renderPage()` collects
 * the markers, dedupes them per page, and injects each block's styles once
 * into `<head>` and its scripts once before `</body>`.
 */

export interface BlockAssets {
  /** Serialized `<style>` elements */
  styles: string[];
  /** Serialized `<script>` elements */
  scripts: string[];
}

const registry = new Map<string, BlockAssets>();

/** Called by generated render modules at import time */
export function registerBlockAssets(name: string, assets: BlockAssets): void {
  registry.set(name, assets);
}

export function getBlockAssets(name: string): BlockAssets | undefined {
  return registry.get(name);
}

export function clearBlockAssets(): void {
  registry.clear();
}

const MARKER_PREFIX = "__sk-asset:";
const MARKER_RE = /<!--__sk-asset:([A-Za-z0-9_-]+)__-->/g;

/** Marker comment a render function emits so the page knows it used this block */
export function blockAssetMarker(name: string): string {
  return `<!--${MARKER_PREFIX}${name}__-->`;
}

/**
 * Strip asset markers from rendered HTML and return the deduped assets of
 * every block that appeared, in first-seen order.
 */
export function collectBlockAssets(html: string): {
  html: string;
  styles: string[];
  scripts: string[];
} {
  const seen = new Set<string>();
  const styles: string[] = [];
  const scripts: string[] = [];

  const stripped = html.replace(MARKER_RE, (_, name: string) => {
    if (!seen.has(name)) {
      seen.add(name);
      const assets = registry.get(name);
      if (assets) {
        styles.push(...assets.styles);
        scripts.push(...assets.scripts);
      }
    }
    return "";
  });

  return { html: stripped, styles, scripts };
}
