# Test Coverage Analysis - Static Block Kit

**Date:** 2026-01-14
**Status:** ⚠️ CRITICAL - Zero test coverage
**Total TypeScript Files:** 42
**Files with Tests:** 0 (0%)

## Executive Summary

The Static Block Kit codebase currently has **no test coverage whatsoever**. This represents a significant risk for a project with complex features including:

- Template compilation with custom DSL
- Block-based architecture with Zod validation
- HTML parsing and rendering
- Build pipeline and CLI commands
- Schema address encoding/decoding

This analysis identifies critical areas requiring test coverage and proposes a prioritized testing strategy.

---

## Current State

### Testing Infrastructure
- ❌ No test framework configured (no Jest, Vitest, or Bun test setup)
- ❌ No test files exist anywhere in the codebase
- ❌ No test scripts in package.json
- ❌ No testing dependencies installed

### Coverage by Package

| Package | Files | Tested | Coverage |
|---------|-------|--------|----------|
| @static-block-kit/core | 8 | 0 | 0% |
| @static-block-kit/cli | 7 | 0 | 0% |
| Blocks (src/blocks) | 18 | 0 | 0% |
| **TOTAL** | **33+** | **0** | **0%** |

---

## Priority 1: Critical Core Logic (HIGH RISK)

These components have complex logic with high potential for bugs. They should be tested first.

### 1. Template Compiler (`packages/core/src/template-compiler.ts`)
**Lines:** 585 | **Complexity:** Very High | **Risk:** CRITICAL

#### Why Critical:
- Parses custom DSL and generates executable TypeScript code
- Multiple directive types with different parsing rules
- String escaping and code generation
- Whitespace normalization
- 10+ distinct code paths

#### Test Coverage Needed:

**A. Text Interpolation**
```typescript
// Test cases needed:
- {{ props.title }} - simple interpolation
- {{{ props.html }}} - raw HTML output
- {{ props.nested.value }} - nested prop access
- Mixed text with {{ props.value }} interpolation
- Edge case: {{ props.undefined }} - undefined values
- Edge case: {{ props.null }} - null values
- Whitespace normalization in text nodes
```

**B. Directives**
```typescript
// v-if directive:
- <div v-if="props.show">content</div>
- v-if on <template> elements
- v-if with complex expressions
- Nested v-if conditions

// v-for directive:
- v-for="item in props.items"
- v-for="item, i in props.items" (with index)
- v-for="(item, i) in props.items" (parenthesized)
- v-for on <template> elements
- Nested v-for loops
- v-for with v-if combined

// Dynamic attributes:
- :href="props.url"
- :class="props.className"
- :data-id="props.id"
- :key="props.key" (should be stripped)
- Attribute with {{ }} interpolation
- Multiple dynamic attributes
- Conditional attribute rendering (truthy/falsy values)
```

**C. render-slot Element**
```typescript
// Test cases:
- <render-slot :block="type" :props="data">
- With :index expression for array paths
- With :prop-path explicit path
- With fallback content
- Without :block (should error)
- Without :props (should error)
- Invalid block type handling
```

**D. Code Generation**
```typescript
// Verify generated code:
- Proper escaping in string literals
- Correct indentation
- Valid TypeScript syntax
- Import statements included
- Function signature correct
```

**E. Edge Cases**
```typescript
- Empty templates
- Whitespace-only templates
- Deeply nested elements (10+ levels)
- Very long attribute values
- Self-closing tags (img, br, hr, etc.)
- Comments (should be ignored)
- Special characters in text (&, <, >, ", ')
- Invalid v-for syntax (should throw)
- Malformed directives
```

**Suggested Test Structure:**
```typescript
// packages/core/src/template-compiler.test.ts
describe('Template Compiler', () => {
  describe('compileTemplate', () => {
    describe('text interpolation', () => { ... })
    describe('raw HTML output', () => { ... })
    describe('v-if directive', () => { ... })
    describe('v-for directive', () => { ... })
    describe('dynamic attributes', () => { ... })
    describe('render-slot', () => { ... })
    describe('code generation', () => { ... })
    describe('edge cases', () => { ... })
  })

  describe('compileBlockTemplates', () => {
    // Integration tests with file I/O
  })
})
```

---

### 2. Block Registry (`packages/core/src/block-registry.ts`)
**Lines:** 197 | **Complexity:** Medium | **Risk:** HIGH

#### Why Important:
- Central registry for all blocks
- Type-safe validation with Zod
- Slot rendering with fallback logic
- Error handling and reporting

#### Test Coverage Needed:

**A. BlockRegistry Class**
```typescript
// Test cases:
- register() adds block to registry
- register() throws on duplicate type
- get() returns correct block
- get() returns undefined for unknown type
- getOrThrow() returns block
- getOrThrow() throws for unknown type
- has() returns true/false correctly
- all() returns all blocks
- types() returns all type strings
- clear() empties registry
```

