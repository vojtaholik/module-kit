import * as parse5 from "parse5";
import { collectBlockAssets } from "./block-assets.ts";
import { blockRegistry, type RenderContext } from "./block-registry.ts";
import type { LayoutProps } from "./layout.ts";
import { layoutPropsSchema } from "./layout.ts";
import type { SchemaAddress } from "./schema-address.ts";
import { vlnaHtml } from "./vlna.ts";

/**
 * Augmentable block props map — users register their block types via:
 *
 *   declare module "@vojtaholik/static-kit-core" {
 *     interface BlockPropsMap {
 *       hero: HeroProps;
 *       // ...
 *     }
 *   }
 */
// biome-ignore lint/suspicious/noEmptyInterface: augmented via `declare module` by user projects
export interface BlockPropsMap {}

type TypedBlockInstance = {
  [K in keyof BlockPropsMap & string]: {
    id: string;
    type: K;
    props: BlockPropsMap[K];
    layout?: Partial<LayoutProps>;
  };
}[keyof BlockPropsMap & string];

type UntypedBlockInstance = {
  id: string;
  type: string;
  props: Record<string, unknown>;
  layout?: Partial<LayoutProps>;
};

/**
 * Block instance in a page config.
 * When BlockPropsMap is augmented, known types get typed props + autocomplete.
 * Arbitrary types still accepted via the fallback.
 */
export type BlockInstance = keyof BlockPropsMap extends never
  ? UntypedBlockInstance
  : TypedBlockInstance | (UntypedBlockInstance & { type: string & {} });

/**
 * Region config - blocks in a named region
 */
export interface RegionConfig {
  blocks: BlockInstance[];
}

/**
 * Page configuration
 */
export interface PageConfig {
  id: string;
  path: string;
  title: string;
  template: string;
  density?: "compact" | "comfortable" | "relaxed";
  regions: Record<string, RegionConfig>;
  /**
   * Extra `<meta>` tags. Keys starting with `og:` / `twitter:` / `fb:` become
   * `property="..."`, everything else `name="..."`. A tag already present in
   * the template with the same name/property gets its content replaced.
   */
  meta?: Record<string, string>;
}

interface Element {
  nodeName: string;
  tagName?: string;
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: Node[];
  value?: string;
  data?: string;
  parentNode?: Node;
  namespaceURI?: string;
}

type Node = Element;

/**
 * Options for rendering a page
 */
export interface RenderPageOptions {
  /** Directory containing page templates */
  templateDir: string;
  /** Whether we're in dev mode (injects dev overlay) */
  isDev?: boolean;
  /** Base URL for assets (exposed to templates as `asset()` / `ctx.assetBase`) */
  assetBase?: string;
  /** Function to read template file content */
  readFile?: (path: string) => Promise<string>;
  /** Timestamp to append as ?v= to .css and .js references for cache-busting */
  cacheBust?: number;
  /**
   * Czech typography (non-breaking spaces after short prepositions, widow
   * prevention). `"auto"` (default) applies it only when `<html lang>` is
   * Czech or Slovak; `true`/`false` force it on or off.
   */
  vlna?: boolean | "auto";
  /**
   * Throw on an unknown block type or invalid props instead of logging a
   * warning and skipping the block. Production builds should set this.
   */
  strict?: boolean;
}

/** Languages whose typography rules vlna implements */
const VLNA_LANGS = ["cs", "sk"];

function shouldApplyVlna(setting: boolean | "auto", lang: string | undefined): boolean {
  if (setting !== "auto") return setting;
  if (!lang) return false;
  const primary = lang.toLowerCase().split(/[-_]/)[0] ?? "";
  return VLNA_LANGS.includes(primary);
}

/**
 * Render a page from its config
 */
