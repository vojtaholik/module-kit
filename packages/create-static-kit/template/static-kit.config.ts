import { defineConfig } from "@vojtaholik/static-kit-core";

export default defineConfig({
  blocksDir: "blocks",
  pagesDir: "site/pages",
  publicDir: "public",
  outDir: "dist",
  publicPath: "/public",
  devPort: 3000,
  // Optional: compile public/**/*.scss → .css (requires `bun add -d sass`)
  // cssPreprocessor: "scss",
});
