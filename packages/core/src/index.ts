// Layout schemas and types
export {
  toneEnum,
  contentAlignEnum,
  densityEnum,
  contentWidthEnum,
  layoutPropsSchema,
  type Tone,
  type ContentAlign,
  type Density,
  type ContentWidth,
  type LayoutProps,
} from "./layout.ts";

// Schema address utilities
export {
  schemaAddressSchema,
  encodeSchemaAddress,
  decodeSchemaAddress,
  withPropPath,
  isSameBlock,
  type SchemaAddress,
} from "./schema-address.ts";

// Block registry
export {
  defineBlock,
  BlockRegistry,
  blockRegistry,
  escapeHtml,
  escapeAttr,
  renderSlot,
  type RenderContext,
  type RenderBlockInput,
  type BlockDefinition,
} from "./block-registry.ts";

// HTML renderer
export {
  renderPage,
  renderBlock,
  type BlockPropsMap,
  type BlockInstance,
  type RegionConfig,
  type PageConfig,
  type RenderPageOptions,
} from "./html-renderer.ts";

// Template compiler
export {
  compileBlockTemplates,
  compileTemplateFile,
  compileTemplate,
  type CompileOptions,
} from "./template-compiler.ts";

// Czech typography (vlna)
export { vlna, vlnaHtml, preventWidow } from "./vlna.ts";

// Configuration
export { configSchema, defineConfig, type StaticKitConfig } from "./config.ts";
