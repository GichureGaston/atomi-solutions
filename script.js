/* ==========================================================================
   Atomi Solutions: site interactions
   - Particle field (canvas, cursor gravity and click resonance)
   - Scroll progress, sticky header state, active nav highlighting
   - Scroll reveal
   - Interactive walkthrough tabs
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Particle field
     Shapes gather in one spot, gravitate toward the cursor, and resonate
     with clicks. No glows, no gradients, just solid brand-coloured shapes.
     ------------------------------------------------------------------------ */
  (function particleField() {
    var canvas = document.getElementById("particle-field");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, dpr = 1;
    var shapes = ["circle", "triangle", "square"];
    var colors = ["#2dd4bf", "#38bdf8", "#34d399", "#f59e3c", "#7dd3fc"];
    var particles = [];
    var pulses = [];
    var anchor = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var pointerActive = false;

    function setAnchor() {
      anchor.x = w * (w < 700 ? 0.5 : 0.72);
      anchor.y = h * (w < 700 ? 0.28 : 0.34);
      if (!pointerActive) {
        target.x = anchor.x;
        target.y = anchor.y;
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = document.documentElement.clientWidth || window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setAnchor();
      seed();
    }

    function makeParticle(initial) {
      var p = {};
      reset(p, initial);
      return p;
    }

    function reset(p, initial) {
      var spread = Math.max(18, Math.min(w, h) * 0.14);
      var angle = Math.random() * Math.PI * 2;
      var radius = Math.sqrt(Math.random()) * spread;
      p.x = target.x + Math.cos(angle) * radius;
      p.y = target.y + Math.sin(angle) * radius;
      p.vx = 0;
      p.vy = 0;
      p.size = 5 + Math.random() * 11;
      p.shape = shapes[(Math.random() * shapes.length) | 0];
      p.color = colors[(Math.random() * colors.length) | 0];
      p.alpha = 0.12 + Math.random() * 0.18;
      p.orbit = 8 + Math.random() * 42;
      p.orbitAngle = Math.random() * Math.PI * 2;
      p.orbitSpeed =
        (0.004 + Math.random() * 0.01) * (Math.random() < 0.5 ? -1 : 1);
      p.gravity = 0.008 + Math.random() * 0.012;
      p.rot = Math.random() * Math.PI * 2;
      p.rotSpeed = (Math.random() - 0.5) * 0.02;
      p.resonance = 0;
    }

    function seed() {
      var count = Math.max(24, Math.min(72, Math.round((w * h) / 22000)));
      particles = [];
      pulses = [];
      for (var i = 0; i < count; i++) particles.push(makeParticle(true));
    }

    function addPulse(x, y) {
      pulses.push({ x: x, y: y, age: 0 });
      if (pulses.length > 5) pulses.shift();
    }

    function update(p) {
      p.orbitAngle += p.orbitSpeed;
      var desiredX = target.x + Math.cos(p.orbitAngle) * p.orbit;
      var desiredY = target.y + Math.sin(p.orbitAngle) * p.orbit;
      p.vx += (desiredX - p.x) * p.gravity;
      p.vy += (desiredY - p.y) * p.gravity;

      for (var i = 0; i < pulses.length; i++) {
        var pulse = pulses[i];
        var wave = pulse.age * 15;
        var dx = p.x - pulse.x;
        var dy = p.y - pulse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var gap = Math.abs(dist - wave);
        if (gap < 26 && dist > 0.001) {
          var strength = (1 - gap / 26) * 1.6;
          p.vx += (dx / dist) * strength;
          p.vy += (dy / dist) * strength;
          if (strength > p.resonance) p.resonance = strength;
        }
      }

      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      p.resonance *= 0.94;
    }

    function draw(p) {
      var s = p.size * (1 + p.resonance * 0.65);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(0.7, p.alpha + p.resonance * 0.28);
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

    function drawPulses() {
      for (var i = 0; i < pulses.length; i++) {
        var pulse = pulses[i];
        var alpha = 0.2 - pulse.age * 0.0035;
        if (alpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#2dd4bf";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pulse.x, pulse.y, pulse.age * 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = pulses.length - 1; i >= 0; i--) {
        pulses[i].age += 1;
        if (pulses[i].age > 58) pulses.splice(i, 1);
      }
      for (var j = 0; j < particles.length; j++) {
        update(particles[j]);
        draw(particles[j]);
      }
      drawPulses();
      window.requestAnimationFrame(frame);
    }

    function renderOnce() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) draw(particles[i]);
    }

    function moveTarget(x, y) {
      target.x = x;
      target.y = y;
      pointerActive = true;
    }

    function releaseTarget() {
      pointerActive = false;
      target.x = anchor.x;
      target.y = anchor.y;
    }

    window.addEventListener("resize", function () {
      resize();
      if (reduceMotion) renderOnce();
    });

    window.addEventListener("mousemove", function (e) {
      moveTarget(e.clientX, e.clientY);
    });
    document.addEventListener("mouseleave", releaseTarget);
    window.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) {
        moveTarget(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener("touchend", releaseTarget);
    window.addEventListener("click", function (e) {
      if (!reduceMotion) addPulse(e.clientX, e.clientY);
    });

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
     Scroll chrome: progress bar, sticky header, active nav link
     ------------------------------------------------------------------------ */
  (function scrollChrome() {
    var header = document.querySelector(".site-header");
    var bar = document.getElementById("scroll-progress");
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".nav-links a[href^='#']")
    );
    if (!header && !bar && !links.length) return;

    var sections = links.map(function (link) {
      var id = link.getAttribute("href").slice(1);
      return { link: link, id: id, el: document.getElementById(id) };
    }).filter(function (item) { return !!item.el; });

    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var y = window.pageYOffset || doc.scrollTop || 0;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);

      if (bar) {
        var pct = Math.min(100, Math.max(0, (y / max) * 100));
        bar.style.width = pct.toFixed(2) + "%";
      }
      if (header) header.classList.toggle("is-scrolled", y > 8);

      if (sections.length) {
        sections.forEach(function (item) {
          item.top = item.el.getBoundingClientRect().top + y;
        });
        sections.sort(function (a, b) { return a.top - b.top; });

        var headerHeight = header ? header.offsetHeight : 0;
        var marker = y + headerHeight + Math.min(160, window.innerHeight * 0.25);
        var current = "";
        sections.forEach(function (item) {
          if (item.top <= marker) current = item.id;
        });
        if (y + window.innerHeight >= doc.scrollHeight - 2) {
          current = sections[sections.length - 1].id;
        }

        links.forEach(function (link) {
          var active = link.getAttribute("href") === "#" + current;
          link.classList.toggle("is-current", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }

      ticking = false;
    }

    function schedule() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    update();
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
      "Set up once. The till adapts to your trade.",
      "Add products with prices, SKUs and barcodes.",
      "Tap or scan items, then split the tender between methods.",
      "Native STK push. The sale stays pending until Safaricom confirms the exact amount.",
      "Close the shift, count the cash, and see every branch in one report."
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
