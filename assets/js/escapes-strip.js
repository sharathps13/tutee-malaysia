/* Semester breaks · the twelve escapes, with travel notes (map positions kept for later use). */
(function () {
  if (window.gsap) window.gsap.registerPlugin.apply(window.gsap, ['ScrollTrigger', 'Flip', 'Draggable', 'InertiaPlugin', 'SplitText', 'DrawSVGPlugin', 'MotionPathPlugin'].map(function (n) { return window[n]; }).filter(Boolean));
  var TYPES = { islands: { name: 'Islands & beaches', color: '#0E8FA8' }, rainforest: { name: 'Rainforest', color: '#2E8B57' }, highlands: { name: 'Mountains & highlands', color: '#7A5AC8' }, wildlife: { name: 'Wildlife', color: '#E0701A' } };
  var ESC = [
    { id: 'skybridge', name: 'Langkawi Sky Bridge', img: 'e-skybridge', region: 'Langkawi, Kedah', lon: 99.66, lat: 6.38, type: 'highlands', trip: 'Weekend', get: 'A 1 hr flight from KL, then the cable car up Gunung Mat Cincang', best: 'November to April, the drier months on the west coast', tip: 'Go up early, before cloud settles on the peaks.' },
    { id: 'redang', name: 'Redang Island', img: 'e-redang', region: 'Terengganu', lon: 103.0, lat: 5.78, type: 'islands', trip: 'Long weekend', get: 'A flight to Kuala Terengganu, then a boat out to the island', best: 'March to October; many resorts close for the November to February monsoon', tip: 'It is a marine park, so you can snorkel straight off the beach.' },
    { id: 'kinabalu', name: 'Mount Kinabalu', img: 'e-kinabalu', region: 'Sabah, Malaysian Borneo', lon: 116.56, lat: 6.08, type: 'highlands', trip: 'Long break', get: 'A 2½ hr flight to Kota Kinabalu, then about 2 hrs by road to the park', best: 'Climbable year-round; usually drier from March to September', tip: 'At 4,095 m it is Malaysia\'s highest peak. The climb takes two days and needs a permit booked well ahead.' },
    { id: 'cameron', name: 'Cameron Highlands', img: 'e-tea', region: 'Pahang', lon: 101.38, lat: 4.47, type: 'highlands', trip: 'Weekend', get: 'About 4 hrs by bus or car from KL', best: 'Any time of year; it stays cool all year round', tip: 'Pack a jacket: evenings in tea country are cool.' },
    { id: 'orangutan', name: 'Orangutans', img: 'e-orangutan', region: 'Sepilok, Sabah', lon: 117.95, lat: 5.87, type: 'wildlife', trip: 'Long break', get: 'A flight to Sandakan, then about 30 min by road to Sepilok', best: 'Any time of year; plan around the morning and afternoon feeding times', tip: 'The rehabilitation centre has viewing platforms where the orangutans come to feed.' },
    { id: 'perhentian', name: 'Perhentian Islands', img: 'e-boats', region: 'Terengganu', lon: 102.74, lat: 5.92, type: 'islands', trip: 'Long weekend', get: 'A flight to Kota Bharu, a drive to Kuala Besut, then a speedboat', best: 'March to October; boats stop running in the monsoon', tip: 'There are no roads on the islands. You walk or hop between beaches by water taxi.' },
    { id: 'cablecar', name: 'Langkawi Cable Car', img: 'e-cablecar', region: 'Langkawi, Kedah', lon: 99.74, lat: 6.43, type: 'highlands', trip: 'Weekend', get: 'A 1 hr flight from KL; the base station is at Oriental Village', best: 'November to April', tip: 'Rides pause in high wind, so keep a spare morning in your plan.' },
    { id: 'kkislands', name: 'Islands off Sabah', img: 'e-islands', region: 'Kota Kinabalu, Sabah', lon: 115.98, lat: 5.98, type: 'islands', trip: 'Long weekend', get: 'A 2½ hr flight to Kota Kinabalu, then a short boat ride from the city jetty', best: 'March to September', tip: 'Tunku Abdul Rahman Park has five islands, and boats leave the same jetty for all of them.' },
    { id: 'canopy', name: 'Canopy walks', img: 'e-canopy', region: 'Taman Negara, Pahang', lon: 102.4, lat: 4.38, type: 'rainforest', trip: 'Long weekend', get: 'About 4 hrs from KL by road, then by river boat', best: 'March to October, outside the heaviest rains', tip: 'Taman Negara is often described as one of the oldest rainforests on Earth.' },
    { id: 'beach', name: 'White-sand beaches', img: 'e-beach', region: 'East-coast islands such as Tioman', lon: 104.17, lat: 2.8, type: 'islands', trip: 'Long weekend', get: 'A bus to Mersing, then a ferry across', best: 'March to October', tip: 'Ferries run less often in the monsoon months, so check the timetable first.' },
    { id: 'falls', name: 'Rainforest waterfalls', img: 'e-falls', region: 'Around the Klang Valley', lon: 101.98, lat: 3.36, type: 'rainforest', trip: 'Day trip', get: 'An hour or less by car or e-hailing from KL', best: 'Any time of year; go in the morning, before the afternoon rain', tip: 'Wear shoes that can get wet. The rocks around the pools are slippery.' },
    { id: 'sunset', name: 'Langkawi sunsets', img: 'e-sunset', region: 'Langkawi, Kedah', lon: 99.72, lat: 6.29, type: 'islands', trip: 'Weekend', get: 'A 1 hr flight from KL', best: 'November to April', tip: 'Pantai Cenang faces west over the Andaman Sea, so the sun sets straight ahead.' }
  ];
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var photo = function (e) { return './assets/img/photos/' + e.img + '.jpg'; };
  var motion = !matchMedia('(prefers-reduced-motion: reduce)').matches && !!window.gsap;
  window.BRK = { ESC: ESC, TYPES: TYPES, esc: esc, photo: photo, motion: motion, TRIPS: ['Day trip', 'Weekend', 'Long weekend', 'Long break'] };
})();

