import { describe, test, expect } from "bun:test";
import { compileTemplate } from "../src/template-compiler.ts";

describe("Template Compiler", () => {
  describe("text interpolation", () => {
    test("compiles simple interpolation", () => {
      const template = "<div>{{ props.title }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(props.title)");
      expect(result).toContain("return out;");
    });

    test("compiles raw HTML output with triple braces", () => {
      const template = "<div>{{{ props.html }}}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("out += props.html");
      expect(result).not.toContain("escapeHtml(props.html)");
    });

    test("compiles nested property access", () => {
      const template = "<div>{{ props.user.name }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(props.user.name)");
    });

    test("compiles array access", () => {
      const template = "<div>{{ props.items[0] }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(props.items[0])");
    });

    test("compiles context variable access", () => {
      const template = "<div>{{ ctx.pageId }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(ctx.pageId)");
    });

    test("compiles address variable access", () => {
      const template = "<div>{{ addr.blockId }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(addr.blockId)");
    });

    test("compiles mixed text and interpolation", () => {
      const template = "<div>Hello {{ props.name }}, welcome!</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += "Hello "');
      expect(result).toContain("escapeHtml(props.name)");
      expect(result).toContain('out += ", welcome!"');
    });

    test("compiles multiple interpolations in one text node", () => {
      const template = "<div>{{ props.first }} and {{ props.second }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(props.first)");
      expect(result).toContain("escapeHtml(props.second)");
      expect(result).toContain('out += " and "');
    });

    test("trims whitespace from text nodes", () => {
      const template = `
        <div>
          {{ props.title }}
        </div>
      `;
      const result = compileTemplate(template, "test-block");

      // Should not contain excessive whitespace
      expect(result).toContain("escapeHtml(props.title)");
      expect(result).not.toContain("\\n");
    });

    test("normalizes internal whitespace to single space", () => {
      const template = "<div>Hello     World</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += "Hello World"');
    });

    test("handles empty string in interpolation gracefully", () => {
      const template = "<div>{{props.empty}}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(props.empty)");
    });
  });

  describe("v-if directive", () => {
    test("compiles v-if with simple condition", () => {
      const template = '<div v-if="props.show">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("if (props.show)");
      expect(result).toContain('out += "<div"');
      expect(result).toContain('out += "content"');
    });

    test("compiles v-if with complex condition", () => {
      const template = '<div v-if="props.count > 5">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("if (props.count > 5)");
    });

    test("compiles v-if with logical AND", () => {
      const template = '<div v-if="props.show && props.enabled">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("if (props.show && props.enabled)");
    });

    test("compiles v-if on template element", () => {
      const template =
        '<template v-if="props.show"><div>a</div><div>b</div></template>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("if (props.show)");
      expect(result).not.toContain("<template");
      expect(result).toContain('out += "<div"');
      expect(result).toContain('out += "a"');
      expect(result).toContain('out += "b"');
    });

    test("removes v-if attribute from rendered element", () => {
      const template = '<div v-if="props.show" class="test">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).not.toContain("v-if");
      expect(result).toContain('class=\\"test\\"');
    });

    test("compiles nested v-if", () => {
      const template =
        '<div v-if="props.outer"><span v-if="props.inner">text</span></div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("if (props.outer)");
      expect(result).toContain("if (props.inner)");
    });

    test("v-if with interpolation in content", () => {
      const template = '<div v-if="props.show">{{ props.title }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("if (props.show)");
      expect(result).toContain("escapeHtml(props.title)");
    });
  });

  describe("v-for directive", () => {
    test("compiles v-for with item only", () => {
      const template = '<div v-for="item in props.items">{{ item.name }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("for (const [_i, item] of (props.items).entries())");
      expect(result).toContain("escapeHtml(item.name)");
    });

    test("compiles v-for with item and index", () => {
      const template = '<div v-for="item, i in props.items">{{ i }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("for (const [i, item] of (props.items).entries())");
      expect(result).toContain("escapeHtml(i)");
    });

    test("compiles v-for with parenthesized destructuring", () => {
      const template = '<div v-for="(item, i) in props.items">{{ i }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("for (const [i, item] of (props.items).entries())");
    });

    test("compiles v-for on template element", () => {
      const template =
        '<template v-for="item in props.items"><div>{{ item }}</div></template>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("for (const [_i, item] of (props.items).entries())");
      expect(result).not.toContain("<template");
    });

    test("removes v-for attribute from rendered element", () => {
      const template = '<div v-for="item in props.items" class="item">text</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).not.toContain("v-for");
      expect(result).toContain('class=\\"item\\"');
    });

    test("throws on invalid v-for syntax", () => {
      const template = '<div v-for="invalid syntax">content</div>';

      expect(() => {
        compileTemplate(template, "test-block");
      }).toThrow("Invalid v-for expression");
    });

    test("compiles nested v-for", () => {
      const template =
        '<div v-for="group in props.groups"><span v-for="item in group.items">{{ item }}</span></div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("for (const [_i, group] of (props.groups).entries())");
      expect(result).toContain(
        "for (const [_i, item] of (group.items).entries())"
      );
    });

    test("v-for with complex array expression", () => {
      const template =
        '<div v-for="item in props.items.filter(x => x.active)">{{ item.name }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain(
        "for (const [_i, item] of (props.items.filter(x => x.active)).entries())"
      );
    });
  });

  describe("dynamic attributes", () => {
    test("compiles :attr binding", () => {
      const template = '<a :href="props.url">link</a>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("const _hrefVal = props.url");
      expect(result).toContain("escapeAttr(_hrefVal)");
    });

    test("compiles multiple dynamic attributes", () => {
      const template = '<a :href="props.url" :title="props.title">link</a>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("const _hrefVal = props.url");
      expect(result).toContain("const _titleVal = props.title");
    });

    test("compiles :class binding", () => {
      const template = '<div :class="props.className">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("const _classVal = props.className");
      expect(result).toContain("escapeAttr(_classVal)");
    });

    test("mixes static and dynamic attributes", () => {
      const template = '<a href="/static" :title="props.title">link</a>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('href=\\"/static\\"');
      expect(result).toContain("const _titleVal = props.title");
    });

    test("strips :key framework directive", () => {
      const template = '<div :key="props.id">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).not.toContain("key=");
      expect(result).not.toContain("escapeAttr(props.id)");
    });

    test("conditionally renders attribute based on truthy value", () => {
      const template = '<input :disabled="props.isDisabled" />';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("const _disabledVal = props.isDisabled");
      expect(result).toContain("if (_disabledVal)");
    });

    test("compiles attribute with interpolation", () => {
      const template = '<div class="item-{{ props.id }}">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('class=\\"');
      expect(result).toContain('out += "item-"');
      expect(result).toContain("escapeAttr(props.id)");
    });

    test("handles data attributes", () => {
      const template = '<div :data-id="props.id">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("_data-idVal = props.id");
      expect(result).toContain("escapeAttr(_data-idVal)");
    });
  });

  describe("render-slot element", () => {
    test("compiles render-slot with :block and :props", () => {
      const template = '<render-slot :block="props.type" :props="props.data" />';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("renderSlot");
      expect(result).toContain("props.type");
      expect(result).toContain("props.data");
    });

    test("compiles render-slot with :index", () => {
      const template =
        '<render-slot :block="item.type" :props="item" :index="i" />';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("renderSlot");
      expect(result).toContain('propPath: (addr.propPath ? addr.propPath + "[" + i + "]"');
    });

    test("compiles render-slot with :prop-path", () => {
      const template =
        '<render-slot :block="props.type" :props="props.data" :prop-path="\'items[0]\'" />';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("renderSlot");
      expect(result).toContain("propPath: 'items[0]'");
    });

    test("compiles render-slot with fallback content", () => {
      const template =
        '<render-slot :block="props.type" :props="props.data"><div>fallback</div></render-slot>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("renderSlot");
      expect(result).toContain('_slot += "<div"');
      expect(result).toContain('_slot += "fallback"');
    });

    test("throws when :block is missing", () => {
      const template = '<render-slot :props="props.data" />';

      expect(() => {
        compileTemplate(template, "test-block");
      }).toThrow("<render-slot> requires :block attribute");
    });

    test("throws when :props is missing", () => {
      const template = '<render-slot :block="props.type" />';

      expect(() => {
        compileTemplate(template, "test-block");
      }).toThrow("<render-slot> requires :props attribute");
    });

    test("compiles render-slot without :index or :prop-path", () => {
      const template = '<render-slot :block="props.type" :props="props.data" />';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("renderSlot");
      expect(result).toContain("addr");
      expect(result).not.toContain("propPath:");
    });
  });

  describe("element compilation", () => {
    test("compiles basic div", () => {
      const template = "<div>content</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += "<div"');
      expect(result).toContain('out += "content"');
      expect(result).toContain('out += "</div>"');
    });

    test("compiles nested elements", () => {
      const template = "<div><span>text</span></div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += "<div"');
      expect(result).toContain('out += "<span"');
      expect(result).toContain('out += "text"');
      expect(result).toContain('out += "</span>"');
      expect(result).toContain('out += "</div>"');
    });

    test("compiles self-closing tags", () => {
      const template = '<img src="/image.jpg" />';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += "<img"');
      expect(result).toContain('src=\\"/image.jpg\\"');
      expect(result).not.toContain("</img>");
    });

    test("handles all void elements correctly", () => {
      const voidElements = ["br", "hr", "img", "input", "meta", "link"];

      for (const tag of voidElements) {
        const template = `<${tag} />`;
        const result = compileTemplate(template, "test-block");

        expect(result).toContain(`out += "<${tag}"`);
        expect(result).not.toContain(`</${tag}>`);
      }
    });

    test("compiles element with static attributes", () => {
      const template = '<div class="container" id="main">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('class=\\"container\\"');
      expect(result).toContain('id=\\"main\\"');
    });

    test("handles template tag by rendering children only", () => {
      const template = "<template><div>a</div><div>b</div></template>";
      const result = compileTemplate(template, "test-block");

      expect(result).not.toContain("<template");
      expect(result).toContain('out += "<div"');
      expect(result).toContain('out += "a"');
    });

    test("ignores HTML comments", () => {
      const template = "<div><!-- comment --><span>text</span></div>";
      const result = compileTemplate(template, "test-block");

      expect(result).not.toContain("comment");
      expect(result).toContain('out += "<span"');
    });

    test("handles deeply nested elements", () => {
      const template =
        "<div><section><article><p><span>deep</span></p></article></section></div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += "<div"');
      expect(result).toContain('out += "<section"');
      expect(result).toContain('out += "<article"');
      expect(result).toContain('out += "<p"');
      expect(result).toContain('out += "<span"');
      expect(result).toContain('out += "deep"');
    });
  });

  describe("code generation", () => {
    test("generates valid TypeScript function", () => {
      const template = "<div>test</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("export function renderTestBlock(");
      expect(result).toContain("import { escapeHtml");
      expect(result).toContain("let out = \"\"");
      expect(result).toContain("return out;");
    });

    test("generates PascalCase function name from kebab-case", () => {
      const template = "<div>test</div>";
      const result = compileTemplate(template, "hero-banner");

      expect(result).toContain("export function renderHeroBanner(");
    });

    test("generates PascalCase function name from multi-dash", () => {
      const template = "<div>test</div>";
      const result = compileTemplate(template, "my-awesome-block");

      expect(result).toContain("export function renderMyAwesomeBlock(");
    });

    test("includes correct imports", () => {
      const template = "<div>{{ props.title }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain(
        'import { escapeHtml, escapeAttr, renderSlot, type RenderBlockInput }'
      );
      expect(result).toContain("import { encodeSchemaAddress }");
    });

    test("uses custom core import path", () => {
      const template = "<div>test</div>";
      const result = compileTemplate(template, "test-block", "custom/path");

      expect(result).toContain('from "custom/path"');
    });

    test("escapes string literals correctly", () => {
      const template = '<div>Text with "quotes" and \\backslashes\\</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('\\"');
      expect(result).toContain("\\\\");
    });

    test("handles newlines in text", () => {
      const template = "<div>Line 1\nLine 2</div>";
      const result = compileTemplate(template, "test-block");

      // Whitespace should be normalized
      expect(result).toContain("Line 1 Line 2");
    });

    test("includes RenderBlockInput type annotation", () => {
      const template = "<div>test</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("(input: RenderBlockInput)");
    });

    test("includes eslint disable comment for any type", () => {
      const template = "<div>test</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("// eslint-disable-next-line");
    });
  });

  describe("edge cases", () => {
    test("handles empty template", () => {
      const result = compileTemplate("", "test-block");

      expect(result).toContain("export function renderTestBlock");
      expect(result).toContain("return out;");
    });

    test("handles whitespace-only template", () => {
      const result = compileTemplate("   \n  \t  ", "test-block");

      expect(result).toContain("export function renderTestBlock");
      expect(result).toContain("return out;");
    });

    test("handles special HTML characters in static text", () => {
      const template = "<div>Price: $5 & up < 10</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("Price: $5 & up < 10");
    });

    test("handles very long text content", () => {
      const longText = "a".repeat(1000);
      const template = `<div>${longText}</div>`;
      const result = compileTemplate(template, "test-block");

      expect(result).toContain(longText);
    });

    test("handles many siblings", () => {
      const template =
        "<div><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>";
      const result = compileTemplate(template, "test-block");

      for (let i = 1; i <= 5; i++) {
        expect(result).toContain(`out += "${i}"`);
      }
    });

    test("handles mixed directives and attributes", () => {
      const template =
        '<div v-if="props.show" :class="props.className" id="test">{{ props.title }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("if (props.show)");
      expect(result).toContain("_classVal = props.className");
      expect(result).toContain('id=\\"test\\"');
      expect(result).toContain("escapeHtml(props.title)");
    });

    test("handles v-for and v-if combination", () => {
      const template =
        '<div v-for="item in props.items"><span v-if="item.visible">{{ item.name }}</span></div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("for (const [_i, item]");
      expect(result).toContain("if (item.visible)");
      expect(result).toContain("escapeHtml(item.name)");
    });

    test("handles element with no children", () => {
      const template = "<div></div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += "<div"');
      expect(result).toContain('out += "</div>"');
    });

    test("handles text node with only interpolation", () => {
      const template = "<div>{{ props.title }}</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("escapeHtml(props.title)");
      expect(result).not.toContain('out += ""');
    });

    test("handles empty attribute value", () => {
      const template = '<div class="">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('class=\\"\\"');
    });

    test("handles single quote in attribute", () => {
      const template = "<div title=\"it's great\">content</div>";
      const result = compileTemplate(template, "test-block");

      // Single quotes are not escaped in string literals
      expect(result).toContain("it's great");
    });

    test("handles unicode characters", () => {
      const template = "<div>Hello 世界 🌍</div>";
      const result = compileTemplate(template, "test-block");

      expect(result).toContain("Hello 世界 🌍");
    });
  });
});
