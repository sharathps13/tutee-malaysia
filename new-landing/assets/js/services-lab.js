/* What we do: three options. 1 kinetic index with a cursor lens that turns into the open page,
   2 a mosaic that reshuffles around the chosen tile (GSAP Flip), 3 a golden thread drawn on scroll. */
(function () {
  'use strict';
  var S = window.SVC; if (!S || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger, Flip, CustomEase, MotionPathPlugin, DrawSVGPlugin);
  CustomEase.create('silk', 'M0,0 C0.16,1 0.3,1 1,1');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var P = './assets/img/photos/';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ico = function (s) { return '<span class="svc-ico" style="--c:' + s.color + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + s.icon + '</svg></span>'; };
  var cta = function (s) { return '<a class="btn btn--sun btn--sm" href="./index.html' + s.href + '">' + esc(s.cta) + ' →</a>'; };

  var links = $$('.sl-jump a');
  links.forEach(function (a) { ScrollTrigger.create({ trigger: $(a.getAttribute('href')), start: 'top 50%', end: 'bottom 50%', onToggle: function (st) { if (st.isActive) links.forEach(function (x) { x.classList.toggle('on', x === a); }); } }); });
  $$('.sl-sec .h2').forEach(function (h) { if (!reduce) gsap.from(h, { yPercent: 40, opacity: 0, duration: 1.2, ease: 'silk', scrollTrigger: { trigger: h, start: 'top 85%', once: true } }); });

  /* =========== 1 · KINETIC INDEX =========== */
  (function () {
    var root = $('[data-ki]'); if (!root) return;
    var list = $('[data-ki-list]', root), lens = $('[data-ki-lens]', root), lin = $('[data-ki-lens-in]', root), ln = $('[data-ki-lens-n]', root);
    list.innerHTML = S.map(function (s, i) {
      var w = s.title.split(' '), t = w.length > 1 ? esc(w.slice(0, -1).join(' ')) + ' <i>' + esc(w[w.length - 1]) + '</i>' : '<i>' + esc(s.title) + '</i>';
      return '<li class="ki-row" style="--c:' + s.color + '"><button type="button" class="ki-btn" aria-expanded="false" data-i="' + i + '"><span class="ki-n">' + pad(i + 1) + '</span><span class="ki-t">' + t + '</span><span class="ki-s">' + esc(s.sub) + '</span><span class="ki-go" aria-hidden="true">+</span></button>' +
        '<div class="ki-body"><div><div class="ki-in"><div class="ki-ph"><img src="' + P + s.img + '.jpg" alt="" loading="lazy"></div><div class="ki-txt">' + ico(s) + '<p>' + esc(s.text) + '</p>' + cta(s) + '</div></div></div></div></li>';
    }).join('');
    lin.innerHTML = S.map(function (s) { return '<img src="' + P + s.img + '.jpg" alt="">'; }).join('');
    var rows = $$('.ki-row', list), limgs = $$('img', lin), cur = -1, open = -1, shown = false;
    var qx = gsap.quickTo(lens, 'x', { duration: .55, ease: 'power3' }), qy = gsap.quickTo(lens, 'y', { duration: .55, ease: 'power3' }), qr = gsap.quickTo(lens, 'rotation', { duration: .8, ease: 'power3' });
    var lastX = 0; gsap.set(lens, { xPercent: 0, yPercent: -50 });
    function show(i) {
      if (i === cur) return;
      var prev = cur; cur = i;
      limgs.forEach(function (im, k) { if (k === i) { gsap.killTweensOf(im); im.style.zIndex = 2; gsap.fromTo(im, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.15 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: reduce ? 0 : .75, ease: 'expo.out' }); } else if (k === prev) { im.style.zIndex = 1; } else { im.style.zIndex = 0; gsap.set(im, { clipPath: 'inset(100% 0% 0% 0%)' }); } });
      ln.textContent = pad(i + 1);
    }
    if (fine && !reduce) {
      root.addEventListener('pointermove', function (e) {
        var r = root.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        qx(x + 80); qy(y); qr(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * .6)); lastX = e.clientX;
      });
      rows.forEach(function (row, i) {
        row.addEventListener('pointerenter', function () {
          if (row.classList.contains('open')) { hideLens(); return; }
          show(i); if (!shown) { shown = true; gsap.to(lens, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.6)' }); }
        });
      });
      list.addEventListener('pointerleave', hideLens);
    }
    function hideLens() { if (!shown) return; shown = false; gsap.to(lens, { opacity: 0, scale: .6, duration: .35, ease: 'power2.in' }); }
    function toggle(i) {
      var row = rows[i], was = open === i;
      if (open > -1) { rows[open].classList.remove('open'); $('.ki-btn', rows[open]).setAttribute('aria-expanded', 'false'); }
      open = was ? -1 : i;
      if (was) return;
      // the lens flies into the photo slot of the row that opens
      var ph = $('.ki-ph', row), lr = lens.getBoundingClientRect();
      row.classList.add('open'); $('.ki-btn', row).setAttribute('aria-expanded', 'true');
      if (shown && !reduce) {
        hideLens();
        requestAnimationFrame(function () {
          var pr = ph.getBoundingClientRect();
          gsap.fromTo(ph, { x: lr.left - pr.left, y: lr.top - pr.top, scaleX: lr.width / Math.max(1, pr.width), scaleY: lr.height / Math.max(1, pr.height), transformOrigin: '0 0', borderRadius: 22 },
            { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .95, ease: 'expo.inOut', clearProps: 'transform' });
        });
      } else if (!reduce) gsap.fromTo(ph, { clipPath: 'inset(0% 0% 100% 0% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: .9, ease: 'expo.out', delay: .15 });
      if (!reduce) gsap.fromTo($$('.ki-txt > *', row), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'silk', stagger: .07, delay: .25 });
    }
    rows.forEach(function (row, i) { $('.ki-btn', row).addEventListener('click', function () { toggle(i); }); });
    if (!reduce) gsap.from(rows, { y: 50, opacity: 0, duration: 1, ease: 'silk', stagger: .06, scrollTrigger: { trigger: list, start: 'top 80%', once: true } });
  })();

  /* =========== 2 · SHUFFLE MOSAIC =========== */
  (function () {
    var root = $('[data-sm]'); if (!root) return;
    var grid = $('[data-sm-grid]', root);
    grid.innerHTML = S.map(function (s, i) {
      return '<button type="button" class="sm-t' + (i === 0 ? ' big' : '') + '" data-i="' + i + '" style="--c:' + s.color + '" aria-pressed="' + (i === 0) + '"><img src="' + P + s.img + '.jpg" alt="" loading="lazy">' +
        '<span class="sm-top"><span class="sm-n">' + pad(i + 1) + '</span>' + ico(s) + '</span>' +
        '<span class="sm-b"><small>' + esc(s.sub) + '</small><b>' + esc(s.title) + '</b><span class="sm-more"><p>' + esc(s.text) + '</p>' + cta(s).replace('<a ', '<a tabindex="-1" ') + '</span></span></button>';
    }).join('');
    var tiles = $$('.sm-t', grid), busy = false;
    function pick(t) {
      if (busy || t.classList.contains('big')) return; busy = true;
      var state = Flip.getState(tiles, { props: 'borderRadius' });
      var old = $('.sm-t.big', grid); old.classList.remove('big'); old.setAttribute('aria-pressed', 'false');
      t.classList.add('big'); t.setAttribute('aria-pressed', 'true');
      grid.insertBefore(t, grid.firstChild);
      $$('.sm-more a', grid).forEach(function (a) { a.tabIndex = a.closest('.big') ? 0 : -1; });
      Flip.from(state, { duration: reduce ? 0 : 1, ease: 'expo.inOut', stagger: .025, absolute: true, nested: true, onComplete: function () { busy = false; } });
      if (!reduce) gsap.fromTo($$('.sm-b > *', t), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'silk', stagger: .07, delay: .55 });
    }
    tiles.forEach(function (t) {
      t.addEventListener('click', function (e) { if (e.target.closest('a')) return; pick(t); });
      if (fine && !reduce) {
        t.addEventListener('pointermove', function (e) { if (t.classList.contains('big')) return; var r = t.getBoundingClientRect(); gsap.to(t, { rotationY: ((e.clientX - r.left) / r.width - .5) * 10, rotationX: -((e.clientY - r.top) / r.height - .5) * 10, transformPerspective: 800, duration: .5, ease: 'power3.out', overwrite: 'auto' }); });
        t.addEventListener('pointerleave', function () { gsap.to(t, { rotationY: 0, rotationX: 0, duration: .8, ease: 'power3.out', overwrite: 'auto' }); });
      }
    });
    if (!reduce) gsap.from(tiles, { clipPath: 'inset(100% 0% 0% 0% round 22px)', y: 40, duration: 1.2, ease: 'silk', stagger: { each: .06, from: 'start' }, scrollTrigger: { trigger: grid, start: 'top 80%', once: true }, clearProps: 'clipPath,transform' });
  })();

  /* =========== 3 · GOLDEN THREAD =========== */
  (function () {
    var root = $('[data-gt]'); if (!root) return;
    var map = $('[data-gt-map]', root), base = $('[data-gt-base]', root), line = $('[data-gt-line]', root), spark = $('[data-gt-spark]', root), nodesEl = $('[data-gt-nodes]', root), panel = $('[data-gt-panel]', root);
    // a snake through three rows of three knots: the student's road from first call to settling in
    var X = [110, 450, 790], Y = [95, 300, 505], pts = [];
    [0, 1, 2].forEach(function (r) { var xs = r % 2 ? X.slice().reverse() : X; xs.forEach(function (x) { pts.push([x, Y[r]]); }); });
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var k = 1; k < pts.length; k++) {
      var a = pts[k - 1], b = pts[k];
      if (a[1] === b[1]) { var mx = (a[0] + b[0]) / 2, w = (k % 2 ? -1 : 1) * 46; d += ' C' + (a[0] + (b[0] - a[0]) * .3) + ' ' + (a[1] + w) + ', ' + (mx) + ' ' + (a[1] - w) + ', ' + mx + ' ' + a[1] + ' S' + (b[0] - (b[0] - a[0]) * .2) + ' ' + (b[1] + w) + ', ' + b[0] + ' ' + b[1]; }
      else { var dir = a[0] > 450 ? 1 : -1; d += ' C' + (a[0] + dir * 150) + ' ' + a[1] + ', ' + (b[0] + dir * 150) + ' ' + b[1] + ', ' + b[0] + ' ' + b[1]; }
    }
    base.setAttribute('d', d); line.setAttribute('d', d);
    var L = line.getTotalLength(), F = pts.map(function (p) { var best = 0, bd = 1e9; for (var s = 0; s <= 600; s++) { var q = line.getPointAtLength(L * s / 600), dd = Math.hypot(q.x - p[0], q.y - p[1]); if (dd < bd) { bd = dd; best = s / 600; } } return best; });
    nodesEl.innerHTML = S.map(function (s, i) { return '<button type="button" class="gt-node" data-i="' + i + '" style="left:' + (pts[i][0] / 9) + '%;top:' + (pts[i][1] / 6) + '%;--c:' + s.color + '" aria-label="' + esc(s.title) + '"><span class="gt-bub"><img src="' + P + s.img + '.jpg" alt="" loading="lazy"></span><span class="gt-dot">' + pad(i + 1) + '</span><span class="gt-lab">' + esc(s.title) + '</span></button>'; }).join('');
    var nodes = $$('.gt-node', nodesEl), cur = -1, at = 0;
    function paint(s, i) {
      return '<div class="gp-ph"><img src="' + P + s.img + '.jpg" alt=""><b>' + pad(i + 1) + '</b></div><div class="gp-bar" style="--c:' + s.color + '"></div><div class="gp-body">' + ico(s) + '<small>' + esc(s.sub) + '</small><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p>' + cta(s) +
        '<div class="gp-nav"><span>' + pad(i + 1) + ' / ' + pad(S.length) + '</span><button type="button" class="rbtn" data-d="-1" aria-label="Previous service">←</button><button type="button" class="rbtn" data-d="1" aria-label="Next service">→</button></div></div>';
    }
    function go(i) {
      if (i === cur) return; var dir = i > cur ? 1 : -1; cur = i;
      nodes.forEach(function (n, k) { n.classList.toggle('on', k === i); });
      var f = F[i];
      gsap.to(spark, { motionPath: { path: line, align: line, alignOrigin: [.5, .5], start: at, end: f }, duration: reduce ? 0 : Math.max(.6, Math.abs(f - at) * 2.4), ease: 'power2.inOut' });
      at = f;
      var swap = function () {
        panel.innerHTML = paint(S[i], i);
        $$('.gp-nav .rbtn', panel).forEach(function (b) { b.addEventListener('click', function () { go((cur + (+b.dataset.d) + S.length) % S.length); }); });
        if (!reduce) {
          gsap.fromTo($('.gp-ph img', panel), { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)', scale: 1.15 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1, ease: 'expo.out' });
          gsap.fromTo($$('.gp-body > *', panel), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'silk', stagger: .05, delay: .1 });
        }
      };
      if (panel.innerHTML && !reduce) gsap.to($$('.gp-body > *', panel), { y: -14, opacity: 0, duration: .22, stagger: .02, onComplete: swap }); else swap();
    }
    nodes.forEach(function (n, i) { n.addEventListener('click', function () { go(i); }); });
    gsap.set(spark, { motionPath: { path: line, align: line, alignOrigin: [.5, .5], start: 0, end: 0 } });
    if (reduce) { nodes.forEach(function (n) { n.classList.add('lit'); }); }
    else {
      gsap.set(line, { drawSVG: '0%' });
      gsap.to(line, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: map, start: 'top 80%', end: 'bottom 45%', scrub: .6, onUpdate: function (st) { nodes.forEach(function (n, k) { n.classList.toggle('lit', st.progress >= F[k] - .005); }); } } });
      gsap.from(nodes, { scale: 0, opacity: 0, duration: .7, ease: 'back.out(2)', stagger: .05, scrollTrigger: { trigger: map, start: 'top 80%', once: true } });
    }
    go(0);
  })();
})();