/* Semester breaks · journey strip
   A strip of destination panels slides sideways. Each photo wipes in and drifts (parallax), the title rises letter
   by letter, and a rail of dots tracks and jumps between stops. The page is never pinned: while the strip is on screen
   it glides from stop to stop on its own (pausing while you hover or focus it), and the rail, the arrow keys or a
   sideways trackpad swipe move it too. Vertical scrolling always just scrolls the page.
   Phones get a vertical stack that reveals as it scrolls. */
(function () {
  var root = document.querySelector('#escapes [data-js]'); if (!root || !window.BRK) return;
  var B = window.BRK, gsap = window.gsap, M = B.motion, esc = B.esc;
  var track = root.querySelector('[data-js-track]'), slot = root.querySelector('[data-js-panels]'), bar = root.querySelector('[data-js-bar]'), dotsEl = root.querySelector('[data-js-dots]');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  slot.outerHTML = B.ESC.map(function (e, i) {
    return '<div class="js-p js-dest' + (i % 2 ? ' alt' : '') + '" data-i="' + i + '"><div class="js-ph"><img data-src="' + B.photo(e) + '" alt="' + esc(e.name) + '" decoding="async" draggable="false"><span class="js-n" aria-hidden="true">' + pad(i + 1) + '</span><span class="js-tag">' + esc(B.TYPES[e.type].name) + '</span></div>' +
      '<div class="js-meta"><span class="js-reg">' + esc(e.region) + '</span><h3>' + esc(e.name) + '</h3><div class="js-facts"><div><small>Getting there</small><span>' + esc(e.get) + '</span></div><div><small>Best time</small><span>' + esc(e.best) + '</span></div><div><small>Trip length</small><span>' + esc(e.trip) + '</span></div></div><p class="js-tip">' + esc(e.tip) + '</p></div></div>';
  }).join('');
  var panels = [].slice.call(root.querySelectorAll('.js-dest'));
  // the twelve photos download only once the section is within a screen of view, not with the first screen
  (function () {
    var imgs = [].slice.call(root.querySelectorAll('img[data-src]'));
    var go = function () { imgs.forEach(function (im) { im.src = im.getAttribute('data-src'); im.removeAttribute('data-src'); }); };
    if (!('IntersectionObserver' in window)) return go();
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); go(); } }, { rootMargin: '100% 0px' });
    o.observe(root.closest('section') || root);
  })();
  dotsEl.innerHTML = B.ESC.map(function (e, i) { return '<button type="button" data-i="' + i + '" title="' + esc(e.name) + '">' + pad(i + 1) + ' ' + esc(e.name.split(' ')[0]) + '</button>'; }).join('');
  var dots = [].slice.call(dotsEl.children), active = -1;
  function mark(i) { if (i === active) return; active = i; dots.forEach(function (d, k) { d.classList.toggle('on', k === i); }); }

  if (!gsap) return;
  var outro = root.querySelector('.js-outro'), stops = panels.concat(outro ? [outro] : []);
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 761px)', motion: '(prefers-reduced-motion: no-preference)' }, function (ctx) {
    var c = ctx.conditions;
    if (!c.wide) {
      // phones: a vertical stack whose photos and facts rise in
      if (c.motion && window.ScrollTrigger) panels.forEach(function (p) { gsap.from(p.querySelectorAll('.js-ph, .js-meta > *'), { y: 50, opacity: 0, duration: .9, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: p, start: 'top 82%', once: true } }); });
      return;
    }
    var state = { x: 0 }, cur = 0, inView = false, hold = false, timer = 0, HOLD = 4600;
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    // stop 0 is the strip's resting start; every other stop centres its panel; the outro sits at the far end
    var at = function (k) { if (!k) return 0; if (k >= stops.length - 1) return dist(); var p = stops[k]; return clamp(p.offsetLeft + p.offsetWidth / 2 - window.innerWidth / 2, 0, dist()); };

    // per-panel effects, worked out each frame from where the panel sits on screen (what the scroll scrub used to do)
    var fx = panels.map(function (p) {
      var h3 = p.querySelector('h3'), chars = c.motion && window.SplitText ? new SplitText(h3, { type: 'chars,words', mask: 'words' }).chars : [h3];
      var t1 = gsap.timeline({ paused: true }).from(chars, { yPercent: 110, duration: .8, ease: 'expo.out', stagger: .02 });
      var t2 = gsap.timeline({ paused: true }).from(p.querySelectorAll('.js-reg, .js-facts > div, .js-tip'), { x: 60, opacity: 0, duration: .8, ease: 'expo.out', stagger: .07 });
      return { p: p, ph: p.querySelector('.js-ph'), img: p.querySelector('.js-ph img'), n: p.querySelector('.js-n'), t1: t1, t2: t2, a: false, b: false };
    });
    // panel positions, measured on resize instead of every frame
    var geo = [], dW = 0;
    function measure() { geo = panels.map(function (p) { return { L: p.offsetLeft, W: p.offsetWidth }; }); dW = dist(); }
    measure();
    function render() {
      var W = window.innerWidth, D = dW;
      gsap.set(track, { x: -state.x });
      bar.style.transform = 'scaleX(' + (D ? state.x / D : 0).toFixed(4) + ')';
      var center = state.x + W / 2, hit = -1;
      geo.forEach(function (g, k) { if (center >= g.L && center < g.L + g.W) hit = k; });
      mark(hit);
      if (!c.motion) return;
      fx.forEach(function (f) {
        var g = geo[fx.indexOf(f)], L = g.L - state.x, pw = g.W;
        var t = clamp((W - L) / (W + pw), 0, 1), w = clamp((W - L) / (W * .6), 0, 1);
        f.img.style.transform = 'translateX(' + (-8 + 16 * t).toFixed(2) + '%)';
        f.n.style.transform = 'translateY(' + (60 - 120 * t).toFixed(2) + '%)';
        f.ph.style.clipPath = 'inset(0% 0% 0% ' + ((1 - w) * 100).toFixed(2) + '% round 30px)';
        var a = L < W * .65, b = L < W * .6;
        if (a !== f.a) { f.a = a; a ? f.t1.play() : f.t1.reverse(); }
        if (b !== f.b) { f.b = b; b ? f.t2.play() : f.t2.reverse(); }
      });
    }
    var manualUntil = 0;
    function go(k, quick, manual) {
      if (manual) manualUntil = Date.now() + 9000;
      cur = clamp(k, 0, stops.length - 1);
      var to = at(cur), far = Math.abs(to - state.x) / window.innerWidth;
      gsap.to(state, { x: to, duration: !c.motion || quick ? 0 : clamp(.9 + far * .35, 1, 2.4), ease: 'power3.inOut', overwrite: true, onUpdate: render });
      if (!c.motion || quick) render();
      // the arrow buttons and their counter follow the current stop (the last stop is the "plan your break" card)
      if (prevB) { prevB.disabled = cur === 0; nextB.setAttribute('aria-label', cur >= stops.length - 1 ? 'Back to the first destination' : 'Next destination'); }
      if (countEl) countEl.textContent = pad(Math.min(cur + 1, panels.length)) + ' / ' + pad(panels.length);
      schedule();
    }
    var prevB = root.querySelector('[data-js-prev]'), nextB = root.querySelector('[data-js-next]'), countEl = root.querySelector('[data-js-count]');
    var onPrev = function () { go(cur - 1, false, true); }, onNext = function () { go(cur >= stops.length - 1 ? 0 : cur + 1, false, true); };
    if (prevB) { prevB.addEventListener('click', onPrev); nextB.addEventListener('click', onNext); }
    function schedule() {
      clearTimeout(timer); if (!inView || hold || !c.motion) return;
      var last = cur >= stops.length - 1;
      timer = setTimeout(function () { go(last ? 0 : cur + 1); }, Math.max(last ? HOLD * 1.6 : HOLD, manualUntil - Date.now()));
    }

    var onDot = function (ev) { var d = ev.target.closest('button'); if (d) go(+d.getAttribute('data-i'), false, true); };
    dotsEl.addEventListener('click', onDot);
    var onKey = function (ev) {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); go(cur + 1, false, true); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(cur - 1, false, true); }
    };
    root.addEventListener('keydown', onKey);
    // a sideways swipe on a trackpad (or shift + wheel) steps the strip; up-and-down scrolling is left to the page
    var acc = 0, coolUntil = 0;
    var onWheel = function (ev) {
      var dx = ev.deltaX || (ev.shiftKey ? ev.deltaY : 0);
      if (Math.abs(dx) <= Math.abs(ev.shiftKey ? 0 : ev.deltaY) || !dx) return;
      ev.preventDefault(); var now = Date.now(); if (now < coolUntil) return;
      acc += dx; if (Math.abs(acc) > 40) { go(cur + (acc > 0 ? 1 : -1), false, true); acc = 0; coolUntil = now + 650; }
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    // drag the strip sideways with the mouse or a finger: it follows the pointer, then settles on the nearest stop
    // (a clear drag always moves at least one stop, and a quick flick carries it further)
    var dragS = null, dragEnd = 0;
    var onDown = function (ev) { if (ev.button > 0 || ev.target.closest('button, a, input')) return; dragS = { x: ev.clientX, y: ev.clientY, sx: state.x, moved: false, lx: ev.clientX, t: performance.now(), v: 0, id: ev.pointerId }; };
    var onMove = function (ev) {
      if (!dragS) return; var dx = ev.clientX - dragS.x;
      if (!dragS.moved) {
        if (Math.abs(dx) < 8) return;
        if (Math.abs(dx) < Math.abs(ev.clientY - dragS.y)) { dragS = null; return; }
        dragS.moved = true; root.classList.add('is-drag'); gsap.killTweensOf(state); clearTimeout(timer);
      }
      var now = performance.now(); dragS.v = (ev.clientX - dragS.lx) / Math.max(8, now - dragS.t); dragS.lx = ev.clientX; dragS.t = now;
      state.x = clamp(dragS.sx - dx, 0, dW); render();
    };
    var onUp = function () {
      if (!dragS) return; var d = dragS; dragS = null; if (!d.moved) return;
      root.classList.remove('is-drag'); dragEnd = Date.now();
      var land = clamp(state.x - d.v * 280, 0, dW), best = 0, bd = 1e9;
      for (var k = 0; k < stops.length; k++) { var dd = Math.abs(at(k) - land); if (dd < bd) { bd = dd; best = k; } }
      var moved = state.x - d.sx; if (best === cur && Math.abs(moved) > 70) best = clamp(cur + (moved > 0 ? 1 : -1), 0, stops.length - 1);
      go(best, false, true);
    };
    var onDragClick = function (ev) { if (Date.now() - dragEnd < 350) { ev.preventDefault(); ev.stopPropagation(); } };
    track.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    root.addEventListener('click', onDragClick, true); root.classList.add('can-drag');
    // the strip fills the screen, so a resting mouse must not stop it; it only waits longer after you have moved it yourself
    var enter = function () {}, leave = function () {};
    var fin = function (ev) { if (ev.target.matches(':focus-visible')) { hold = true; clearTimeout(timer); } }, fout = function (ev) { if (!root.contains(ev.relatedTarget)) { hold = false; schedule(); } };
    root.addEventListener('pointerenter', enter); root.addEventListener('pointerleave', leave);
    root.addEventListener('focusin', fin); root.addEventListener('focusout', fout);
    var io = new IntersectionObserver(function (es) { inView = es[0].isIntersecting; schedule(); }, { threshold: .5 });
    io.observe(root);
    var vis = function () { if (document.hidden) clearTimeout(timer); else schedule(); };
    document.addEventListener('visibilitychange', vis);
    var rs = function () { measure(); go(cur, true); };
    window.addEventListener('resize', rs);
    go(0, true);
    // the strip no longer adds pinned scroll length, so the triggers further down are measured again
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();

    return function () {
      clearTimeout(timer); io.disconnect(); gsap.killTweensOf(state);
      dotsEl.removeEventListener('click', onDot); if (prevB) { prevB.removeEventListener('click', onPrev); nextB.removeEventListener('click', onNext); }root.removeEventListener('keydown', onKey); root.removeEventListener('wheel', onWheel);
      root.removeEventListener('pointerenter', enter); root.removeEventListener('pointerleave', leave); root.removeEventListener('focusin', fin); root.removeEventListener('focusout', fout);
      document.removeEventListener('visibilitychange', vis); window.removeEventListener('resize', rs);
      track.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
      root.removeEventListener('click', onDragClick, true); root.classList.remove('can-drag', 'is-drag');
      gsap.set(track, { clearProps: 'transform' });
      fx.forEach(function (f) { f.img.style.transform = ''; f.n.style.transform = ''; f.ph.style.clipPath = ''; f.t1.progress(1).kill(); f.t2.progress(1).kill(); });
    };
  });
})();