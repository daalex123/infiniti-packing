/**
 * Site preloader — load gate + crossfade reveal (no flicker).
 */
(function () {
  var LOADER_ID = "site-loader";
  var MIN_MS = 850;
  var MAX_MS = 4800;
  var EXIT_FALLBACK_MS = 1400;

  function getLoader() {
    return document.getElementById(LOADER_ID);
  }

  function setProgress(loader, pct) {
    var bar = loader && loader.querySelector(".site-loader__bar-fill");
    if (!bar) return;
    var clamped = Math.max(0, Math.min(100, pct));
    bar.style.transform = "scaleX(" + clamped / 100 + ")";
  }

  function finishLoading() {
    var root = document.documentElement;
    root.classList.remove("is-loading", "is-revealing");
  }

  function removeLoader(loader) {
    if (loader && loader.parentNode) {
      loader.parentNode.removeChild(loader);
    }
    finishLoading();
  }

  function skipLoader(loader) {
    removeLoader(loader);
  }

  function shouldSkip() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
    try {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      if (nav && nav.type === "back_forward") return true;
    } catch (e) {}
    return false;
  }

  function waitForReady() {
    var loadPromise = new Promise(function (resolve) {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    });
    var fontPromise =
      document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(function () {})
        : Promise.resolve();
    return Promise.all([loadPromise, fontPromise]);
  }

  function runProgress(loader, startAt, untilDone) {
    var rafId;
    function tick() {
      if (!loader || loader.classList.contains("is-exiting")) return;
      var elapsed = Date.now() - startAt;
      var t = Math.min(elapsed / untilDone, 1);
      var eased = 1 - Math.pow(1 - t, 2.8);
      setProgress(loader, eased * 88);
      if (t < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return function cancel() {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }

  function exitLoader(loader) {
    if (!loader || loader.classList.contains("is-exiting")) return;
    setProgress(loader, 100);
    loader.setAttribute("aria-busy", "false");

    var root = document.documentElement;
    var done = false;

    function complete() {
      if (done) return;
      done = true;
      removeLoader(loader);
    }

    function startReveal() {
      root.classList.add("is-revealing");
      loader.classList.add("is-exiting");

      loader.addEventListener(
        "transitionend",
        function (e) {
          if (e.target === loader && e.propertyName === "opacity") complete();
        },
        { once: true }
      );

      setTimeout(complete, EXIT_FALLBACK_MS);
    }

    /* Double rAF: ensure hidden content is painted before crossfade */
    requestAnimationFrame(function () {
      requestAnimationFrame(startReveal);
    });
  }

  function init() {
    var loader = getLoader();
    var root = document.documentElement;

    if (!loader) {
      finishLoading();
      return;
    }

    root.classList.add("is-loading");
    root.classList.remove("is-revealing");

    if (shouldSkip()) {
      skipLoader(loader);
      return;
    }

    var startAt = Date.now();
    var finished = false;
    var cancelProgress = runProgress(loader, startAt, 2200);

    function finish() {
      if (finished) return;
      finished = true;
      cancelProgress();
      setProgress(loader, 100);
      var elapsed = Date.now() - startAt;
      var delay = Math.max(0, MIN_MS - elapsed);
      setTimeout(function () {
        exitLoader(loader);
      }, delay);
    }

    var maxTimer = setTimeout(finish, MAX_MS);

    waitForReady().then(function () {
      clearTimeout(maxTimer);
      finish();
    });
  }

  window.addEventListener(
    "pageshow",
    function (e) {
      if (!e.persisted) return;
      skipLoader(getLoader());
    },
    { passive: true }
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
