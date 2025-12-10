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
          // Hot reload CSS without full page refresh
          reloadCSS();
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
        var delay = reconnectAttempts < 3 ? 100 : Math.min(500 * reconnectAttempts, 3000);
        console.log("[HMR] Disconnected, reconnecting in " + delay + "ms...");
        setTimeout(connectHMR, delay);
      } else {
        console.log("[HMR] Max reconnection attempts reached. Refresh manually.");
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
      '<style>',
      '#static-kit-dev-overlay {',
      '  position: fixed;',
      '  z-index: 99999;',
      '  background: #1a1a2e;',
      '  color: #fff;',
      '  padding: 16px;',
      '  border-radius: 8px;',
      '  font-family: ui-monospace, monospace;',
      '  font-size: 13px;',
      '  line-height: 1.5;',
      '  max-width: 400px;',
      '  box-shadow: 0 10px 40px rgba(0,0,0,0.3);',
      '  display: none;',
      '}',
      '#static-kit-dev-overlay.visible { display: block; }',
      '#static-kit-dev-overlay h4 {',
      '  margin: 0 0 12px;',
      '  font-size: 14px;',
      '  font-weight: 600;',
      '  color: #6366f1;',
      '}',
      '#static-kit-dev-overlay dl {',
      '  margin: 0;',
      '  display: grid;',
      '  grid-template-columns: auto 1fr;',
      '  gap: 4px 12px;',
      '}',
      '#static-kit-dev-overlay dt {',
      '  color: #9ca3af;',
      '}',
      '#static-kit-dev-overlay dd {',
      '  margin: 0;',
      '  word-break: break-all;',
      '}',
      '#static-kit-dev-overlay .close-btn {',
      '  position: absolute;',
      '  top: 8px;',
      '  right: 8px;',
      '  background: none;',
      '  border: none;',
      '  color: #9ca3af;',
      '  cursor: pointer;',
      '  padding: 4px;',
      '  font-size: 16px;',
      '}',
      '#static-kit-dev-overlay .close-btn:hover { color: #fff; }',
      '[data-schema-address] { position: relative; }',
      '[data-schema-address].inspecting {',
      '  outline: 2px dashed #6366f1;',
      '  outline-offset: 2px;',
      '}',
      '</style>',
      '<button class="close-btn" aria-label="Close">&times;</button>',
      '<h4>Block Inspector</h4>',
      '<dl></dl>',
    ].join('\n');
    document.body.appendChild(el);
    
    el.querySelector('.close-btn').addEventListener('click', hideOverlay);
    
    return el;
  }

  function showOverlay(blockEl, x, y) {
    if (!overlay) {
      overlay = createOverlay();
    }

    var address = blockEl.getAttribute('data-schema-address');
    var blockId = blockEl.getAttribute('data-block-id');
    var parts = address ? address.split('::') : [];

    var dl = overlay.querySelector('dl');
    dl.innerHTML = [
      '<dt>Page</dt><dd>' + (parts[0] || '-') + '</dd>',
      '<dt>Region</dt><dd>' + (parts[1] || '-') + '</dd>',
      '<dt>Block ID</dt><dd>' + (blockId || '-') + '</dd>',
      '<dt>Address</dt><dd>' + (address || '-') + '</dd>',
    ].join('');

    // Remove previous inspecting class
    var prev = document.querySelector('.inspecting');
    if (prev) prev.classList.remove('inspecting');
    blockEl.classList.add('inspecting');

    // Position overlay
    var rect = blockEl.getBoundingClientRect();
    overlay.style.top = Math.min(y + 10, window.innerHeight - 200) + 'px';
    overlay.style.left = Math.min(x + 10, window.innerWidth - 420) + 'px';
    overlay.classList.add('visible');
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.remove('visible');
    }
    var prev = document.querySelector('.inspecting');
    if (prev) prev.classList.remove('inspecting');
  }

  // Alt+click handler
  document.addEventListener('click', function (e) {
    if (!e.altKey) {
      hideOverlay();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Find closest block element
    var blockEl = e.target.closest('[data-schema-address]');
    if (blockEl) {
      showOverlay(blockEl, e.clientX, e.clientY);
    }
  });

  // ESC to close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      hideOverlay();
    }
  });

  console.log('Static Kit Dev Overlay loaded. Alt+click on blocks to inspect.');
})();
