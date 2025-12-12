/**
 * Block Template Compiler
 *
 * Parses *.block.html templates and generates TypeScript render functions.
 *
 * Template DSL:
 * - {{ expr }} - interpolation (props.x, ctx.x, addr.x, item, i)
 * - {{{ expr }}} - raw HTML output (no escaping)
 * - v-if="expr" - conditional rendering
 * - v-for="item, i in props.items" - iteration
 * - :attr="expr" - dynamic attribute binding
 * - <render-slot :block="expr" :props="expr" :index="expr">fallback</render-slot> - slot delegation
 */

import * as parse5 from "parse5";
import { Glob } from "bun";
import { mkdir } from "node:fs/promises";
import { basename, join } from "node:path";

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
  /** Custom import path for core utilities (defaults to @static-block-kit/core) */
  coreImportPath?: string;
}

/**
 * Compile all block templates in a directory
 */
export async function compileBlockTemplates(
  options: CompileOptions
): Promise<void> {
  const { blocksDir, coreImportPath = "@static-block-kit/core" } = options;
  const genDir = options.genDir ?? join(blocksDir, "gen");

  // Ensure gen directory exists
  await mkdir(genDir, { recursive: true });

  // Find all block templates
  const glob = new Glob("*.block.html");
  const files: string[] = [];

  for await (const file of glob.scan(blocksDir)) {
    files.push(join(blocksDir, file));
  }

  if (files.length === 0) {
    console.log("No block templates found in", blocksDir);
    return;
  }

  console.log(`Found ${files.length} template(s)`);

  // Compile each template
  for (const file of files) {
    const blockName = basename(file, ".block.html");
    const outFile = join(genDir, `${blockName}.render.ts`);

    const code = await compileTemplateFile(file, coreImportPath);
    await Bun.write(outFile, code);
    console.log(`  ✓ ${blockName}`);
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
 * Compile a single template file to a render function
 */
export async function compileTemplateFile(
  filePath: string,
  coreImportPath = "@static-block-kit/core"
): Promise<string> {
  const content = await Bun.file(filePath).text();
  return compileTemplate(
    content,
    basename(filePath, ".block.html"),
    coreImportPath
  );
}

/**
 * Compile template content to a render function
 */
export function compileTemplate(
  content: string,
  blockName: string,
  coreImportPath = "@static-block-kit/core"
): string {
  const document = parse5.parseFragment(content) as Element;
  const pascalName = toPascalCase(blockName);

  let code = `// Auto-generated - DO NOT EDIT
import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput } from "${coreImportPath}";
import { encodeSchemaAddress } from "${coreImportPath}";

export function render${pascalName}(input: RenderBlockInput): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { props, ctx, addr } = input as { props: any; ctx: typeof input.ctx; addr: typeof input.addr };
  let out = "";
`;

  code += compileNodes(document.childNodes || [], 1);

  code += `
  return out;
}
`;

  return code;
}

/**
 * Compile a list of nodes
 */
function compileNodes(nodes: Node[], indent: number): string {
  let code = "";
  for (const node of nodes) {
    code += compileNode(node, indent);
  }
  return code;
}

/**
 * Compile a single node
 */
function compileNode(node: Node, indent: number): string {
  // Text node
  if (node.nodeName === "#text") {
    const text = node.value || "";
    // Skip whitespace-only text nodes entirely
    if (!text.trim()) {
      return "";
    }
    return compileTextWithInterpolation(text, indent);
  }

  // Comment node
  if (node.nodeName === "#comment") {
    return "";
  }

  // Document fragment
  if (node.nodeName === "#document-fragment") {
    return compileNodes(node.childNodes || [], indent);
  }

  // Element node
  const element = node as Element;
  const tagName = element.tagName || element.nodeName;
  const attrs = element.attrs || [];

  // Check for v-for
  const vFor = getAttr(attrs, "v-for");
  if (vFor) {
    return compileVFor(element, vFor, indent);
  }

  // Check for v-if
  const vIf = getAttr(attrs, "v-if");
  if (vIf) {
    return compileVIf(element, vIf, indent);
  }

  // Handle <template> tag - just render children
  if (tagName === "template") {
    return compileNodes(element.childNodes || [], indent);
  }

  // Handle <render-slot> - delegate rendering to another block with fallback
  if (tagName === "render-slot") {
    return compileRenderSlot(element, indent);
  }

  // Regular element
  return compileElement(element, indent);
}

/**
 * Compile a regular element
 */
function compileElement(element: Element, indent: number): string {
  const pad = "  ".repeat(indent);
  const tagName = element.tagName || element.nodeName;
  const attrs = element.attrs || [];

  let code = "";

  // Opening tag
  code += `${pad}out += "<${tagName}";\n`;

  // Attributes
  for (const attr of attrs) {
    // Skip directive attributes
    if (attr.name.startsWith("v-") || attr.name.startsWith(":")) {
      continue;
    }

    // Check for dynamic binding with :
    const bindMatch = attr.name.match(/^:(.+)$/);
    if (bindMatch) {
      const attrName = bindMatch[1];
      code += `${pad}out += " ${attrName}=\\"" + escapeAttr(${attr.value}) + "\\"";\n`;
    } else if (attr.value.includes("{{")) {
      // Interpolation in attribute value
      code += compileAttrWithInterpolation(attr.name, attr.value, indent);
    } else {
      // Static attribute
      code += `${pad}out += " ${attr.name}=\\"${escapeStringLiteral(
        attr.value
      )}\\"";\n`;
    }
  }

  // Handle dynamic attributes with :
  // Framework directives that should be stripped (not rendered as HTML attributes)
  const frameworkDirectives = new Set(["key"]);

  for (const attr of attrs) {
    if (attr.name.startsWith(":")) {
      const attrName = attr.name.slice(1);
      // Skip framework directives like :key
      if (frameworkDirectives.has(attrName)) {
        continue;
      }
      // Conditionally render attribute only if value is truthy
      code += `${pad}const _${attrName}Val = ${attr.value};\n`;
      code += `${pad}if (_${attrName}Val) {\n`;
      code += `${pad}  out += " ${attrName}=\\"" + escapeAttr(_${attrName}Val) + "\\"";\n`;
      code += `${pad}}\n`;
    }
  }

  // Self-closing tags
  const voidElements = [
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
  ];

  if (voidElements.includes(tagName)) {
    code += `${pad}out += ">";\n`;
    return code;
  }

  code += `${pad}out += ">";\n`;

  // Children
  code += compileNodes(element.childNodes || [], indent);

  // Closing tag
  code += `${pad}out += "</${tagName}>";\n`;

  return code;
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
 * Compile v-if directive
 */
function compileVIf(
  element: Element,
  condition: string,
  indent: number
): string {
  const pad = "  ".repeat(indent);
  let code = "";

  code += `${pad}if (${condition}) {\n`;

  // Remove v-if from attrs
  const filteredAttrs = (element.attrs || []).filter((a) => a.name !== "v-if");

  // If it's a template, render its children directly
  if (element.tagName === "template") {
    // Get children (using content for template elements)
    const rawChildren = getChildren(element);
    // Filter out whitespace-only text nodes at the start/end
    const children = rawChildren.filter((node, i, arr) => {
      if (node.nodeName === "#text") {
        const text = node.value || "";
        // Keep non-whitespace text nodes
        if (text.trim()) return true;
        // Keep internal whitespace but not leading/trailing
        if (i === 0 || i === arr.length - 1) return false;
      }
      return true;
    });
    code += compileNodes(children, indent + 1);
  } else {
    const cleanElement = { ...element, attrs: filteredAttrs };
    code += compileElement(cleanElement, indent + 1);
  }

  code += `${pad}}\n`;

  return code;
}

/**
 * Compile v-for directive
 * Supports: "item in items", "item, i in items", "(item, i) in items"
 */
function compileVFor(element: Element, expr: string, indent: number): string {
  const pad = "  ".repeat(indent);
  let code = "";

  // Parse v-for expression
  const match = expr.match(
    /^\s*(?:\(?\s*(\w+)\s*(?:,\s*(\w+))?\s*\)?)\s+in\s+(.+)\s*$/
  );
  if (!match) {
    throw new Error(`Invalid v-for expression: ${expr}`);
  }

  const [, itemVar, indexVar, arrayExpr] = match;
  const idx = indexVar || "_i";

  code += `${pad}for (const [${idx}, ${itemVar}] of (${arrayExpr}).entries()) {\n`;

  // Remove v-for from attrs
  const filteredAttrs = (element.attrs || []).filter((a) => a.name !== "v-for");

  // If it's a template, render its children directly
  if (element.tagName === "template") {
    // Get children (using content for template elements)
    const rawChildren = getChildren(element);
    // Filter out whitespace-only text nodes at the start/end
    const children = rawChildren.filter((node, i, arr) => {
      if (node.nodeName === "#text") {
        const text = node.value || "";
        if (text.trim()) return true;
        if (i === 0 || i === arr.length - 1) return false;
      }
      return true;
    });
    code += compileNodes(children, indent + 1);
  } else {
    const cleanElement = { ...element, attrs: filteredAttrs };
    code += compileElement(cleanElement, indent + 1);
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
function compileRenderSlot(element: Element, indent: number): string {
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
    addrExpr = `{ ...addr, propPath: (addr.propPath ? addr.propPath + "[" + ${indexExpr} + "]" : "[" + ${indexExpr} + "]") }`;
  } else {
    // No prop path
    addrExpr = "addr";
  }

  // Compile fallback children
  const rawChildren = element.childNodes || [];
  const children = rawChildren.filter((node, i, arr) => {
    if (node.nodeName === "#text") {
      const text = node.value || "";
      if (text.trim()) return true;
      if (i === 0 || i === arr.length - 1) return false;
    }
    return true;
  });

  // Generate the renderSlot call
  code += `${pad}out += renderSlot(\n`;
  code += `${pad}  ${blockExpr},\n`;
  code += `${pad}  ${propsExpr},\n`;
  code += `${pad}  ctx,\n`;
  code += `${pad}  ${addrExpr},\n`;
  code += `${pad}  () => {\n`;
  code += `${pad}    let _slot = "";\n`;
  code += compileNodes(children, indent + 2).replace(/\bout\b/g, "_slot");
  code += `${pad}    return _slot;\n`;
  code += `${pad}  }\n`;
  code += `${pad});\n`;

  return code;
}

/**
 * Compile text with {{ interpolation }} and {{{ raw }}}
 * Normalizes whitespace: trims edges and collapses internal whitespace to single spaces
 */
function compileTextWithInterpolation(text: string, indent: number): string {
  const pad = "  ".repeat(indent);
  let code = "";

  // Split on {{{ ... }}} (raw) and {{ ... }} (escaped)
  // Order matters: match triple braces first
  const parts = text.split(/(\{\{\{.+?\}\}\}|\{\{.+?\}\})/g);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    // Check for triple braces (raw output)
    const rawMatch = part.match(/^\{\{\{\s*(.+?)\s*\}\}\}$/);
    if (rawMatch) {
      code += `${pad}out += ${rawMatch[1]};\n`;
      continue;
    }

    // Check for double braces (escaped output)
    const escapedMatch = part.match(/^\{\{\s*(.+?)\s*\}\}$/);
    if (escapedMatch) {
      code += `${pad}out += escapeHtml(${escapedMatch[1]});\n`;
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
      code += `${pad}out += "${escaped}";\n`;
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
  indent: number
): string {
  const pad = "  ".repeat(indent);

  // Split on {{ ... }}
  const parts = value.split(/(\{\{.+?\}\})/g);

  let code = `${pad}out += " ${name}=\\"";\n`;

  for (const part of parts) {
    if (!part) continue;

    const match = part.match(/^\{\{\s*(.+?)\s*\}\}$/);
    if (match) {
      code += `${pad}out += escapeAttr(${match[1]});\n`;
    } else {
      code += `${pad}out += "${escapeStringLiteral(part)}";\n`;
    }
  }

  code += `${pad}out += "\\"";\n`;

  return code;
}

/**
 * Get attribute value by name
 */
function getAttr(attrs: Attribute[], name: string): string | undefined {
  const attr = attrs.find((a) => a.name === name);
  return attr?.value;
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
