import { defineConfig } from "@vojtaholik/static-kit-core";

export default defineConfig({
  blocksDir: "blocks",
  pagesDir: "site/pages",
  publicDir: "public",
  outDir: "dist",
  publicPath: "/public",
  devPort: 3000,
});
