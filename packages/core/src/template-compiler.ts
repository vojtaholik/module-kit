/**
 * Block Template Compiler
 *
 * Parses *.block.html templates and generates TypeScript render functions.
 *
 * Template DSL:
 * - {{ expr }} - interpolation (props.x, ctx.x, addr.x, item, i)
 * - {{{ expr }}} - raw HTML output (no escaping)
 * - v-if / v-else-if / v-else - conditional rendering
 * - v-for="item, i in props.items" - iteration
 * - :attr="expr" - dynamic attribute binding
 * - <render-slot :block="expr" :props="expr" :index="expr">fallback</render-slot> - slot delegation
 * - asset("images/x.jpg") - URL under the public asset base
 * - top-level <style> / <script> - hoisted, injected once per page
 *
 * When `<name>.block.ts` next to the template exports `<Name>Props`, the
 * generated render function is typed against it, so `{{ props.titel }}`
 * is a type error instead of an empty string.
 */

import { mkdir } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { Glob } from "bun";
import * as parse5 from "parse5";

interface Attribute {
  name: string;
  value: string;
}

interface Element {
  nodeName: string;
  tagName?: string;
  attrs?: Attribute[];
  childNodes?: Node[];
  content?: Element; // For <template> elements, parse5 puts content here
  value?: string;
  data?: string;
}

type Node = Element;

/**
 * Options for compiling block templates
 */
export interface CompileOptions {
  /** Directory containing *.block.html files */
  blocksDir: string;
  /** Output directory for generated render functions (defaults to blocksDir/gen) */
  genDir?: string;
  /** Custom import path for core utilities (defaults to @vojtaholik/static-kit-core) */
  coreImportPath?: string;
  /**
   * Type `props` against `<Name>Props` exported from `<name>.block.ts` when
   * that file exists next to the template. Defaults to true.
   */
  typed?: boolean;
}

/**
 * Where the props type of a template comes from
 */
export interface PropsTypeRef {
  /** Exported type name, e.g. "HeroProps" */
  name: string;
  /** Import specifier relative to the generated file, e.g. "../hero.block.ts" */
  from: string;
}

export interface CompileTemplateOptions {
  /** Type the render function's props (omit for `any`) */
  propsType?: PropsTypeRef;
}

/**
 * Compile all block templates in a directory
 */
export async function compileBlockTemplates(options: CompileOptions): Promise<void> {
  const { blocksDir, coreImportPath = "@vojtaholik/static-kit-core", typed = true } = options;
  const genDir = options.genDir ?? join(blocksDir, "gen");

  // Ensure gen directory exists
  await mkdir(genDir, { recursive: true });

  // Find all block templates
  const glob = new Glob("*.block.html");
  const files: string[] = [];

  for await (const file of glob.scan(blocksDir)) {
    files.push(join(blocksDir, file));
  }
  // Deterministic output regardless of filesystem order
  files.sort();

  if (files.length === 0) {
    console.log("No block templates found in", blocksDir);
    return;
  }

  console.log(`Found ${files.length} template(s)`);

  // Compile each template
  for (const file of files) {
    const blockName = basename(file, ".block.html");
    const outFile = join(genDir, `${blockName}.render.ts`);

    const propsType = typed ? await findPropsType(blocksDir, genDir, blockName) : undefined;
    const code = await compileTemplateFile(file, coreImportPath, { propsType });
    await Bun.write(outFile, code);
    console.log(`  ✓ ${blockName}${propsType ? ` (${propsType.name})` : ""}`);
  }

  // Generate index file
  const indexCode = files
    .map((f) => {
      const name = basename(f, ".block.html");
      const pascal = toPascalCase(name);
      return `export { render${pascal} } from "./${name}.render.ts";`;
    })
    .join("\n");

  await Bun.write(join(genDir, "index.ts"), indexCode + "\n");
}

/**
 * Look for `export type <Name>Props` / `export interface <Name>Props` in the
 * template's sibling `<name>.block.ts`.
 */