**B. Escape Functions**
```typescript
// escapeHtml():
- Escapes &, <, >, ", '
- Handles null/undefined (returns "")
- Handles numbers, booleans
- Handles objects (String() conversion)

// escapeAttr():
- Same as escapeHtml (uses it internally)
```

**C. renderSlot Function**
```typescript
// Success cases:
- Renders block when type is valid
- Passes props, ctx, addr correctly
- Returns rendered HTML

// Fallback cases:
- Returns fallback when blockType is undefined
- Returns fallback when block not found
- Returns fallback when props validation fails
- Logs warning for unknown block type
- Logs warning for validation failure

// Dev mode:
- Injects error markers in dev mode
- No error markers in production mode
- Error markers contain correct data
```

**D. Integration Tests**
```typescript
// Test with real blocks:
- Register multiple blocks
- Render slots with various block types
- Validate Zod schemas are enforced
- Test layout props merging
```

---

### 3. HTML Renderer (`packages/core/src/html-renderer.ts`)
**Lines:** 286 | **Complexity:** Medium | **Risk:** HIGH

#### Why Important:
- Core page rendering logic
- DOM tree walking and manipulation
- Region injection system
- Dev overlay injection

#### Test Coverage Needed:

**A. renderPage Function**
```typescript
// Basic rendering:
- Renders page with title
- Renders page with blocks in regions
- Sets data-page-id on <html>
- Reads template file correctly
- Returns valid HTML string

// Region handling:
- Single region with one block
- Single region with multiple blocks
- Multiple regions
- Region with no blocks (empty)
- Unknown region in template (no config)

// Dev mode:
- Injects dev overlay script in dev mode
- No dev overlay in production mode
- Dev overlay script before </body>

// Asset base:
- Uses custom assetBase
- Defaults to "/"

// Template path:
- Resolves template from templateDir
- Handles custom readFile function
```

**B. renderBlock Function**
```typescript
// Success cases:
- Renders standalone block
- Validates props with schema
- Passes correct context
- Returns HTML string

// Error cases:
- Throws on unknown block type
- Throws on invalid props
```

**C. Internal Functions**
```typescript
// renderRegionBlocks():
- Renders all blocks in correct order
- Skips unknown block types (with warning)
- Skips blocks with invalid props (with error)
- Builds layout props correctly
- Builds schema address correctly

// walkTree():
- Visits all nodes
- Visits in correct order (depth-first)
- Handles nodes without children

// getAttr() / setAttr():
- Gets existing attributes
- Returns undefined for missing attributes
- Sets new attributes
- Updates existing attributes
```

**D. Integration Tests**
```typescript
// Full page rendering:
- Real template + real blocks
- Multiple regions and blocks
- Nested block delegation
- Layout prop inheritance
```

---

### 4. Schema Address (`packages/core/src/schema-address.ts`)
**Lines:** 64 | **Complexity:** Low | **Risk:** MEDIUM

#### Why Important:
- Used throughout the system for CMS editing
- String encoding/decoding must be perfect
- Used in data attributes for inspector

#### Test Coverage Needed:

```typescript
// encodeSchemaAddress():
- Basic: pageId::region::blockId
- With propPath: pageId::region::blockId::propPath
- Complex propPath: pageId::region::blockId::items[0].title

// decodeSchemaAddress():
- Decodes basic address
- Decodes address with propPath
- Throws on invalid format (< 3 parts)
- Validates with Zod schema

// withPropPath():
- Creates new address with propPath
- Preserves existing properties
- Overwrites existing propPath

// isSameBlock():
- Returns true for same block (ignoring propPath)
- Returns false for different pageId
- Returns false for different region
- Returns false for different blockId
- Ignores propPath differences

// Edge cases:
- Empty strings in parts
- Special characters in values (::, /, etc.)
- Very long propPaths
- Unicode characters
```

---

## Priority 2: CLI Commands (MEDIUM RISK)

These have external dependencies (file system, HTTP) but are critical for user experience.

### 5. Build Command (`packages/cli/src/commands/build.ts`)
**Why Important:** Production build pipeline
**Test Strategy:** Integration tests with temp directories

**Test Cases:**
- Creates dist directory
- Copies public assets
- Generates pages successfully
- Handles missing directories gracefully
- Cleans old builds
- Reports errors properly

### 6. Dev Command (`packages/cli/src/commands/dev.ts`)
**Why Important:** Development server with hot reload
**Test Strategy:** Mock HTTP server, test endpoints

**Test Cases:**
- Starts server on specified port
- Serves static files
- Serves generated pages
- SSE hot reload works
- API endpoints respond correctly:
  - `/__pages` returns page list
  - `/__site` returns site config
  - `/__inspect` returns block details
  - `/__hmr` sends SSE events
