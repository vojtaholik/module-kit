import { describe, test, expect, beforeEach } from "bun:test";
import { z } from "zod/v4";
import {
  BlockRegistry,
  blockRegistry,
  defineBlock,
  escapeHtml,
  escapeAttr,
  renderSlot,
  type BlockDefinition,
  type RenderContext,
} from "../src/block-registry.ts";
import type { SchemaAddress } from "../src/schema-address.ts";

describe("Block Registry", () => {
  describe("defineBlock", () => {
    test("creates block definition with required fields", () => {
      const schema = z.object({ title: z.string() });
      const render = () => "<div>test</div>";

      const block = defineBlock({
        type: "test-block",
        propsSchema: schema,
        renderHtml: render,
      });

      expect(block.type).toBe("test-block");
      expect(block.propsSchema).toBe(schema);
      expect(block.renderHtml).toBe(render);
      expect(block.sourceFile).toBeUndefined();
    });

    test("includes sourceFile when provided", () => {
      const schema = z.object({ title: z.string() });
      const render = () => "<div>test</div>";

      const block = defineBlock({
        type: "test-block",
        propsSchema: schema,
        renderHtml: render,
        sourceFile: "/path/to/block.ts",
      });

      expect(block.sourceFile).toBe("/path/to/block.ts");
    });
  });

  describe("BlockRegistry class", () => {
    let registry: BlockRegistry;

    beforeEach(() => {
      registry = new BlockRegistry();
    });

    describe("register", () => {
      test("registers a new block", () => {
        const block = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });

        registry.register(block);

        expect(registry.has("hero")).toBe(true);
        expect(registry.get("hero")).toBe(block);
      });

      test("throws when registering duplicate block type", () => {
        const block1 = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero1</div>",
        });
        const block2 = defineBlock({
          type: "hero",
          propsSchema: z.object({ description: z.string() }),
          renderHtml: () => "<div>hero2</div>",
        });

        registry.register(block1);

        expect(() => {
          registry.register(block2);
        }).toThrow('Block type "hero" is already registered');
      });

      test("allows registering multiple different blocks", () => {
        const hero = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });
        const card = defineBlock({
          type: "card",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>card</div>",
        });

        registry.register(hero);
        registry.register(card);

        expect(registry.has("hero")).toBe(true);
        expect(registry.has("card")).toBe(true);
      });
    });

    describe("get", () => {
      test("returns block for registered type", () => {
        const block = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });

        registry.register(block);
        const result = registry.get("hero");

        expect(result).toBe(block);
      });

      test("returns undefined for unknown type", () => {
        const result = registry.get("unknown");
        expect(result).toBeUndefined();
      });

      test("returns undefined for empty registry", () => {
        const result = registry.get("hero");
        expect(result).toBeUndefined();
      });
    });

    describe("getOrThrow", () => {
      test("returns block for registered type", () => {
        const block = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });

        registry.register(block);
        const result = registry.getOrThrow("hero");

        expect(result).toBe(block);
      });

      test("throws for unknown type", () => {
        expect(() => {
          registry.getOrThrow("unknown");
        }).toThrow('Unknown block type: "unknown"');
      });

      test("throws with correct error message", () => {
        expect(() => {
          registry.getOrThrow("missing-block");
        }).toThrow('Unknown block type: "missing-block"');
      });
    });

    describe("has", () => {
      test("returns true for registered block", () => {
        const block = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });

        registry.register(block);
        expect(registry.has("hero")).toBe(true);
      });

      test("returns false for unknown block", () => {
        expect(registry.has("unknown")).toBe(false);
      });

      test("returns false after clearing registry", () => {
        const block = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });

        registry.register(block);
        registry.clear();
        expect(registry.has("hero")).toBe(false);
      });
    });

    describe("all", () => {
      test("returns empty array for empty registry", () => {
        const result = registry.all();
        expect(result).toEqual([]);
      });

      test("returns all registered blocks", () => {
        const hero = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });
        const card = defineBlock({
          type: "card",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>card</div>",
        });

        registry.register(hero);
        registry.register(card);

        const result = registry.all();
        expect(result).toHaveLength(2);
        expect(result).toContain(hero);
        expect(result).toContain(card);
      });

      test("returns array copy, not internal map", () => {
        const hero = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });

        registry.register(hero);
        const result1 = registry.all();
        const result2 = registry.all();

        expect(result1).not.toBe(result2);
        expect(result1).toEqual(result2);
      });
    });

    describe("types", () => {
      test("returns empty array for empty registry", () => {
        const result = registry.types();
        expect(result).toEqual([]);
      });

      test("returns all block type strings", () => {
        const hero = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });
        const card = defineBlock({
          type: "card",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>card</div>",
        });

        registry.register(hero);
        registry.register(card);

        const result = registry.types();
        expect(result).toHaveLength(2);
        expect(result).toContain("hero");
        expect(result).toContain("card");
      });
    });

    describe("clear", () => {
      test("removes all blocks from registry", () => {
        const hero = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });
        const card = defineBlock({
          type: "card",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>card</div>",
        });

        registry.register(hero);
        registry.register(card);
        registry.clear();

        expect(registry.all()).toEqual([]);
        expect(registry.types()).toEqual([]);
        expect(registry.has("hero")).toBe(false);
        expect(registry.has("card")).toBe(false);
      });

      test("allows re-registering after clear", () => {
        const hero = defineBlock({
          type: "hero",
          propsSchema: z.object({ title: z.string() }),
          renderHtml: () => "<div>hero</div>",
        });

        registry.register(hero);
        registry.clear();
        registry.register(hero);

        expect(registry.has("hero")).toBe(true);
      });
    });
  });

  describe("escapeHtml", () => {
    test("escapes ampersand", () => {
      expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    test("escapes less than", () => {
      expect(escapeHtml("1 < 2")).toBe("1 &lt; 2");
    });

    test("escapes greater than", () => {
      expect(escapeHtml("2 > 1")).toBe("2 &gt; 1");
    });

    test("escapes double quotes", () => {
      expect(escapeHtml('Say "hello"')).toBe("Say &quot;hello&quot;");
    });

    test("escapes single quotes", () => {
      expect(escapeHtml("It's great")).toBe("It&#39;s great");
    });

    test("escapes multiple special characters", () => {
      expect(escapeHtml('<div class="test">A & B</div>')).toBe(
        "&lt;div class=&quot;test&quot;&gt;A &amp; B&lt;/div&gt;"
      );
    });

    test("returns empty string for null", () => {
      expect(escapeHtml(null)).toBe("");
    });

    test("returns empty string for undefined", () => {
      expect(escapeHtml(undefined)).toBe("");
    });

    test("converts number to string", () => {
      expect(escapeHtml(42)).toBe("42");
    });

    test("converts boolean to string", () => {
      expect(escapeHtml(true)).toBe("true");
      expect(escapeHtml(false)).toBe("false");
    });

    test("converts object to string", () => {
      expect(escapeHtml({ foo: "bar" })).toBe("[object Object]");
    });

    test("handles empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    test("handles string with no special characters", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("escapeAttr", () => {
    test("escapes same as escapeHtml", () => {
      const input = '<div class="test">A & B</div>';
      expect(escapeAttr(input)).toBe(escapeHtml(input));
    });

    test("handles null like escapeHtml", () => {
      expect(escapeAttr(null)).toBe("");
    });

    test("handles undefined like escapeHtml", () => {
      expect(escapeAttr(undefined)).toBe("");
    });

    test("converts numbers like escapeHtml", () => {
      expect(escapeAttr(123)).toBe("123");
    });
  });

  describe("renderSlot", () => {
    let mockContext: RenderContext;
    let mockAddr: SchemaAddress;

    beforeEach(() => {
      blockRegistry.clear();
      mockContext = {
        pageId: "test-page",
        assetBase: "/",
        isDev: false,
        layout: {
          tone: "surface",
          contentAlign: "left",
          density: "comfortable",
          contentWidth: "default",
        },
      };
      mockAddr = {
        pageId: "test-page",
        region: "main",
        blockId: "test-block-1",
      };
    });

    test("renders block when type is valid and props are valid", () => {
      const block = defineBlock({
        type: "hero",
        propsSchema: z.object({ title: z.string() }),
        renderHtml: ({ props }) => `<div>${props.title}</div>`,
      });

      blockRegistry.register(block);

      const result = renderSlot(
        "hero",
        { title: "Hello" },
        mockContext,
        mockAddr,
        () => "<div>fallback</div>"
      );

      expect(result).toBe("<div>Hello</div>");
    });

    test("returns fallback when blockType is undefined", () => {
      const result = renderSlot(
        undefined,
        {},
        mockContext,
        mockAddr,
        () => "<div>fallback</div>"
      );

      expect(result).toBe("<div>fallback</div>");
    });

    test("returns fallback when block type is not found", () => {
      const result = renderSlot(
        "unknown-block",
        { title: "Hello" },
        mockContext,
        mockAddr,
        () => "<div>fallback</div>"
      );

      expect(result).toContain("<div>fallback</div>");
    });

    test("returns fallback when props validation fails", () => {
      const block = defineBlock({
        type: "hero",
        propsSchema: z.object({ title: z.string() }),
        renderHtml: ({ props }) => `<div>${props.title}</div>`,
      });

      blockRegistry.register(block);

      const result = renderSlot(
        "hero",
        { title: 123 }, // Invalid: should be string
        mockContext,
        mockAddr,
        () => "<div>fallback</div>"
      );

      expect(result).toContain("<div>fallback</div>");
    });

    test("injects error marker in dev mode for unknown block", () => {
      const devContext = { ...mockContext, isDev: true };

      const result = renderSlot(
        "unknown-block",
        {},
        devContext,
        mockAddr,
        () => "<div>fallback</div>"
      );

      expect(result).toContain('data-slot-error');
      expect(result).toContain('<div>fallback</div>');
    });

    test("no error marker in production mode for unknown block", () => {
      const result = renderSlot(
        "unknown-block",
        {},
        mockContext,
        mockAddr,
        () => "<div>fallback</div>"
      );

      expect(result).not.toContain('data-slot-error');
      expect(result).toBe("<div>fallback</div>");
    });

    test("injects error marker in dev mode for validation failure", () => {
      const block = defineBlock({
        type: "hero",
        propsSchema: z.object({ title: z.string() }),
        renderHtml: ({ props }) => `<div>${props.title}</div>`,
      });

      blockRegistry.register(block);

      const devContext = { ...mockContext, isDev: true };
      const result = renderSlot(
        "hero",
        { title: 123 },
        devContext,
        mockAddr,
        () => "<div>fallback</div>"
      );

      expect(result).toContain('data-slot-error');
      expect(result).toContain('&quot;type&quot;:&quot;validation&quot;');
    });

    test("passes correct context to block render function", () => {
      let receivedContext: RenderContext | undefined;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ ctx }) => {
          receivedContext = ctx;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      renderSlot("test", {}, mockContext, mockAddr, () => "fallback");

      expect(receivedContext).toBe(mockContext);
    });

    test("passes correct address to block render function", () => {
      let receivedAddr: SchemaAddress | undefined;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ addr }) => {
          receivedAddr = addr;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      renderSlot("test", {}, mockContext, mockAddr, () => "fallback");

      expect(receivedAddr).toBe(mockAddr);
    });

    test("validates and transforms props with schema", () => {
      const block = defineBlock({
        type: "test",
        propsSchema: z.object({
          count: z.string().transform((v) => parseInt(v, 10)),
        }),
        renderHtml: ({ props }) => `<div>${props.count * 2}</div>`,
      });

      blockRegistry.register(block);

      const result = renderSlot(
        "test",
        { count: "5" },
        mockContext,
        mockAddr,
        () => "fallback"
      );

      expect(result).toBe("<div>10</div>");
    });

    test("handles complex nested schemas", () => {
      const block = defineBlock({
        type: "test",
        propsSchema: z.object({
          user: z.object({
            name: z.string(),
            age: z.number(),
          }),
        }),
        renderHtml: ({ props }) =>
          `<div>${props.user.name} is ${props.user.age}</div>`,
      });

      blockRegistry.register(block);

      const result = renderSlot(
        "test",
        { user: { name: "Alice", age: 30 } },
        mockContext,
        mockAddr,
        () => "fallback"
      );

      expect(result).toBe("<div>Alice is 30</div>");
    });

    test("fallback function is only called when needed", () => {
      let fallbackCalled = false;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: () => "<div>test</div>",
      });

      blockRegistry.register(block);

      renderSlot(
        "test",
        {},
        mockContext,
        mockAddr,
        () => {
          fallbackCalled = true;
          return "fallback";
        }
      );

      expect(fallbackCalled).toBe(false);
    });

    test("fallback function is called for unknown block", () => {
      let fallbackCalled = false;

      renderSlot(
        "unknown",
        {},
        mockContext,
        mockAddr,
        () => {
          fallbackCalled = true;
          return "fallback";
        }
      );

      expect(fallbackCalled).toBe(true);
    });
  });
});
