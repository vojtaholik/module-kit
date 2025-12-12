#!/usr/bin/env bun
/**
 * Static Kit - Development Server
 *
 * Bun.serve() based dev server with:
 * - Page routes (rendered HTML with dev overlay)
 * - Static asset serving
 * - Dev API endpoints
 * - Hot reload via SSE
 */

import { watch } from "node:fs";
import { join } from "node:path";
import {
  decodeSchemaAddress,
  blockRegistry,
  renderPage,
  compileBlockTemplates,
  type PageConfig,
} from "@static-block-kit/core";
import { loadConfig, resolvePath } from "../config-loader.ts";
import { processCSS } from "../css-processor.ts";
import { compileSpritesheet } from "../sprite-compiler.ts";

const cwd = process.cwd();
const config = await loadConfig(cwd);

const blocksDir = resolvePath(config, "blocksDir", cwd);
const pagesDir = resolvePath(config, "pagesDir", cwd);
const publicDir = resolvePath(config, "publicDir", cwd);
const svgDir = join(publicDir, "svg");

// Compile block templates before importing blocks (gen/ may not exist yet)
console.log("🔨 Compiling block templates...");
await compileBlockTemplates({
  blocksDir,
  genDir: join(blocksDir, "gen"),
});

// Compile SVG spritesheet if svg/ directory exists
try {
  console.log("🎨 Compiling SVG spritesheet...");
  const { count } = await compileSpritesheet({ publicDir });
  if (count === 0) {
    console.log("   (no SVGs found in svg/)");
  }
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
    console.warn("   ⚠ Sprite compilation failed:", err);
  }
  // svg/ directory doesn't exist, skip silently
}

// Dynamically import site's blocks and pages
const blocksModule = await import(join(blocksDir, "index.ts"));
const pagesModule = await import(join(pagesDir, "index.ts"));

// Register all blocks at startup
if (typeof blocksModule.registerAllBlocks === "function") {
  blocksModule.registerAllBlocks();
}

const pages: PageConfig[] = pagesModule.pages;
const getPageByPath = pagesModule.getPageByPath as (
  path: string
) => PageConfig | undefined;

// Try to load cms-blocks if it exists
let cmsBlocks: Record<string, unknown> = {};
try {
  const cmsBlocksModule = await import(join(cwd, "src/cms-blocks.ts"));
  cmsBlocks = cmsBlocksModule.cmsBlocks ?? cmsBlocksModule.default ?? {};
} catch {
  // No cms-blocks file, that's fine
}

const PORT = config.devPort;
const publicPath = config.publicPath; // e.g. "/public"

// Server start time for HMR restart detection
const SERVER_START_TIME = Date.now();

// SSE clients for hot reload
const sseClients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const sseHeartbeats = new Map<
  ReadableStreamDefaultController<Uint8Array>,
  ReturnType<typeof setInterval>
>();

// Debounce file change notifications
let reloadTimeout: ReturnType<typeof setTimeout> | null = null;
let lastChangeType: "full" | "css" = "full";

function broadcastReload(type: "full" | "css" = "full") {
  // Debounce rapid changes
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
    // Escalate to full reload if mixed changes
    if (type === "full") lastChangeType = "full";
  } else {
    lastChangeType = type;
  }

  reloadTimeout = setTimeout(() => {
    reloadTimeout = null;
    const message = `data: ${JSON.stringify({
      type: lastChangeType,
      time: Date.now(),
    })}\n\n`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    for (const controller of sseClients) {
      try {
        controller.enqueue(data);
      } catch {
        // Clean up both client and heartbeat when controller fails
        const heartbeat = sseHeartbeats.get(controller);
        if (heartbeat) {
          clearInterval(heartbeat);
          sseHeartbeats.delete(controller);
        }
        sseClients.delete(controller);
      }
    }
    console.log(
      `🔄 ${lastChangeType === "css" ? "CSS" : "Full"} reload triggered`
    );
  }, 50);
}

// Watch for file changes
const watchDirs = [blocksDir, pagesDir, publicDir, svgDir];

async function handleFileChange(filename: string, dir: string) {
  // Ignore generated files
  if (filename.includes("/gen/") || filename.endsWith(".render.ts")) return;

  // SVG in svg/ directory changed - recompile spritesheet
  if (filename.endsWith(".svg") && dir === svgDir) {
    console.log(`🎨 SVG changed: ${filename}`);
    try {
      await compileSpritesheet({ publicDir });
      broadcastReload("css"); // No full reload needed for SVG sprites
    } catch (err) {
      console.warn("   ⚠ Sprite compilation failed:", err);
    }
    return;
  }

  if (filename.endsWith(".css")) {
    broadcastReload("css");
    return;
  }

  // HTML template changed - recompile templates before reload
  if (filename.endsWith(".block.html")) {
    console.log(`📝 Template changed: ${filename}`);
    await compileBlockTemplates({
      blocksDir,
      genDir: join(blocksDir, "gen"),
    });
    // bun --watch will restart the server after recompile
    // which triggers browser reload via SSE reconnect
    return;
  }

  // For other source files, just broadcast (bun --watch handles the restart)
  if (filename.endsWith(".ts") || filename.endsWith(".js")) {
    broadcastReload("full");
  }
}

