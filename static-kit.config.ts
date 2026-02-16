import { defineConfig } from "@vojtaholik/static-kit-core";

export default defineConfig({
  blocksDir: "example/blocks",
  pagesDir: "example/site/pages",
  publicDir: "example/public",
  outDir: "dist",
  publicPath: "/public",
  devPort: 3000,
  cmsBlocksFile: "example/cms-blocks.ts",
});