export async function renderPage(page: PageConfig, options: RenderPageOptions): Promise<string> {
  const templatePath = `${options.templateDir}/${page.template}`;

  assertUniqueBlockIds(page);

  // Use provided readFile or default to Bun.file
  const readFile = options.readFile ?? (async (path: string) => await Bun.file(path).text());
  const templateHtml = await readFile(templatePath);

  // Parse the template
  const document = parse5.parse(templateHtml) as Element;

  // Track regions and their rendered content
  const regionContent: Record<string, string> = {};
  let htmlLang: string | undefined;
  let head: Element | undefined;

  // Find and update elements
  walkTree(document, (node) => {
    // Update <title> (works for an empty <title></title> too)
    if (node.nodeName === "title") {
      node.childNodes = [{ nodeName: "#text", value: page.title, parentNode: node } as Node];
    }

    if (node.nodeName === "head") {
      head = node;
    }

    if (node.nodeName === "html") {
      htmlLang = getAttr(node, "lang");
      // data-page-id only in dev for HMR
      if (options.isDev) {
        setAttr(node, "data-page-id", page.id);
      }
    }

    if (node.nodeName === "main" && page.density) {
      setAttr(node, "data-density", page.density);
    }

    // Cache-bust .css and .js references
    if (options.cacheBust) {
      if (node.nodeName === "link") {
        const rel = getAttr(node, "rel");
        const href = getAttr(node, "href");
        if (rel === "stylesheet" && href && href.endsWith(".css") && !href.includes("?v=")) {
          setAttr(node, "href", `${href}?v=${options.cacheBust}`);
        }
      }
      if (node.nodeName === "script") {
        const src = getAttr(node, "src");
        if (src?.endsWith(".js") && !src.includes("?v=")) {
          setAttr(node, "src", `${src}?v=${options.cacheBust}`);
        }
      }
    }

    // Process regions - inject a marker that we'll replace after serialization
    const regionName = getAttr(node, "data-region");
    if (regionName) {
      const regionConfig = page.regions[regionName];
      if (regionConfig) {
        // Render blocks for this region
        regionContent[regionName] = renderRegionBlocks(regionConfig, {
          pageId: page.id,
          region: regionName,
          isDev: options.isDev ?? false,
          assetBase: options.assetBase ?? "/",
          strict: options.strict ?? false,
        });

        // Insert a marker that won't get escaped
        node.childNodes = [
          {
            nodeName: "#comment",
            data: `__REGION_CONTENT_${regionName}__`,
          } as Node,
        ];

        // Strip data-region in production
        if (!options.isDev) {
          removeAttr(node, "data-region");
        }
      }
    }
  });

  if (page.meta && head) {
    applyMeta(head, page.meta);
  }

  // Serialize to HTML
  let html = parse5.serialize(document as unknown as parse5.DefaultTreeAdapterMap["parentNode"]);

  // Replace markers with actual region content
  // Uses split/join instead of replace() to avoid issues with $ in content
  // being interpreted as replacement patterns
  for (const [regionName, content] of Object.entries(regionContent)) {
    const marker = `<!--__REGION_CONTENT_${regionName}__-->`;
    html = html.split(marker).join(content);
  }

  // Block-level <style>/<script>: once per page, in first-seen order
  const assets = collectBlockAssets(html);
  html = assets.html;
  if (assets.styles.length) {
    html = injectBefore(html, "</head>", assets.styles.join("\n"));
  }
  if (assets.scripts.length) {
    html = injectBefore(html, "</body>", assets.scripts.join("\n"));
  }

  // Czech typography: non-breaking spaces after single-char prepositions
  if (shouldApplyVlna(options.vlna ?? "auto", htmlLang)) {
    html = vlnaHtml(html);
  }

  // Dev mode: inject overlay. Production: strip dev attributes.
  if (options.isDev) {
    html = injectDevOverlay(html);
  } else {
    html = stripDevAttributes(html);
  }

  return html;
}

/**
 * Two blocks with the same id on one page would share a schema address,
 * so the inspector (and any CMS) could not tell them apart.
 */
function assertUniqueBlockIds(page: PageConfig): void {
  const seen = new Map<string, string>();
  for (const [region, config] of Object.entries(page.regions)) {
    for (const block of config.blocks) {
      const prev = seen.get(block.id);
      if (prev) {
        throw new Error(
          `Duplicate block id "${block.id}" on page "${page.id}" (regions "${prev}" and "${region}")`
        );
      }
      seen.set(block.id, region);
    }
  }
}

const PROPERTY_META_PREFIXES = ["og:", "twitter:", "fb:", "article:"];

/**
 * Add or update <meta> tags in <head> from page.meta
 */
function applyMeta(head: Element, meta: Record<string, string>): void {
  head.childNodes ??= [];
  for (const [key, content] of Object.entries(meta)) {
    const keyAttr = PROPERTY_META_PREFIXES.some((p) => key.startsWith(p)) ? "property" : "name";
    const existing = head.childNodes.find(
      (n) => n.nodeName === "meta" && getAttr(n, keyAttr) === key
    );
    if (existing) {
      setAttr(existing, "content", content);
      continue;
    }
    head.childNodes.push({
      nodeName: "meta",
      tagName: "meta",
      namespaceURI: "http://www.w3.org/1999/xhtml",
      attrs: [
        { name: keyAttr, value: key },
        { name: "content", value: content },
      ],
      childNodes: [],
      parentNode: head,
    } as Node);
  }
}

