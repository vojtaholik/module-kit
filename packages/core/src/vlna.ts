/**
 * Czech typography transform (vlna)
 *
 * Inserts non-breaking spaces (\u00A0) after single-character Czech
 * prepositions and conjunctions (k, s, v, z, o, u, a, i) so they
 * never end up alone at the end of a line.
 *
 * Also prevents widows — a single short word orphaned on the last
 * line of a paragraph.
 *
 * Runs at build time. The util itself is never shipped to browsers;
 * only the resulting \u00A0 characters are baked into the HTML output.
 *
 * Based on ČSN 01 6910 and Petr Olšák's vlna for TeX.
 */

/**
 * Single-char Czech prepositions/conjunctions: k s v z o u a i
 * Uses lookbehind so the leading whitespace isn't consumed — handles
 * adjacent prepositions like "v s tím" in a single pass.
 * Only replaces regular spaces (not existing \u00A0).
 */
const SINGLE_CHAR_RE = /(?<=\s|^)([ksvzouaiKSVZOUAI]) /g;

/**
 * Replace space after single-char Czech prepositions/conjunctions with \u00A0.
 * Plain text only — no HTML awareness.
 */
export function vlna(text: string): string {
  return text.replace(SINGLE_CHAR_RE, "$1\u00A0");
}

/**
 * Prevent widows — replace the last space in a text with \u00A0
 * so the final word doesn't sit alone on a line.
 * Only acts when the last word is ≤15 chars (avoids gluing long URLs etc).
 */
export function preventWidow(text: string): string {
  return text.replace(/\s(\S{1,15})\s*$/, "\u00A0$1");
}

/** Tags whose text content should NOT be transformed */
const SKIP_TAGS = new Set([
  "script",
  "style",
  "code",
  "pre",
  "textarea",
  "kbd",
  "var",
  "samp",
]);

/**
 * Apply Czech typography transforms to all text nodes in an HTML string.
 * Skips content inside <script>, <style>, <code>, <pre>, <textarea>, etc.
 * Does not touch HTML tags or attributes — only text between > and <.
 */
export function vlnaHtml(html: string): string {
  // Track which tags we're inside to know when to skip
  const tagStack: string[] = [];
  let result = "";
  let i = 0;

  while (i < html.length) {
    if (html[i] === "<") {
      // Find end of tag
      const tagEnd = html.indexOf(">", i);
      if (tagEnd === -1) {
        // Malformed HTML — just append rest
        result += html.slice(i);
        break;
      }

      const tag = html.slice(i, tagEnd + 1);
      result += tag;

      // Parse tag name
      const tagMatch = tag.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/);
      if (tagMatch) {
        const tagName = tagMatch[1]!.toLowerCase();
        if (tag[1] === "/") {
          // Closing tag — pop from stack
          const idx = tagStack.lastIndexOf(tagName);
          if (idx !== -1) tagStack.splice(idx, 1);
        } else if (!tag.endsWith("/>")) {
          // Opening tag (not self-closing)
          tagStack.push(tagName);
        }
      }

      i = tagEnd + 1;
    } else {
      // Text node — find the next tag
      const nextTag = html.indexOf("<", i);
      const textEnd = nextTag === -1 ? html.length : nextTag;
      const text = html.slice(i, textEnd);

      // Only transform if we're not inside a skip tag
      const inSkipTag = tagStack.some((t) => SKIP_TAGS.has(t));
      if (inSkipTag) {
        result += text;
      } else {
        result += vlna(text);
      }

      i = textEnd;
    }
  }

  return result;
}