for (const dir of watchDirs) {
  try {
    watch(dir, { recursive: true }, (event, filename) => {
      if (!filename) return;
      handleFileChange(filename, dir);
    });
  } catch {
    // Directory might not exist yet
  }
}

console.log(`🚀 Starting dev server on http://localhost:${PORT}`);
console.log(`👀 Watching for changes...`);

Bun.serve({
  port: PORT,
  idleTimeout: 120, // Don't kill SSE connections every 10s
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // Dev overlay (special internal asset)
      if (path === "/__dev-overlay.js") {
        const js = await Bun.file(join(publicDir, "js/dev-overlay.js")).text();
        return new Response(js, {
          headers: { "Content-Type": "application/javascript" },
        });
      }

      // Hot reload SSE endpoint
      if (path === "/__hmr") {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            sseClients.add(controller);
            const encoder = new TextEncoder();
            // Send initial connected message with server start time
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "connected",
                  time: SERVER_START_TIME,
                })}\n\n`
              )
            );
            // Heartbeat every 30s to keep connection alive
            const heartbeat = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(": heartbeat\n\n"));
              } catch {
                clearInterval(heartbeat);
                sseHeartbeats.delete(controller);
              }
            }, 30000);
            sseHeartbeats.set(controller, heartbeat);
          },
          cancel(controller) {
            const heartbeat = sseHeartbeats.get(controller);
            if (heartbeat) {
              clearInterval(heartbeat);
              sseHeartbeats.delete(controller);
            }
            sseClients.delete(controller);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // Dev API endpoints
      if (path === "/__pages") {
        return Response.json(
          pages.map((p) => ({
            id: p.id,
            path: p.path,
            title: p.title,
          }))
        );
      }

      if (path === "/__site") {
        return Response.json({
          pages: pages.map((p) => ({
            id: p.id,
            path: p.path,
            title: p.title,
          })),
          blocks: blockRegistry.types(),
          schemas: cmsBlocks,
        });
      }

      if (path === "/__inspect") {
        const address = url.searchParams.get("address");
        if (!address) {
          return Response.json(
            { error: "Missing address parameter" },
            { status: 400 }
          );
        }

        try {
          const decoded = decodeSchemaAddress(address);
          const page = pages.find((p) => p.id === decoded.pageId);
          const region = page?.regions[decoded.region];
          const block = region?.blocks.find((b) => b.id === decoded.blockId);
          const blockDef = block ? blockRegistry.get(block.type) : null;

          // Convert file:// URL to absolute path if needed
          const sourceFile = blockDef?.sourceFile?.startsWith("file://")
            ? blockDef.sourceFile.replace("file://", "")
            : blockDef?.sourceFile;

          return Response.json({
            address: decoded,
            page: page
              ? {
                  id: page.id,
                  path: page.path,
                  title: page.title,
                  sourceFile: `${pagesDir}/${decoded.pageId}.page.ts`,
                }
              : null,
            block: block
              ? {
                  id: block.id,
                  type: block.type,
                  props: block.props,
                  sourceFile,
                  templateFile: `${blocksDir}/${block.type}.block.html`,
                }
              : null,
            schema: block ? cmsBlocks[block.type] : null,
          });
        } catch (err) {
          return Response.json(
            { error: "Invalid address", details: String(err) },
            { status: 400 }
          );
        }
      }

      // Public static files - serve publicDir at publicPath (1:1 mapping)
      if (path.startsWith(`${publicPath}/`)) {
        const relativePath = path.slice(publicPath.length + 1);
        const filePath = join(publicDir, relativePath);
        const file = Bun.file(filePath);
        if (await file.exists()) {
          // Process CSS through lightningcss (no minification in dev)
          if (filePath.endsWith(".css")) {
            const cssBytes = new Uint8Array(await file.arrayBuffer());
            const result = processCSS({
              filename: filePath,
              code: cssBytes,
              minify: false,
            });
            return new Response(new TextDecoder().decode(result.code), {
              headers: {
                "Content-Type": "text/css",
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            });
          }
          return new Response(file, {
            headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
          });
        }
      }

      // Page routes
      const pagePath = path === "/" ? "/" : path.replace(/\/$/, "");
      const page = getPageByPath(pagePath);

      if (page) {
        const html = await renderPage(page, {
          templateDir: pagesDir,
          isDev: true,
          assetBase: "/",
        });

        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      }

      // 404
      return new Response("Not Found", { status: 404 });
    } catch (err) {
      console.error("Error handling request:", err);
      return new Response(
        `<html>
          <head><title>Error</title></head>
          <body style="font-family: system-ui; padding: 2rem;">
            <h1>Server Error</h1>
            <pre style="background: #f5f5f5; padding: 1rem; overflow: auto;">${String(
              err
            )}</pre>
          </body>
        </html>`,
        {
          status: 500,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  },
});

console.log(`
  Dev server running at http://localhost:${PORT}

  Pages: ${pagesDir}
  Public: ${publicDir} → ${publicPath}/

  Dev API:
    /__pages    → List all pages
    /__site     → Site config (pages, blocks, schemas)
    /__inspect  → Decode schema address
`);