interface BlockRenderContext {
  pageId: string;
  region: string;
  isDev: boolean;
  assetBase: string;
  /** Throw instead of warn on unknown type / invalid props */
  strict: boolean;
}

/**
 * Validate and render one block instance. Returns "" (after warning) for an
 * unknown type or invalid props unless `strict` is set, in which case it throws.
 */
function renderBlockInstance(block: BlockInstance, context: BlockRenderContext): string {
  const definition = blockRegistry.get(block.type);
  if (!definition) {
    const msg = `Unknown block type "${block.type}" (block "${block.id}" on page "${context.pageId}")`;
    if (context.strict) throw new Error(msg);
    console.warn(msg);
    return "";
  }

  // Validate and parse props
  const propsResult = definition.propsSchema.safeParse(block.props);
  if (!propsResult.success) {
    const issues = propsResult.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const msg = `Invalid props for block "${block.id}" (${block.type}) on page "${context.pageId}": ${issues}`;
    if (context.strict) throw new Error(msg);
    console.warn(msg);
    return "";
  }

  // Build layout props
  const layout = layoutPropsSchema.parse(block.layout ?? {});

  // Build render context
  const ctx: RenderContext = {
    pageId: context.pageId,
    assetBase: context.assetBase,
    isDev: context.isDev,
    layout,
  };

  // Build schema address
  const addr: SchemaAddress = {
    pageId: context.pageId,
    region: context.region,
    blockId: block.id,
  };

  return definition.renderHtml({
    props: propsResult.data,
    ctx,
    addr,
  });
}

/**
 * Render all blocks in a region
 */
function renderRegionBlocks(region: RegionConfig, context: BlockRenderContext): string {
  let html = "";
  for (const block of region.blocks) {
    html += renderBlockInstance(block, context);
  }
  return html;
}

/**
 * Walk the parse5 tree
 */
function walkTree(node: Node, callback: (node: Node) => void): void {
  callback(node);
  if (node.childNodes) {
    for (const child of node.childNodes) {
      walkTree(child, callback);
    }
  }
}

/**
 * Get attribute value
 */
function getAttr(node: Node, name: string): string | undefined {
  const element = node as Element;
  const attr = element.attrs?.find((a) => a.name === name);
  return attr?.value;
}

/**
 * Set attribute value
 */
function setAttr(node: Node, name: string, value: string): void {
  const element = node as Element;
  if (!element.attrs) {
    element.attrs = [];
  }
  const existing = element.attrs.find((a) => a.name === name);
  if (existing) {
    existing.value = value;
  } else {
    element.attrs.push({ name, value });
  }
}

function removeAttr(node: Node, name: string): void {
  const element = node as Element;
  if (element.attrs) {
    element.attrs = element.attrs.filter((a) => a.name !== name);
  }
}

/** Insert `content` before the first occurrence of `marker` (or append) */
function injectBefore(html: string, marker: string, content: string): string {
  const idx = html.indexOf(marker);
  if (idx === -1) return html + content;
  return html.slice(0, idx) + content + html.slice(idx);
}

/**
 * Strip dev-only attributes (data-block-id, data-schema-address) from production HTML.
 * Generated templates already omit them outside dev; this covers hand-written
 * renderHtml functions.
 */
function stripDevAttributes(html: string): string {
  return html
    .replace(/\s+data-block-id="[^"]*"/g, "")
    .replace(/\s+data-schema-address="[^"]*"/g, "");
}

/**
 * Inject dev overlay script
 */
function injectDevOverlay(html: string): string {
  return injectBefore(html, "</body>", `<script src="/__dev-overlay.js"></script>`);
}

/**
 * Render a standalone block (for API/preview). Always strict: throws on an
 * unknown type or invalid props. Block asset markers are stripped.
 */
export function renderBlock(
  block: BlockInstance,
  context: {
    pageId: string;
    region: string;
    isDev: boolean;
    assetBase: string;
  }
): string {
  const html = renderBlockInstance(block, { ...context, strict: true });
  return collectBlockAssets(html).html;
}
