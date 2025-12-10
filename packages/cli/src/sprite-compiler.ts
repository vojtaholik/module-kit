/**
 * SVG Sprite Compiler
 *
 * Compiles individual SVG files into a single spritesheet.
 * Each SVG becomes a <symbol> element with id matching the filename.
 */

import { join, basename } from "node:path";
import { Glob } from "bun";

export interface SpriteCompileOptions {
  publicDir: string;
  /** Relative path within publicDir for source SVGs */
  svgDir?: string;
  /** Output filename within publicDir */
  outputFile?: string;
}

/**
 * Parse an SVG string and extract viewBox + inner content
 */
function parseSvg(content: string): { viewBox: string; inner: string } | null {
  // Extract viewBox attribute
  const viewBoxMatch = content.match(/viewBox=["']([^"']+)["']/);
  const viewBox = viewBoxMatch?.[1] ?? "0 0 24 24";

  // Extract content between <svg> tags
  const svgMatch = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (!svgMatch) return null;

  const inner = svgMatch[1]?.trim() ?? "";
  return { viewBox, inner };
}

/**
 * Compile SVGs from a directory into a spritesheet
 */
export async function compileSpritesheet(
  options: SpriteCompileOptions
): Promise<{ count: number; outputPath: string }> {
  const { publicDir, svgDir = "svg", outputFile = "sprite.svg" } = options;

  const inputDir = join(publicDir, svgDir);
  const outputPath = join(publicDir, outputFile);

  const symbols: string[] = [];
  const glob = new Glob("*.svg");

  for await (const file of glob.scan(inputDir)) {
    const filePath = join(inputDir, file);
    const content = await Bun.file(filePath).text();

    const parsed = parseSvg(content);
    if (!parsed) {
      console.warn(`  ⚠ Skipping ${file}: could not parse SVG`);
      continue;
    }

    // Use filename without extension as symbol id
    const id = basename(file, ".svg");
    symbols.push(
      `  <symbol id="${id}" viewBox="${parsed.viewBox}">\n    ${parsed.inner}\n  </symbol>`
    );
  }

  // Generate spritesheet
  const spritesheet = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none;">
${symbols.join("\n")}
</svg>
`;

  await Bun.write(outputPath, spritesheet);

  return { count: symbols.length, outputPath };
}
