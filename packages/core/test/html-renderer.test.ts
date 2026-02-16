import { describe, test, expect, beforeEach } from "bun:test";
import { z } from "zod/v4";
import {
  renderPage,
  renderBlock,
  type PageConfig,
  type BlockInstance,
  type RenderPageOptions,
} from "../src/html-renderer.ts";
import {
  blockRegistry,
  defineBlock,
  type RenderBlockInput,
} from "../src/block-registry.ts";

describe("HTML Renderer", () => {
  beforeEach(() => {
    // Clear registry before each test
    blockRegistry.clear();
  });

  describe("renderPage", () => {
    test("renders basic page with title", async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <title>Default Title</title>
</head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "test-page",
        path: "/test",
        title: "Test Page Title",
        template: "base.html",
        regions: {
          main: { blocks: [] },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
        isDev: false,
      };

      const html = await renderPage(page, options);

      expect(html).toContain("<title>Test Page Title</title>");
      expect(html).toContain('data-page-id="test-page"');
    });

    test("renders page with single block in region", async () => {
      const heroBlock = defineBlock({
        type: "hero",
        propsSchema: z.object({ title: z.string() }),
        renderHtml: ({ props }) => `<div class="hero">${props.title}</div>`,
      });

      blockRegistry.register(heroBlock);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: {
            blocks: [
              {
                id: "hero-1",
                type: "hero",
                props: { title: "Welcome" },
              },
            ],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      const html = await renderPage(page, options);

      expect(html).toContain('<div class="hero">Welcome</div>');
    });

    test("renders page with multiple blocks in region", async () => {
      const textBlock = defineBlock({
        type: "text",
        propsSchema: z.object({ content: z.string() }),
        renderHtml: ({ props }) => `<p>${props.content}</p>`,
      });

      blockRegistry.register(textBlock);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: {
            blocks: [
              { id: "text-1", type: "text", props: { content: "First" } },
              { id: "text-2", type: "text", props: { content: "Second" } },
              { id: "text-3", type: "text", props: { content: "Third" } },
            ],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      const html = await renderPage(page, options);

      expect(html).toContain("<p>First</p>");
      expect(html).toContain("<p>Second</p>");
      expect(html).toContain("<p>Third</p>");
      // Verify order
      expect(html.indexOf("First")).toBeLessThan(html.indexOf("Second"));
      expect(html.indexOf("Second")).toBeLessThan(html.indexOf("Third"));
    });

    test("renders page with multiple regions", async () => {
      const block = defineBlock({
        type: "text",
        propsSchema: z.object({ content: z.string() }),
        renderHtml: ({ props }) => `<div>${props.content}</div>`,
      });

      blockRegistry.register(block);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <header data-region="header"></header>
  <main data-region="main"></main>
  <aside data-region="sidebar"></aside>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          header: {
            blocks: [{ id: "h1", type: "text", props: { content: "Header" } }],
          },
          main: {
            blocks: [{ id: "m1", type: "text", props: { content: "Main" } }],
          },
          sidebar: {
            blocks: [{ id: "s1", type: "text", props: { content: "Sidebar" } }],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      const html = await renderPage(page, options);

      expect(html).toContain("<div>Header</div>");
      expect(html).toContain("<div>Main</div>");
      expect(html).toContain("<div>Sidebar</div>");
    });

    test("handles empty region", async () => {
      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: { blocks: [] },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      const html = await renderPage(page, options);

      expect(html).toContain('data-region="main"');
      expect(html).not.toContain("undefined");
    });

    test("skips unknown block types with warning", async () => {
      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: {
            blocks: [
              { id: "unknown-1", type: "unknown-type", props: { test: "value" } },
            ],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      const html = await renderPage(page, options);

      // Should not crash, just skip the unknown block
      expect(html).toBeTruthy();
      expect(html).not.toContain("unknown-type");
    });

    test("skips blocks with invalid props", async () => {
      const block = defineBlock({
        type: "strict-block",
        propsSchema: z.object({ required: z.string() }),
        renderHtml: ({ props }) => `<div>${props.required}</div>`,
      });

      blockRegistry.register(block);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: {
            blocks: [
              { id: "block-1", type: "strict-block", props: { wrong: "prop" } },
            ],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      const html = await renderPage(page, options);

      // Should not crash, just skip the invalid block
      expect(html).toBeTruthy();
      expect(html).not.toContain("<div>");
    });

    test("injects dev overlay in dev mode", async () => {
      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: { blocks: [] },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
        isDev: true,
      };

      const html = await renderPage(page, options);

      expect(html).toContain('<script src="/__dev-overlay.js"></script>');
    });

    test("does not inject dev overlay in production", async () => {
      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: { blocks: [] },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
        isDev: false,
      };

      const html = await renderPage(page, options);

      expect(html).not.toContain("__dev-overlay");
    });

    test("passes correct context to blocks", async () => {
      let receivedContext: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ ctx }) => {
          receivedContext = ctx;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "my-page",
        path: "/test",
        title: "Test",
        template: "base.html",
        regions: {
          main: {
            blocks: [{ id: "test-1", type: "test", props: {} }],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
        assetBase: "/assets/",
        isDev: true,
      };

      await renderPage(page, options);

      expect(receivedContext).toBeTruthy();
      expect(receivedContext.pageId).toBe("my-page");
      expect(receivedContext.assetBase).toBe("/assets/");
      expect(receivedContext.isDev).toBe(true);
    });

    test("passes correct schema address to blocks", async () => {
      let receivedAddr: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ addr }) => {
          receivedAddr = addr;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "my-page",
        path: "/test",
        title: "Test",
        template: "base.html",
        regions: {
          main: {
            blocks: [{ id: "block-123", type: "test", props: {} }],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      await renderPage(page, options);

      expect(receivedAddr).toBeTruthy();
      expect(receivedAddr.pageId).toBe("my-page");
      expect(receivedAddr.region).toBe("main");
      expect(receivedAddr.blockId).toBe("block-123");
    });

    test("uses default asset base when not provided", async () => {
      let receivedContext: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ ctx }) => {
          receivedContext = ctx;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: {
            blocks: [{ id: "test-1", type: "test", props: {} }],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      await renderPage(page, options);

      expect(receivedContext.assetBase).toBe("/");
    });

    test("applies block layout props", async () => {
      let receivedContext: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ ctx }) => {
          receivedContext = ctx;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const template = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div data-region="main"></div>
</body>
</html>`;

      const page: PageConfig = {
        id: "home",
        path: "/",
        title: "Home",
        template: "base.html",
        regions: {
          main: {
            blocks: [
              {
                id: "test-1",
                type: "test",
                props: {},
                layout: {
                  tone: "accent",
                  density: "compact",
                },
              },
            ],
          },
        },
      };

      const options: RenderPageOptions = {
        templateDir: "/templates",
        readFile: async () => template,
      };

      await renderPage(page, options);

      expect(receivedContext.layout.tone).toBe("accent");
      expect(receivedContext.layout.density).toBe("compact");
    });
  });

  describe("renderBlock", () => {
    test("renders standalone block", () => {
      const block = defineBlock({
        type: "card",
        propsSchema: z.object({ title: z.string() }),
        renderHtml: ({ props }) => `<div class="card">${props.title}</div>`,
      });

      blockRegistry.register(block);

      const blockInstance: BlockInstance = {
        id: "card-1",
        type: "card",
        props: { title: "My Card" },
      };

      const html = renderBlock(blockInstance, {
        pageId: "test",
        region: "main",
        isDev: false,
        assetBase: "/",
      });

      expect(html).toBe('<div class="card">My Card</div>');
    });

    test("throws on unknown block type", () => {
      const blockInstance: BlockInstance = {
        id: "unknown-1",
        type: "unknown-type",
        props: {},
      };

      expect(() => {
        renderBlock(blockInstance, {
          pageId: "test",
          region: "main",
          isDev: false,
          assetBase: "/",
        });
      }).toThrow('Unknown block type: "unknown-type"');
    });

    test("throws on invalid props", () => {
      const block = defineBlock({
        type: "strict",
        propsSchema: z.object({ required: z.string() }),
        renderHtml: ({ props }) => `<div>${props.required}</div>`,
      });

      blockRegistry.register(block);

      const blockInstance: BlockInstance = {
        id: "strict-1",
        type: "strict",
        props: { wrong: "prop" },
      };

      expect(() => {
        renderBlock(blockInstance, {
          pageId: "test",
          region: "main",
          isDev: false,
          assetBase: "/",
        });
      }).toThrow("Invalid props");
    });

    test("passes correct context", () => {
      let receivedContext: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ ctx }) => {
          receivedContext = ctx;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const blockInstance: BlockInstance = {
        id: "test-1",
        type: "test",
        props: {},
      };

      renderBlock(blockInstance, {
        pageId: "my-page",
        region: "sidebar",
        isDev: true,
        assetBase: "/static/",
      });

      expect(receivedContext.pageId).toBe("my-page");
      expect(receivedContext.isDev).toBe(true);
      expect(receivedContext.assetBase).toBe("/static/");
    });

    test("passes correct address", () => {
      let receivedAddr: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ addr }) => {
          receivedAddr = addr;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const blockInstance: BlockInstance = {
        id: "block-xyz",
        type: "test",
        props: {},
      };

      renderBlock(blockInstance, {
        pageId: "about",
        region: "footer",
        isDev: false,
        assetBase: "/",
      });

      expect(receivedAddr.pageId).toBe("about");
      expect(receivedAddr.region).toBe("footer");
      expect(receivedAddr.blockId).toBe("block-xyz");
    });

    test("applies layout props from block instance", () => {
      let receivedContext: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ ctx }) => {
          receivedContext = ctx;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const blockInstance: BlockInstance = {
        id: "test-1",
        type: "test",
        props: {},
        layout: {
          tone: "inverted",
          contentWidth: "wide",
        },
      };

      renderBlock(blockInstance, {
        pageId: "test",
        region: "main",
        isDev: false,
        assetBase: "/",
      });

      expect(receivedContext.layout.tone).toBe("inverted");
      expect(receivedContext.layout.contentWidth).toBe("wide");
    });

    test("uses default layout props when not specified", () => {
      let receivedContext: any = null;

      const block = defineBlock({
        type: "test",
        propsSchema: z.object({}),
        renderHtml: ({ ctx }) => {
          receivedContext = ctx;
          return "<div>test</div>";
        },
      });

      blockRegistry.register(block);

      const blockInstance: BlockInstance = {
        id: "test-1",
        type: "test",
        props: {},
      };

      renderBlock(blockInstance, {
        pageId: "test",
        region: "main",
        isDev: false,
        assetBase: "/",
      });

      expect(receivedContext.layout).toBeTruthy();
      expect(receivedContext.layout.tone).toBe("surface");
      expect(receivedContext.layout.contentAlign).toBe("left");
      expect(receivedContext.layout.density).toBe("comfortable");
      expect(receivedContext.layout.contentWidth).toBe("default");
    });
  });
});