async function findPropsType(
  blocksDir: string,
  genDir: string,
  blockName: string
): Promise<PropsTypeRef | undefined> {
  const blockFile = join(blocksDir, `${blockName}.block.ts`);
  const file = Bun.file(blockFile);
  if (!(await file.exists())) return undefined;

  const typeName = `${toPascalCase(blockName)}Props`;
  const source = await file.text();
  const re = new RegExp(`export\\s+(?:type|interface)\\s+${typeName}\\b`);
  if (!re.test(source)) return undefined;

  let from = relative(genDir, blockFile).split("\\").join("/");
  if (!from.startsWith(".")) from = `./${from}`;
  return { name: typeName, from };
}

/**
 * Compile a single template file to a render function
 */
export async function compileTemplateFile(
  filePath: string,
  coreImportPath = "@vojtaholik/static-kit-core",
  options: CompileTemplateOptions = {}
): Promise<string> {
  const content = await Bun.file(filePath).text();
  return compileTemplate(content, basename(filePath, ".block.html"), coreImportPath, options);
}

/**
 * Compile template content to a render function
 */
export function compileTemplate(
  content: string,
  blockName: string,
  coreImportPath = "@vojtaholik/static-kit-core",
  options: CompileTemplateOptions = {}
): string {
  const document = parse5.parseFragment(content) as Element;
  const pascalName = toPascalCase(blockName);
  const { propsType } = options;

  // Hoist top-level <style> / <script> out of the render function
  const { nodes, styles, scripts } = hoistAssets(document.childNodes || []);
  const hasAssets = styles.length > 0 || scripts.length > 0;

  let code = `// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, assetUrl, type TypedRenderInput } from "${coreImportPath}";
import { encodeSchemaAddress, registerBlockAssets, blockAssetMarker } from "${coreImportPath}";
`;

  if (propsType) {
    code += `import type { ${propsType.name} } from "${propsType.from}";\n`;
  }

  if (hasAssets) {
    code += `
registerBlockAssets(${JSON.stringify(blockName)}, {
  styles: ${JSON.stringify(styles)},
  scripts: ${JSON.stringify(scripts)},
});
`;
  }

  const propsTypeName = propsType ? propsType.name : "any";
  code += `
${propsType ? "" : "// eslint-disable-next-line @typescript-eslint/no-explicit-any\n"}export function render${pascalName}(input: TypedRenderInput<${propsTypeName}>): string {
  const { props, ctx, addr } = input;
  const asset = (path: string) => assetUrl(ctx, path);
  let out = "";
`;

  if (hasAssets) {
    code += `  out += blockAssetMarker(${JSON.stringify(blockName)});\n`;
  }

  code += compileNodes(nodes, 1);

  code += `
  return out;
}
`;

  return code;
}

/**
 * Split top-level <style>/<script> elements from the rest of the template
 */
function hoistAssets(nodes: Node[]): {
  nodes: Node[];
  styles: string[];
  scripts: string[];
} {
  const rest: Node[] = [];
  const styles: string[] = [];
  const scripts: string[] = [];

  for (const node of nodes) {
    const tag = node.tagName;
    if (tag === "style" || tag === "script") {
      const attrs = (node.attrs || [])
        .map((a) => ` ${a.name}="${a.value.replace(/"/g, "&quot;")}"`)
        .join("");
      const text = (node.childNodes || [])
        .map((c) => (c.nodeName === "#text" ? c.value || "" : ""))
        .join("");
      const html = `<${tag}${attrs}>${text}</${tag}>`;
      (tag === "style" ? styles : scripts).push(html);
      continue;
    }
    rest.push(node);
  }

  return { nodes: rest, styles, scripts };
}

/**
 * Compile a list of sibling nodes. Handles v-if / v-else-if / v-else chains,
 * which span multiple siblings.
 */
