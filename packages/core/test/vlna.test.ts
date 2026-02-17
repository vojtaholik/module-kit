import { describe, test, expect } from "bun:test";
import { vlna, vlnaHtml, preventWidow } from "../src/vlna.ts";

describe("vlna", () => {
  describe("plain text", () => {
    test("adds nbsp after single-char prepositions", () => {
      expect(vlna("Šel jsem v neděli")).toBe("Šel jsem v\u00A0neděli");
      expect(vlna("Byl s kamarádem")).toBe("Byl s\u00A0kamarádem");
      expect(vlna("Jdu k řece")).toBe("Jdu k\u00A0řece");
      expect(vlna("Přišel z města")).toBe("Přišel z\u00A0města");
      expect(vlna("Stalo se to u mostu")).toBe("Stalo se\u00A0to u\u00A0mostu");
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

    test("adds nbsp after short prepositions", () => {
      expect(vlna("Bez kompromisů")).toBe("Bez\u00A0kompromisů");
      expect(vlna("nad městem")).toBe("nad\u00A0městem");
      expect(vlna("pod mostem")).toBe("pod\u00A0mostem");
      expect(vlna("pro tebe")).toBe("pro\u00A0tebe");
      expect(vlna("při práci")).toBe("při\u00A0práci");
      expect(vlna("před domem")).toBe("před\u00A0domem");
      expect(vlna("přes cestu")).toBe("přes\u00A0cestu");
      expect(vlna("mezi stromy")).toBe("mezi\u00A0stromy");
    });

    test("adds nbsp after short conjunctions", () => {
      expect(vlna("ani jeden")).toBe("ani\u00A0jeden");
      expect(vlna("ale ne")).toBe("ale\u00A0ne");
      expect(vlna("nebo dva")).toBe("nebo\u00A0dva");
      expect(vlna("jako vždy")).toBe("jako\u00A0vždy");
    });

    test("adds nbsp after two-char prepositions", () => {
      expect(vlna("do lesa")).toBe("do\u00A0lesa");
      expect(vlna("na stole")).toBe("na\u00A0stole");
      expect(vlna("se psem")).toBe("se\u00A0psem");
      expect(vlna("ve městě")).toBe("ve\u00A0městě");
      expect(vlna("od domu")).toBe("od\u00A0domu");
      expect(vlna("po cestě")).toBe("po\u00A0cestě");
      expect(vlna("za plotem")).toBe("za\u00A0plotem");
      expect(vlna("ke škole")).toBe("ke\u00A0škole");
      expect(vlna("ze dřeva")).toBe("ze\u00A0dřeva");
    });

    test("handles uppercase short prepositions", () => {
      expect(vlna("BEZ kompromisů")).toBe("BEZ\u00A0kompromisů");
      expect(vlna("Nad městem")).toBe("Nad\u00A0městem");
      expect(vlna("NA stole")).toBe("NA\u00A0stole");
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
      expect(vlnaHtml("<p>Šel jsem v neděli</p>")).toBe(
        "<p>Šel jsem v\u00A0neděli</p>"
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
      const input =
        "<p>Šel v lese daleko</p><code>v kódu</code><p>Byl s přítelem včera</p>";
      const result = vlnaHtml(input);
      expect(result).toContain("v\u00A0lese");
      expect(result).toContain("s\u00A0přítelem");
      expect(result).toContain("v kódu"); // unchanged in <code>
    });

    test("handles nested tags", () => {
      expect(vlnaHtml("<div><p>Šel v lese daleko</p></div>")).toBe(
        "<div><p>Šel v\u00A0lese\u00A0daleko</p></div>"
      );
    });

    test("handles self-closing tags", () => {
      const result = vlnaHtml("Šel v lese<br/>Byl s přítelem");
      expect(result).toContain("v\u00A0lese");
      expect(result).toContain("s\u00A0přítelem");
    });

    test("prevents widows in text nodes", () => {
      expect(vlnaHtml("<p>Nemusíte dělat žádné kompromisy</p>")).toBe(
        "<p>Nemusíte dělat žádné\u00A0kompromisy</p>"
      );
    });

    test("prevents widow with Bez at line start", () => {
      expect(
        vlnaHtml("<p>Bez zbytečných látek navíc</p>")
      ).toBe("<p>Bez\u00A0zbytečných látek\u00A0navíc</p>");
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
  <p>Šel v neděli s kamarádem do parku</p>
  <script>var a = 1;</script>
</body>
</html>`;

      const result = vlnaHtml(input);
      expect(result).toContain("v\u00A0neděli");
      expect(result).toContain("s\u00A0kamarádem");
      expect(result).toContain("do\u00A0parku");
      // script and style untouched
      expect(result).toContain("<script>var a = 1;</script>");
      expect(result).toContain("body { v: 1; }");
    });
  });
});
