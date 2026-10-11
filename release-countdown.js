(function () {
  "use strict";
  // March 28, 2027 at midnight in Los Angeles (PDT); identical for every visitor.
  const releaseAt = Date.parse("2027-03-28T00:00:00-07:00");
  const roots = Array.from(document.querySelectorAll("[data-dod-release]"));
  if (!roots.length) return;
  function tick() {
    const remaining = Math.max(0, Math.floor((releaseAt - Date.now()) / 1000));
    const values = {
      days: Math.floor(remaining / 86400),
      hours: Math.floor(remaining / 3600) % 24,
      minutes: Math.floor(remaining / 60) % 60,
      seconds: remaining % 60
    };
    roots.forEach(function (root) {
      const clock = root.querySelector(".dod-release-clock");
      if (clock) clock.textContent = remaining ? values.days + "d " + String(values.hours).padStart(2,"0") + "h " + String(values.minutes).padStart(2,"0") + "m " + String(values.seconds).padStart(2,"0") + "s" : "Available Now";
      root.querySelectorAll("[data-dod-unit]").forEach(function (element) {
        element.textContent = String(values[element.dataset.dodUnit]).padStart(2, "0");
      });
      if (!remaining) {
        const heading = root.querySelector(".dod-release-heading");
        if (heading) heading.textContent = "The Prophecy Begins — Available Now";
        const digits = root.querySelector(".dod-release-digits");
        if (digits) digits.hidden = true;
        const preorder = root.querySelector(".dod-release-preorder");
        if (preorder) preorder.textContent = "Buy the Ebook";
        const promotion = root.querySelector("[data-dod-promotion]");
        if (promotion) promotion.textContent = "Read the full book";
        const access = root.querySelector("[data-dod-access]");
        if (access) access.textContent = "Purchase the Full Book";
      }
    });
    return remaining;
  }
  if (tick()) {
    const timer = setInterval(function () { if (!tick()) clearInterval(timer); }, 1000);
  }
})();