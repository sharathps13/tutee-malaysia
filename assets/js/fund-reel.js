/* ---------- 09 · Scholarships, loans & work: the funding reel ----------
   A short film in a video player, animated frame by frame at 30 fps the same way the Students & parents card is:
   springs for things that land, an exponential ease for things that slide, words rising out of a blur, a highlighter
   sweep on the key phrase. Three chapters of 7 seconds each:
     01 Scholarships     a tuition bill gets stamped, and the share you pay shrinks to part, then none
     02 Education loans  collateral and non-collateral switch on, tuition then living costs fill, ten lenders arrive
     03 Vacation work    a term-and-break calendar is scanned: no work in term, up to 20 hours a week in breaks
   It plays while the section is on screen and loops. Play/pause, click the stage, seek on the chapter bar, jump with
   the chapter buttons or the arrow keys. With reduced motion it shows each chapter's finished frame instead. */
(function () {
  'use strict';
  var root = document.querySelector('[data-fr]'); if (!root) return;
  var FPS = 30, LEN = 210, N = 3, TOTAL = LEN * N;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P = './assets/img/photos/', L = './assets/img/partners/';

  // ---------- the reference's maths ----------
  var clamp01 = function (t) { return t < 0 ? 0 : t > 1 ? 1 : t; };
  var H = function (t, a, b) { return clamp01((t - a) / Math.max(1e-6, b - a)); };
  var expo = function (t) { var s = clamp01(t); return s >= 1 ? 1 : 1 - Math.pow(2, -10 * s); };
  var inout = function (t) { var s = clamp01(t); return s < .5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2; };
  function spring(frame, cfg) {
    if (frame <= 0) return 0;
    var t = frame / FPS, w0 = Math.sqrt(cfg.stiffness / cfg.mass), z = cfg.damping / (2 * Math.sqrt(cfg.stiffness * cfg.mass)), v;
    if (z < 1) { var wd = w0 * Math.sqrt(1 - z * z); v = 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
    else v = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    return Math.abs(1 - v) < .001 && t > .3 ? 1 : v;
  }
  var CARD = { damping: 16, stiffness: 120, mass: .9 }, POP = { damping: 8, stiffness: 220, mass: .6 }, CHIP = { damping: 11, stiffness: 160, mass: .7 };
  var r2 = function (n) { return Math.round(n * 100) / 100; };
  var mmss = function (f) { var s = Math.floor(f / FPS); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); };

  // ---------- the three chapters ----------
  var ICO = {
    check: '<path d="M20 6 9 17l-5-5"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    food: '<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M17 3c-2 0-3 2-3 5s1 4 3 4v9"/>', fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M7 8h5M15 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
    shop: '<path d="M4 7h16l-1.5 13h-13zM9 7V5a3 3 0 0 1 6 0v2"/>', hotel: '<path d="M3 20V6M3 13h18v7M21 13a4 4 0 0 0-4-4h-7v4M7 11.5a1.5 1.5 0 1 0 0-.01"/>',
    stamp: '<path d="M9 3h6l-1 6h3a2 2 0 0 1 2 2v3H5v-3a2 2 0 0 1 2-2h3zM4 18h16v3H4z"/>'
  };
  var ico = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[k] + '</svg>'; };
  var CH = [
    { name: 'Scholarships', k: '01 · Merit awards, bursaries and grants', img: 'fund-1', title: 'Scholarships that can cover *part or all of tuition.*',
      p: 'We match strong profiles to institutional scholarships, and coach you through the essays that win them.',
      pts: ['Merit and need-based awards', 'Essay and interview coaching', 'Deadlines tracked for you'], ptAt: [118, 132, 146],
      vis: '<div class="frl-card frl-bill"><div class="frl-ch"><b>Tuition, per year</b><small>Public university</small></div>' +
        '<div class="frl-row"><span>Tuition</span><b>from RM 14,000</b></div><div class="frl-row"><span>Applied for</span><b>Institutional scholarship</b></div><div class="frl-row"><span>Essay coaching</span><b class="frl-ok">' + ico('check') + 'Done</b></div>' +
        '<div class="frl-pay"><div class="frl-pay-l"><span>You pay</span><b data-pay-l>All of it</b></div><div class="frl-bar"><i class="frl-bar-cov"></i><i class="frl-bar-you"></i></div></div>' +
        '<span class="frl-stamp">Scholarship<small>awarded</small></span></div>' },
    { name: 'Education loans', k: '02 · With or without collateral', img: 'fund-2', title: 'Loans for tuition *and living costs.*',
      p: 'Direct tie-ups with national banks and private lenders, with the paperwork handled alongside your offer letter.',
      pts: ['Collateral and non-collateral', 'Tuition plus living costs', '10 lending partners'], ptAt: [60, 112, 168],
      vis: '<div class="frl-card frl-loan"><div class="frl-ch"><b>Your loan plan</b><small>Arranged before you fly</small></div>' +
        '<div class="frl-tg"><span class="frl-sw" data-sw="0"><i></i>Collateral</span><span class="frl-sw" data-sw="1"><i></i>Non-collateral</span></div>' +
        '<div class="frl-stack"><div class="frl-seg frl-seg-a"><i></i><span>Tuition</span></div><div class="frl-seg frl-seg-b"><i></i><span>Accommodation and living</span></div></div>' +
        '<div class="frl-lenders"><div class="frl-lh"><b data-lend>0</b><span>lending partners</span></div><div class="frl-logos">' +
        ['auxilo.jpg', 'avanse.jpg', 'axis.jpg', 'hdfc-credila.jpg', 'icici.png', 'idfc.jpg', 'incred.jpg', 'mpower.jpg', 'prodigy.jpg', 'union.jpg'].map(function (f) { return '<span><img src="' + L + f + '" alt="" loading="lazy" decoding="async"></span>'; }).join('') +
        '</div></div></div>' },
    { name: 'Vacation work', k: '03 · Earning in Malaysia, the real rules', img: 'fund-3', title: 'Work the breaks, *not the term.*',
      p: 'In semester breaks longer than seven days you may work, with prior Immigration Department approval that your institution applies for.',
      pts: ['Up to 20 hours a week in breaks', 'Approved sectors only', 'Your institution applies for permission'], ptAt: [140, 160, 180],
      vis: '<div class="frl-card frl-work"><div class="frl-ch"><b>Your year</b><small>Term and semester break</small></div>' +
        '<div class="frl-cal">' + Array.apply(null, Array(16)).map(function (x, i) { return '<i class="' + (i < 12 ? 'is-term' : 'is-break') + '"></i>'; }).join('') + '<b class="frl-cur"></b></div>' +
        '<div class="frl-cal-l"><span>Term</span><span>Break, 7+ days</span></div>' +
        '<div class="frl-state"><span class="frl-pill" data-pill></span><div class="frl-hrs"><b data-hrs>0</b><span>hours a week, at most</span><div class="frl-meter"><i></i></div></div></div>' +
        '<div class="frl-sec"><span>' + ico('food') + 'Restaurants</span><span>' + ico('fuel') + 'Petrol kiosks</span><span>' + ico('shop') + 'Mini markets</span><span>' + ico('hotel') + 'Hotels</span></div>' +
        '<span class="frl-stamp frl-stamp--ok">Approved<small>by Immigration, before you start</small></span></div>' }
  ];
  function words(t) {
    var out = [], em = false;
    t.split(/\s+/).forEach(function (w) { var s = w; var open = s[0] === '*'; if (open) { em = true; s = s.slice(1); } var close = /\*[.,!?]?$/.test(s); s = s.replace('*', ''); out.push({ t: s, em: em }); if (close) em = false; });
    return out;
  }

  // ---------- build ----------
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  root.innerHTML =
    '<div class="frl-player" tabindex="0" role="region" aria-roledescription="video" aria-label="Funding explained in three short chapters. Space plays or pauses, arrow keys change chapter.">' +
      '<div class="frl-bgs" aria-hidden="true">' + CH.map(function (c) { return '<img src="' + P + c.img + '.jpg" alt="" loading="lazy" decoding="async">'; }).join('') + '</div>' +
      '<div class="frl-scenes">' + CH.map(function (c, i) {
        return '<div class="frl-scene" data-s="' + i + '"' + (i ? ' aria-hidden="true"' : '') + '><div class="frl-copy"><span class="frl-k">' + esc(c.k) + '</span>' +
          '<h3 class="frl-t">' + words(c.title).map(function (w) { return '<span class="frl-w' + (w.em ? ' frl-em' : '') + '">' + esc(w.t) + '</span>'; }).join(' ') + '</h3>' +
          '<p class="frl-p">' + esc(c.p) + '</p><ul class="frl-pts">' + c.pts.map(function (p) { return '<li>' + ico('check') + esc(p) + '</li>'; }).join('') + '</ul></div>' +
          '<div class="frl-vis">' + c.vis + '</div></div>';
      }).join('') + '</div>' +
      '<div class="frl-top" aria-hidden="true"><span class="frl-live"><i></i>Funding</span><span class="frl-chn" data-chn>01 / 03</span></div>' +
      '<button type="button" class="frl-big" aria-hidden="true" tabindex="-1"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
      '<div class="frl-ctl">' +
        '<button type="button" class="frl-pp" data-pp aria-label="Pause"><svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1.2"/><rect x="14" y="4.5" width="4" height="15" rx="1.2"/></svg><svg class="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<span class="frl-time" data-time>0:00 / ' + mmss(TOTAL) + '</span>' +
        '<div class="frl-seek" data-seek role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="' + Math.round(TOTAL / FPS) + '" aria-valuenow="0">' + CH.map(function () { return '<span class="frl-segp"><i></i></span>'; }).join('') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="frl-chaps" role="group" aria-label="Chapters">' + CH.map(function (c, i) {
      return '<button type="button" data-ch="' + i + '"><img src="' + P + c.img + '.jpg" alt="" loading="lazy" decoding="async"><span><small>' + (i < 9 ? '0' : '') + (i + 1) + ' · ' + mmss(i * LEN) + '</small><b>' + esc(c.name) + '</b></span><i class="frl-chp"><i></i></i></button>';
    }).join('') + '</div>';

  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var player = $('.frl-player'), scenes = $$('.frl-scene'), bgs = $$('.frl-bgs img'), segs = $$('.frl-segp i'), chaps = $$('.frl-chaps button'), chp = $$('.frl-chp i');
  var ppB = $('[data-pp]'), timeEl = $('[data-time]'), seek = $('[data-seek]'), chn = $('[data-chn]'), big = $('.frl-big');
  var S = scenes.map(function (sc, i) {
    return { root: sc, k: $('.frl-k', sc), w: $$('.frl-w', sc), em: $$('.frl-em', sc), p: $('.frl-p', sc), pts: $$('.frl-pts li', sc), card: $('.frl-card', sc), rows: $$('.frl-row, .frl-ch', sc), stamp: $('.frl-stamp', sc),
      payL: $('[data-pay-l]', sc), you: $('.frl-bar-you', sc), cov: $('.frl-bar-cov', sc), pay: $('.frl-pay', sc),
      sw: $$('.frl-sw', sc), segA: $('.frl-seg-a i', sc), segB: $('.frl-seg-b i', sc), segs: $$('.frl-seg', sc), logos: $$('.frl-logos span', sc), lend: $('[data-lend]', sc), lh: $('.frl-lh', sc),
      cells: $$('.frl-cal i', sc), cur: $('.frl-cur', sc), pill: $('[data-pill]', sc), hrs: $('[data-hrs]', sc), meter: $('.frl-meter i', sc), hrsBox: $('.frl-hrs', sc), sec: $$('.frl-sec span', sc), calL: $('.frl-cal-l', sc) };
  });

  // ---------- drawing one frame ----------
  var set = function (el, o, tf, extra) { if (!el) return; el.style.opacity = r2(o); el.style.transform = tf || ''; if (extra) for (var k in extra) el.style[k] = extra[k]; };
  function copy(s, c, f) {
    var ek = expo(H(f, 4, 18)); set(s.k, ek, 'translateX(' + r2((1 - ek) * -24) + 'px)');
    s.w.forEach(function (w, k) { var a = 10 + k * 2.6, e = expo(H(f, a, a + 9)); set(w, e, 'translateY(' + r2((1 - e) * .5) + 'em)', { filter: e < 1 ? 'blur(' + r2((1 - e) * 6) + 'px)' : '' }); });
    var hl = expo(H(f, 52, 64)); s.em.forEach(function (w) { w.style.setProperty('--hl', r2(hl)); });
    var ep = expo(H(f, 36, 52)); set(s.p, ep, 'translateY(' + r2((1 - ep) * 14) + 'px)');
    s.pts.forEach(function (li, k) { var sp = spring(f - c.ptAt[k], CHIP); set(li, clamp01(sp * 1.4), 'translateY(' + r2((1 - sp) * 12) + 'px) scale(' + r2(.9 + .1 * sp) + ')'); li.classList.toggle('on', f >= c.ptAt[k] + 6); });
  }
  function cardIn(s, f) {
    var sp = spring(f - 12, CARD); set(s.card, clamp01(sp * 1.3), 'perspective(900px) translateY(' + r2((1 - sp) * 70) + 'px) rotateX(' + r2((1 - sp) * 14) + 'deg) scale(' + r2(.94 + .06 * sp) + ')');
    s.rows.forEach(function (r, k) { var e = expo(H(f, 22 + k * 6, 34 + k * 6)); set(r, e, 'translateY(' + r2((1 - e) * 10) + 'px)'); });
  }
  var DRAW = [
    function (s, f) {   // scholarships
      cardIn(s, f);
      var ep = expo(H(f, 44, 58)); set(s.pay, ep, 'translateY(' + r2((1 - ep) * 10) + 'px)');
      var you = 1 - .55 * expo(H(f, 92, 112)) - .45 * expo(H(f, 150, 170));
      s.you.style.transform = 'scaleX(' + r2(you) + ')'; s.cov.style.transform = 'scaleX(' + r2(1 - you) + ')';
      s.payL.textContent = f < 96 ? 'All of it' : f < 152 ? 'Part of it' : 'None of it';
      var st = spring(f - 80, POP); set(s.stamp, H(f, 80, 83), 'translate(-50%,-50%) rotate(-14deg) scale(' + r2(2.2 - 1.2 * st) + ')');
      if (f >= 80 && f < 96) { var k = (f - 80) / 16; s.card.style.transform += ' translateX(' + r2(Math.sin(k * 26) * 7 * (1 - k)) + 'px)'; }
    },
    function (s, f) {   // loans
      cardIn(s, f);
      s.sw.forEach(function (w, k) { var a = 44 + k * 14, e = expo(H(f, 30 + k * 6, 42 + k * 6)); set(w, e, 'translateY(' + r2((1 - e) * 10) + 'px)'); w.classList.toggle('on', f >= a); });
      s.segs.forEach(function (g, k) { var e = expo(H(f, 64 + k * 4, 76 + k * 4)); set(g, e, ''); });
      s.segA.style.transform = 'scaleX(' + r2(inout(H(f, 76, 100))) + ')'; s.segB.style.transform = 'scaleX(' + r2(inout(H(f, 100, 124))) + ')';
      s.segs[0].classList.toggle('on', f >= 100); s.segs[1].classList.toggle('on', f >= 124);
      var lh = expo(H(f, 124, 136)); set(s.lh, lh, 'translateY(' + r2((1 - lh) * 10) + 'px)');
      s.logos.forEach(function (l, k) { var sp = spring(f - (130 + k * 3.5), POP); set(l, clamp01(sp * 1.6), 'scale(' + r2(.4 + .6 * sp) + ')'); });
      s.lend.textContent = Math.round(10 * H(f, 130, 166));
    },
    function (s, f) {   // work
      cardIn(s, f);
      s.cells.forEach(function (c, k) { var e = expo(H(f, 26 + k * 1.4, 34 + k * 1.4)); set(c, e, 'scaleY(' + r2(.3 + .7 * e) + ')'); });
      set(s.calL, expo(H(f, 44, 54)), '');
      var x = inout(H(f, 50, 140)), idx = Math.min(15, Math.floor(x * 16));
      s.cur.style.opacity = r2(H(f, 46, 52) * (1 - H(f, 150, 158))); s.cur.style.left = r2(x * 100) + '%';
      s.cells.forEach(function (c, k) { c.classList.toggle('lit', f >= 50 && k <= idx); });
      var inBreak = f >= 50 && idx >= 12;
      var es = expo(H(f, 50, 60)); set(s.pill, es, 'translateY(' + r2((1 - es) * 8) + 'px)');
      s.pill.textContent = inBreak ? 'Semester break: work allowed' : 'Term time: no work';
      s.pill.classList.toggle('go', inBreak);
      var hr = expo(H(f, 118, 146)); s.hrs.textContent = Math.round(20 * hr); s.meter.style.transform = 'scaleX(' + r2(hr) + ')';
      set(s.hrsBox, .35 + .65 * H(f, 112, 120), '');
      s.sec.forEach(function (e, k) { var sp = spring(f - (150 + k * 6), CHIP); set(e, clamp01(sp * 1.4), 'translateY(' + r2((1 - sp) * 14) + 'px)'); });
      var st = spring(f - 180, POP); set(s.stamp, H(f, 180, 183), 'translate(-50%,-50%) rotate(-10deg) scale(' + r2(2 - st) + ')');
    }
  ];
  var shown = -1;
  function render(T) {
    T = Math.max(0, Math.min(TOTAL - 1, T));
    var c = Math.floor(T / LEN), f = T - c * LEN;
    if (c !== shown) {
      scenes.forEach(function (sc, i) { sc.classList.toggle('on', i === c); if (i === c) sc.removeAttribute('aria-hidden'); else sc.setAttribute('aria-hidden', 'true'); });
      chaps.forEach(function (b, i) { b.classList.toggle('on', i === c); b.setAttribute('aria-current', i === c ? 'true' : 'false'); });
      chn.textContent = '0' + (c + 1) + ' / 0' + N;
      shown = c;
    }
    // the scene fades up at its start and dips out at its end, like a cut with a short dissolve
    var vin = H(f, 0, 9), vout = 1 - H(f, LEN - 9, LEN);
    scenes[c].style.opacity = r2(Math.min(vin, vout));
    bgs.forEach(function (b, i) { b.style.opacity = i === c ? r2(.55 * Math.min(1, vin * 1.5, vout * 1.5 + .3)) : 0; b.style.transform = i === c ? 'scale(' + r2(1.06 + .06 * f / LEN) + ')' : ''; });
    DRAW[c](S[c], f);
    segs.forEach(function (g, i) { g.style.transform = 'scaleX(' + r2(i < c ? 1 : i > c ? 0 : f / LEN) + ')'; });
    chp.forEach(function (g, i) { g.style.transform = 'scaleX(' + r2(i < c ? 1 : i > c ? 0 : f / LEN) + ')'; });
    timeEl.textContent = mmss(T) + ' / ' + mmss(TOTAL);
    seek.setAttribute('aria-valuenow', Math.floor(T / FPS)); seek.setAttribute('aria-valuetext', CH[c].name + ', ' + mmss(T));
  }

  // ---------- the player ----------
  var T = 0, playing = !still, inView = false, raf = 0, last = 0;
  function loop(now) {
    raf = 0;
    if (!playing || !inView || document.hidden) { last = 0; return; }
    if (last) T += Math.min(4, (now - last) / (1000 / FPS));
    last = now;
    if (T >= TOTAL) T = 0;
    render(Math.floor(T));
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && playing && inView) { last = 0; raf = requestAnimationFrame(loop); } }
  function setPlaying(on, flash) {
    playing = on; player.classList.toggle('is-paused', !on);
    ppB.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (flash) { big.classList.remove('flash'); void big.offsetWidth; big.classList.add('flash'); }
    kick();
  }
  function seekTo(t, keep) {
    T = Math.max(0, Math.min(TOTAL - 1, t));
    render(Math.floor(T));
    if (!keep && still) setPlaying(false);
  }
  function chapter(i) { seekTo(still ? i * LEN + LEN - 20 : i * LEN, true); }
  ppB.addEventListener('click', function (e) { e.stopPropagation(); setPlaying(!playing, true); });
  $('.frl-scenes').addEventListener('click', function () { setPlaying(!playing, true); });
  chaps.forEach(function (b, i) { b.addEventListener('click', function () { chapter(i); if (!still) setPlaying(true); }); });
  // seeking: click or drag along the chapter bar
  function seekAt(x) { var r = seek.getBoundingClientRect(); seekTo(clamp01((x - r.left) / r.width) * TOTAL, true); }
  var dragging = false;
  seek.addEventListener('pointerdown', function (e) { dragging = true; seek.setPointerCapture(e.pointerId); seekAt(e.clientX); player.classList.add('is-seeking'); });
  seek.addEventListener('pointermove', function (e) { if (dragging) seekAt(e.clientX); });
  var endDrag = function () { dragging = false; player.classList.remove('is-seeking'); };
  seek.addEventListener('pointerup', endDrag); seek.addEventListener('pointercancel', endDrag);
  player.addEventListener('keydown', function (e) {
    var c = Math.floor(T / LEN);
    if (e.key === ' ' || e.key === 'k' || e.key === 'K') { e.preventDefault(); setPlaying(!playing, true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); chapter((c + 1) % N); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); chapter(T - c * LEN > 45 ? c : (c - 1 + N) % N); }
  });

  // plays while on screen, holds when it isn't
  if (still) { player.classList.add('is-paused'); playing = false; }
  render(still ? LEN - 20 : 0);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; kick(); }, { threshold: .35 }).observe(player);
  else { inView = true; kick(); }
  document.addEventListener('visibilitychange', kick);
})();
