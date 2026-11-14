/* ---------- Our education-loan partners: the lender strip ----------
   The ten lenders glide past on their own. Point at the strip and it slows to a stop while the logos near the cursor
   swell like a dock; the filter chips pick out banks, education lenders or international lenders; and a click (or tap,
   or Enter) opens a card for that lender with what we arrange and a way to ask about it. Nothing here quotes a rate or
   a limit: those are set by each lender, and the card says so. */
(function () {
  'use strict';
  var root = document.querySelector('[data-lp]'); if (!root) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var L = './assets/img/partners/';
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var TYPES = { bank: 'Bank', nbfc: 'Education lender', intl: 'International lender' };
  var LENDERS = [
    { n: 'HDFC Credila', f: 'hdfc-credila.jpg', t: 'nbfc' }, { n: 'ICICI Bank', f: 'icici.png', t: 'bank' }, { n: 'IDFC FIRST Bank', f: 'idfc.jpg', t: 'bank' },
    { n: 'InCred', f: 'incred.jpg', t: 'nbfc' }, { n: 'MPOWER Financing', f: 'mpower.jpg', t: 'intl' }, { n: 'Prodigy Finance', f: 'prodigy.jpg', t: 'intl' },
    { n: 'Union Bank of India', f: 'union.jpg', t: 'bank' }, { n: 'Auxilo', f: 'auxilo.jpg', t: 'nbfc' }, { n: 'Avanse', f: 'avanse.jpg', t: 'nbfc' }, { n: 'Axis Bank', f: 'axis.jpg', t: 'bank' }
  ];
  var count = function (t) { return LENDERS.filter(function (l) { return !t || l.t === t; }).length; };

  // ---------- build ----------
  root.innerHTML =
    '<div class="lp-head"><p class="partners-k">Our education-loan partners</p>' +
      '<div class="lp-chips" role="group" aria-label="Show lenders">' +
        [['', 'All ' + count('')], ['bank', 'Banks · ' + count('bank')], ['nbfc', 'Education lenders · ' + count('nbfc')], ['intl', 'International · ' + count('intl')]].map(function (c, i) {
          return '<button type="button" data-t="' + c[0] + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + c[1] + '</button>';
        }).join('') +
      '</div></div>' +
    '<div class="lp-strip" data-lp-strip><div class="lp-track" data-lp-track>' +
      LENDERS.concat(LENDERS).map(function (l, i) {
        var dup = i >= LENDERS.length;
        return '<button type="button" class="lp-tile" data-i="' + (i % LENDERS.length) + '" data-t="' + l.t + '"' + (dup ? ' aria-hidden="true" tabindex="-1"' : ' aria-label="' + esc(l.n) + ', ' + TYPES[l.t].toLowerCase() + '. Open details"') + '>' +
          '<img src="' + L + l.f + '" alt="" loading="lazy" decoding="async"><i class="lp-tag">' + TYPES[l.t] + '</i></button>';
      }).join('') +
    '</div></div>' +
    '<p class="lp-hint">' + (fine ? 'Point at the strip to stop it, click a lender for details.' : 'Tap a lender for details.') + '</p>' +
    '<div class="lp-card" data-lp-card role="dialog" aria-modal="false" hidden></div>';

  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var strip = $('[data-lp-strip]'), track = $('[data-lp-track]'), tiles = $$('.lp-tile'), chips = $$('.lp-chips button'), card = $('[data-lp-card]');

  // ---------- the glide ----------
  var x = 0, speed = 1, half = 0, geo = [], hovering = false, px = -1e4, open = -1, filter = '', inView = false, raf = 0, last = 0;
  var PXS = 34;   // pixels a second at full speed
  function measure() {
    half = track.scrollWidth / 2;
    geo = tiles.map(function (t) { return { l: t.offsetLeft, w: t.offsetWidth }; });
  }
  function target() { return open > -1 ? 0 : hovering ? .06 : filter ? .45 : 1; }
  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    speed += (target() - speed) * Math.min(1, dt * 3.5);
    if (!reduce) { x -= speed * PXS * dt; if (half && x <= -half) x += half; track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)'; }
    // the dock: logos near the cursor swell and lift
    var sl = strip.getBoundingClientRect().left;
    tiles.forEach(function (t, i) {
      var g = geo[i]; if (!g) return;
      var cx = sl + g.l + g.w / 2 + x, d = Math.abs(cx - px);
      var k = hovering && !reduce ? Math.pow(Math.max(0, 1 - d / 340), 1.6) : 0;
      var s = 1 + .3 * k;
      t.style.transform = k > .001 ? 'translateY(' + (-(s - 1) * 30).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')' : '';
      t.style.zIndex = k > .3 ? 2 : '';
    });
    if (inView && !document.hidden && (speed > .002 || hovering || target() > 0)) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function kick() { if (!raf && inView) { last = 0; raf = requestAnimationFrame(frame); } }

  if (fine) {
    strip.addEventListener('pointermove', function (e) { px = e.clientX; if (!hovering) { hovering = true; } kick(); });
    strip.addEventListener('pointerleave', function () { hovering = false; px = -1e4; kick(); });
  }
  strip.addEventListener('focusin', function () { hovering = true; kick(); });
  strip.addEventListener('focusout', function () { hovering = false; kick(); });

  // ---------- filters ----------
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      filter = c.dataset.t;
      chips.forEach(function (o) { o.setAttribute('aria-pressed', String(o === c)); });
      tiles.forEach(function (t) { var m = !filter || t.dataset.t === filter; t.classList.toggle('is-dim', !m); t.classList.toggle('is-match', !!filter && m); });
      kick();
    });
  });

  // ---------- the lender card ----------
  function cardHTML(l) {
    var msg = encodeURIComponent('Hi Tutee Connect, I\'d like to know about an education loan with ' + l.n + ' for studying in Malaysia.');
    return '<button type="button" class="lp-x" aria-label="Close">✕</button>' +
      '<div class="lp-ch"><span class="lp-logo"><img src="' + L + l.f + '" alt=""></span><div><b>' + esc(l.n) + '</b><small>' + TYPES[l.t] + ' · education-loan partner</small></div></div>' +
      '<ul><li>Covers <b>tuition and accommodation</b></li><li><b>Collateral or non-collateral</b>, depending on your profile</li><li>Paperwork handled <b>alongside your offer letter</b></li></ul>' +
      '<p class="lp-note">Rates and limits are set by the lender. Your counsellor compares the lenders for your profile before you apply.</p>' +
      '<div class="lp-acts"><a class="btn btn--sun btn--sm" href="https://wa.me/917010902329?text=' + msg + '" target="_blank" rel="noopener">Ask about ' + esc(l.n.replace(/ (Financing|Finance|of India)$/, '')) + '</a><a class="btn btn--glass btn--sm" href="#begin" data-lp-close>Compare lenders</a></div>';
  }
  function place(tile) {
    var rr = root.getBoundingClientRect(), tr = tile.getBoundingClientRect(), cw = card.offsetWidth;
    var cx = tr.left + tr.width / 2 - rr.left, left = Math.max(8, Math.min(rr.width - cw - 8, cx - cw / 2));
    card.style.left = left + 'px'; card.style.setProperty('--ax', (cx - left) + 'px');
    card.style.top = (tr.top - rr.top - card.offsetHeight - 16) + 'px';
  }
  var lastTile = null;
  function openCard(i, tile) {
    open = i; lastTile = tile;
    card.innerHTML = cardHTML(LENDERS[i]); card.setAttribute('aria-label', LENDERS[i].n); card.hidden = false;
    tiles.forEach(function (t) { t.classList.toggle('is-open', t === tile); });
    if (matchMedia('(min-width: 700px)').matches) place(tile); else { card.style.left = ''; card.style.top = ''; }
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
    $('.lp-x').focus({ preventScroll: true });
    kick();
  }
  function closeCard(refocus) {
    if (open < 0) return; open = -1; card.hidden = true; card.classList.remove('in');
    tiles.forEach(function (t) { t.classList.remove('is-open'); });
    if (refocus && lastTile) lastTile.focus({ preventScroll: true });
    kick();
  }
  tiles.forEach(function (t) { t.addEventListener('click', function (e) { e.stopPropagation(); var i = +t.dataset.i; if (open === i && lastTile === t) closeCard(); else openCard(i, t); }); });
  card.addEventListener('click', function (e) { e.stopPropagation(); if (e.target.closest('.lp-x')) closeCard(true); else if (e.target.closest('[data-lp-close]')) closeCard(); });
  document.addEventListener('click', function () { closeCard(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open > -1) closeCard(true); });
  addEventListener('resize', function () { measure(); if (open > -1 && lastTile && matchMedia('(min-width: 700px)').matches) place(lastTile); });

  // ---------- start ----------
  if (reduce) root.classList.add('is-still');
  measure();
  $$('.lp-tile img').forEach(function (im) { if (!im.complete) im.addEventListener('load', measure, { once: true }); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) { measure(); kick(); } }, { rootMargin: '10% 0px' }).observe(strip);
  else { inView = true; kick(); }
  document.addEventListener('visibilitychange', kick);
})();
