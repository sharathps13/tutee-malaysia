/* Hero options lab: 1 songket mosaic (canvas), 2 photos in letters (CSS text clip), 3 floating gallery (CSS 3D) */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var P = './assets/img/photos/';
  var mods = {}, cur = null;

  /* ---------------- switcher ---------------- */
  function pick(k) {
    if (k === cur) return;
    if (cur && mods[cur]) mods[cur].stop();
    cur = k;
    $$('[data-hx]').forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-hx') === k); });
    $$('[data-pick]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-pick') === k)); });
    window.scrollTo(0, 0);
    mods[k].start();
    try { history.replaceState(null, '', '#' + k); } catch (e) { /* sandboxed */ }
  }
  $$('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { pick(b.getAttribute('data-pick')); }); });
  document.addEventListener('keydown', function (e) { var m = { 1: 'mosaic', 2: 'letters', 3: 'gallery' }[e.key]; if (m && !/INPUT|TEXTAREA/.test(e.target.tagName)) pick(m); });

  function intro(sel) {
    if (!gsap || reduce) return;
    gsap.fromTo($$(sel), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.3, ease: 'expo.out', stagger: .08, delay: .15 });
  }

  /* ---------------- 1 · songket mosaic ---------------- */
  mods.mosaic = (function () {
    var sec = $('[data-hx="mosaic"]'), cv = $('[data-mz]'), ctx = cv.getContext('2d');
    var SLIDES = [
      ['hx-m118', 'Merdeka 118', 'Kuala Lumpur skyline'], ['hx-perhentian', 'Perhentian Islands', 'Terengganu'], ['hx-putra', 'Putra Mosque', 'Putrajaya'],
      ['hx-skybridge', 'Sky Bridge', 'Langkawi'], ['hx-melaka', 'Melaka River', 'UNESCO old town'], ['hx-petronas', 'Petronas Twin Towers', 'Kuala Lumpur by night'], ['hx-keklok', 'Kek Lok Si', 'Penang']
    ];
    var imgs = SLIDES.map(function (s) { var i = new Image(); i.decoding = 'async'; i.src = P + s[0] + '.jpg'; return i; });
    var nEl = $('[data-mz-n]'), plEl = $('[data-mz-place]'), noEl = $('[data-mz-note]'), dots = $('[data-mz-dots]');
    SLIDES.forEach(function () { dots.appendChild(document.createElement('i')); });
    var W, H, dpr, S, tiles = [], a = 0, b = 0, flipT = -1, origin = [0, 0], mx = -9999, my = -9999, px = 0, py = 0, tpx = 0, tpy = 0;
    var running = false, raf = 0, timer = 0, lastMove = 0, FLIP = 1.25, SPREAD = 1.1, introT = 0;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75); W = sec.clientWidth; H = sec.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      S = W < 700 ? 84 : W < 1100 ? 104 : 124;
      tiles = []; var hh = S / 2;
      for (var r = -1; r * hh < H + S; r++) for (var c = -1; c * S < W + S; c++) tiles.push({ x: c * S + (r % 2 ? hh : 0), y: r * hh, hv: 0, d: 0 });
      setDelays();
    }
    function setDelays() {
      var maxD = Math.hypot(W, H);
      tiles.forEach(function (t) { t.d = Math.hypot(t.x - origin[0], t.y - origin[1]) / maxD * SPREAD + Math.random() * .12; });
    }
    function cover(img) { /* image -> screen mapping for object-fit: cover with a little room for parallax */
      var iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max((W + 60) / iw, (H + 60) / ih);
      return { s: s, ox: (W - iw * s) / 2, oy: (H - ih * s) / 2 };
    }
    function drawTile(t, img, m, sx, k, shade) {
      var half = S / 2 * k;
      ctx.save(); ctx.translate(t.x, t.y); ctx.scale(sx, 1);
      ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(half, 0); ctx.lineTo(0, half); ctx.lineTo(-half, 0); ctx.closePath(); ctx.clip();
      if (img.complete && img.naturalWidth) {
        var x0 = t.x - S / 2 - px, y0 = t.y - S / 2 - py;
        ctx.drawImage(img, (x0 - m.ox) / m.s, (y0 - m.oy) / m.s, S / m.s, S / m.s, -S / 2, -S / 2, S, S);
      } else { ctx.fillStyle = '#16204F'; ctx.fillRect(-S / 2, -S / 2, S, S); }
      if (shade > 0) { ctx.fillStyle = 'rgba(7,11,34,' + shade.toFixed(3) + ')'; ctx.fillRect(-S / 2, -S / 2, S, S); }
      ctx.restore();
      if (k < .985) { /* gold thread round a lifted tile */
        ctx.save(); ctx.translate(t.x, t.y); ctx.scale(sx, 1); ctx.strokeStyle = 'rgba(233,185,73,' + (.25 + t.hv * .65).toFixed(2) + ')'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(half, 0); ctx.lineTo(0, half); ctx.lineTo(-half, 0); ctx.closePath(); ctx.stroke(); ctx.restore();
      }
    }
    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var t = now / 1000;
      px += (tpx - px) * .06; py += (tpy - py) * .06;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0A0F2C'; ctx.fillRect(0, 0, W, H);
      var mA = imgs[a].naturalWidth ? cover(imgs[a]) : null, mB = imgs[b].naturalWidth ? cover(imgs[b]) : null;
      var el = flipT < 0 ? -1 : t - flipT, done = true;
      for (var i = 0; i < tiles.length; i++) {
        var tl = tiles[i];
        var near = mx > -999 ? Math.max(0, 1 - Math.hypot(tl.x - mx, tl.y - my) / 210) : 0;
        tl.hv += (near - tl.hv) * .14;
        var gi = Math.min(1, Math.max(0, (t - introT - tl.d * .9) / .9)); if (gi <= 0) continue;
        gi = 1 - Math.pow(1 - gi, 3);
        var k = (.965 - tl.hv * .2) * gi, p = 0;
        if (el >= 0) { p = Math.min(1, Math.max(0, (el - tl.d) / FLIP)); if (p < 1) done = false; }
        var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        var sx = Math.max(.02, Math.abs(Math.cos(Math.PI * e))), useB = e >= .5;
        var img = useB ? imgs[b] : imgs[a], m = useB ? mB : mA;
        if (!m) { img = imgs[a]; m = mA; }
        var shade = Math.sin(Math.PI * e) * .55 + tl.hv * .05;
        drawTile(tl, img, m || { s: 1, ox: 0, oy: 0 }, sx, k, shade);
      }
      if (el >= 0 && done) { a = b; flipT = -1; }
    }
    function caption(i) {
      nEl.textContent = ('0' + (i + 1)).slice(-2); plEl.textContent = SLIDES[i][1]; noEl.textContent = SLIDES[i][2];
      $$('i', dots).forEach(function (d, j) { d.classList.toggle('on', j === i); });
      if (gsap && !reduce) gsap.fromTo([plEl, noEl], { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'expo.out', stagger: .05 });
    }
    function next() {
      if (flipT >= 0) return;
      b = (a + 1) % SLIDES.length;
      var corners = [[0, 0], [W, 0], [W, H], [0, H], [W / 2, H / 2]];
      origin = performance.now() - lastMove < 2500 && mx > -999 ? [mx, my] : corners[Math.floor(Math.random() * corners.length)];
      setDelays(); flipT = performance.now() / 1000; caption(b);
    }
    sec.addEventListener('pointermove', function (e) {
      var r = sec.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; lastMove = performance.now();
      tpx = (mx / W - .5) * -30; tpy = (my / H - .5) * -24;
    });
    sec.addEventListener('pointerleave', function () { mx = my = -9999; tpx = tpy = 0; });
    sec.addEventListener('click', function (e) { if (!e.target.closest('a,button')) next(); });
    window.addEventListener('resize', function () { if (running) size(); });
    return {
      start: function () {
        running = true; size(); caption(a);
        if (reduce) { FLIP = .01; }
        raf = requestAnimationFrame(frame);
        clearInterval(timer); timer = setInterval(next, 6500);
        intro('.mz-l > *'); if (gsap && !reduce) gsap.from('.mz-copy .eyebrow, .mz-band, .mz-copy .hx-sub, .mz-copy .hx-cta, .mz-cap', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .07, delay: .45 });
        /* opening: tiles grow in from the right of centre */
        origin = [W * .7, H * .45]; setDelays(); introT = reduce ? -10 : performance.now() / 1000;
      },
      stop: function () { running = false; cancelAnimationFrame(raf); clearInterval(timer); }
    };
  })();

  /* ---------------- 2 · photos inside the letters ---------------- */
  mods.letters = (function () {
    var sec = $('[data-hx="letters"]'), word = $('[data-lt-word]'), bg = $('[data-lt-bg]'), cap = $('[data-lt-cap]');
    var L = [['M', 'hx-m118', 'Merdeka 118, KL'], ['A', 'hx-perhentian', 'Perhentian Islands'], ['L', 'hx-melaka', 'Melaka River'], ['A', 'hx-batu', 'Batu Caves'],
             ['Y', 'hx-keklok', 'Kek Lok Si, Penang'], ['S', 'hx-skybridge', 'Langkawi Sky Bridge'], ['I', 'hx-putra', 'Putrajaya'], ['A', 'hx-mural', 'George Town murals']];
    var spans = L.map(function (l, i) {
      var s = document.createElement('span'); s.className = 'lt'; s.textContent = l[0]; s.setAttribute('aria-hidden', 'true');
      s.style.backgroundImage = 'url(' + P + l[1] + '-s.jpg)'; s.setAttribute('data-place', l[2]); s.setAttribute('data-i', i);
      word.appendChild(s); return s;
    });
    var cuts = $$('.lt-cut', sec), running = false, raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, auto = 0, autoT = 0, hot = -1;
    function focus(i) {
      if (i === hot) return; hot = i;
      spans.forEach(function (s, j) { s.classList.toggle('is-hot', j === i); });
      if (i < 0) { bg.classList.remove('on'); cap.textContent = 'Hover a letter'; return; }
      bg.style.backgroundImage = 'url(' + P + L[i][1] + '-s.jpg)'; bg.classList.add('on'); cap.textContent = L[i][2];
    }
    spans.forEach(function (s, i) {
      s.addEventListener('mouseenter', function () { clearInterval(autoT); focus(i); });
      s.addEventListener('mouseleave', function () { focus(-1); startAuto(); });
      s.addEventListener('click', function () { focus(i); });
    });
    function startAuto() { clearInterval(autoT); if (reduce) return; autoT = setInterval(function () { auto = (auto + 1) % L.length; focus(auto); }, 2600); }
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5; });
    function frame(now) {
      if (!running) return; raf = requestAnimationFrame(frame);
      cx += (tx - cx) * .07; cy += (ty - cy) * .07; var t = now / 1000;
      spans.forEach(function (s, i) {
        var dpt = 18 + (i % 3) * 10, drift = Math.sin(t * .35 + i * 1.3) * 6;
        s.style.backgroundPosition = (50 + cx * dpt + drift) + '% ' + (50 + cy * dpt * .8) + '%';
      });
      cuts.forEach(function (c) { var d = +c.getAttribute('data-depth'); c.style.transform = 'translate(' + (cx * d).toFixed(1) + 'px,' + (cy * d).toFixed(1) + 'px)'; });
    }
    return {
      start: function () {
        running = true; raf = requestAnimationFrame(frame); startAuto();
        if (gsap && !reduce) {
          gsap.fromTo(spans, { yPercent: 70, opacity: 0, rotation: function (i) { return i % 2 ? 6 : -6; } }, { yPercent: 0, opacity: 1, rotation: 0, duration: 1.4, ease: 'expo.out', stagger: .06, delay: .1, clearProps: 'transform' });
          gsap.from('.lt-pre, .lt-copy .eyebrow', { x: -40, opacity: 0, duration: 1.1, ease: 'expo.out', delay: .4 });
          gsap.from('.lt-foot > *', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, delay: .7 });
          gsap.from(cuts, { scale: .4, opacity: 0, rotation: 30, duration: 1.3, ease: 'back.out(1.6)', stagger: .1, delay: .9 });
        }
      },
      stop: function () { running = false; cancelAnimationFrame(raf); clearInterval(autoT); }
    };
  })();

  /* ---------------- 3 · floating 3D gallery ---------------- */
  mods.gallery = (function () {
    var sec = $('[data-hx="gallery"]'), world = $('[data-gl-world]'), bgEl = $('[data-gl-bg]'), plEl = $('[data-gl-place]'), noEl = $('[data-gl-note]');
    var G = [
      ['hx-m118', 'Merdeka 118', 'Kuala Lumpur', 1.5], ['hx-perhentian', 'Perhentian', 'Terengganu', 1.33], ['hx-batu', 'Batu Caves', 'Selangor', .75], ['hx-putra', 'Putra Mosque', 'Putrajaya', .8],
      ['hx-skybridge', 'Sky Bridge', 'Langkawi', 1.5], ['hx-keklok', 'Kek Lok Si', 'Penang', .67], ['hx-melaka', 'Melaka River', 'Melaka', 1.5], ['hx-mural', 'Street art', 'George Town', .67],
      ['hx-samad', 'Sultan Abdul Samad', 'Merdeka Square', 1.5], ['hx-petronas', 'Petronas Towers', 'By night', 1.5], ['hx-murugan', 'Lord Murugan', 'Batu Caves', .75],
      ['e-orangutan', 'Orangutans', 'Sabah', 1.63], ['e-tea', 'Tea hills', 'Cameron Highlands', 1.5], ['l-satay', 'Satay', 'Hawker night', .67], ['e-kinabalu', 'Mount Kinabalu', 'Sabah', 1.5], ['l-lanterns', 'Lanterns', 'Chinese New Year', .67]
    ];
    var NEAR = 650, FAR = -3400, SPAN = NEAR - FAR, cards = [], bgImgs = [], feat = -1;
    var running = false, raf = 0, last = 0, speed = 110, boost = 0, rx = 0, ry = 0, trx = 0, try_ = 0, lastY = 0, featT = 0;
    G.forEach(function (g, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'gl-card'; b.setAttribute('tabindex', '-1');
      var big = g[0].indexOf('hx-') === 0, src = P + g[0] + (big ? '-s' : '') + '.jpg';
      b.innerHTML = '<img src="' + src + '" alt="" draggable="false"><span>' + g[1] + '</span>';
      b.style.setProperty('--ar', g[3]); b.style.setProperty('--w', (g[3] > 1 ? 300 : 210) + 'px');
      world.appendChild(b);
      var ang = i * 2.399963 + .4; /* golden angle so cards spread round the title */
      cards.push({ el: b, i: i, ang: ang, rad: .72 + (i % 4) * .1, z: FAR + (SPAN / G.length) * i, w: g[3] > 1 ? 300 : 210 });
      b.addEventListener('click', function () { feature(i); });
      var bi = document.createElement('img'); bi.alt = ''; bi.decoding = 'async'; bi.dataset.src = P + g[0] + '.jpg'; bgEl.appendChild(bi); bgImgs.push(bi);
    });
    function feature(i) {
      if (i === feat) return; feat = i; featT = performance.now();
      var im = bgImgs[i]; if (!im.src) im.src = im.dataset.src;
      bgImgs.forEach(function (x) { x.classList.toggle('on', x === im); });
      cards.forEach(function (c) { c.el.classList.toggle('on', c.i === i); });
      plEl.textContent = G[i][1]; noEl.textContent = G[i][2];
      if (gsap && !reduce) gsap.fromTo([plEl, noEl], { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .05 });
    }
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); try_ = ((e.clientX - r.left) / r.width - .5) * 16; trx = -((e.clientY - r.top) / r.height - .5) * 10; });
    sec.addEventListener('pointerleave', function () { trx = try_ = 0; });
    window.addEventListener('scroll', function () { var y = window.scrollY; boost = Math.min(1600, boost + Math.abs(y - lastY) * 6); lastY = y; }, { passive: true });
    window.addEventListener('wheel', function (e) { if (cur === 'gallery' && window.scrollY < 10 && e.deltaY < 0) boost = Math.min(1600, boost + 400); }, { passive: true });
    function frame(now) {
      if (!running) return; raf = requestAnimationFrame(frame);
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      boost *= .94; rx += (trx - rx) * .05; ry += (try_ - ry) * .05;
      var W = sec.clientWidth, H = sec.clientHeight, mob = W < 700;
      world.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      var best = -1, bestZ = -1e9;
      cards.forEach(function (c) {
        c.z += (speed + boost) * dt; if (c.z > NEAR) c.z -= SPAN;
        var x = Math.cos(c.ang) * W * .5 * c.rad * (mob ? 1.05 : 1), y = Math.sin(c.ang) * H * .46 * c.rad;
        var fadeIn = Math.min(1, (c.z - FAR) / 1700), fadeOut = Math.min(1, (NEAR - c.z) / 380), o = Math.max(0, Math.min(fadeIn * fadeIn, fadeOut));
        var k = 900 / (900 - c.z), qx = x * k / (W * .5), qy = y * k / (H * .5), cen = qx * qx / .42 + qy * qy / .5;
        if (cen < 1) o *= .18 + .82 * cen * cen; /* keep the title clear */
        var s = mob ? .62 : 1;
        c.el.style.transform = 'translate3d(' + (x - c.w * s / 2).toFixed(1) + 'px,' + (y - c.w * s * .4).toFixed(1) + 'px,' + c.z.toFixed(1) + 'px) scale(' + s + ')';
        c.el.style.opacity = o.toFixed(3);
        c.el.style.zIndex = Math.round(c.z + 4000);
        if (c.z < 200 && c.z > bestZ) { bestZ = c.z; best = c.i; }
      });
      if (best > -1 && now - featT > 5200) feature(best);
    }
    return {
      start: function () {
        running = true; last = 0; lastY = window.scrollY; if (reduce) speed = 0;
        if (feat < 0) feature(0); raf = requestAnimationFrame(frame);
        if (gsap && !reduce) { boost = 1600; gsap.from('.gl-copy > *', { y: 40, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .08, delay: .2 }); }
      },
      stop: function () { running = false; cancelAnimationFrame(raf); }
    };
  })();

  var start = (location.hash || '').slice(1);
  pick(mods[start] ? start : 'mosaic');
})();