function compileNodes(nodes: Node[], indent: number, out = "out"): string {
  let code = "";

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const attrs = isElement(node) ? node.attrs || [] : [];

    if (isElement(node) && hasAttr(attrs, "v-if") && !hasAttr(attrs, "v-for")) {
      const branches: IfBranch[] = [{ condition: getAttr(attrs, "v-if")!, element: node }];

      // Look ahead for v-else-if / v-else siblings (skipping whitespace + comments)
      let j = i + 1;
      let sawElse = false;
      while (j < nodes.length) {
        const next = nodes[j]!;
        if (isSkippable(next)) {
          j++;
          continue;
        }
        if (!isElement(next) || sawElse) break;
        const nextAttrs = next.attrs || [];
        if (hasAttr(nextAttrs, "v-for")) {
          if (hasAttr(nextAttrs, "v-else") || hasAttr(nextAttrs, "v-else-if")) {
            throw new Error("v-else / v-else-if cannot be combined with v-for");
          }
          break;
        }
        if (hasAttr(nextAttrs, "v-else-if")) {
          branches.push({ condition: getAttr(nextAttrs, "v-else-if")!, element: next });
        } else if (hasAttr(nextAttrs, "v-else")) {
          branches.push({ condition: null, element: next });
          sawElse = true;
        } else {
          break;
        }
        j++;
      }

      code += compileIfChain(branches, indent, out);
      i = j - 1;
      continue;
    }

    if (isElement(node) && (hasAttr(attrs, "v-else") || hasAttr(attrs, "v-else-if"))) {
      throw new Error(`v-else / v-else-if on <${node.tagName}> has no preceding v-if sibling`);
    }

    code += compileNode(node, indent, out);
  }

  return code;
}

/**
 * Compile a single node
 */
function compileNode(node: Node, indent: number, out = "out"): string {
  // Text node
  if (node.nodeName === "#text") {
    const text = node.value || "";
    // Skip whitespace-only text nodes entirely
    if (!text.trim()) {
      return "";
    }
    return compileTextWithInterpolation(text, indent, out);
  }

  // Comment node
  if (node.nodeName === "#comment") {
    return "";
  }

  // Document fragment
  if (node.nodeName === "#document-fragment") {
    return compileNodes(node.childNodes || [], indent, out);
  }

  // Element node
  const element = node as Element;
  const tagName = element.tagName || element.nodeName;
  const attrs = element.attrs || [];

  // Check for v-for
  const vFor = getAttr(attrs, "v-for");
  if (vFor) {
    return compileVFor(element, vFor, indent, out);
  }

  // Check for v-if (single, not part of a chain — chains are handled in compileNodes)
  const vIf = getAttr(attrs, "v-if");
  if (vIf) {
    return compileIfChain([{ condition: vIf, element }], indent, out);
  }

  // Handle <template> tag - just render children
  if (tagName === "template") {
    return compileNodes(getChildren(element), indent, out);
  }

  // Handle <render-slot> - delegate rendering to another block with fallback
  if (tagName === "render-slot") {
    return compileRenderSlot(element, indent, out);
  }

  // Regular element
  return compileElement(element, indent, out);
}

/**
 * Framework directives that should be stripped (not rendered as HTML attributes)
 */
const FRAMEWORK_DIRECTIVES = new Set(["key"]);

/**
 * Attributes only emitted in dev (inspector hooks) — never in production HTML
 */
const DEV_ONLY_ATTRS = new Set(["data-block-id", "data-schema-address"]);

const CONDITIONAL_DIRECTIVES = new Set(["v-if", "v-else-if", "v-else", "v-for"]);

/**
 * Compile a regular element
 */
