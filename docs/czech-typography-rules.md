# Czech Typography Rules for Web Rendering

Research for the `vlna` utility in Static Kit.

## ČSN 01 6910 — Line Breaking Rules

### Single-char words that MUST NOT end a line

```
Prepositions: k, s, v, z, o, u  (+ uppercase)
Conjunctions: a, i              (+ uppercase)
```

These get a non-breaking space (`\u00A0`) after them instead of a regular space.
The Czech name for this transform is **vlna** (wave/tilde), from Petr Olšák's TeX tool
that replaces spaces with `~` (TeX non-breaking space).

### Additional rules

| Rule | Example | Fix |
|------|---------|-----|
| Number + unit | `50 %`, `10 kg` | `50\u00A0%`, `10\u00A0kg` |
| Date components | `21. 6.` | `21.\u00A06.` |
| Title + name | `Ing. Poliaková` | `Ing.\u00A0Poliaková` |
| Abbreviations | `a. s.`, `s. r. o.` | `a.\u00A0s.`, `s.\u00A0r.\u00A0o.` |

### Widows (parchanti/vdovy)

A single short word alone on the last line of a paragraph. Fix: non-breaking space
before the last word.

## CSS text-wrap vs Server-Side nbsp

```
┌──────────────────────────────────────────────────────────┐
│  CSS text-wrap: pretty                                   │
│                                                          │
│  "Šel jsem v                     ← WRONG: "v" alone     │
│   neděli s kamarádem"                                    │
│                                                          │
│  Browser doesn't know Czech rules. It may or may not     │
│  break after "v" depending on line width.                │
├──────────────────────────────────────────────────────────┤
│  Server-side nbsp (\u00A0)                               │
│                                                          │
│  "Šel jsem                                               │
│   v\u00A0neděli s\u00A0kamarádem"  ← CORRECT always     │
│                                                          │
│  Non-breaking space GUARANTEES the preposition stays     │
│  with the following word at ANY viewport width.           │
└──────────────────────────────────────────────────────────┘
```

| Property | Effect | Limits |
|----------|--------|--------|
| `text-wrap: balance` | Equalizes line lengths | Max 6–9 lines. Headings only. |
| `text-wrap: pretty` | Avoids orphans | English-centric, no Czech awareness |

**Server-side `\u00A0` is the only reliable approach for Czech.**

## Existing Libraries

| # | Library | npm | Scope | Notes |
|---|---------|-----|-------|-------|
| 1 | **typopo** | `typopo` | Full Czech typo | MIT, active, Bražek-consulted |
| 2 | **typograf** | `typograf` | 27 langs | `afterShortWord` rule (1–2 char) |
| 3 | **widont** | `widont` | Widow only | Last-word nbsp |
| 4 | **vlna** (TeX) | — | TeX only | Original tool by Petr Olšák |

### typopo

Best Czech-specific option. Handles prepositions, quotes, dashes, ellipsis, units.

```ts
import { fixTypos } from "typopo"
const output = fixTypos(input, "cs")
```

### typograf

Multi-language. `common/nbsp/afterShortWord` inserts `\u00A0` after words ≤2 chars.

```ts
import Typograf from "typograf"
const tp = new Typograf({ locale: ["cs"] })
const result = tp.execute(text)
```

## Our Implementation: `vlna.ts`

Zero-dependency build-time transform in `packages/core/src/vlna.ts`.

### Core regex

```ts
// Match single-char Czech preposition/conjunction followed by a space
const CZECH_SINGLE_CHAR = /(\s|^)([ksvzouaiKSVZOUAI])\s/g

function vlna(text: string): string {
  let result = text.replace(CZECH_SINGLE_CHAR, "$1$2\u00A0")
  // Run twice for overlapping matches (e.g., "v s" → "v\u00A0s\u00A0")
  result = result.replace(CZECH_SINGLE_CHAR, "$1$2\u00A0")
  return result
}
```

### HTML-safe variant

Only transforms text between tags, not inside attributes or tag names:

```ts
function vlnaHtml(html: string): string {
  return html.replace(/>(.*?)</gs, (_, text) => ">" + vlna(text) + "<")
}
```

### Widow prevention

```ts
function preventWidow(text: string): string {
  return text.replace(/\s(\S+)\s*$/, "\u00A0$1")
}
```

## References

- [ČSN 01 6910 via UJC](https://prirucka.ujc.cas.cz/?id=880)
- [PeckaDesign Typography Cheatsheet](https://www.peckadesign.cz/blog/typograficky-tahak-nejen-pro-grafiky)
- [typopo (GitHub)](https://github.com/surfinzap/typopo)
- [typograf (GitHub)](https://github.com/typograf/typograf)
- [Vlna for Typst](https://typst.app/universe/package/vlna/)
- [Chrome text-wrap: pretty](https://developer.chrome.com/blog/css-text-wrap-pretty)
