(function () {
  function setFooterYear() {
    var el = document.getElementById("footer-year");
    if (!el) return;
    var year = String(new Date().getFullYear());
    el.textContent = year;
    el.setAttribute("datetime", year);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setFooterYear);
  } else {
    setFooterYear();
  }
})();
