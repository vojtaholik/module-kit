import { defineConfig } from "@static-block-kit/core";

export default defineConfig({
  blocksDir: "src/blocks",
  pagesDir: "src/site/pages",
  publicDir: "src/public",
  outDir: "dist",
  publicPath: "/public",
  devPort: 3000,
});