function compileElement(element: Element, indent: number, out = "out"): string {
  const pad = "  ".repeat(indent);
  const tagName = element.tagName || element.nodeName;
  const attrs = element.attrs || [];

  let code = "";

  // Opening tag
  code += `${pad}${out} += "<${tagName}";\n`;

  // `class="static" :class="dyn"` → one merged class attribute
  const staticClass = attrs.find((a) => a.name === "class");
  const dynamicClass = attrs.find((a) => a.name === ":class");
  const mergeClass = Boolean(staticClass && dynamicClass);

  const devOnly = (name: string, attrCode: string): string => {
    if (!DEV_ONLY_ATTRS.has(name)) return attrCode;
    return `${pad}if (ctx.isDev) {\n${attrCode.replace(/^/gm, "  ")}${pad}}\n`;
  };

  // Static attributes
  for (const attr of attrs) {
    // Skip directive attributes
    if (attr.name.startsWith("v-") || attr.name.startsWith(":")) {
      continue;
    }
    if (mergeClass && attr.name === "class") {
      continue;
    }

    let attrCode: string;
    if (attr.value.includes("{{")) {
      // Interpolation in attribute value
      attrCode = compileAttrWithInterpolation(attr.name, attr.value, indent, out);
    } else {
      // Static attribute
      attrCode = `${pad}${out} += " ${attr.name}=\\"${escapeStringLiteral(attr.value)}\\"";\n`;
    }
    code += devOnly(attr.name, attrCode);
  }

  // Dynamic attributes with :
  // Each binding lives in its own block scope so sibling elements can bind
  // the same attribute name without redeclaring the temp const.
  // Only null/undefined/false omit the attribute (0 and "" are rendered),
  // mirroring Vue's attribute binding semantics.
  for (const attr of attrs) {
    if (!attr.name.startsWith(":")) continue;
    const attrName = attr.name.slice(1);
    if (FRAMEWORK_DIRECTIVES.has(attrName)) continue;

    const varName = `_${attrName.replace(/[^a-zA-Z0-9_]/g, "_")}Val`;
    let attrCode = `${pad}{\n`;
    attrCode += `${pad}  const ${varName}: unknown = ${attr.value};\n`;
    if (mergeClass && attrName === "class") {
      const staticExpr = attrValueExpr(staticClass!.value);
      attrCode += `${pad}  ${out} += " class=\\"" + ${staticExpr} + (${varName} != null && ${varName} !== false && ${varName} !== "" ? " " + escapeAttr(${varName}) : "") + "\\"";\n`;
    } else {
      attrCode += `${pad}  if (${varName} != null && ${varName} !== false) {\n`;
      attrCode += `${pad}    ${out} += " ${attrName}=\\"" + escapeAttr(${varName}) + "\\"";\n`;
      attrCode += `${pad}  }\n`;
    }
    attrCode += `${pad}}\n`;
    code += devOnly(attrName, attrCode);
  }

  code += `${pad}${out} += ">";\n`;

  // Void elements have no children and no closing tag
  if (VOID_ELEMENTS.has(tagName)) {
    return code;
  }

  // Children
  code += compileNodes(element.childNodes || [], indent, out);

  // Closing tag
  code += `${pad}${out} += "</${tagName}>";\n`;

  return code;
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * Build a JS expression producing an attribute value string,
 * expanding {{ }} interpolations with escapeAttr().
 */
function attrValueExpr(value: string): string {
  const parts = value.split(/(\{\{.+?\}\})/g).filter(Boolean);
  const exprs = parts.map((part) => {
    const match = part.match(/^\{\{\s*(.+?)\s*\}\}$/);
    return match ? `escapeAttr(${match[1]})` : `"${escapeStringLiteral(part)}"`;
  });
  return exprs.length ? exprs.join(" + ") : '""';
}

/**
 * Get the actual children of an element (handling <template> content)
 */
function getChildren(element: Element): Node[] {
  // For <template> elements, parse5 puts content in a special #document-fragment
  if (element.tagName === "template" && element.content) {
    return element.content.childNodes || [];
  }
  return element.childNodes || [];
}

/**
 * Drop whitespace-only text nodes at the start/end of a child list
 */
function trimEdgeWhitespace(nodes: Node[]): Node[] {
  return nodes.filter((node, i, arr) => {
    if (node.nodeName === "#text") {
      const text = node.value || "";
      if (text.trim()) return true;
      if (i === 0 || i === arr.length - 1) return false;
    }
    return true;
  });
}

/**
 * Compile the body of a conditional/loop branch: a <template> renders its
 * children, anything else renders the element itself (directives removed).
 */
function compileBranchBody(element: Element, indent: number, out: string): string {
  if (element.tagName === "template") {
    return compileNodes(trimEdgeWhitespace(getChildren(element)), indent, out);
  }
  const attrs = (element.attrs || []).filter((a) => !CONDITIONAL_DIRECTIVES.has(a.name));
  return compileElement({ ...element, attrs }, indent, out);
}

interface IfBranch {
  /** null → v-else */
  condition: string | null;
  element: Element;
}

/**
 * Compile a v-if / v-else-if / v-else chain
 */
function compileIfChain(branches: IfBranch[], indent: number, out: string): string {
  const pad = "  ".repeat(indent);
  let code = "";

  branches.forEach((branch, i) => {
    if (i === 0) {
      code += `${pad}if (${branch.condition}) {\n`;
    } else if (branch.condition !== null) {
      code += `${pad}} else if (${branch.condition}) {\n`;
    } else {
      code += `${pad}} else {\n`;
    }
    code += compileBranchBody(branch.element, indent + 1, out);
  });

  code += `${pad}}\n`;
  return code;
}

/**
 * Compile v-for directive
 * Supports: "item in items", "item, i in items", "(item, i) in items"
 */
function compileVFor(element: Element, expr: string, indent: number, out = "out"): string {
  const pad = "  ".repeat(indent);
  let code = "";

  // Parse v-for expression
  const match = expr.match(/^\s*(?:\(?\s*(\w+)\s*(?:,\s*(\w+))?\s*\)?)\s+in\s+(.+)\s*$/);
  if (!match) {
    throw new Error(`Invalid v-for expression: ${expr}`);
  }

  const [, itemVar, indexVar, arrayExpr] = match;
  const idx = indexVar || "_i";

  // `?? []` so an optional/missing array renders nothing instead of throwing
  code += `${pad}for (const [${idx}, ${itemVar}] of ((${arrayExpr}) ?? []).entries()) {\n`;

  const attrs = (element.attrs || []).filter((a) => a.name !== "v-for");
  const cleanElement = { ...element, attrs };

  // v-if on the same element applies per iteration
  const vIf = getAttr(attrs, "v-if");
  if (vIf) {
    code += compileIfChain([{ condition: vIf, element: cleanElement }], indent + 1, out);
  } else {
    code += compileBranchBody(cleanElement, indent + 1, out);
  }

  code += `${pad}}\n`;

  return code;
}

/**
 * Compile <render-slot> element
 *
 * Syntax: <render-slot :block="blockType" :props="propsExpr" :index="indexExpr">fallback</render-slot>
 *
 * - :block - Expression evaluating to block type string (required)
 * - :props - Expression evaluating to props object for the delegated block (required)
 * - :index - Optional expression for array index (used to build propPath like "posts[0]")
 * - :prop-path - Optional expression for explicit prop path (alternative to :index)
 * - Children are rendered as fallback when block is not specified or invalid
 */
function compileRenderSlot(element: Element, indent: number, out = "out"): string {
  const pad = "  ".repeat(indent);
  const attrs = element.attrs || [];

  const blockExpr = getAttr(attrs, ":block");
  const propsExpr = getAttr(attrs, ":props");
  const indexExpr = getAttr(attrs, ":index");
  const propPathExpr = getAttr(attrs, ":prop-path");

  if (!blockExpr) {
    throw new Error("<render-slot> requires :block attribute");
  }
  if (!propsExpr) {
    throw new Error("<render-slot> requires :props attribute");
  }

  let code = "";

  // Build the addr expression with propPath
  let addrExpr: string;
  if (propPathExpr) {
    // Explicit prop path provided
    addrExpr = `{ ...addr, propPath: ${propPathExpr} }`;
  } else if (indexExpr) {
    // Build prop path from index (assumes we're iterating over an array prop)
    // This creates paths like "posts[0]", "posts[1]" etc.
    // When addr.propPath is set, appends index: "posts[0]"
    // When addr.propPath is missing, uses the :props expression base as prefix
    const propsBase = propsExpr.replace(/^props\./, "").split(/[.[]/)[0];
    addrExpr = `{ ...addr, propPath: (addr.propPath ? addr.propPath + "[" + ${indexExpr} + "]" : "${propsBase}[" + ${indexExpr} + "]") }`;
  } else {
    // No prop path
    addrExpr = "addr";
  }

  // Compile fallback children into their own output variable
  const children = trimEdgeWhitespace(element.childNodes || []);

  // Generate the renderSlot call
  code += `${pad}${out} += renderSlot(\n`;
  code += `${pad}  ${blockExpr},\n`;
  code += `${pad}  ${propsExpr},\n`;
  code += `${pad}  ctx,\n`;
  code += `${pad}  ${addrExpr},\n`;
  code += `${pad}  () => {\n`;
  code += `${pad}    let _slot = "";\n`;
  code += compileNodes(children, indent + 2, "_slot");
  code += `${pad}    return _slot;\n`;
  code += `${pad}  }\n`;
  code += `${pad});\n`;

  return code;
}

/**
 * Compile text with {{ interpolation }} and {{{ raw }}}
 * Normalizes whitespace: trims edges and collapses internal whitespace to single spaces
 */
function compileTextWithInterpolation(text: string, indent: number, out = "out"): string {
  const pad = "  ".repeat(indent);
  let code = "";

  // Split on {{{ ... }}} (raw) and {{ ... }} (escaped)
  // Order matters: match triple braces first
  // Uses [\s\S] instead of . to support multiline expressions
  const parts = text.split(/(\{\{\{[\s\S]+?\}\}\}|\{\{[\s\S]+?\}\})/g);

  // Detect unmatched braces in static text parts (every other part is static)
  for (let j = 0; j < parts.length; j += 2) {
    const staticPart = parts[j];
    if (staticPart && /\{\{/.test(staticPart)) {
      throw new Error(
        `Unmatched interpolation braces in template text: "${staticPart.trim().slice(0, 60)}"`
      );
    }
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Check for triple braces (raw output)
    const rawMatch = part.match(/^\{\{\{\s*(.+?)\s*\}\}\}$/);
    if (rawMatch) {
      code += `${pad}${out} += ${rawMatch[1]};\n`;
      continue;
    }

    // Check for double braces (escaped output)
    const escapedMatch = part.match(/^\{\{\s*(.+?)\s*\}\}$/);
    if (escapedMatch) {
      code += `${pad}${out} += escapeHtml(${escapedMatch[1]});\n`;
      continue;
    }

    // Static text - normalize whitespace
    let normalized = part;

    // Trim leading whitespace if this is the first part
    if (i === 0) {
      normalized = normalized.replace(/^\s+/, "");
    }

    // Trim trailing whitespace if this is the last part
    if (i === parts.length - 1) {
      normalized = normalized.replace(/\s+$/, "");
    }

    // Collapse internal whitespace (newlines, multiple spaces) to single space
    normalized = normalized.replace(/\s+/g, " ");

    const escaped = escapeStringLiteral(normalized);
    if (escaped) {
      code += `${pad}${out} += "${escaped}";\n`;
    }
  }

  return code;
}

/**
 * Compile attribute with interpolation
 */
function compileAttrWithInterpolation(
  name: string,
  value: string,
  indent: number,
  out = "out"
): string {
  const pad = "  ".repeat(indent);

  // Split on {{ ... }}
  const parts = value.split(/(\{\{.+?\}\})/g);

  let code = `${pad}${out} += " ${name}=\\"";\n`;

  for (const part of parts) {
    if (!part) continue;

    const match = part.match(/^\{\{\s*(.+?)\s*\}\}$/);
    if (match) {
      code += `${pad}${out} += escapeAttr(${match[1]});\n`;
    } else {
      code += `${pad}${out} += "${escapeStringLiteral(part)}";\n`;
    }
  }

  code += `${pad}${out} += "\\"";\n`;

  return code;
}

function isElement(node: Node): node is Element & { tagName: string } {
  return typeof node.tagName === "string";
}

/** Whitespace-only text and comments don't break a v-if/v-else chain */
function isSkippable(node: Node): boolean {
  if (node.nodeName === "#comment") return true;
  return node.nodeName === "#text" && !(node.value || "").trim();
}

/**
 * Get attribute value by name
 */
function getAttr(attrs: Attribute[], name: string): string | undefined {
  const attr = attrs.find((a) => a.name === name);
  return attr?.value;
}

function hasAttr(attrs: Attribute[], name: string): boolean {
  return attrs.some((a) => a.name === name);
}

/**
 * Escape string for JavaScript string literal
 */
function escapeStringLiteral(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Convert kebab-case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
