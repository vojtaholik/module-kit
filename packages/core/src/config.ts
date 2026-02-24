import { z } from "zod/v4";

/**
 * Static Kit configuration schema
 */
export const configSchema = z.object({
  /** Directory containing block definitions and templates */
  blocksDir: z.string().default("blocks"),
  /** Directory containing page configs and templates */
  pagesDir: z.string().default("site/pages"),
  /** Source directory for public assets (css, js, images) - structure mirrors output */
  publicDir: z.string().default("public"),
  /** Output directory for built site */
  outDir: z.string().default("dist"),
  /** URL path prefix where public assets are served */
  publicPath: z.string().default("/public"),
  /** Dev server port */
  devPort: z.number().default(3000),
  /** HTML output format: "formatted" (pretty-printed) or "minified" */
  htmlOutput: z.enum(["formatted", "minified"]).default("formatted"),
});

export type StaticKitConfig = z.infer<typeof configSchema>;

/**
 * Define a Static Kit configuration with type-safe defaults
 */
export function defineConfig(
  config: z.input<typeof configSchema> = {}
): StaticKitConfig {
  return configSchema.parse(config);
}
