/* ---------- 02 · Where you could live: Play a city ----------
   A turntable and a shelf of five record sleeves, one per region (data: window.CX.places).
   - Drag a sleeve onto the turntable, with a mouse or a finger, or just click or tap it: the tonearm lifts, the old
     record comes off, the new one flies from the sleeve to the platter, the arm swings back in and it spins.
   - The region's details read as the record's liner notes: a track list of the facts, its universities, and a link
     to its campuses. The round button pauses and plays. Nothing makes sound; the motion is the point.
   - On a phone the sleeves stand in a crate under the turntable. Touching a sleeve picks it up (the page does not
     scroll from the sleeves themselves, everywhere else it does); carrying it near the top or bottom of the screen
     scrolls the page along, and letting go over the turntable plays it. A sleeve dropped anywhere else slides home. */
(function () {
  'use strict';
  var root = document.querySelector('[data-vn]');
  if (!root || !window.CX || !window.CX.places) return;
  var G = window.gsap, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var P = './assets/img/photos/';
  var TRIP = {
    KUL: { t: 'About 4 h', how: 'direct to KLIA' },
    SGR: { t: 'About 4 h', how: 'KLIA itself is in Selangor' },
    PEN: { t: 'About 3¾ h', how: 'direct to Penang' },
    MLK: { t: 'About 6 h', how: '4 h to KLIA, then 2 h by road' },
    BOR: { t: 'About 6 h', how: '4 h to KL, then about 2 h on' }
  };
  var MAA = [13.0827, 80.2707];
  function km(p) {
    var r = Math.PI / 180, a = Math.sin((p.lat - MAA[0]) * r / 2), b = Math.sin((p.lon - MAA[1]) * r / 2);
    var h = a * a + Math.cos(MAA[0] * r) * Math.cos(p.lat * r) * b * b;
    return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) / 10) * 10;
  }
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var places = window.CX.places.map(function (p) {
    var x = TRIP[p.code] || { t: '', how: '' };
    return { name: p.name, tag: p.tag, code: p.code, color: p.color, count: p.count, text: p.text, chips: p.chips,
      km: km(p).toLocaleString('en-IN'), trip: x.t, how: x.how, thumb: P + p.img + '-w.jpg',
      href: './universities.html?state=' + encodeURIComponent(p.states[0]) };
  });
  var buzz = function (ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  // ---------- markup ----------
  var ROT = [-4, 3, -2, 4, -3];
  var up = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  root.innerHTML =
    '<div class="vn-deck" data-vn-deck>' +
      '<div class="vn-platter"><div class="vn-rec" data-vn-rec><div class="vn-disc"><div class="vn-label" data-vn-label><img alt=""><b></b></div></div></div></div>' +
      '<i class="vn-pivot" aria-hidden="true"></i><i class="vn-arm" aria-hidden="true"></i>' +
      '<p class="vn-now" aria-hidden="true"><span class="vn-eq"><i style="--k:0"></i><i style="--k:1"></i><i style="--k:2"></i><i style="--k:3"></i><i style="--k:4"></i></span></p>' +
      '<div class="vn-ctrl"><span class="vn-rpm">33⅓ RPM</span><button type="button" class="vn-play" data-vn-play aria-label="Pause the record">' +
        '<svg class="vn-i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg><svg class="vn-i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4.5h4.5v15H6zM13.5 4.5H18v15h-4.5z"/></svg></button></div>' +
    '</div>' +
    '<div class="vn-side">' +
      '<p class="vn-hint"><i>' + up + '</i><span class="t-fine">Drag a record onto the turntable, or click one.</span><span class="t-touch">Drag a record up onto the turntable, or tap one.</span></p>' +
      '<div class="vn-shelf" role="group" aria-label="Records, one per region">' + places.map(function (p, i) {
        return '<button type="button" class="vn-sleeve" data-i="' + i + '" style="--c:' + p.color + ';--r:' + ROT[i % 5] + 'deg" aria-label="Play ' + esc(p.name) + '" aria-pressed="false"><img src="' + p.thumb + '" alt="" loading="lazy" draggable="false"><span><small>' + p.code + '</small><b>' + esc(p.name) + '</b></span></button>';
      }).join('') + '</div>' +
      '<article class="vn-notes" data-vn-notes aria-live="polite"></article>' +
    '</div>';
  var deck = root.querySelector('[data-vn-deck]'), rec = root.querySelector('[data-vn-rec]'), label = root.querySelector('[data-vn-label]');
  var notes = root.querySelector('[data-vn-notes]'), playB = root.querySelector('[data-vn-play]');
  var sleeves = [].slice.call(root.querySelectorAll('.vn-sleeve')), cur = 0, busy = false;

  function setPlaying(on) { root.classList.toggle('is-playing', on); playB.setAttribute('aria-label', on ? 'Pause the record' : 'Play the record'); }
  playB.addEventListener('click', function () { setPlaying(!root.classList.contains('is-playing')); });

  function paint(i) {
    var p = places[i];
    label.style.setProperty('--c', p.color); label.querySelector('img').src = p.thumb; label.querySelector('b').textContent = p.code;
    notes.innerHTML = '<small>Now playing · record ' + pad(i + 1) + ' of ' + pad(places.length) + ' · ' + esc(p.tag) + '</small><h3>' + esc(p.name) + '</h3><p>' + esc(p.text) + '</p>' +
      '<ol class="vn-tracks">' +
        '<li><i>A1</i><span>Campuses</span><u></u><b>' + p.count + '</b></li>' +
        '<li><i>A2</i><span>From Chennai</span><u></u><b>' + p.km + ' km</b></li>' +
        '<li><i>A3</i><span>The trip<small>' + esc(p.how) + '</small></span><u></u><b>' + esc(p.trip) + '</b></li>' +
        '<li><i>B1</i><span>Featuring</span><u></u><b>' + p.chips.length + (p.chips.length === 1 ? ' university' : ' universities') + '</b></li>' +
      '</ol>' +
      '<div class="vn-chips">' + p.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' +
      '<a class="vn-cta" href="' + p.href + '" target="_blank" rel="opener">See these campuses <span aria-hidden="true">→</span></a>';
    sleeves.forEach(function (s, k) { s.classList.toggle('is-on', k === i); s.setAttribute('aria-pressed', String(k === i)); });
  }
  // from: where the new record starts its flight (the sleeve on the shelf, or wherever it was dropped)
  function select(i, from) {
    if (busy || i === cur) return;
    root.classList.add('is-used');
    var f = from || sleeves[i].getBoundingClientRect(), to = rec.getBoundingClientRect();
    cur = i;
    if (!G || reduce) { paint(i); setPlaying(true); return; }
    busy = true; setPlaying(false);
    var dx = f.left + f.width / 2 - (to.left + to.width / 2), dy = f.top + f.height / 2 - (to.top + to.height / 2), sc = f.width / to.width;
    G.timeline({ onComplete: function () { busy = false; } })
      .to(rec, { y: -to.height * .5, opacity: 0, scale: .9, duration: .42, ease: 'power2.in' }, .32)
      .add(function () { paint(i); })
      .fromTo(rec, { x: dx, y: dy, scale: sc, opacity: 0, rotation: -70 }, { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0, duration: .85, ease: 'expo.out' })
      .fromTo(notes.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out', stagger: .04, clearProps: 'transform,opacity' }, '<.1')
      .add(function () { setPlaying(true); }, '-=.2');
  }

  // ---------- drag and drop (mouse, pen and touch alike) ----------
  var drag = null, suppressClick = false;
  function overDeck(x, y) { var r = deck.getBoundingClientRect(), m = 18; return x > r.left - m && x < r.right + m && y > r.top - m && y < r.bottom + m; }
  function place() {
    if (!drag || !drag.on) return;
    // the sleeve's home position moves with the page while it scrolls, so recompute it each time
    var hx = drag.homeX - window.scrollX, hy = drag.homeY - window.scrollY;
    drag.s.style.transform = 'translate3d(' + (drag.x - drag.offX - hx).toFixed(1) + 'px,' + (drag.y - drag.offY - hy).toFixed(1) + 'px,0) rotate(-6deg) scale(1.12)';
    var hit = overDeck(drag.x, drag.y);
    if (hit !== drag.hit) { drag.hit = hit; deck.classList.toggle('is-target', hit); if (hit) buzz(8); }
  }
  // carrying a sleeve near the top or bottom edge of the screen scrolls the page along
  function edgeLoop() {
    if (!drag || !drag.on) return;
    var H = window.innerHeight, edge = Math.min(110, H * .16), v = 0;
    if (drag.y < edge) v = -Math.pow((edge - drag.y) / edge, 1.5) * 16;
    else if (drag.y > H - edge) v = Math.pow((drag.y - (H - edge)) / edge, 1.5) * 16;
    if (v) { if (window.TClenis) window.TClenis.scrollTo(window.scrollY + v, { immediate: true, force: true }); else window.scrollBy(0, v); place(); }
    drag.raf = requestAnimationFrame(edgeLoop);
  }
  function start(e) {
    if (busy || drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
    var s = e.currentTarget, r = s.getBoundingClientRect();
    drag = { s: s, i: +s.getAttribute('data-i'), id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, on: false, hit: false,
      offX: e.clientX - r.left, offY: e.clientY - r.top, homeX: r.left + window.scrollX, homeY: r.top + window.scrollY, raf: 0, type: e.pointerType };
    try { s.setPointerCapture(e.pointerId); } catch (x) {}
  }
  function move(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.on) {
      if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) < (drag.type === 'touch' ? 6 : 8)) return;
      // picked up: the sleeve lifts from the shelf (measure it flat, without its tilt or lift)
      drag.on = true; drag.s.classList.add('is-drag'); root.classList.add('is-dragging'); buzz(10);
      drag.raf = requestAnimationFrame(edgeLoop);
    }
    e.preventDefault(); place();
  }
  function end(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null; cancelAnimationFrame(d.raf);
    try { d.s.releasePointerCapture(d.id); } catch (x) {}
    if (!d.on) return;   // a plain tap or click: the click handler plays it
    suppressClick = true; setTimeout(function () { suppressClick = false; }, 300);
    var dropped = d.hit && e.type === 'pointerup', from = d.s.getBoundingClientRect();
    deck.classList.remove('is-target'); root.classList.remove('is-dragging');
    // the sleeve slides back to its place on the shelf (its CSS transition does the work)
    d.s.classList.remove('is-drag'); d.s.style.transform = '';
    if (dropped) { buzz(14); if (d.i === cur) { setPlaying(true); } else select(d.i, from); }
  }
  sleeves.forEach(function (s) {
    var i = +s.getAttribute('data-i');
    s.addEventListener('pointerdown', start);
    s.addEventListener('pointermove', move);
    s.addEventListener('pointerup', end);
    s.addEventListener('pointercancel', end);
    s.addEventListener('lostpointercapture', function (e) { if (drag && drag.s === s) end(e); });
    s.addEventListener('click', function (e) { if (suppressClick) { e.preventDefault(); return; } select(i); });
    s.addEventListener('contextmenu', function (e) { if (e.pointerType !== 'mouse') e.preventDefault(); });
    s.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drag) { var d = drag; drag = null; cancelAnimationFrame(d.raf); d.s.classList.remove('is-drag'); d.s.style.transform = ''; deck.classList.remove('is-target'); root.classList.remove('is-dragging'); } });

  paint(0); setPlaying(!reduce);
})();