- Handles file watch events
- Graceful shutdown

### 7. Gen Command (`packages/cli/src/commands/gen.ts`)
**Why Important:** Template compilation
**Test Strategy:** Integration tests with temp directories

**Test Cases:**
- Finds all .block.html files
- Compiles each template
- Writes .render.ts files
- Generates index.ts with exports
- Reports compilation errors
- Handles no templates found
- Overwrites existing generated files

### 8. Sprite Command (`packages/cli/src/commands/sprite.ts`)
**Why Important:** SVG sprite generation
**Test Strategy:** Integration tests with test SVG files

**Test Cases:**
- Finds all SVG files
- Combines into single sprite
- Generates valid SVG output
- Handles missing source directory
- Handles empty directory
- Reports errors for invalid SVG

---

## Priority 3: Utilities and Infrastructure (LOW RISK)

### 9. Config Loader (`packages/cli/src/config-loader.ts`)
**Test Cases:**
- Loads config from file
- Validates config schema
- Handles missing config file
- Handles invalid config
- Merges defaults

### 10. CSS Processor (`packages/cli/src/css-processor.ts`)
**Test Cases:**
- Processes CSS with lightningcss
- Minifies in production mode
- Preserves source maps in dev mode
- Handles CSS errors

### 11. Sprite Compiler (`packages/cli/src/sprite-compiler.ts`)
**Test Cases:**
- Compiles SVG sprites
- Generates unique IDs
- Handles nested SVG elements
- Optimizes output

### 12. Layout Schema (`packages/core/src/layout.ts`)
**Test Cases:**
- Validates tone enum
- Validates density enum
- Validates contentAlign enum
- Validates contentWidth enum
- Applies defaults
- Rejects invalid values

### 13. Config Schema (`packages/core/src/config.ts`)
**Test Cases:**
- Validates page config
- Validates site config
- Handles partial configs
- Rejects invalid structures

---

## Priority 4: Block Implementations (LOW RISK)

All 9 block definitions in `src/blocks/*.block.ts`:
- hero
- feature-grid
- latest-posts
- teaser
- section-header
- business-card
- grid
- carousel
- bento-showcase

**Test Strategy:** Snapshot testing or visual regression

**Test Cases for Each Block:**
- Zod schema validates valid props
- Zod schema rejects invalid props
- Render function returns valid HTML
- Layout props are applied
- Schema addresses are encoded
- Dev inspector attributes present

---

## Recommended Testing Setup

### 1. Choose Test Framework: **Bun Test Runner**

**Why Bun's built-in test runner:**
- ✅ Native TypeScript support (no compilation needed)
- ✅ Fast execution (uses JavaScriptCore)
- ✅ Already using Bun for the project
- ✅ Zero configuration required
- ✅ Compatible with Jest-like API
- ✅ Built-in mocking and assertions

**Alternative:** Vitest (if needed for better IDE integration)

### 2. Initial Setup Steps

```bash
# 1. Add test script to package.json
bun run --add-script test "bun test"

# 2. Create test directory structure
mkdir -p packages/core/test
mkdir -p packages/cli/test

# 3. Install testing utilities (if needed)
bun add -d @types/node  # For better type definitions
```

### 3. Test File Structure

```
packages/
├── core/
│   ├── src/
│   │   ├── template-compiler.ts
│   │   ├── block-registry.ts
│   │   └── ...
│   └── test/
│       ├── template-compiler.test.ts
│       ├── block-registry.test.ts
│       ├── html-renderer.test.ts
│       ├── schema-address.test.ts
│       └── fixtures/
│           ├── templates/
│           └── blocks/
└── cli/
    ├── src/
    └── test/
        ├── commands/
        │   ├── build.test.ts
        │   ├── dev.test.ts
        │   └── gen.test.ts
        └── fixtures/
```

### 4. Example Test Template

