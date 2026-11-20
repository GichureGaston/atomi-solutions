/* ==========================================================================
   Atomi Solutions — site interactions
   - Ambient "anti-gravity" particle field (canvas, cursor repulsion)
   - Scroll reveal
   - Interactive walkthrough tabs
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Ambient particle field
     Shapes drift upward, sway gently, and are pushed away from the cursor —
     the same floating-field feel as the Antigravity site, in brand colours.
     ------------------------------------------------------------------------ */
  (function particleField() {
    var canvas = document.getElementById("particle-field");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1;
    var shapes = ["circle", "triangle", "square"];
    var colors = ["#0d9c92", "#2b82b8", "#2e9a6b", "#6a8fa3"];
    var particles = [];
    var mouse = { x: -1000, y: -1000, active: false };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function makeParticle(initial) {
      var p = {};
      reset(p, initial);
      return p;
    }

    function reset(p, initial) {
      p.x = Math.random() * w;
      p.y = initial ? Math.random() * h : h + 40 + Math.random() * 80;
      p.size = 6 + Math.random() * 15;
      p.shape = shapes[(Math.random() * shapes.length) | 0];
      p.color = colors[(Math.random() * colors.length) | 0];
      p.alpha = 0.08 + Math.random() * 0.16;
      p.speed = 0.14 + Math.random() * 0.42;
      p.sway = 0.25 + Math.random() * 0.8;
      p.phase = Math.random() * Math.PI * 2;
      p.swaySpeed = 0.005 + Math.random() * 0.012;
      p.rot = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 0.012;
      p.dx = 0;
      p.dy = 0;
    }

    function seed() {
      var count = Math.max(26, Math.min(90, Math.round((w * h) / 17000)));
      particles = [];
      for (var i = 0; i < count; i++) particles.push(makeParticle(true));
    }

    function update(p) {
      p.phase += p.swaySpeed;
      p.y -= p.speed;
      p.x += Math.sin(p.phase) * p.sway;
      p.rot += p.rotSpeed;

      if (mouse.active) {
        var px = p.x + p.dx;
        var py = p.y + p.dy;
        var ax = px - mouse.x;
        var ay = py - mouse.y;
        var dist = Math.sqrt(ax * ax + ay * ay);
        var radius = 150;
        if (dist < radius && dist > 0.001) {
          var force = (1 - dist / radius) * 2.6;
          p.dx += (ax / dist) * force;
          p.dy += (ay / dist) * force;
        }
      }

      // Ease displacement back to zero so particles rejoin the upward drift.
      p.dx *= 0.93;
      p.dy *= 0.93;

      if (p.y < -50 || p.x < -70 || p.x > w + 70) reset(p, false);
    }

    function draw(p) {
      var s = p.size;
      ctx.save();
      ctx.translate(p.x + p.dx, p.y + p.dy);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.shape === "circle") {
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      } else if (p.shape === "triangle") {
        ctx.moveTo(0, -s / 2);
        ctx.lineTo(s / 2, s / 2);
        ctx.lineTo(-s / 2, s / 2);
        ctx.closePath();
      } else {
        ctx.rect(-s / 2, -s / 2, s, s);
      }
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        update(particles[i]);
        draw(particles[i]);
      }
      window.requestAnimationFrame(frame);
    }

    function renderOnce() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) draw(particles[i]);
    }

    window.addEventListener("resize", function () {
      resize();
      if (reduceMotion) renderOnce();
    });

    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });
    document.addEventListener("mouseleave", function () { mouse.active = false; });
    window.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    }, { passive: true });
    window.addEventListener("touchend", function () { mouse.active = false; });

    resize();
    if (reduceMotion) renderOnce();
    else window.requestAnimationFrame(frame);
  })();

  /* ------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------ */
  (function scrollReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

    // Fallback for browsers/edge cases where the observer callback is missed:
    // reveal anything currently inside the viewport on scroll.
    function revealInView() {
      Array.prototype.forEach.call(items, function (el) {
        if (el.classList.contains("is-visible")) return;
        var box = el.getBoundingClientRect();
        if (box.top < window.innerHeight - 40 && box.bottom > 0) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      });
    }

    window.addEventListener("scroll", revealInView, { passive: true });
    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
    revealInView();
  })();

  /* ------------------------------------------------------------------------
     Walkthrough tabs
     ------------------------------------------------------------------------ */
  (function walkthrough() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".step"));
    if (!tabs.length) return;

    var screens = Array.prototype.slice.call(document.querySelectorAll(".screen"));
    var caption = document.getElementById("stage-caption");
    var captions = [
      "Set up once — the till adapts to your trade.",
      "Add products with prices, SKUs and barcodes.",
      "Tap or scan items, then split the tender between methods.",
      "M-Pesa STK push — the customer approves on their phone while the cart stays open.",
      "Close the shift and see every branch in one report."
    ];

    function activate(index) {
      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", active ? "true" : "false");
        tab.tabIndex = active ? 0 : -1;
      });
      screens.forEach(function (screen, i) {
        var active = i === index;
        screen.classList.toggle("is-active", active);
        screen.hidden = !active;
      });
      if (caption && captions[index]) caption.textContent = captions[index];
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { activate(i); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          activate(next);
          tabs[next].focus();
        }
      });
    });
  })();

  /* ------------------------------------------------------------------------
     Digital receipt viewer
     ------------------------------------------------------------------------ */
  (function receiptViewer() {
    var modal = document.getElementById("receipt-modal");
    var open = document.getElementById("receipt-open");
    var close = document.getElementById("receipt-close");
    var close2 = document.getElementById("receipt-close-2");
    var backdrop = document.getElementById("receipt-backdrop");
    if (!modal || !open) return;

    var lastFocused = null;

    function show() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      if (close) close.focus();
    }

    function hide() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    open.addEventListener("click", show);
    if (close) close.addEventListener("click", hide);
    if (close2) close2.addEventListener("click", hide);
    if (backdrop) backdrop.addEventListener("click", hide);
    document.addEventListener("keydown", function (e) {
      if (!modal.hidden && e.key === "Escape") hide();
    });
  })();

  /* ------------------------------------------------------------------------
     Mobile menu: collapse after choosing a link
     ------------------------------------------------------------------------ */
  (function mobileMenu() {
    var menu = document.querySelector(".mobile-menu");
    if (!menu) return;
    Array.prototype.forEach.call(menu.querySelectorAll("a"), function (link) {
      link.addEventListener("click", function () { menu.open = false; });
    });
  })();

  /* ------------------------------------------------------------------------
     Trade orbit: reflect the focused trade in the nucleus
     ------------------------------------------------------------------------ */
  (function tradeOrbit() {
    var title = document.querySelector(".nucleus-title");
    var detail = document.querySelector(".nucleus-detail");
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".electron"));
    if (!title || !detail || !nodes.length) return;

    var defaultTitle = title.textContent;
    var defaultDetail = detail.textContent;

    nodes.forEach(function (node) {
      var name = node.querySelector("b");
      var description = node.querySelector("small");

      function activate() {
        title.textContent = name ? name.textContent.trim() : defaultTitle;
        detail.textContent = description ? description.textContent.trim() : defaultDetail;
      }

      function reset() {
        title.textContent = defaultTitle;
        detail.textContent = defaultDetail;
      }

      node.addEventListener("mouseenter", activate);
      node.addEventListener("mouseleave", reset);
      node.addEventListener("focusin", activate);
      node.addEventListener("focusout", reset);
    });
  })();
})();
