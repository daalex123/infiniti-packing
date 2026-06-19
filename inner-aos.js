/**
 * Scroll reveal for inner pages — decorates main content, boots AOS after site loader.
 */
(function () {
  "use strict";

  if (!document.body || !document.body.classList.contains("inner-page")) {
    return;
  }

  var STAGGER_MS = 55;
  var STAGGER_CAP = 440;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function hasAosAncestor(el) {
    var node = el.parentElement;
    while (node && node !== document.body) {
      if (node.hasAttribute && node.hasAttribute("data-aos")) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function applyReveal(el, options) {
    if (!el || el.hasAttribute("data-aos") || hasAosAncestor(el)) {
      return;
    }
    var opts = options || {};
    el.setAttribute("data-aos", opts.animation || "fade-up");
    el.setAttribute("data-aos-duration", String(opts.duration != null ? opts.duration : 900));
    el.setAttribute("data-aos-offset", String(opts.offset != null ? opts.offset : 72));
    if (opts.delay != null) {
      el.setAttribute("data-aos-delay", String(opts.delay));
    }
  }

  function staggerItems(items, baseOptions) {
    for (var i = 0; i < items.length; i++) {
      var delay = Math.min(i * STAGGER_MS, STAGGER_CAP);
      applyReveal(items[i], Object.assign({}, baseOptions || {}, { delay: delay }));
    }
  }

  function decorateInnerPage() {
    var main = document.getElementById("main-content");
    if (!main) {
      return;
    }

    var sections = main.querySelectorAll(":scope > section:not(.page-hero)");

    sections.forEach(function (section) {
      if (section.classList.contains("about-intro")) {
        applyReveal(section.querySelector("figure"), {
          animation: "fade-right",
          duration: 1000,
          offset: 80,
        });
        applyReveal(section.querySelector(".about-intro__content"), {
          animation: "fade-left",
          duration: 1000,
          offset: 80,
        });
        return;
      }

      if (section.classList.contains("contact-map-section")) {
        var mapPanel =
          section.querySelector(".contact-map-panel") ||
          section.querySelector(".contact-map-wrap");
        applyReveal(mapPanel || section, { duration: 920, offset: 48 });
        return;
      }

      if (!section.hasAttribute("data-aos")) {
        section.querySelectorAll(
          ".brands-section-intro, .contact-section-intro, .products-section-intro"
        ).forEach(function (intro) {
          applyReveal(intro, { duration: 900, offset: 80 });
        });

        section.querySelectorAll(".brands-page__stats, .products-page__stats").forEach(function (stats) {
          applyReveal(stats, { duration: 880, offset: 64 });
        });
      }

      section.querySelectorAll("article.brands-panel").forEach(function (panel, panelIndex) {
        if (!hasAosAncestor(panel)) {
          applyReveal(panel.querySelector(":scope > header.brands-section-intro"), {
            delay: panelIndex * 80,
            duration: 900,
            offset: 76,
          });
        }
        staggerItems(panel.querySelectorAll("ul.brands-grid > li"), {
          duration: 880,
          offset: 68,
        });
      });

      var contactPanels = section.querySelectorAll(
        ".contact-layout > .contact-panel, .contact-layout > .contact-form-panel"
      );
      if (contactPanels.length) {
        staggerItems(contactPanels, { duration: 950, offset: 72 });
      }

      var channelCards = section.querySelectorAll(".contact-channel-card");
      if (channelCards.length) {
        staggerItems(channelCards, { duration: 880, offset: 64 });
      }
    });
  }

  function bootAOS() {
    if (typeof AOS === "undefined" || prefersReducedMotion()) {
      return;
    }
    AOS.init({
      duration: 980,
      easing: "ease-out-cubic",
      once: false,
      mirror: true,
      offset: 64,
      delay: 0,
      anchorPlacement: "top-bottom",
      disable: function () {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      },
    });
    if (typeof AOS.refreshHard === "function") {
      AOS.refreshHard();
    } else if (typeof AOS.refresh === "function") {
      AOS.refresh();
    }
  }

  function startAOS() {
    decorateInnerPage();
    if (prefersReducedMotion()) {
      return;
    }
    if (!document.documentElement.classList.contains("is-loading")) {
      bootAOS();
      return;
    }
    var observer = new MutationObserver(function () {
      if (!document.documentElement.classList.contains("is-loading")) {
        observer.disconnect();
        window.setTimeout(bootAOS, 120);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAOS);
  } else {
    startAOS();
  }
})();
