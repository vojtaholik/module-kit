import { z } from "zod/v4";
import type { LayoutProps } from "./layout.ts";
import type { SchemaAddress } from "./schema-address.ts";

/**
 * Context passed to block render functions
 */
export interface RenderContext {
  /** Current page ID */
  pageId: string;
  /** Base URL for assets */
  assetBase: string;
  /** Whether we're in dev mode */
  isDev: boolean;
  /** Layout props for styling context */
  layout: LayoutProps;
}

/**
 * Input to block render function
 */
export interface RenderBlockInput<T extends z.ZodType = z.ZodType> {
  /** Validated block props */
  props: z.infer<T>;
  /** Render context */
  ctx: RenderContext;
  /** Schema address for CMS editing */
  addr: SchemaAddress;
}

/**
 * Block definition - ties together type, schema, and render function
 */
export interface BlockDefinition<T extends z.ZodType = z.ZodType> {
  type: string;
  propsSchema: T;
  renderHtml: (input: RenderBlockInput<T>) => string;
  /** Source file path (for dev inspector) - pass import.meta.url */
  sourceFile?: string;
}

/**
 * Define a block with type-safe props
 * Pass `sourceFile: import.meta.url` to enable click-to-open in dev inspector
 */
export function defineBlock<T extends z.ZodType>(config: {
  type: string;
  propsSchema: T;
  renderHtml: (input: RenderBlockInput<T>) => string;
  /** Source file path - pass import.meta.url */
  sourceFile?: string;
}): BlockDefinition<T> {
  return {
    type: config.type,
    propsSchema: config.propsSchema,
    renderHtml: config.renderHtml,
    sourceFile: config.sourceFile,
  };
}

/**
 * Registry of all block definitions
 */
export class BlockRegistry {
  private blocks = new Map<string, BlockDefinition>();

  register<T extends z.ZodType>(definition: BlockDefinition<T>): void {
    if (this.blocks.has(definition.type)) {
      throw new Error(`Block type "${definition.type}" is already registered`);
    }
    this.blocks.set(definition.type, definition as BlockDefinition);
  }

  get(type: string): BlockDefinition | undefined {
    return this.blocks.get(type);
  }

  getOrThrow(type: string): BlockDefinition {
    const block = this.blocks.get(type);
    if (!block) {
      throw new Error(`Unknown block type: "${type}"`);
    }
    return block;
  }

  has(type: string): boolean {
    return this.blocks.has(type);
  }

  all(): BlockDefinition[] {
    return Array.from(this.blocks.values());
  }

  types(): string[] {
    return Array.from(this.blocks.keys());
  }

  clear(): void {
    this.blocks.clear();
  }
}

/**
 * Global block registry instance
 */
export const blockRegistry = new BlockRegistry();

/**
 * HTML escape helper for templates
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Escape for use in HTML attributes
 */
export function escapeAttr(str: unknown): string {
  return escapeHtml(str);
}
