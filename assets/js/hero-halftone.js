/* ---------- hero title in halftone ----------
   Port of Kedhareswer Naidu's "Halftone Wordmark Footer" (21st.dev, MIT): the words are printed as halftone dots that
   part around the pointer on springs and warm in colour as they move; a click sends a shock ring through the letters.
   Here it prints "Study in Malaysia" in the page's own type, white and sun gold, the dots fly in to assemble the title
   after the loader, and the real heading text stays in the page (transparent) for screen readers and search. */
(function () {
  var h1 = document.querySelector('[data-ht]'); if (!h1) return;
  var lines = [].slice.call(h1.querySelectorAll('[data-hl]')); if (!lines.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = document.createElement('canvas'); cv.className = 'ht-cv'; cv.setAttribute('aria-hidden', 'true'); h1.appendChild(cv);
  var ctx = cv.getContext('2d'); if (!ctx) { cv.remove(); return; }
  /* base colour of each line, and the colour a dot warms towards as it is pushed off its spot */
  var INK = [[244, 241, 234], [255, 204, 0]], WARM = [[255, 204, 0], [255, 84, 48]];
  var PAD = 70, W = 1, H = 1, dpr = 1, gap = 5, radius = 80, D = new Float32Array(0), N = 0, grain = null;
  var mx = -1e5, my = -1e5, shock = { x: 0, y: 0, t: -1 }, raf = 0, awake = false, visible = true, started = reduce;
  var hex = function (c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; };

  function layout() {
    var r = h1.getBoundingClientRect(); if (!r.width) return;
    W = Math.round(r.width + PAD * 2); H = Math.round(r.height + PAD * 2); dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.left = cv.style.top = -PAD + 'px'; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var off = document.createElement('canvas'); off.width = W; off.height = H;
    var o = off.getContext('2d', { willReadFrequently: true });
    var fs = 100;
    lines.forEach(function (ln, k) {
      var el = ln.querySelector('em') || ln, cs = getComputedStyle(el), txt = el.textContent;
      fs = parseFloat(cs.fontSize) || fs;
      o.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      var rg = document.createRange(); rg.selectNodeContents(el); var tr = rg.getBoundingClientRect();
      var m = o.measureText(txt), asc = m.fontBoundingBoxAscent || fs * .9;
      o.fillStyle = k ? '#00ff00' : '#ff0000'; o.textBaseline = 'alphabetic';
      o.fillText(txt, tr.left - r.left + PAD + (tr.width - m.width) / 2, tr.top - r.top + PAD + asc);
    });
    gap = Math.max(3, Math.min(6, Math.round(fs / 34))); radius = Math.max(46, fs * .5);
    var px = o.getImageData(0, 0, W, H).data, cols = Math.ceil(W / gap), rows = Math.ceil(H / gap), out = [];
    for (var gy = 0; gy < rows; gy++) for (var gx = 0; gx < cols; gx++) {
      var a = 0, g = 0, rr = 0;
      for (var sy = 0; sy < 3; sy++) for (var sx = 0; sx < 3; sx++) {
        var X = Math.min(W - 1, Math.floor(gx * gap + (sx + .5) * gap / 3)), Y = Math.min(H - 1, Math.floor(gy * gap + (sy + .5) * gap / 3)), p = (Y * W + X) * 4;
        a += px[p + 3]; rr += px[p]; g += px[p + 1];
      }
      var cov = a / (9 * 255); if (cov < .06) continue;
      var hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
      out.push(hx, hy, 0, 0, hx, hy, Math.sqrt(Math.min(1, cov)) * gap * .56, g > rr ? 1 : 0);
    }
    D = new Float32Array(out); N = out.length / 8;
    if (!grain) {
      grain = document.createElement('canvas'); grain.width = grain.height = 256;
      var gc = grain.getContext('2d'), id = gc.createImageData(256, 256);
      for (var i = 0; i < id.data.length; i += 4) { var v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = Math.random() < .5 ? 0 : 255; }
      gc.putImageData(id, 0, 0);
    }
    h1.classList.add('ht-on');
    if (started) wake();
  }

  /* throw every dot away from the title so the springs can pull it back together */
  function scatter(force) {
    var cx = W / 2, cy = H / 2;
    for (var i = 0; i < N; i++) {
      var k = i * 8, dx = D[k + 4] - cx, dy = D[k + 5] - cy, d = Math.sqrt(dx * dx + dy * dy) + .001, f = (180 + Math.random() * 520) * (force || 1);
      var ang = Math.atan2(dy, dx) + (Math.random() - .5) * 1.4;
      D[k] = D[k + 4] + Math.cos(ang) * f; D[k + 1] = D[k + 5] + Math.sin(ang) * f * .7; D[k + 2] = 0; D[k + 3] = 0;
    }
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!started) return false;
    var R = reduce ? 0 : radius, el = shock.t < 0 ? 1e9 : now - shock.t, ring = el * .9, moving = false;
    var paths = [new Path2D(), new Path2D()];
    for (var i = 0; i < N; i++) {
      var k = i * 8, x = D[k], y = D[k + 1], vx = D[k + 2], vy = D[k + 3], hx = D[k + 4], hy = D[k + 5], r = D[k + 6], c = D[k + 7];
      if (!reduce) {
        if (el < 900) { /* the shock ring: a band that travels out from the click and kicks dots outward */
          var sx = hx - shock.x, sy = hy - shock.y, sd = Math.sqrt(sx * sx + sy * sy) + .001, band = 1 - Math.min(1, Math.abs(sd - ring) / 26);
          if (band > 0) { var kick = band * 3.2 * (1 - el / 900); vx += sx / sd * kick; vy += sy / sd * kick; }
        }
        var ex = x - mx, ey = y - my, e2 = ex * ex + ey * ey;
        if (R > 0 && e2 < R * R) { var ed = Math.sqrt(e2) + .001, push = (1 - ed / R) * 2.6; vx += ex / ed * push; vy += ey / ed * push; }
        vx = (vx + (hx - x) * .05) * .84; vy = (vy + (hy - y) * .05) * .84; x += vx; y += vy;
        if (Math.abs(vx) + Math.abs(vy) > .02 || Math.abs(x - hx) + Math.abs(y - hy) > .05) moving = true; else { x = hx; y = hy; vx = 0; vy = 0; }
        D[k] = x; D[k + 1] = y; D[k + 2] = vx; D[k + 3] = vy;
      }
      var w = Math.min(1, Math.sqrt((x - hx) * (x - hx) + (y - hy) * (y - hy)) / 28);
      if (w > .02) {
        var a = INK[c], b = WARM[c];
        ctx.fillStyle = 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * w) + ',' + Math.round(a[1] + (b[1] - a[1]) * w) + ',' + Math.round(a[2] + (b[2] - a[2]) * w) + ')';
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      } else { paths[c].moveTo(x + r, y); paths[c].arc(x, y, r, 0, 6.2832); }
    }
    /* a soft dark halo under the settled letters keeps them readable over a bright photo or card behind */
    ctx.shadowColor = 'rgba(0,0,0,.8)';
    for (var pass = 0; pass < 2; pass++) {
      ctx.shadowBlur = (pass ? 26 : 8) * dpr;
      ctx.fillStyle = hex(INK[0]); ctx.fill(paths[0]); ctx.fillStyle = hex(INK[1]); ctx.fill(paths[1]);
    }
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    /* print grain, only on the ink */
    if (grain) { ctx.globalAlpha = .1; ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = ctx.createPattern(grain, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    return moving || el < 900 || mx > -1e4;
  }
  function loop(now) { raf = 0; if (!visible) { awake = false; return; } awake = draw(now); if (awake) raf = requestAnimationFrame(loop); }
  function wake() { awake = true; if (!raf && visible) raf = requestAnimationFrame(loop); }

  var local = function (e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  var heroSec = h1.closest('section') || document.body;
  if (!reduce) {
    window.addEventListener('pointermove', function (e) {
      var r = heroSec.getBoundingClientRect(); if (e.clientY > r.bottom || r.bottom < 0) { if (mx > -1e4) { mx = my = -1e5; wake(); } return; }
      var p = local(e); mx = p[0]; my = p[1]; wake();
    }, { passive: true });
    document.addEventListener('pointerleave', function () { mx = my = -1e5; wake(); });
    window.addEventListener('blur', function () { mx = my = -1e5; wake(); });
    window.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('a, button, input, select, textarea, label, nav, [data-menu], [data-dock]')) return;
      var r = heroSec.getBoundingClientRect(); if (e.clientY < r.top || e.clientY > Math.min(r.bottom, window.innerHeight)) return;
      var p = local(e); shock = { x: p[0], y: p[1], t: performance.now() }; wake();
    });
  }
  new ResizeObserver(function () { layout(); }).observe(h1);
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) wake(); }).observe(h1);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); });
  layout();
  if (reduce) draw(0);
  /* called by the hero intro once the loader lifts; falls back to running on its own */
  var intro = function () { if (started) return; started = true; scatter(1); wake(); };
  setTimeout(intro, 5000);
  window.TCHalftone = { intro: intro };
})();
