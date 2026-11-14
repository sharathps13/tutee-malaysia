/* Course finder · home screen
   Fields are apps whose badges count the institutions teaching them. Tapping one zooms it open from its icon.
   The black pill at the top morphs into a search panel; the dock magnifies under the pointer and keeps a shortlist. */
(function () {
  var root = document.querySelector('#courses'); if (!root || !window.CF) return;
  var C = window.CF, gsap = window.gsap, M = C.motion && !!gsap, esc = C.esc;
  var hs = root.querySelector('[data-hs]'), grid = root.querySelector('[data-hs-grid]'), dock = root.querySelector('[data-hs-dock]'), app = root.querySelector('[data-hs-app]');
  var island = root.querySelector('[data-island]'), pillBtn = root.querySelector('[data-is-open]'), pillText = root.querySelector('[data-is-text]'), iq = root.querySelector('[data-is-q]'), ires = root.querySelector('[data-is-res]'), clock = root.querySelector('[data-hs-clock]');
  var short = [], openFrom = null;
  var G = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };

  /* home screen and dock */
  grid.innerHTML = C.FIELDS.map(function (f, i) { return '<button type="button" class="app" data-f="' + i + '" aria-label="Open ' + esc(f.name) + ', ' + f.count + ' institutions"><span class="app-ic" style="--c:' + f.color + '">' + C.icon(f) + '<span class="app-badge">' + f.count + '</span></span><span class="app-nm">' + esc(f.name) + '</span></button>'; }).join('');
  dock.innerHTML =
    '<button type="button" class="app" data-dk="search" aria-label="Search"><span class="app-ic" style="--c:#2C2C34">' + G('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') + '</span><span class="app-nm">Search</span></button>' +
    '<button type="button" class="app" data-dk="short" aria-label="Shortlist"><span class="app-ic" style="--c:#12A150">' + G('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>') + '<span class="app-badge" data-sb hidden>0</span></span><span class="app-nm">Shortlist</span></button>' +
    '<a class="app" href="' + C.begin + '" aria-label="Free evaluation"><span class="app-ic" style="--c:#E0A800">' + G('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>') + '</span><span class="app-nm">Free evaluation</span></a>' +
    '<a class="app" href="' + C.dir + '" target="_blank" rel="noopener" aria-label="Full directory"><span class="app-ic" style="--c:#2442C4">' + G('<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>') + '</span><span class="app-nm">Directory</span></a>';
  var badge = dock.querySelector('[data-sb]');
  grid.querySelectorAll('[data-f]').forEach(function (b) { b.addEventListener('click', function () { openApp(b.querySelector('.app-ic'), fieldApp(C.FIELDS[+b.dataset.f])); }); });
  dock.querySelector('[data-dk="search"]').addEventListener('click', openIsland);
  dock.querySelector('[data-dk="short"]').addEventListener('click', function (e) { openApp(e.currentTarget.querySelector('.app-ic'), shortApp()); });

  // dock magnification under the pointer
  var dIcons = [].slice.call(dock.querySelectorAll('.app-ic'));
  if (M && matchMedia('(hover: hover)').matches) {
    dock.addEventListener('pointermove', function (e) { dIcons.forEach(function (ic) { var r = ic.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)), k = Math.max(0, 1 - d / 140); gsap.to(ic, { scale: 1 + .42 * k, y: -14 * k, duration: .25, ease: 'power2.out', overwrite: 'auto' }); }); });
    dock.addEventListener('pointerleave', function () { gsap.to(dIcons, { scale: 1, y: 0, duration: .4, ease: 'elastic.out(1, .6)' }); });
  }

  /* app screens */
  function note(u, color) {
    var on = short.some(function (s) { return s.n === u.n; }), p = C.progs(u);
    return '<div class="note" style="--c:' + color + '"><span class="av' + (u.r ? '' : ' no') + '">' + (u.r ? '#' + u.r : 'EMGS') + '</span><div><b>' + esc(u.n) + '</b><small>' + esc(C.city(u)) + (p ? ' · ' + p + ' programmes' : '') + ' · ' + esc(u.t) + '</small></div><button type="button" class="add" data-add="' + esc(u.n) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Remove from' : 'Add to') + ' shortlist">' + (on ? '✓' : '+') + '</button></div>';
  }
  function chrome() { return '<button type="button" class="ha-close" data-close>Close</button><button type="button" class="ha-home" data-close aria-label="Back to the home screen"></button>'; }
  function fieldApp(f) {
    var max = f.states.length ? f.states[0][1] : 1;
    return { color: f.color, items: f.top, html: '<div class="ha-scroll" data-lenis-prevent><header class="ha-head" style="--c:' + f.color + '"><small>Field app</small><h3>' + esc(f.name) + '</h3><p>Top-ranked institutions teaching it, in QS 2027 order.</p><b class="ha-count" data-count>' + f.count + '</b></header>' +
      '<div class="ha-body"><div><p class="ha-label">Top campuses · tap + to shortlist</p><div class="ha-notes">' + f.top.map(function (u) { return note(u, f.color); }).join('') + '</div></div>' +
      '<div><div class="wdg" style="--c:' + f.color + '"><p class="ha-label">Busiest states</p>' + f.states.map(function (s) { return '<div class="wdg-bar"><span>' + esc(s[0]) + '</span><span>' + s[1] + '</span><i style="width:' + (s[1] / max * 100).toFixed(1) + '%"></i></div>'; }).join('') + '</div>' +
      '<div class="wdg" style="--c:' + f.color + '"><p class="ha-label">Institutions</p><b class="wdg-big">' + f.count + '</b><a class="textlink" href="' + C.fieldHref(f) + '" target="_blank" rel="noopener">Open the full directory ↗</a></div></div></div></div>' + chrome() };
  }
  function shortApp() {
    return { color: '#12A150', items: short.slice(), html: '<div class="ha-scroll" data-lenis-prevent><header class="ha-head" style="--c:#12A150"><small>Shortlist</small><h3>' + (short.length ? 'Your ' + short.length + ' campuses' : 'Nothing saved yet') + '</h3><p>' + (short.length ? 'Send them to us and a counsellor checks entry requirements for each.' : 'Open a field app and tap + on any campus to save it here.') + '</p></header>' +
      '<div class="ha-body"><div><div class="ha-notes">' + short.map(function (u) { return note(u, '#12A150'); }).join('') + '</div></div><div><div class="wdg" style="--c:#12A150"><p class="ha-label">Next step</p><a class="btn btn--red btn--sm" href="' + C.begin + '">Send me this shortlist</a></div></div></div></div>' + chrome() };
  }
  function uniApp(u) {
    var ls = C.lines[u.n] || [], rg = C.region(u);
    return { color: '#0A1A5C', items: [u], html: '<div class="ha-scroll" data-lenis-prevent><header class="ha-head" style="--c:#0A1A5C"><small>Search result</small><h3>' + esc(u.n) + '</h3><p>' + esc(u.l) + ' · ' + esc(u.t) + '</p></header>' +
      '<div class="ha-body"><div><div class="ha-notes">' + note(u, '#0A1A5C') + '</div><div class="wdg" style="--c:#0A1A5C;margin-top:14px"><p class="ha-label">Among the top six for</p>' + (ls.length ? '<div class="sw-chips">' + ls.map(function (f) { return '<span class="f" style="--c:' + f.color + ';background:' + f.color + ';color:#fff">' + esc(f.name) + '</span>'; }).join('') + '</div>' : '<p>No field yet. Ask us how it compares for your course.</p>') + '</div></div>' +
      '<div><div class="wdg" style="--c:#0A1A5C"><p class="ha-label">QS 2027</p><b class="wdg-big">' + (u.r ? '#' + u.r : '—') + '</b><p>' + (C.progs(u) ? C.progs(u) + ' accredited programmes' : '') + '</p></div><div class="wdg"><img src="' + rg.img + '" alt="" style="border-radius:14px;aspect-ratio:16/10;object-fit:cover;width:100%"><p class="ha-label" style="margin:0">Region photo · ' + esc(rg.name) + '</p><a class="textlink" href="' + C.dirHref(u) + '" target="_blank" rel="noopener">Directory ↗</a></div></div></div></div>' + chrome() };
  }
  function rectIn(el) { var s = hs.getBoundingClientRect(), r = el.getBoundingClientRect(); return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height }; }
  function openApp(fromEl, a) {
    closeIsland(true);
    openFrom = fromEl; app.innerHTML = a.html; app.hidden = false; app._items = a.items;
    app.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeApp); });
    wireAdds();
    var full = parseFloat(getComputedStyle(app).borderRadius) || 40;
    if (!M) return;
    var r = rectIn(fromEl);
    gsap.fromTo(app, { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: r.width * .26 }, { left: 0, top: 0, width: hs.clientWidth, height: hs.clientHeight, borderRadius: full, duration: .62, ease: 'expo.out', onComplete: function () { gsap.set(app, { clearProps: 'left,top,width,height,borderRadius' }); } });
    gsap.fromTo(app.querySelector('.ha-scroll'), { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out', delay: .12 });
    gsap.to([grid, dock], { scale: 1.15, opacity: 0, duration: .45, ease: 'power2.out' });
    gsap.from(app.querySelectorAll('.note'), { y: -50, opacity: 0, scale: .9, duration: .7, ease: 'back.out(1.6)', stagger: .08, delay: .3 });
    gsap.from(app.querySelectorAll('.wdg'), { y: 40, opacity: 0, duration: .7, ease: 'expo.out', stagger: .1, delay: .4 });
    gsap.from(app.querySelectorAll('.wdg-bar i'), { scaleX: 0, duration: 1, ease: 'expo.out', stagger: .08, delay: .6 });
    var cnt = app.querySelector('[data-count]'); if (cnt) { var o = { v: 0 }, n = +cnt.textContent; gsap.to(o, { v: n, duration: 1.2, ease: 'expo.out', delay: .2, onUpdate: function () { cnt.textContent = Math.round(o.v); } }); }
  }
  function closeApp() {
    if (app.hidden) return;
    var done = function () { app.hidden = true; app.innerHTML = ''; gsap && gsap.set(app, { clearProps: 'all' }); };
    if (!M || !openFrom) { done(); if (gsap) gsap.set([grid, dock], { clearProps: 'all' }); return; }
    var r = rectIn(openFrom);
    gsap.to(app.querySelector('.ha-scroll'), { opacity: 0, duration: .2 });
    gsap.fromTo(app, { left: 0, top: 0, width: hs.clientWidth, height: hs.clientHeight }, { left: r.left, top: r.top, width: r.width, height: r.height, borderRadius: r.width * .26, duration: .5, ease: 'expo.inOut', onComplete: done });
    gsap.to([grid, dock], { scale: 1, opacity: 1, duration: .55, ease: 'expo.out', delay: .1 });
  }
  function wireAdds() {
    app.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = b.getAttribute('data-add'), u = (app._items || []).filter(function (x) { return x.n === n; })[0] || C.IDX.filter(function (x) { return x.n === n; })[0];
        var on = short.some(function (s) { return s.n === n; });
        if (on) short = short.filter(function (s) { return s.n !== n; }); else if (u) short.push(u);
        b.setAttribute('aria-pressed', String(!on)); b.textContent = on ? '+' : '✓'; b.setAttribute('aria-label', (on ? 'Add to' : 'Remove from') + ' shortlist');
        badge.hidden = !short.length; badge.textContent = short.length;
        if (M) { gsap.fromTo(b, { scale: 1.5 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .4)' }); gsap.fromTo(badge, { scale: 1.8 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' }); }
      });
    });
  }
  hs.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (island.classList.contains('open')) closeIsland(); else closeApp(); } });

  /* the island: a pill that cycles live facts and morphs into search */
  var facts = function () { var t = '--:--'; try { t = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }); } catch (e) { /* keep */ } return [C.total + ' institutions', 'Kuala Lumpur ' + t, 'Tap to search']; };
  var fi = 0;
  function cycle() {
    if (island.classList.contains('open')) return;
    fi = (fi + 1) % 3; var txt = facts()[fi];
    if (M) gsap.to(pillText, { yPercent: -120, opacity: 0, duration: .25, ease: 'power2.in', onComplete: function () { pillText.textContent = txt; gsap.fromTo(pillText, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .35, ease: 'back.out(2)' }); } }); else pillText.textContent = txt;
  }
  setInterval(cycle, 3200);
  function tick() { clock.textContent = facts()[1].replace('Kuala Lumpur ', ''); } tick(); setInterval(tick, 20000);
  function openIsland() {
    if (island.classList.contains('open')) { iq.focus(); return; }
    var w0 = island.offsetWidth, h0 = island.offsetHeight; island._w0 = w0;
    island.classList.add('open'); pillBtn.setAttribute('aria-expanded', 'true');
    var w = Math.min(560, hs.clientWidth - 28); gsap && gsap.set(island, { width: w, height: 'auto' }); var h = island.offsetHeight;
    if (M) gsap.fromTo(island, { width: w0, height: h0, borderRadius: 22 }, { width: w, height: h, borderRadius: 30, duration: .7, ease: 'elastic.out(1, .78)', onComplete: function () { gsap.set(island, { height: 'auto' }); } });
    iq.focus(); search();
  }
  function closeIsland(instant) {
    if (!island.classList.contains('open')) return;
    var end = function () { island.classList.remove('open'); pillBtn.setAttribute('aria-expanded', 'false'); gsap && gsap.set(island, { clearProps: 'width,height,borderRadius' }); };
    if (M && !instant) gsap.to(island, { width: island._w0 || 230, height: 38, borderRadius: 22, duration: .45, ease: 'expo.inOut', onComplete: end }); else end();
  }
  pillBtn.addEventListener('click', openIsland);
  root.querySelector('[data-is-close]').addEventListener('click', function () { closeIsland(); });
  document.addEventListener('pointerdown', function (e) { if (island.classList.contains('open') && !island.contains(e.target) && !e.target.closest('[data-dk="search"]')) closeIsland(); });
  var t, hits = [];
  function search() {
    var r = C.search(iq.value, 8);
    if (!r) { ires.innerHTML = '<li class="msg">Type part of a name or a city, for example Sunway, UTM or Penang.</li>'; return; }
    hits = r;
    ires.innerHTML = r.length ? r.map(function (u, i) { return '<li><button type="button" data-h="' + i + '"><span class="av">' + (u.r ? '#' + u.r : '—') + '</span><span><b>' + esc(u.n) + '</b><small>' + esc(u.l) + '</small></span><span class="go">›</span></button></li>'; }).join('') : '<li class="msg">No institution matches that name. Try a shorter word.</li>';
    ires.querySelectorAll('[data-h]').forEach(function (b) { b.addEventListener('click', function () { var u = hits[+b.dataset.h]; openApp(island, uniApp(u)); }); });
    if (M) gsap.from(ires.children, { y: -10, opacity: 0, duration: .3, stagger: .03 });
  }
  iq.addEventListener('input', function () { clearTimeout(t); t = setTimeout(search, 180); });

  /* unlock: icons spring in from the centre when the screen scrolls into view */
  if (window.ScrollTrigger && M) window.ScrollTrigger.create({ trigger: hs, start: 'top 70%', once: true, onEnter: function () {
    gsap.from(grid.querySelectorAll('.app'), { scale: 0, opacity: 0, duration: .8, ease: 'back.out(1.8)', stagger: { each: .05, from: 'center' } });
    gsap.from(dock, { y: 120, duration: .9, ease: 'expo.out', delay: .3 });
    gsap.from(island, { scaleX: .3, opacity: 0, duration: .8, ease: 'elastic.out(1, .6)' });
  } });
})();
