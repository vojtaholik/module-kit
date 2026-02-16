import * as parse5 from "parse5";
import type { LayoutProps } from "./layout.ts";
import { layoutPropsSchema } from "./layout.ts";
import { blockRegistry, type RenderContext } from "./block-registry.ts";
import type { SchemaAddress } from "./schema-address.ts";

/**
 * Block instance in a page config
 */
export interface BlockInstance {
  id: string;
  type: string;
  props: Record<string, unknown>;
  layout?: Partial<LayoutProps>;
}

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
  /** Base URL for assets */
  assetBase?: string;
  /** Function to read template file content */
  readFile?: (path: string) => Promise<string>;
}

/**
 * Render a page from its config
 */
export async function renderPage(
  page: PageConfig,
  options: RenderPageOptions
): Promise<string> {
  const templatePath = `${options.templateDir}/${page.template}`;

  // Use provided readFile or default to Bun.file
  const readFile =
    options.readFile ?? (async (path: string) => await Bun.file(path).text());
  const templateHtml = await readFile(templatePath);

  // Parse the template
  const document = parse5.parse(templateHtml) as Element;

  // Track regions and their rendered content
  const regionContent: Record<string, string> = {};

  // Find and update elements
  walkTree(document, (node) => {
    // Update <title>
    if (node.nodeName === "title") {
      const textNode = node.childNodes?.[0];
      if (textNode && textNode.nodeName === "#text") {
        textNode.value = page.title;
      }
    }

    // Update <html> attributes
    if (node.nodeName === "html") {
      setAttr(node, "data-page-id", page.id);
      // if (page.density) {
      //   setAttr(node, "data-density", page.density);
      // }
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
        });

        // Insert a marker that won't get escaped
        node.childNodes = [
          {
            nodeName: "#comment",
            data: `__REGION_CONTENT_${regionName}__`,
          } as Node,
        ];
      }
    }
  });

  // Serialize to HTML
  let html = parse5.serialize(
    document as unknown as parse5.DefaultTreeAdapterMap["parentNode"]
  );

  // Replace markers with actual region content
  for (const [regionName, content] of Object.entries(regionContent)) {
    const marker = `<!--__REGION_CONTENT_${regionName}__-->`;
    html = html.replace(marker, content);
  }

  // Inject dev overlay if in dev mode
  if (options.isDev) {
    html = injectDevOverlay(html);
  }

  return html;
}

/**
 * Render all blocks in a region
 */
function renderRegionBlocks(
  region: RegionConfig,
  context: {
    pageId: string;
    region: string;
    isDev: boolean;
    assetBase: string;
  }
): string {
  let html = "";

  for (const block of region.blocks) {
    const definition = blockRegistry.get(block.type);
    if (!definition) {
      console.warn(`Unknown block type: ${block.type}`);
      continue;
    }

    // Validate and parse props
    const propsResult = definition.propsSchema.safeParse(block.props);
    if (!propsResult.success) {
      const issues = propsResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      console.warn(`Invalid props for block ${block.id}: ${issues}`);
      continue;
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

    // Render the block
    html += definition.renderHtml({
      props: propsResult.data,
      ctx,
      addr,
    });
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

/**
 * Inject dev overlay script
 */
function injectDevOverlay(html: string): string {
  const script = `<script src="/__dev-overlay.js"></script>`;
  return html.replace("</body>", `${script}</body>`);
}

/**
 * Render a standalone block (for API/preview)
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
  const definition = blockRegistry.getOrThrow(block.type);

  const propsResult = definition.propsSchema.safeParse(block.props);
  if (!propsResult.success) {
    throw new Error(`Invalid props: ${propsResult.error.message}`);
  }

  const layout = layoutPropsSchema.parse(block.layout ?? {});

  const ctx: RenderContext = {
    pageId: context.pageId,
    assetBase: context.assetBase,
    isDev: context.isDev,
    layout,
  };

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
