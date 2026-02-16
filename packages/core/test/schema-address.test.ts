import { describe, test, expect } from "bun:test";
import {
  encodeSchemaAddress,
  decodeSchemaAddress,
  withPropPath,
  isSameBlock,
  type SchemaAddress,
} from "../src/schema-address.ts";

describe("Schema Address", () => {
  describe("encodeSchemaAddress", () => {
    test("encodes basic address without propPath", () => {
      const addr: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };

      const encoded = encodeSchemaAddress(addr);
      expect(encoded).toBe("home::main::hero-1");
    });

    test("encodes address with propPath", () => {
      const addr: SchemaAddress = {
        pageId: "about",
        region: "sidebar",
        blockId: "card-2",
        propPath: "title",
      };

      const encoded = encodeSchemaAddress(addr);
      expect(encoded).toBe("about::sidebar::card-2::title");
    });

    test("encodes address with nested propPath", () => {
      const addr: SchemaAddress = {
        pageId: "blog",
        region: "content",
        blockId: "post-1",
        propPath: "author.name",
      };

      const encoded = encodeSchemaAddress(addr);
      expect(encoded).toBe("blog::content::post-1::author.name");
    });

    test("encodes address with array index in propPath", () => {
      const addr: SchemaAddress = {
        pageId: "products",
        region: "main",
        blockId: "grid-1",
        propPath: "items[0].title",
      };

      const encoded = encodeSchemaAddress(addr);
      expect(encoded).toBe("products::main::grid-1::items[0].title");
    });

    test("handles empty propPath as undefined", () => {
      const addr: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: "",
      };

      const encoded = encodeSchemaAddress(addr);
      // Empty string propPath should still be included
      expect(encoded).toBe("home::main::hero-1::");
    });
  });

  describe("decodeSchemaAddress", () => {
    test("decodes basic address without propPath", () => {
      const encoded = "home::main::hero-1";
      const addr = decodeSchemaAddress(encoded);

      expect(addr).toEqual({
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: undefined,
      });
    });

    test("decodes address with propPath", () => {
      const encoded = "about::sidebar::card-2::title";
      const addr = decodeSchemaAddress(encoded);

      expect(addr).toEqual({
        pageId: "about",
        region: "sidebar",
        blockId: "card-2",
        propPath: "title",
      });
    });

    test("decodes address with nested propPath", () => {
      const encoded = "blog::content::post-1::author.name";
      const addr = decodeSchemaAddress(encoded);

      expect(addr).toEqual({
        pageId: "blog",
        region: "content",
        blockId: "post-1",
        propPath: "author.name",
      });
    });

    test("decodes address with array index in propPath", () => {
      const encoded = "products::main::grid-1::items[0].title";
      const addr = decodeSchemaAddress(encoded);

      expect(addr).toEqual({
        pageId: "products",
        region: "main",
        blockId: "grid-1",
        propPath: "items[0].title",
      });
    });

    test("throws on invalid format with too few parts", () => {
      expect(() => {
        decodeSchemaAddress("home::main");
      }).toThrow("Invalid schema address");
    });

    test("throws on invalid format with one part", () => {
      expect(() => {
        decodeSchemaAddress("home");
      }).toThrow("Invalid schema address");
    });

    test("throws on empty string", () => {
      expect(() => {
        decodeSchemaAddress("");
      }).toThrow("Invalid schema address");
    });

    test("handles empty string parts", () => {
      const encoded = "::::";
      const addr = decodeSchemaAddress(encoded);

      expect(addr).toEqual({
        pageId: "",
        region: "",
        blockId: "",
        propPath: "",
      });
    });
  });

  describe("encode/decode round-trip", () => {
    test("round-trip without propPath", () => {
      const original: SchemaAddress = {
        pageId: "test",
        region: "main",
        blockId: "block-1",
      };

      const encoded = encodeSchemaAddress(original);
      const decoded = decodeSchemaAddress(encoded);

      expect(decoded.pageId).toBe(original.pageId);
      expect(decoded.region).toBe(original.region);
      expect(decoded.blockId).toBe(original.blockId);
      expect(decoded.propPath).toBeUndefined();
    });

    test("round-trip with propPath", () => {
      const original: SchemaAddress = {
        pageId: "test",
        region: "main",
        blockId: "block-1",
        propPath: "items[0].title",
      };

      const encoded = encodeSchemaAddress(original);
      const decoded = decodeSchemaAddress(encoded);

      expect(decoded).toEqual(original);
    });

    test("round-trip with special characters in IDs", () => {
      const original: SchemaAddress = {
        pageId: "page-123",
        region: "main-region",
        blockId: "hero_block_1",
        propPath: "data.items[0].nested_field",
      };

      const encoded = encodeSchemaAddress(original);
      const decoded = decodeSchemaAddress(encoded);

      expect(decoded).toEqual(original);
    });
  });

  describe("withPropPath", () => {
    test("adds propPath to address without existing propPath", () => {
      const addr: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };

      const result = withPropPath(addr, "title");

      expect(result).toEqual({
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: "title",
      });
    });

    test("overwrites existing propPath", () => {
      const addr: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: "oldPath",
      };

      const result = withPropPath(addr, "newPath");

      expect(result).toEqual({
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: "newPath",
      });
    });

    test("preserves all other properties", () => {
      const addr: SchemaAddress = {
        pageId: "test",
        region: "sidebar",
        blockId: "card-5",
      };

      const result = withPropPath(addr, "description");

      expect(result.pageId).toBe(addr.pageId);
      expect(result.region).toBe(addr.region);
      expect(result.blockId).toBe(addr.blockId);
      expect(result.propPath).toBe("description");
    });

    test("does not mutate original address", () => {
      const addr: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };

      const original = { ...addr };
      withPropPath(addr, "title");

      expect(addr).toEqual(original);
    });

    test("handles complex propPath", () => {
      const addr: SchemaAddress = {
        pageId: "blog",
        region: "content",
        blockId: "list-1",
      };

      const result = withPropPath(addr, "posts[0].author.name");

      expect(result.propPath).toBe("posts[0].author.name");
    });
  });

  describe("isSameBlock", () => {
    test("returns true for identical addresses", () => {
      const a: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };
      const b: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };

      expect(isSameBlock(a, b)).toBe(true);
    });

    test("returns true when propPath differs", () => {
      const a: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: "title",
      };
      const b: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: "description",
      };

      expect(isSameBlock(a, b)).toBe(true);
    });

    test("returns true when one has propPath and other doesn't", () => {
      const a: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
        propPath: "title",
      };
      const b: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };

      expect(isSameBlock(a, b)).toBe(true);
    });

    test("returns false when pageId differs", () => {
      const a: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };
      const b: SchemaAddress = {
        pageId: "about",
        region: "main",
        blockId: "hero-1",
      };

      expect(isSameBlock(a, b)).toBe(false);
    });

    test("returns false when region differs", () => {
      const a: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };
      const b: SchemaAddress = {
        pageId: "home",
        region: "sidebar",
        blockId: "hero-1",
      };

      expect(isSameBlock(a, b)).toBe(false);
    });

    test("returns false when blockId differs", () => {
      const a: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };
      const b: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-2",
      };

      expect(isSameBlock(a, b)).toBe(false);
    });

    test("returns false when multiple properties differ", () => {
      const a: SchemaAddress = {
        pageId: "home",
        region: "main",
        blockId: "hero-1",
      };
      const b: SchemaAddress = {
        pageId: "about",
        region: "sidebar",
        blockId: "card-1",
      };

      expect(isSameBlock(a, b)).toBe(false);
    });
  });
});
