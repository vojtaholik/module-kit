import { describe, test, expect } from "bun:test";
import { vlna, vlnaHtml, preventWidow } from "../src/vlna.ts";

describe("vlna", () => {
  describe("plain text", () => {
    test("adds nbsp after single-char prepositions", () => {
      expect(vlna("Šel jsem v neděli")).toBe("Šel jsem v\u00A0neděli");
      expect(vlna("Byl s kamarádem")).toBe("Byl s\u00A0kamarádem");
      expect(vlna("Jdu k řece")).toBe("Jdu k\u00A0řece");
      expect(vlna("Přišel z města")).toBe("Přišel z\u00A0města");
      expect(vlna("Stalo se to u mostu")).toBe("Stalo se to u\u00A0mostu");
      expect(vlna("Mluvil o tom")).toBe("Mluvil o\u00A0tom");
    });

    test("adds nbsp after single-char conjunctions", () => {
      expect(vlna("ty a já")).toBe("ty a\u00A0já");
      expect(vlna("on i ona")).toBe("on i\u00A0ona");
    });

    test("handles uppercase", () => {
      expect(vlna("V neděli")).toBe("V\u00A0neděli");
      expect(vlna("A potom")).toBe("A\u00A0potom");
      expect(vlna("K řece")).toBe("K\u00A0řece");
    });

    test("handles multiple prepositions in one string", () => {
      expect(vlna("Šel v neděli s kamarádem k řece")).toBe(
        "Šel v\u00A0neděli s\u00A0kamarádem k\u00A0řece"
      );
    });

    test("handles adjacent single-char words", () => {
      const result = vlna("byl v s tím");
      expect(result).toBe("byl v\u00A0s\u00A0tím");
    });

    test("does not modify multi-char words", () => {
      expect(vlna("ve městě")).toBe("ve městě");
      expect(vlna("se psem")).toBe("se psem");
      expect(vlna("do lesa")).toBe("do lesa");
    });

    test("does not touch single char in middle of word", () => {
      expect(vlna("auto")).toBe("auto");
      expect(vlna("kolo")).toBe("kolo");
    });

    test("preserves existing nbsp", () => {
      expect(vlna("v\u00A0neděli")).toBe("v\u00A0neděli");
    });

    test("handles empty string", () => {
      expect(vlna("")).toBe("");
    });

    test("handles string with no prepositions", () => {
      expect(vlna("Dobrý den")).toBe("Dobrý den");
    });

    test("handles preposition at start of string", () => {
      expect(vlna("V lese")).toBe("V\u00A0lese");
    });
  });

  describe("preventWidow", () => {
    test("adds nbsp before last word", () => {
      expect(preventWidow("Tohle je věta se slovem")).toBe(
        "Tohle je věta se\u00A0slovem"
      );
    });

    test("skips words longer than 15 chars", () => {
      const longWord = "a".repeat(16);
      const input = `Tohle je ${longWord}`;
      expect(preventWidow(input)).toBe(input);
    });

    test("handles short strings", () => {
      expect(preventWidow("jedno")).toBe("jedno");
    });

    test("handles two-word strings", () => {
      expect(preventWidow("dvě slova")).toBe("dvě\u00A0slova");
    });
  });

  describe("vlnaHtml", () => {
    test("transforms text between tags", () => {
      expect(vlnaHtml("<p>Šel v neděli</p>")).toBe(
        "<p>Šel v\u00A0neděli</p>"
      );
    });

    test("does not transform HTML attributes", () => {
      expect(vlnaHtml('<a href="v neděli">text</a>')).toBe(
        '<a href="v neděli">text</a>'
      );
    });

    test("skips <script> content", () => {
      expect(vlnaHtml("<script>var v = 1;</script>")).toBe(
        "<script>var v = 1;</script>"
      );
    });

    test("skips <style> content", () => {
      expect(vlnaHtml("<style>.v { color: red; }</style>")).toBe(
        "<style>.v { color: red; }</style>"
      );
    });

    test("skips <code> content", () => {
      expect(vlnaHtml("<code>v neděli</code>")).toBe(
        "<code>v neděli</code>"
      );
    });

    test("skips <pre> content", () => {
      expect(vlnaHtml("<pre>v neděli</pre>")).toBe(
        "<pre>v neděli</pre>"
      );
    });

    test("transforms text outside skip tags", () => {
      const input = "<p>v lese</p><code>v kódu</code><p>s přítelem</p>";
      const expected =
        "<p>v\u00A0lese</p><code>v kódu</code><p>s\u00A0přítelem</p>";
      expect(vlnaHtml(input)).toBe(expected);
    });

    test("handles nested tags", () => {
      expect(vlnaHtml("<div><p>v lese</p></div>")).toBe(
        "<div><p>v\u00A0lese</p></div>"
      );
    });

    test("handles self-closing tags", () => {
      expect(vlnaHtml("v lese<br/>s přítelem")).toBe(
        "v\u00A0lese<br/>s\u00A0přítelem"
      );
    });

    test("handles nested skip tags", () => {
      expect(vlnaHtml("<pre><code>v neděli</code></pre>")).toBe(
        "<pre><code>v neděli</code></pre>"
      );
    });

    test("handles full HTML document", () => {
      const input = `<!DOCTYPE html>
<html>
<head><title>Test</title><style>body { v: 1; }</style></head>
<body>
  <p>Šel v neděli s kamarádem</p>
  <script>var a = 1;</script>
</body>
</html>`;

      const result = vlnaHtml(input);
      expect(result).toContain("v\u00A0neděli");
      expect(result).toContain("s\u00A0kamarádem");
      // script and style untouched
      expect(result).toContain("<script>var a = 1;</script>");
      expect(result).toContain("body { v: 1; }");
    });
  });
});
