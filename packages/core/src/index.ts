// Layout schemas and types

// Base path rewriting
export { rewriteBasePath } from "./base-path.ts";
// Block-level assets (hoisted <style>/<script>)
export {
  type BlockAssets,
  blockAssetMarker,
  clearBlockAssets,
  collectBlockAssets,
  getBlockAssets,
  registerBlockAssets,
} from "./block-assets.ts";

// Block registry
export {
  assetUrl,
  type BlockDefinition,
  BlockRegistry,
  blockRegistry,
  defineBlock,
  escapeAttr,
  escapeHtml,
  type RenderBlockInput,
  type RenderContext,
  renderSlot,
  type TypedRenderInput,
} from "./block-registry.ts";
// Configuration
export { configSchema, defineConfig, type StaticKitConfig } from "./config.ts";

// HTML renderer
export {
  type BlockInstance,
  type BlockPropsMap,
  type PageConfig,
  type RegionConfig,
  type RenderPageOptions,
  renderBlock,
  renderPage,
} from "./html-renderer.ts";
export {
  type ContentAlign,
  type ContentWidth,
  contentAlignEnum,
  contentWidthEnum,
  type Density,
  densityEnum,
  type LayoutProps,
  layoutPropsSchema,
  type Tone,
  toneEnum,
} from "./layout.ts";
// Schema address utilities
export {
  decodeSchemaAddress,
  encodeSchemaAddress,
  isSameBlock,
  type SchemaAddress,
  schemaAddressSchema,
  withPropPath,
} from "./schema-address.ts";
// Template compiler
export {
  type CompileOptions,
  type CompileTemplateOptions,
  compileBlockTemplates,
  compileTemplate,
  compileTemplateFile,
  type PropsTypeRef,
} from "./template-compiler.ts";
// Czech typography (vlna)
export { preventWidow, vlna, vlnaHtml } from "./vlna.ts";
