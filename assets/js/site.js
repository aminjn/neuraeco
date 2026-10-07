// صفحهٔ معرفیِ نورا — تم، منوی موبایل و هالهٔ اسپکترومِ آواتار.
// هیچ درخواستِ شبکه‌ای، ورود یا خریدی در این صفحه نیست.
(function () {
  var root = document.documentElement;

  // ── تم: انتخابِ دستیِ ماندگار، وگرنه تنظیمِ سیستم ───────────────────────
  function stored() { try { return localStorage.getItem('neura_site_theme') || ''; } catch (e) { return ''; } }
  function systemDark() { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
  function apply(t) {
    root.setAttribute('data-theme', t);
    var btn = document.querySelector('[data-theme-btn]');
    if (btn) {
      btn.innerHTML = '<i class="fa-solid ' + (t === 'dark' ? 'fa-sun' : 'fa-moon') + '"></i>';
      btn.setAttribute('aria-label', t === 'dark' ? 'تم روشن' : 'تم تیره');
    }
  }
  apply(stored() || (systemDark() ? 'dark' : 'light'));
  var tb = document.querySelector('[data-theme-btn]');
  if (tb) tb.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('neura_site_theme', next); } catch (e) { /* — */ }
    apply(next);
  });

  // ── منوی موبایل ─────────────────────────────────────────────────────────
  var menu = document.querySelector('[data-site-menu]');
  var burger = document.querySelector('[data-site-burger]');
  if (menu && burger) {
    burger.addEventListener('click', function () {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('a')) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── هالهٔ اسپکتروم (همان فرمولِ آواتارِ نورا) ────────────────────────────
  function specHsl(src) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(src || '').trim());
    if (!m) return { h: 265, s: 80, l: 62 };
    var r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
    if (d) {
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    var l = (mx + mn) / 2;
    return { h: h, s: (d ? d / (1 - Math.abs(2 * l - 1)) : 0) * 100, l: l * 100 };
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('[data-spectrum]'), function (host) {
    var cv = host.querySelector('canvas');
    if (!cv) return;
    var ac = specHsl(host.getAttribute('data-spectrum'));
    var t = 0, w = 0, h = 0, ctx = null;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), box = host.getBoundingClientRect();
      w = Math.max(1, Math.round(box.width)); h = Math.max(1, Math.round(box.height));
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx = cv.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function offsetAt(a, L, tt, unit) {
      var v = Math.sin(5 * a + L * 0.34 + tt) + 0.62 * Math.sin(3 * a - L * 0.20 - tt * 0.8 + 1.2)
        + 0.40 * Math.sin(8 * a + L * 0.12 + tt * 1.25 + 2.1) + 0.30 * Math.sin(2 * a - L * 0.08 - tt * 0.5);
      return (v / 2.32) * unit;
    }
    function draw() {
      if (!ctx) return;
      t += 0.016 * 2.2;
      ctx.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2, sz = Math.min(w, h);
      var baseR = sz * 0.27, dotR = Math.max(0.6, sz * 0.0030), RINGS = 26, gap = sz * 0.00336;
      var waveUnit = sz * 0.01925 * 2.3, spanR = baseR + RINGS * gap + waveUnit;
      var N = Math.max(90, Math.round(240 * sz / 400));
      for (var L = 0; L < RINGS; L++) {
        var ringFade = Math.pow(1 - L / RINGS, 1.25), layerWeight = Math.pow(L / (RINGS - 1), 0.85);
        var alpha = 0.5 * ringFade;
        if (alpha < 0.02) continue;
        for (var i = 0; i < N; i++) {
          var a = (i / N) * Math.PI * 2, r = baseR + L * gap + offsetAt(a, L, t, waveUnit) * layerWeight;
          var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
          var nx = Math.min(1, Math.max(0, 0.5 + (x - cx) / (spanR * 1.7)));
          ctx.beginPath();
          ctx.fillStyle = 'hsla(' + (ac.h - 26 + nx * 52) + ',' + Math.max(45, Math.min(96, ac.s)) + '%,'
            + (Math.max(44, Math.min(66, ac.l)) + 4 + nx * 6) + '%,' + alpha + ')';
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!reduce) requestAnimationFrame(draw);
    }
    size(); draw();
    var tmr = 0;
    window.addEventListener('resize', function () { clearTimeout(tmr); tmr = setTimeout(size, 160); });
  });
})();
