/**
 * Static Kit - Dev Overlay
 *
 * - Alt+click on any block to inspect its schema address
 * - Hot reload via SSE connection
 */

(function () {
  "use strict";

  // ==========================================================================
  // Hot Reload Client
  // ==========================================================================

  var reconnectAttempts = 0;
  var maxReconnectAttempts = 20;
  var wasConnected = false;
  var lastServerTime = null;

  function connectHMR() {
    var source = new EventSource("/__hmr");

    source.onopen = function () {
      console.log("[HMR] Connected");

      // If we were previously connected and reconnected, reload
      // This handles the case where the server restarted (--watch)
      if (wasConnected) {
        console.log("[HMR] Server restarted, reloading...");
        window.location.reload();
        return;
      }

      wasConnected = true;
      reconnectAttempts = 0;
    };

    source.onmessage = function (event) {
      try {
        var data = JSON.parse(event.data);

        if (data.type === "connected") {
          // Store server start time to detect restarts
          if (lastServerTime && data.time && lastServerTime !== data.time) {
            console.log("[HMR] Server restarted, reloading...");
            window.location.reload();
          }
          lastServerTime = data.time;
          return;
        }

        if (data.type === "css") {
          // Hot reload CSS and SVG sprites without full page refresh
          reloadCSS();
          reloadSVGSprites();
        } else if (data.type === "full") {
          // Full page reload
          console.log("[HMR] Reloading...");
          window.location.reload();
        }
      } catch (e) {
        console.error("[HMR] Failed to parse message:", e);
      }
    };

    source.onerror = function () {
      source.close();
      reconnectAttempts++;

      if (reconnectAttempts <= maxReconnectAttempts) {
        // Quick reconnects at first, then slower
        var delay =
          reconnectAttempts < 3 ? 100 : Math.min(500 * reconnectAttempts, 3000);
        console.log("[HMR] Disconnected, reconnecting in " + delay + "ms...");
        setTimeout(connectHMR, delay);
      } else {
        console.log(
          "[HMR] Max reconnection attempts reached. Refresh manually."
        );
      }
    };
  }

  function reloadCSS() {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    var reloaded = 0;

    links.forEach(function (link) {
      var href = link.href;
      if (!href) return;

      // Add cache-busting query param
      var url = new URL(href);
      url.searchParams.set("_hmr", Date.now());

      // Create new link element
      var newLink = document.createElement("link");
      newLink.rel = "stylesheet";
      newLink.href = url.toString();

      newLink.onload = function () {
        link.remove();
        reloaded++;
        if (reloaded === links.length) {
          console.log("[HMR] CSS reloaded");
        }
      };

      newLink.onerror = function () {
        console.error("[HMR] Failed to reload CSS:", href);
      };

      link.parentNode.insertBefore(newLink, link.nextSibling);
    });
  }

  function reloadSVGSprites() {
    // Find all <use> elements referencing sprite files
    var uses = document.querySelectorAll("use[href*='sprite']");
    if (uses.length === 0) return;

    var timestamp = Date.now();
    uses.forEach(function (use) {
      var href = use.getAttribute("href");
      if (!href) return;

      // Parse href and add cache-busting param
      var hashIndex = href.indexOf("#");
      var path = hashIndex > -1 ? href.slice(0, hashIndex) : href;
      var fragment = hashIndex > -1 ? href.slice(hashIndex) : "";

      // Strip existing _hmr param if present
      var cleanPath = path.replace(/[?&]_hmr=\d+/, "");
      var separator = cleanPath.indexOf("?") > -1 ? "&" : "?";
      var newHref = cleanPath + separator + "_hmr=" + timestamp + fragment;

      use.setAttribute("href", newHref);
    });

    console.log("[HMR] SVG sprites reloaded (" + uses.length + " refs)");
  }

  // Start HMR connection
  connectHMR();

  // ==========================================================================
  // Block Inspector
  // ==========================================================================

  var overlay = null;

  function createOverlay() {
    var el = document.createElement("div");
    el.id = "static-kit-dev-overlay";
    el.innerHTML = [
      "<style>",
      "#static-kit-dev-overlay {",
      "  position: fixed;",
      "  z-index: 99999;",
      "  background: #1a1a2e;",
      "  color: #fff;",
      "  padding: 16px;",
      "  border-radius: 8px;",
      "  font-family: ui-monospace, monospace;",
      "  font-size: 13px;",
      "  line-height: 1.5;",
      "  max-width: 480px;",
      "  box-shadow: 0 10px 40px rgba(0,0,0,0.3);",
      "  display: none;",
      "}",
      "#static-kit-dev-overlay.visible { display: block; }",
      "#static-kit-dev-overlay h4 {",
      "  margin: 0 0 12px;",
      "  font-size: 14px;",
      "  font-weight: 600;",
      "  color: #6366f1;",
      "}",
      "#static-kit-dev-overlay dl {",
      "  margin: 0;",
      "  display: grid;",
      "  grid-template-columns: auto 1fr;",
      "  gap: 4px 12px;",
      "}",
      "#static-kit-dev-overlay dt {",
      "  color: #9ca3af;",
      "}",
      "#static-kit-dev-overlay dd {",
      "  margin: 0;",
      "  word-break: break-all;",
      "}",
      "#static-kit-dev-overlay a {",
      "  color: #818cf8;",
      "  text-decoration: none;",
      "  display: inline-flex;",
      "  align-items: center;",
      "  gap: 4px;",
      "}",
      "#static-kit-dev-overlay a:hover {",
      "  color: #a5b4fc;",
      "  text-decoration: underline;",
      "}",
      "#static-kit-dev-overlay .file-links {",
      "  margin-top: 12px;",
      "  padding-top: 12px;",
      "  border-top: 1px solid #374151;",
      "  display: flex;",
      "  flex-direction: column;",
      "  gap: 6px;",
      "}",
      "#static-kit-dev-overlay .close-btn {",
      "  position: absolute;",
      "  top: 8px;",
      "  right: 8px;",
      "  background: none;",
      "  border: none;",
      "  color: #9ca3af;",
      "  cursor: pointer;",
      "  padding: 4px;",
      "  font-size: 16px;",
      "}",
      "#static-kit-dev-overlay .close-btn:hover { color: #fff; }",
      "#static-kit-dev-overlay .loading {",
      "  color: #9ca3af;",
      "  font-style: italic;",
      "}",
      "[data-schema-address] { position: relative; }",
      "[data-schema-address].inspecting {",
      "  outline: 2px dashed #6366f1;",
      "  outline-offset: 2px;",
      "}",
      "</style>",
      '<button class="close-btn" aria-label="Close">&times;</button>',
      "<h4>Block Inspector</h4>",
      "<dl></dl>",
      '<div class="file-links"></div>',
    ].join("\n");
    document.body.appendChild(el);

    el.querySelector(".close-btn").addEventListener("click", hideOverlay);

    return el;
  }

  function makeCursorLink(filePath, label) {
    if (!filePath) return '<span style="color:#6b7280">-</span>';
    // cursor://file/absolute/path
    var href = "cursor://file" + filePath;
    var shortPath = filePath.split("/").slice(-2).join("/");
    return (
      '<a href="' +
      href +
      '" title="' +
      filePath +
      '">' +
      (label || shortPath) +
      " ↗</a>"
    );
  }

  async function showOverlay(blockEl, x, y) {
    if (!overlay) {
      overlay = createOverlay();
    }

    var address = blockEl.getAttribute("data-schema-address");
    var blockId = blockEl.getAttribute("data-block-id");
    var parts = address ? address.split("::") : [];

    // Remove previous inspecting class
    var prev = document.querySelector(".inspecting");
    if (prev) prev.classList.remove("inspecting");
    blockEl.classList.add("inspecting");

    // Position overlay
    overlay.style.top = Math.min(y + 10, window.innerHeight - 200) + "px";
    overlay.style.left = Math.min(x + 10, window.innerWidth - 500) + "px";
    overlay.classList.add("visible");

    var dl = overlay.querySelector("dl");
    var fileLinks = overlay.querySelector(".file-links");

    // Show loading state
    dl.innerHTML = [
      "<dt>Page</dt><dd>" + (parts[0] || "-") + "</dd>",
      "<dt>Region</dt><dd>" + (parts[1] || "-") + "</dd>",
      "<dt>Block ID</dt><dd>" + (blockId || "-") + "</dd>",
    ].join("");
    fileLinks.innerHTML = '<span class="loading">Loading...</span>';

    // Fetch full info from server
    try {
      var res = await fetch(
        "/__inspect?address=" + encodeURIComponent(address)
      );
      var data = await res.json();

      if (data.error) {
        fileLinks.innerHTML =
          '<span style="color:#ef4444">' + data.error + "</span>";
        return;
      }

      dl.innerHTML = [
        "<dt>Block Type</dt><dd><strong>" +
          (data.block?.type || "-") +
          "</strong></dd>",
        "<dt>Page</dt><dd>" + (data.page?.id || "-") + "</dd>",
        "<dt>Region</dt><dd>" + (data.address?.region || "-") + "</dd>",
        "<dt>Block ID</dt><dd>" + (data.block?.id || "-") + "</dd>",
      ].join("");

      fileLinks.innerHTML =
        [
          data.block?.sourceFile
            ? makeCursorLink(data.block.sourceFile, "📦 Block Source")
            : "",
          data.block?.templateFile
            ? makeCursorLink(data.block.templateFile, "📄 Template")
            : "",
          data.page?.sourceFile
            ? makeCursorLink(data.page.sourceFile, "📄 Page Config")
            : "",
        ]
          .filter(Boolean)
          .join("") ||
        '<span style="color:#6b7280">No source files found</span>';
    } catch (err) {
      fileLinks.innerHTML = '<span style="color:#ef4444">Failed to load</span>';
      console.error("[Inspector] Failed to fetch:", err);
    }
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.remove("visible");
    }
    var prev = document.querySelector(".inspecting");
    if (prev) prev.classList.remove("inspecting");
  }

  // Alt+click handler
  document.addEventListener("click", function (e) {
    if (!e.altKey) {
      hideOverlay();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Find closest block element
    var blockEl = e.target.closest("[data-schema-address]");
    if (blockEl) {
      showOverlay(blockEl, e.clientX, e.clientY);
    }
  });

  // ESC to close
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      hideOverlay();
    }
  });

  console.log("Static Kit Dev Overlay loaded. Alt+click on blocks to inspect.");

  // ==========================================================================
  // Slot Error Toast
  // ==========================================================================

  var errorToast = null;
  var slotErrors = [];

  function createErrorToast() {
    var el = document.createElement("div");
    el.id = "static-kit-slot-errors";
    el.innerHTML = [
      "<style>",
      "#static-kit-slot-errors {",
      "  position: fixed;",
      "  bottom: 16px;",
      "  right: 16px;",
      "  z-index: 99998;",
      "  background: #1a1a2e;",
      "  border: 1px solid #ef4444;",
      "  border-radius: 8px;",
      "  font-family: ui-monospace, monospace;",
      "  font-size: 13px;",
      "  line-height: 1.5;",
      "  max-width: 420px;",
      "  max-height: 300px;",
      "  overflow: auto;",
      "  box-shadow: 0 10px 40px rgba(239,68,68,0.3);",
      "}",
      "#static-kit-slot-errors .header {",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: space-between;",
      "  padding: 10px 14px;",
      "  background: rgba(239,68,68,0.15);",
      "  border-bottom: 1px solid #374151;",
      "  position: sticky;",
      "  top: 0;",
      "}",
      "#static-kit-slot-errors .header-title {",
      "  color: #ef4444;",
      "  font-weight: 600;",
      "  display: flex;",
      "  align-items: center;",
      "  gap: 8px;",
      "}",
      "#static-kit-slot-errors .header-count {",
      "  background: #ef4444;",
      "  color: #fff;",
      "  padding: 2px 8px;",
      "  border-radius: 10px;",
      "  font-size: 11px;",
      "}",
      "#static-kit-slot-errors .close-btn {",
      "  background: none;",
      "  border: none;",
      "  color: #9ca3af;",
      "  cursor: pointer;",
      "  padding: 4px;",
      "  font-size: 16px;",
      "}",
      "#static-kit-slot-errors .close-btn:hover { color: #fff; }",
      "#static-kit-slot-errors .error-list {",
      "  padding: 0;",
      "  margin: 0;",
      "  list-style: none;",
      "}",
      "#static-kit-slot-errors .error-item {",
      "  padding: 10px 14px;",
      "  border-bottom: 1px solid #374151;",
      "  color: #e5e7eb;",
      "}",
      "#static-kit-slot-errors .error-item:last-child {",
      "  border-bottom: none;",
      "}",
      "#static-kit-slot-errors .error-type {",
      "  color: #f87171;",
      "  font-weight: 600;",
      "  margin-bottom: 4px;",
      "}",
      "#static-kit-slot-errors .error-block {",
      "  color: #fbbf24;",
      "}",
      "#static-kit-slot-errors .error-details {",
      "  color: #9ca3af;",
      "  font-size: 12px;",
      "  margin-top: 4px;",
      "  word-break: break-word;",
      "}",
      "#static-kit-slot-errors .error-addr {",
      "  color: #6b7280;",
      "  font-size: 11px;",
      "  margin-top: 4px;",
      "}",
      "</style>",
      '<div class="header">',
      '  <span class="header-title">',
      "    ⚠️ Slot Errors",
      '    <span class="header-count">0</span>',
      "  </span>",
      '  <button class="close-btn" aria-label="Dismiss">&times;</button>',
      "</div>",
      '<ul class="error-list"></ul>',
    ].join("\n");
    document.body.appendChild(el);

    el.querySelector(".close-btn").addEventListener("click", function () {
      el.style.display = "none";
    });

    return el;
  }

  function collectSlotErrors() {
    var scripts = document.querySelectorAll("script[data-slot-error]");
    slotErrors = [];

    scripts.forEach(function (script) {
      try {
        var data = JSON.parse(script.textContent);
        slotErrors.push(data);
      } catch (e) {
        console.error("[Dev] Failed to parse slot error:", e);
      }
    });

    return slotErrors;
  }

  function renderSlotErrors() {
    collectSlotErrors();

    if (slotErrors.length === 0) {
      if (errorToast) {
        errorToast.style.display = "none";
      }
      return;
    }

    if (!errorToast) {
      errorToast = createErrorToast();
    }

    errorToast.style.display = "block";
    errorToast.querySelector(".header-count").textContent = slotErrors.length;

    var list = errorToast.querySelector(".error-list");
    list.innerHTML = slotErrors
      .map(function (err) {
        var typeLabel =
          err.type === "not-found"
            ? 'Block not found: <span class="error-block">' +
              err.blockType +
              "</span>"
            : 'Validation failed: <span class="error-block">' +
              err.blockType +
              "</span>";
        var details = err.details
          ? '<div class="error-details">' +
            escapeForHtml(err.details) +
            "</div>"
          : "";
        var addr = err.addr
          ? '<div class="error-addr">' +
            err.addr.pageId +
            " → " +
            err.addr.region +
            " → " +
            err.addr.blockId +
            (err.addr.propPath ? " → " + err.addr.propPath : "") +
            "</div>"
          : "";
        return (
          '<li class="error-item">' +
          '<div class="error-type">' +
          typeLabel +
          "</div>" +
          details +
          addr +
          "</li>"
        );
      })
      .join("");
  }

  function escapeForHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Check for slot errors on page load
  renderSlotErrors();
})();