```typescript
// packages/core/test/template-compiler.test.ts
import { describe, test, expect } from "bun:test";
import { compileTemplate } from "../src/template-compiler.ts";

describe("Template Compiler", () => {
  describe("text interpolation", () => {
    test("compiles simple interpolation", () => {
      const template = '<div>{{ props.title }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('escapeHtml(props.title)');
      expect(result).toContain('return out;');
    });

    test("compiles raw HTML output", () => {
      const template = '<div>{{{ props.html }}}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('out += props.html');
      expect(result).not.toContain('escapeHtml');
    });

    test("handles undefined values", () => {
      const template = '<div>{{ props.missing }}</div>';
      const code = compileTemplate(template, "test-block");

      // Compile and execute to test runtime behavior
      const fn = new Function(
        'props', 'ctx', 'addr',
        code.replace('export function renderTestBlock(input: RenderBlockInput): string {', '')
            .replace('return out;', 'return out;')
      );

      const result = fn({ missing: undefined }, {}, {});
      expect(result).toContain(''); // Should render empty string
    });
  });

  describe("v-if directive", () => {
    test("compiles v-if with truthy condition", () => {
      const template = '<div v-if="props.show">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('if (props.show)');
    });

    test("v-if on template element", () => {
      const template = '<template v-if="props.show"><div>a</div><div>b</div></template>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('if (props.show)');
      expect(result).not.toContain('<template');
    });
  });

  describe("v-for directive", () => {
    test("compiles v-for with item only", () => {
      const template = '<div v-for="item in props.items">{{ item.name }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('for (const [_i, item] of (props.items).entries())');
    });

    test("compiles v-for with item and index", () => {
      const template = '<div v-for="item, i in props.items">{{ i }}</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('for (const [i, item] of (props.items).entries())');
    });

    test("throws on invalid v-for syntax", () => {
      const template = '<div v-for="invalid syntax">content</div>';

      expect(() => {
        compileTemplate(template, "test-block");
      }).toThrow("Invalid v-for expression");
    });
  });

  describe("dynamic attributes", () => {
    test("compiles :attr binding", () => {
      const template = '<a :href="props.url">link</a>';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('escapeAttr(props.url)');
    });

    test("strips :key framework directive", () => {
      const template = '<div :key="props.id">content</div>';
      const result = compileTemplate(template, "test-block");

      expect(result).not.toContain('key=');
    });
  });

  describe("edge cases", () => {
    test("handles empty template", () => {
      const result = compileTemplate('', "test-block");
      expect(result).toContain('function renderTestBlock');
    });

    test("handles self-closing tags", () => {
      const template = '<img :src="props.image" />';
      const result = compileTemplate(template, "test-block");

      expect(result).toContain('<img');
      expect(result).not.toContain('</img>');
    });

    test("escapes special characters", () => {
      const template = '<div>Price: $5 & up < 10</div>';
      const result = compileTemplate(template, "test-block");

      // Should preserve special chars in template literal
      expect(result).toContain('Price: $5 & up < 10');
    });
  });
});
```

---

## Coverage Goals

### Phase 1: Foundation (Weeks 1-2)
**Target:** 60% coverage on core logic
- ✅ Template Compiler: 80%+
- ✅ Block Registry: 90%+
- ✅ Schema Address: 100%
- ✅ HTML Renderer: 70%+

### Phase 2: CLI (Weeks 3-4)
**Target:** 50% coverage on CLI commands
- ✅ Gen Command: 80%+
- ✅ Build Command: 60%+
- ✅ Dev Command: 40%+ (integration tests)
- ✅ Sprite Command: 70%+

### Phase 3: Full Coverage (Week 5+)
**Target:** 80% overall coverage
- ✅ All utilities: 90%+
- ✅ All block implementations: 70%+
- ✅ Integration tests for full workflows
- ✅ CI/CD integration

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test
      - run: bun run typecheck

  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test --coverage
      - uses: codecov/codecov-action@v4
```

---

## Key Benefits of Adding Tests

1. **Confidence in Refactoring**
   - Safe to optimize template compiler
   - Can improve rendering performance
   - Easier to add new directives

2. **Bug Prevention**
   - Catch edge cases in code generation
   - Prevent XSS vulnerabilities in escaping
   - Validate Zod schemas work correctly

3. **Documentation**
   - Tests serve as usage examples
   - Show expected behavior clearly
   - Help onboard new contributors

4. **Faster Development**
   - Quick feedback on changes
   - No manual testing needed
   - Regression prevention

5. **Production Confidence**
   - Safe to deploy changes
   - Validated build pipeline
   - Proven error handling

---

## Immediate Action Items

1. **This Week:**
   - [ ] Set up Bun test runner
   - [ ] Add test script to package.json
   - [ ] Write first 10 tests for template compiler
   - [ ] Write first 10 tests for block registry

2. **Next Week:**
   - [ ] Complete template compiler tests (50+ tests)
   - [ ] Complete block registry tests (30+ tests)
   - [ ] Add schema address tests (15+ tests)
   - [ ] Start HTML renderer tests

3. **Following Weeks:**
   - [ ] CLI command tests
   - [ ] Integration tests
   - [ ] Set up CI/CD
   - [ ] Aim for 80% coverage

---

## Conclusion

The Static Block Kit is a sophisticated project that **urgently needs test coverage**. The template compiler alone has enough complexity to justify comprehensive testing, and the lack of any tests represents a significant risk to stability and maintainability.

**Estimated effort:** 2-3 weeks for comprehensive coverage
**Priority:** HIGH - Should be addressed before major feature additions
**Recommendation:** Start with Priority 1 items (core logic) immediately

The good news: The code is well-structured and modular, making it relatively straightforward to test. The use of Bun means fast test execution with zero configuration overhead.
