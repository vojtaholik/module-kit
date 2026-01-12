/**
 * Static Kit - Client Runtime
 *
 * Minimal ES5-compatible enhancement script.
 * Add interactive behaviors here as needed.
 */

(function () {
  "use strict";

  // Smooth scroll for anchor links
  document.addEventListener("click", function (e) {
    var target = e.target;
    if (target.tagName === "A" && target.hash) {
      var element = document.querySelector(target.hash);
      if (element) {
        e.preventDefault();
        element.scrollIntoView({ behavior: "smooth" });
        history.pushState(null, null, target.hash);
      }
    }
  });

  // Mark external links
  var links = document.querySelectorAll('a[href^="http"]');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.hostname !== window.location.hostname) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  }

  // Carousel button handlers
  // CSS handles scroll-snap, JS just wires up the prev/next buttons
  function initCarousels() {
    var carousels = document.querySelectorAll("[data-carousel]");
    carousels.forEach(function (carousel) {
      var container = carousel.closest(".container");
      var prevBtn = container.querySelector("[data-carousel-prev]");
      var nextBtn = container.querySelector("[data-carousel-next]");

      if (!prevBtn || !nextBtn) return;

      // Get scroll amount (width of first child + gap)
      function getScrollAmount() {
        var firstChild = carousel.firstElementChild;
        if (!firstChild) return 300;
        var style = getComputedStyle(carousel);
        var gap = parseInt(style.gap) || 16;
        return firstChild.offsetWidth + gap;
      }

      // Update button states
      function updateButtons() {
        prevBtn.disabled = carousel.scrollLeft <= 0;
        nextBtn.disabled =
          carousel.scrollLeft >=
          carousel.scrollWidth - carousel.clientWidth - 1;
      }

      prevBtn.addEventListener("click", function () {
        carousel.scrollBy({ left: -getScrollAmount(), behavior: "smooth" });
      });

      nextBtn.addEventListener("click", function () {
        carousel.scrollBy({ left: getScrollAmount(), behavior: "smooth" });
      });

      carousel.addEventListener("scroll", updateButtons, { passive: true });
      updateButtons();
    });
  }

  // Init on DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarousels);
  } else {
    initCarousels();
  }

  console.log("Static Kit initialized");
})();
