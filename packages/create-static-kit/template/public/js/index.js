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

  console.log("Static Kit initialized");
})();
