/**
 * CSS Processing with lightningcss
 *
 * Handles:
 * - CSS nesting (native)
 * - Custom media queries
 * - Vendor prefixes (autoprefixer)
 * - Minification (build only)
 */

import { transform, browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";

// Cache the targets since browserslist resolution is expensive
let cachedTargets: ReturnType<typeof browserslistToTargets> | null = null;

function getTargets() {
  if (!cachedTargets) {
    cachedTargets = browserslistToTargets(browserslist("> 0.5%, not dead"));
  }
  return cachedTargets;
}

export interface CSSProcessOptions {
  /** Enable minification (typically false for dev, true for build) */
  minify?: boolean;
  /** Filename for error reporting and source maps */
  filename: string;
  /** Raw CSS content as Uint8Array */
  code: Uint8Array;
}

export interface CSSProcessResult {
  code: Uint8Array;
  map: Uint8Array | undefined;
}

/**
 * Process CSS through lightningcss
 *
 * Features enabled:
 * - CSS nesting (lowered for browser compat)
 * - Custom media queries draft spec
 * - Vendor prefixes based on browserslist targets
 */
export function processCSS(options: CSSProcessOptions): CSSProcessResult {
  const result = transform({
    filename: options.filename,
    code: options.code,
    minify: options.minify ?? false,
    targets: getTargets(),
    drafts: {
      customMedia: true,
    },
    // Error on unknown at-rules instead of passing through
    errorRecovery: false,
  });

  return {
    code: result.code,
    map: result.map ?? undefined,
  };
}

/**
 * Process CSS from a string (convenience wrapper)
 */
export function processCSSString(
  css: string,
  options: Omit<CSSProcessOptions, "code">
): string {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const result = processCSS({
    ...options,
    code: encoder.encode(css),
  });

  return decoder.decode(result.code);
}
