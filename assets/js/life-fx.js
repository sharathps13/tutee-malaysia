/* ---------- 07 · Life in Malaysia: extra motion, and the festival year ----------
   1. A two-row band of big outlined words (dishes, phrases, festivals from this page) drifts between the photo wall and
      the phrase card, and speeds up while the page is scrolling.
   2. The phrase card plays through the phrases on its own until the visitor picks one; the chips cascade in; a ghost
      of the phrase sits behind the card; sound bars dance while "Listen" speaks.
   3. "A festival every season" becomes the festival year: a big stage whose photo wipes open from the festival you
      pick, each with its own ambient effect (rising lanterns, falling marigold petals, a crescent and stars,
      fireworks), over a twelve-month ruler that marks where each festival falls and where we are in the year today. */
(function () {
  'use strict';
  var sec = document.getElementById('life'); if (!sec) return;
  var G = window.gsap, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || sec).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || sec).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var P = './assets/img/photos/';

  /* ---------- 1 · the word band ---------- */
  (function band() {
    var gal = $('[data-gal]'); if (!gal) return;
    var rows = [['Jom makan!', 'Nasi kerabu', 'Satay', 'Curry laksa', 'Hawker spread', 'Night market', 'Tapau', 'Late nights'],
                ['Chinese New Year', 'Thaipusam', 'Hari Raya Aidilfitri', 'Merdeka Day', 'Lantern season', 'Open houses', 'Lion dances', 'Selamat datang']];
    var el = document.createElement('div'); el.className = 'lf-band'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = rows.map(function (r, i) { var one = r.map(function (w, k) { return '<span' + (k % 3 === i ? ' class="fill"' : '') + '>' + esc(w) + '</span><i></i>'; }).join(''); return '<div class="lf-row' + (i ? ' rev' : '') + '"><div class="lf-run">' + one + one + '</div></div>'; }).join('');
    gal.parentNode.insertBefore(el, gal.nextSibling);
    if (reduce) return;
    var runs = $$('.lf-run', el), t = 0;
    addEventListener('scroll', function () {
      var v = window.TClenis && typeof window.TClenis.velocity === 'number' ? Math.abs(window.TClenis.velocity) : 6;
      var rate = 1 + Math.min(5, v / 6);
      runs.forEach(function (r) { var a = r.getAnimations && r.getAnimations()[0]; if (a) a.playbackRate = rate; });
      clearTimeout(t); t = setTimeout(function () { runs.forEach(function (r) { var a = r.getAnimations && r.getAnimations()[0]; if (a) a.playbackRate = 1; }); }, 220);
    }, { passive: true });
  })();

  /* ---------- 2 · the phrase card ---------- */
  (function speak() {
    var card = $('.speak-card'), chips = $$('[data-chips] .chip'), my = $('[data-sp-my]'), say = $('[data-say]'); if (!card || !chips.length) return;
    var ghost = document.createElement('span'); ghost.className = 'lf-ghost'; ghost.setAttribute('aria-hidden', 'true'); ghost.textContent = my.textContent; card.insertBefore(ghost, card.firstChild);
    var bars = document.createElement('span'); bars.className = 'lf-bars'; bars.setAttribute('aria-hidden', 'true'); bars.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'; if (say) say.appendChild(bars);
    var user = false, timer = 0, inView = false, hover = false;
    chips.forEach(function (c) { c.addEventListener('click', function (e) { if (e.isTrusted) { user = true; clearTimeout(timer); sec.classList.remove('lf-auto'); } setTimeout(function () { ghost.textContent = c.getAttribute('data-my'); }, 200); }); });
    if (say) say.addEventListener('click', function () { user = true; clearTimeout(timer); sec.classList.remove('lf-auto'); card.classList.add('is-speaking'); setTimeout(function () { card.classList.remove('is-speaking'); }, 1700); });
    function next() {
      clearTimeout(timer); if (user || reduce) return;
      timer = setTimeout(function () {
        if (inView && !hover && !document.hidden) { var i = chips.findIndex(function (c) { return c.classList.contains('on'); }); chips[(i + 1) % chips.length].click(); }
        next();
      }, 3800);
    }
    card.addEventListener('pointerenter', function () { hover = true; }); card.addEventListener('pointerleave', function () { hover = false; });
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting;
        if (inView && !seen) { seen = true; if (G && !reduce) { G.from(chips, { y: 26, opacity: 0, scale: .8, duration: .7, ease: 'back.out(1.8)', stagger: .05, clearProps: 'all' }); G.from(card, { y: 60, opacity: 0, rotateY: -14, transformPerspective: 900, duration: 1.2, ease: 'expo.out', clearProps: 'transform,opacity' }); } if (!user && !reduce) sec.classList.add('lf-auto'); next(); }
      }, { threshold: .4 }).observe(card);
    }
  })();

  /* ---------- 3 · the festival year ---------- */
  (function year() {
    var root = $('[data-fy]'); if (!root) return;
    var FEST = [
      { k: 'cny', img: 'f-cny', when: 'January or February', name: 'Chinese New Year', text: 'Lanterns, open houses and lion dances across every city.', months: [0, 1] },
      { k: 'thai', img: 'f-thaipusam', when: 'January or February', name: 'Thaipusam', text: 'Hundreds of thousands climb the 272 steps of Batu Caves.', months: [0, 1] },
      { k: 'raya', img: 'f-raya', when: 'Islamic calendar', name: 'Hari Raya Aidilfitri', text: 'The end of Ramadan, and open houses where everyone is welcome.', months: null },
      { k: 'merdeka', img: 'f-merdeka', when: '31 August', name: 'Merdeka Day', text: 'Independence Day, with fireworks over Kuala Lumpur.', months: [7] }
    ];
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var now = new Date(), m0 = now.getMonth(), N = FEST.length;
    // what comes next, from today's date: Merdeka has a fixed day; the new-year festivals fall in January or February
    var merdeka = new Date(now.getFullYear(), 7, 31, 23, 59), days = Math.ceil((merdeka - now) / 864e5);
    var nextK = m0 >= 2 && days >= 0 ? ['merdeka'] : ['cny', 'thai'];
    var badge = function (f) {
      if (nextK.indexOf(f.k) < 0) return f.k === 'raya' ? 'Date moves each year' : '';
      if (f.k === 'merdeka') return days <= 0 ? 'Today!' : 'Next up · in ' + days + (days === 1 ? ' day' : ' days');
      return m0 <= 1 ? 'Happening this season' : 'Next up · early in the new year';
    };
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    function fx(k) {
      var h = '', i;
      if (k === 'cny') for (i = 0; i < 8; i++) h += '<svg class="fy-lan" style="left:' + rnd(2, 92).toFixed(1) + '%;width:' + rnd(26, 52).toFixed(0) + 'px;--dx:' + rnd(-40, 40).toFixed(0) + 'px;animation-duration:' + rnd(9, 16).toFixed(1) + 's;animation-delay:-' + rnd(0, 14).toFixed(1) + 's"><use href="#s-lantern"/></svg>';
      if (k === 'thai') for (i = 0; i < 22; i++) h += '<i class="fy-petal" style="left:' + rnd(0, 98).toFixed(1) + '%;--dx:' + rnd(-60, 60).toFixed(0) + 'px;--s:' + rnd(.6, 1.3).toFixed(2) + ';background:' + ['#FFB000', '#FF8A00', '#FFD23F'][i % 3] + ';animation-duration:' + rnd(6, 11).toFixed(1) + 's;animation-delay:-' + rnd(0, 10).toFixed(1) + 's"></i>';
      if (k === 'raya') { h += '<i class="fy-moon"></i>'; for (i = 0; i < 18; i++) h += '<i class="fy-star" style="left:' + rnd(3, 96).toFixed(1) + '%;top:' + rnd(4, 60).toFixed(1) + '%;--s:' + rnd(.5, 1.4).toFixed(2) + ';animation-duration:' + rnd(1.8, 4).toFixed(1) + 's;animation-delay:-' + rnd(0, 4).toFixed(1) + 's"></i>'; }
      if (k === 'merdeka') [[22, 26, 0, '#FFCC00'], [64, 18, .9, '#FF5A6E'], [44, 40, 1.7, '#9FD0FF'], [82, 38, 2.4, '#FFCC00']].forEach(function (b) {
        h += '<i class="fy-burst" style="left:' + b[0] + '%;top:' + b[1] + '%;color:' + b[3] + '">'; for (i = 0; i < 14; i++) h += '<i style="--a:' + (i * 360 / 14).toFixed(0) + 'deg;animation-delay:' + b[2] + 's"></i>'; h += '</i>';
      });
      return '<div class="fy-g" data-k="' + k + '">' + h + '</div>';
    }
    root.innerHTML =
      '<div class="fy-stage"><div class="fy-imgs">' + FEST.map(function (f) { return '<img class="fy-img" src="' + P + f.img + '.jpg" alt="" loading="lazy" decoding="async">'; }).join('') + '</div>' +
        '<div class="fy-fx" aria-hidden="true">' + FEST.map(function (f) { return fx(f.k); }).join('') + '</div>' +
        '<div class="fy-copy" aria-live="polite"><span class="fy-when"></span><h4 class="fy-name"></h4><p class="fy-text"></p><span class="fy-next"></span></div><span class="fy-count" aria-hidden="true"></span></div>' +
      '<div class="fy-year" aria-hidden="true">' + MON.map(function (mn, i) {
        var dots = FEST.filter(function (f) { return f.months && f.months.indexOf(i) > -1; }).map(function (f) { return '<i data-k="' + f.k + '"></i>'; }).join('');
        return '<span class="fy-m' + (i === m0 ? ' is-now' : '') + '" data-m="' + i + '"><b>' + mn + '</b><span class="fy-dots">' + dots + '</span>' + (i === m0 ? '<em>Today</em>' : '') + '</span>';
      }).join('') + '</div>' +
      '<div class="fy-tabs" role="group" aria-label="Festivals">' + FEST.map(function (f, i) {
        return '<button type="button" data-i="' + i + '" aria-pressed="false"><img src="' + P + f.img + '.jpg" alt="" loading="lazy" decoding="async"><span><small>' + esc(f.when) + '</small><b>' + esc(f.name) + '</b></span><i class="fy-prog"><i></i></i></button>';
      }).join('') + '</div>';
    var stage = $('.fy-stage', root), imgs = $$('.fy-img', root), groups = $$('.fy-g', root), tabs = $$('.fy-tabs button', root), months = $$('.fy-m', root);
    var whenEl = $('.fy-when', root), nameEl = $('.fy-name', root), textEl = $('.fy-text', root), nextEl = $('.fy-next', root), countEl = $('.fy-count', root);
    var cur = -1, z = 1, timer = 0, manualUntil = 0, inView = false, hold = false, HOLD = 6000;
    function fill(i) {
      var f = FEST[i], b = badge(f);
      whenEl.textContent = f.when; nameEl.innerHTML = f.name.split(' ').map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(' '); textEl.textContent = f.text;
      nextEl.textContent = b; nextEl.hidden = !b; nextEl.classList.toggle('is-next', nextK.indexOf(f.k) > -1);
      countEl.textContent = '0' + (i + 1) + ' / 0' + N;
    }
    function show(i, manual) {
      if (i === cur) return; var first = cur < 0, f = FEST[i]; cur = i;
      if (manual) manualUntil = Date.now() + 12000;
      tabs.forEach(function (t, k) { t.classList.toggle('on', k === i); t.setAttribute('aria-pressed', String(k === i)); t.classList.remove('run'); });
      months.forEach(function (mEl) { var mi = +mEl.dataset.m; mEl.classList.toggle('on', !!f.months && f.months.indexOf(mi) > -1); });
      root.classList.toggle('is-moving', !f.months);
      groups.forEach(function (g) { g.classList.toggle('on', g.dataset.k === f.k); });
      // the photo opens in a circle from the chosen festival's tab
      var tr = tabs[i].getBoundingClientRect(), sr = stage.getBoundingClientRect(), ox = sr.width ? Math.max(0, Math.min(100, (tr.left + tr.width / 2 - sr.left) / sr.width * 100)) : 50;
      var im = imgs[i]; im.style.zIndex = ++z; imgs.forEach(function (o) { o.classList.toggle('on', o === im); });
      if (G && !reduce && !first) {
        G.fromTo(im, { clipPath: 'circle(0% at ' + ox.toFixed(1) + '% 100%)', scale: 1.2 }, { clipPath: 'circle(150% at ' + ox.toFixed(1) + '% 100%)', scale: 1.04, duration: 1.2, ease: 'expo.inOut' });
        G.to([whenEl, nameEl, textEl, nextEl], { y: -14, opacity: 0, duration: .22, stagger: .03, overwrite: true, onComplete: function () {
          fill(i); G.set([whenEl, nameEl, textEl, nextEl], { y: 0, opacity: 1 });
          G.from($$('span', nameEl), { yPercent: 110, opacity: 0, duration: .8, ease: 'expo.out', stagger: .07 });
          G.from([whenEl, textEl, nextEl], { y: 18, opacity: 0, duration: .7, ease: 'expo.out', stagger: .08, delay: .1 });
        } });
      } else { im.style.clipPath = ''; fill(i); }
      schedule();
    }
    function schedule() {
      clearTimeout(timer); tabs.forEach(function (t) { t.classList.remove('run'); });
      if (reduce || !inView || hold) return;
      var wait = Math.max(HOLD, manualUntil - Date.now());
      if (wait === HOLD) { void tabs[cur].offsetWidth; tabs[cur].classList.add('run'); }
      timer = setTimeout(function () { show((cur + 1) % N); }, wait);
    }
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i, true); }); });
    months.forEach(function (mEl) { mEl.addEventListener('click', function () {
      var mi = +mEl.dataset.m, hits = FEST.map(function (f, k) { return f.months && f.months.indexOf(mi) > -1 ? k : -1; }).filter(function (k) { return k > -1; });
      if (!hits.length) return; var at = hits.indexOf(cur); show(hits[(at + 1) % hits.length], true);
    }); });
    root.addEventListener('pointerenter', function () { hold = true; clearTimeout(timer); tabs.forEach(function (t) { t.classList.remove('run'); }); });
    root.addEventListener('pointerleave', function () { hold = false; schedule(); });
    // start on whatever comes next in the year
    show(Math.max(0, FEST.findIndex(function (f) { return f.k === nextK[0]; })));
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting; schedule();
        if (inView && !seen && G && !reduce) { seen = true; G.from(stage, { clipPath: 'inset(40% 20% 40% 20% round 28px)', duration: 1.4, ease: 'expo.out', clearProps: 'clipPath' }); G.from(months, { y: 20, opacity: 0, duration: .6, ease: 'expo.out', stagger: .03, delay: .3, clearProps: 'all' }); G.from(tabs, { y: 30, opacity: 0, duration: .8, ease: 'expo.out', stagger: .07, delay: .45, clearProps: 'all' }); }
      }, { threshold: .3 }).observe(stage);
    } else inView = true;
  })();
})();
