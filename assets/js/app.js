/* Tutee Connect · Study in Malaysia · "Warna Malaysia" (v12)
   GSAP 3.13 (ScrollTrigger, SplitText, CustomEase, Flip, Draggable, Inertia) + Lenis.
   No scroll locking or pinning anywhere: every scroll effect is a scrub or a one-off reveal. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement; root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var motion = !!gsap && !reduce;
  if (gsap) {
    gsap.registerPlugin.apply(gsap, [window.ScrollTrigger, window.SplitText, window.CustomEase, window.Flip, window.Draggable, window.InertiaPlugin].filter(Boolean));
    if (window.CustomEase) CustomEase.create('silk', 'M0,0 C0.16,1 0.3,1 1,1');
  }
  if (!motion) root.classList.add('no-motion');
  var clamp = function (a, b, v) { return Math.max(a, Math.min(b, v)); };
  var pad = function (n) { return ('0' + n).slice(-2); };
  function countTo(el, end, dur) {
    if (!motion) { el.textContent = end; return; }
    var o = { v: 0 }; gsap.to(o, { v: end, duration: dur || 1.2, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
  }
  function once(el, start, fn) { if (ST) ST.create({ trigger: el, start: start || 'top 85%', once: true, onEnter: fn }); else fn(); }
  function inView(el, fn) { if (ST) ST.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: function (s) { fn(s.isActive); } }); else fn(true); }

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: .1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', function () { if (ST) ST.update(); });
    if (gsap) { gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
    lenis.stop();
  }
  window.TClenis = lenis;
  function jump(el) { if (lenis) lenis.scrollTo(el, { immediate: true, force: true }); else el.scrollIntoView(); if (ST) ST.update(); }

  /* ---------- section state: nav theme, dock, live backgrounds ---------- */
  var wash = $('[data-wash]'), nav = $('[data-nav]'), prog = $('[data-prog]');
  var secs = $$('main .sec'), curSec = null, placeColour = null;
  secs.forEach(function (s, i) { if (i > 0 && !s.classList.contains('hero')) s.style.setProperty('--prev', i === 1 ? 'rgba(10,26,92,0)' : secs[i - 1].getAttribute('data-bg')); });
  if (motion) $$('main > .sec:not(.hero) > .wrap').forEach(function (w) {
    gsap.fromTo(w, { y: 90, opacity: .2 }, { y: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: w.parentElement, start: 'top 96%', end: 'top 30%', scrub: .6 } });
  });
  var dock = $('[data-dock]'), dks = $$('[data-dk]'), dockI = $('[data-dock-i]'), dockName = $('[data-dock-name]');
  function setWash(c, instant) { if (!gsap) return; gsap.to(wash, { backgroundColor: c, duration: instant ? 0 : 1, ease: 'power2.out', overwrite: true }); }
  var navLinks = $('[data-nav-links]'), nls = $$('[data-nl]'), pill = $('[data-nav-pill]');
  function navOn(s) {
    if (!navLinks) return;
    var idx = secs.indexOf(s), pick = null;
    nls.forEach(function (a) { var t = document.getElementById(a.getAttribute('data-nl')); if (t && secs.indexOf(t) <= idx && secs.indexOf(t) > -1) pick = a; });
    nls.forEach(function (a) { a.classList.toggle('on', a === pick); });
    navLinks.classList.toggle('has-on', !!pick);
    if (pick) { if (gsap && motion) gsap.to(pill, { x: pick.offsetLeft, width: pick.offsetWidth, duration: .6, ease: 'expo.out' }); else { pill.style.transform = 'translateX(' + pick.offsetLeft + 'px)'; pill.style.width = pick.offsetWidth + 'px'; } }
  }
  (function navClock() {
    var el = $('[data-nav-clock]'); if (!el) return;
    function tick() { try { var p = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }).split(':'); el.innerHTML = p[0] + '<i>:</i>' + p[1]; } catch (e) { el.parentNode.parentNode.hidden = true; } }
    tick(); setInterval(tick, 15000);
  })();
  function activate(s) {
    if (curSec === s) return; curSec = s; navOn(s);
    setWash((s.id === 'places' && placeColour) || s.getAttribute('data-bg'));
    nav.setAttribute('data-theme', s.getAttribute('data-theme'));
    var acc = s.getAttribute('data-accent');
    if (gsap) gsap.to(prog, { backgroundColor: acc, duration: .6 });
    var k = -1; dks.forEach(function (d, j) { var on = d.getAttribute('data-dk') === s.id; d.classList.toggle('on', on); if (on) k = j; });
    if (dock) {
      dock.style.setProperty('--dock-c', acc);
      var name = s.getAttribute('data-name'), num = k > -1 ? pad(k + 1) + ' / ' + pad(dks.length) : '';
      if (motion) gsap.timeline().to([dockI, dockName], { yPercent: -60, opacity: 0, duration: .18, ease: 'power2.in' }).add(function () { dockI.textContent = num; dockName.textContent = name; }).fromTo([dockI, dockName], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .45, ease: 'expo.out', stagger: .04 });
      else { dockI.textContent = num; dockName.textContent = name; }
    }
  }
  if (ST) {
    secs.forEach(function (s) {
      var dk = dks.filter(function (d) { return d.getAttribute('data-dk') === s.id; })[0];
      ST.create({ trigger: s, start: 'top 50%', end: 'bottom 50%', onToggle: function (st) { if (st.isActive) activate(s); },
        onUpdate: dk ? function (st) { dk.style.setProperty('--off', (116.3 * (1 - st.progress)).toFixed(1)); } : null });
    });
    ST.create({ start: 0, end: 'max', onUpdate: function (st) { prog.style.transform = 'scaleX(' + st.progress.toFixed(4) + ')'; } });
    var lastY = 0, heroEl = document.getElementById('home');
    /* a refresh (a card opening, a resize) measures the page from the top for a moment: the bar must not react to that */
    var navST = null;
    ST.addEventListener('refresh', function () { if (navST) navST.vars.onUpdate(navST); });
    navST = ST.create({ start: 0, end: 'max', onUpdate: function (st) {
      if (ST.isRefreshing) return;
      var y = st.scroll(); nav.classList.toggle('scrolled', y > 40);
      // the home bar: clear over the hero, white once the hero has gone (the logo orb turns into the full wordmark)
      nav.classList.toggle('is-bar', !!heroEl && heroEl.getBoundingClientRect().bottom < 80);
      // the bar stays in place, as on the Finland page, so the logo's change into the white bar is always in view
      nav.classList.remove('hide');
      if (dock) dock.classList.toggle('show', y > window.innerHeight * .6 && !menuOpen);
      lastY = y;
    } });
  } else if (dock) dock.classList.add('show');
  setWash('#0A0F2C', true);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('live', e.isIntersecting); }); }, { rootMargin: '100px 0px' });
    secs.forEach(function (s) { io.observe(s); });
  } else secs.forEach(function (s) { s.classList.add('live'); });
  /* dock: magnify on hover like a desktop dock */
  if (dock && fine && motion) {
    var items = $('[data-dock-items]');
    items.addEventListener('mousemove', function (e) {
      dks.forEach(function (d) { var r = d.getBoundingClientRect(), c = r.left + r.width / 2, dist = Math.abs(e.clientX - c); d.style.setProperty('--s', (1 + Math.max(0, 1 - dist / 130) * .55).toFixed(3)); });
    });
    items.addEventListener('mouseleave', function () { dks.forEach(function (d) { d.style.setProperty('--s', 1); }); });
  }
  if (dock) {
    var step = function (dir) {
      var i = curSec ? secs.indexOf(curSec) : 0, t = secs[clamp(1, secs.length - 1, i + dir)];
      if (t) travel(t);
    };
    $('[data-dock-prev]').addEventListener('click', function () { step(-1); });
    $('[data-dock-next]').addEventListener('click', function () { step(1); });
  }

  /* ---------- loader ---------- */
  var loader = $('[data-loader]'), introDone = false, heroReady = false;
  function finishLoader() {
    if (introDone) return; introDone = true;
    if (!motion) { loader.style.display = 'none'; if (lenis) lenis.start(); heroIntro(); return; }
    var stripes = $$('.ld-stripes i', loader), n = $('[data-ld-n]', loader), o = { v: +n.textContent };
    gsap.timeline({ onComplete: function () { loader.style.display = 'none'; if (lenis) lenis.start(); } })
      .to(o, { v: 100, duration: .5, ease: 'power2.out', onUpdate: function () { n.textContent = Math.round(o.v); } })
      .to(stripes, { scaleX: 1, duration: .55, ease: 'expo.inOut', stagger: { each: .03, from: 'start' } })
      .set(loader, { backgroundColor: 'transparent' }).set('.ld-in', { autoAlpha: 0 })
      .add(heroIntro, '+=.05')
      .to(stripes, { scaleX: 0, transformOrigin: 'right', duration: .7, ease: 'expo.inOut', stagger: { each: .03, from: 'end' } }, '<');
  }
  if (motion) {
    var ldn = $('[data-ld-n]'), lo = { v: 0 };
    gsap.to(lo, { v: 86, duration: 1.6, ease: 'power1.out', onUpdate: function () { ldn.textContent = Math.round(lo.v); } });
  }
  var minWait = new Promise(function (r) { setTimeout(r, motion ? 1300 : 0); });
  var firstImg = $('.hg-bg img.on');
  var imgReady = new Promise(function (r) { if (!firstImg || firstImg.complete) r(); else { firstImg.addEventListener('load', r); firstImg.addEventListener('error', r); } });
  Promise.all([minWait, imgReady]).then(finishLoader);
  setTimeout(finishLoader, 4500);

  /* ---------- curtain transitions for in-page jumps ---------- */
  var curtain = $('[data-curtain]'), slats = $$('i', curtain), moving = false;
  function travel(target) {
    if (!motion) { jump(target); return; }
    if (moving) return; moving = true;
    var c = target.id === 'places' && placeColour ? placeColour : (target.getAttribute('data-bg') || '#0A1A5C');
    gsap.set(slats, { backgroundColor: c, transformOrigin: 'bottom' });
    gsap.timeline({ onComplete: function () { moving = false; } })
      .to(slats, { scaleY: 1, duration: .5, ease: 'expo.in', stagger: .045 })
      .add(function () { jump(target); activate(target); })
      .set(slats, { transformOrigin: 'top' })
      .to(slats, { scaleY: 0, duration: .65, ease: 'expo.out', stagger: .045 }, '+=.05');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var t = document.querySelector(id); if (!t) return;
    e.preventDefault();
    if (menuOpen) menu(false, function () { travel(t); }); else travel(t);
  });

  /* ---------- menu ---------- */
  var menuEl = $('[data-menu]'), menuBtn = $('[data-menu-btn]'), menuLabel = $('[data-menu-label]'), menuOpen = false;
  var mImgs = $$('[data-mp]', menuEl), mCap = $('[data-menu-cap]'), mCur = 0, mz = 2;
  function menu(open, after) {
    menuOpen = open; menuBtn.setAttribute('aria-expanded', String(open)); menuEl.setAttribute('aria-hidden', String(!open));
    menuLabel.textContent = open ? 'Close' : 'Menu'; nav.classList.toggle('menu-open', open); nav.classList.remove('hide');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    if (!motion) { menuEl.style.visibility = open ? 'visible' : 'hidden'; $('.menu-bg', menuEl).style.clipPath = open ? 'none' : ''; if (after) after(); return; }
    var bg = $('.menu-bg', menuEl), links = $$('.menu-list a', menuEl);
    if (open) {
      gsap.set(menuEl, { visibility: 'visible' });
      gsap.timeline()
        .fromTo(bg, { clipPath: 'circle(0% at calc(100% - 60px) 38px)' }, { clipPath: 'circle(150% at calc(100% - 60px) 38px)', duration: .9, ease: 'expo.inOut' })
        .fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out', stagger: .03 }, '-=.45')
        .fromTo('.menu-photo', { clipPath: 'inset(100% 0 0 0 round 26px)' }, { clipPath: 'inset(0% 0 0 0 round 26px)', duration: 1, ease: 'expo.out' }, '<')
        .fromTo('.menu-foot', { opacity: 0 }, { opacity: .8, duration: .5 }, '<.2')
        .add(function () { var f = $('.menu-list a', menuEl); if (f) f.focus({ preventScroll: true }); });
    } else {
      gsap.timeline({ onComplete: function () { gsap.set(menuEl, { visibility: 'hidden' }); if (after) after(); } })
        .to(links, { yPercent: -40, opacity: 0, duration: .3, ease: 'power2.in', stagger: .01 })
        .to(bg, { clipPath: 'circle(0% at calc(100% - 60px) 38px)', duration: .6, ease: 'expo.inOut' }, '-=.15')
        .to('.menu-photo', { opacity: 0, duration: .3 }, 0).set('.menu-photo', { opacity: 1 });
    }
  }
  menuBtn.addEventListener('click', function () { menu(!menuOpen); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { menu(false); menuBtn.focus(); } });
  $$('[data-mi]', menuEl).forEach(function (a) {
    var show = function () {
      var i = +a.getAttribute('data-mi'); if (i === mCur) return; mCur = i;
      var img = mImgs[i]; mCap.textContent = img.getAttribute('data-cap').replace('&amp;', '&');
      if (motion) { gsap.set(img, { zIndex: ++mz }); gsap.fromTo(img, { clipPath: 'inset(100% 0 0 0)', scale: 1.2 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: .8, ease: 'expo.out' }); }
      else { mImgs.forEach(function (m) { m.classList.toggle('on', m === img); }); }
    };
    a.addEventListener('mouseenter', show); a.addEventListener('focus', show);
  });

  /* ---------- cursor + magnetic buttons ---------- */
  var cur = $('[data-cursor]'), curLabel = $('[data-cursor-label]');
  if (motion && fine && cur) {
    var cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); }, { passive: true });
    $$('[data-cursor]').forEach(function (el) {
      if (el === cur) return;
      el.addEventListener('mouseenter', function () { curLabel.textContent = el.getAttribute('data-cursor'); gsap.to(cur, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(2)' }); });
      el.addEventListener('mouseleave', function () { gsap.to(cur, { scale: 0, opacity: 0, duration: .3 }); });
    });
  }
  $$('.btn').forEach(function (b) { b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.setProperty('--bx', (e.clientX - r.left) + 'px'); b.style.setProperty('--by', (e.clientY - r.top) + 'px'); }); });
  if (motion && fine) $$('[data-magnet]').forEach(function (b) {
    var qx = gsap.quickTo(b, 'x', { duration: .5, ease: 'elastic.out(1,.4)' }), qy = gsap.quickTo(b, 'y', { duration: .5, ease: 'elastic.out(1,.4)' });
    b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .25); qy((e.clientY - r.top - r.height / 2) * .35); });
    b.addEventListener('mouseleave', function () { qx(0); qy(0); });
  });

  /* ---------- hero: a 3D gallery of Malaysia; photos fly toward you, faster as you scroll, then the page takes over ---------- */
  var hero = $('#home'), HG = (function () {
    var layer = $('[data-hg]'); if (!layer) return null;
    var world = $('[data-hg-world]'), bgImgs = $$('[data-hg-bg] img'), fade = $('[data-hg-fade]'), cap = $('[data-hg-cap]');
    var plEl = $('[data-hg-place]'), noEl = $('[data-hg-note]'), why = $('#why');
    var NEAR = 650, FAR = -3400, SPAN = NEAR - FAR, PERSP = 900;
    var cards = $$('.hg-card', world).map(function (el, i) {
      var ar = parseFloat(el.style.getPropertyValue('--ar')) || 1.5;
      return { el: el, i: i, ang: i * 2.399963 + .4, rad: .74 + (i % 4) * .1, z0: (SPAN / 16) * i, w: ar > 1 ? 300 : 210 };
    });
    var feat = -1, featT = -1e9, drift = 0, sc = 0, rx = 0, ry = 0, trx = 0, try_ = 0, last = 0, on = true, raf = 0, mob = false;
    function feature(i) {
      if (i === feat) return; feat = i; featT = performance.now();
      var im = bgImgs[i];
      if (!im.getAttribute('src')) im.src = window.innerWidth < 900 ? im.getAttribute('data-src-m') : im.getAttribute('data-src');
      bgImgs.forEach(function (x) { x.classList.toggle('on', x === im); });
      cards.forEach(function (c) { c.el.classList.toggle('on', c.i === i); });
      var c = cards[i].el; plEl.textContent = c.getAttribute('data-place'); noEl.textContent = c.getAttribute('data-note');
      if (motion) gsap.fromTo([plEl, noEl], { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .05 });
    }
    window.addEventListener('pointermove', function (e) { if (!on) return; try_ = (e.clientX / window.innerWidth - .5) * 16; trx = -(e.clientY / window.innerHeight - .5) * 10; }, { passive: true });
    /* the photos sit behind the page, so find the one under the pointer when the hero is clicked */
    hero.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return;
      var hit = document.elementsFromPoint(e.clientX, e.clientY).filter(function (x) { return x.classList && x.classList.contains('hg-card'); })[0];
      if (hit) feature(+hit.getAttribute('data-hg'));
    });
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      var W = window.innerWidth, H = window.innerHeight, y = window.scrollY;
      var wt = why ? why.getBoundingClientRect().top : H, q = clamp(0, 1, 1 - wt / H);
      var vis = wt > -H * .15;
      if (vis !== on) { on = vis; layer.classList.toggle('off', !on); }
      if (!on) return;
      mob = W < 760;
      if (motion) { drift += 85 * dt; sc += (y * 1.7 - sc) * .12; }
      rx += (trx - rx) * .05; ry += (try_ - ry) * .05;
      world.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + (1 + q * .35).toFixed(3) + ')';
      fade.style.opacity = (Math.min(1, q * 1.15) * .97).toFixed(3);
      cap.style.opacity = (1 - clamp(0, 1, q * 2.5)).toFixed(3);
      var best = -1, bestZ = -1e9, s = mob ? .62 : 1;
      cards.forEach(function (c) {
        var z = ((c.z0 + drift + sc) % SPAN + SPAN) % SPAN + FAR;
        var x = Math.cos(c.ang) * W * .5 * c.rad * (mob ? 1.1 : 1), yy = Math.sin(c.ang) * H * .46 * c.rad;
        var fi = Math.min(1, (z - FAR) / 1700), fo = Math.min(1, (NEAR - z) / 380), o = Math.max(0, Math.min(fi * fi, fo));
        /* keep the title clear: on a phone the copy fills the width, so the clear zone is the whole middle of the screen */
        var k = PERSP / (PERSP - z), qx = x * k / (W * .5), qy = yy * k / (H * .5), cen = qx * qx / .42 + qy * qy / .5;
        /* on a phone the copy (eyebrow, title, text, buttons) fills a full-width band down the middle: a card anywhere
           in that band, counting its own height, all but disappears so nothing sits on the words */
        var halfH = c.w * s * .5 * k / (H * .5);
        if (mob) { if (y < H * .6 && qy + halfH > -.62 && qy - halfH < .78) o *= .06; }
        else if (cen < 1 && y < H * .6) o *= .18 + .82 * cen * cen;
        c.el.style.transform = 'translate3d(' + (x - c.w * s / 2).toFixed(1) + 'px,' + (yy - c.w * s * .4).toFixed(1) + 'px,' + z.toFixed(1) + 'px) scale(' + s + ')';
        c.el.style.opacity = o.toFixed(3);
        c.el.style.zIndex = Math.round(z + 4000);
        if (z < 200 && z > bestZ) { bestZ = z; best = c.i; }
      });
      if (best > -1 && now - featT > (y > 40 ? 2600 : 5200)) feature(best);
    }
    feature(0);
    raf = requestAnimationFrame(frame);
    return { layer: layer };
  })();
  var heroSplit = null;
  function heroIntro() {
    if (!motion) return;
    /* the title is printed in halftone dots (hero-halftone.js) that fly in and assemble; letters split only as a fallback */
    if (window.TCHalftone) window.TCHalftone.intro(); else if (window.SplitText) heroSplit = SplitText.create('[data-hl]', { type: 'chars', charsClass: 'ch' });
    var tl = gsap.timeline();
    if (heroSplit) tl.from(heroSplit.chars, { yPercent: 115, rotation: 6, duration: 1.3, ease: 'expo.out', stagger: .035 });
    tl.from('.hg-copy .eyebrow', { y: 20, opacity: 0, duration: .9, ease: 'expo.out' }, 0.1)
      .from('[data-hero-fade]', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1 }, .35)
      .from('.hg-stage', { scale: 1.6, opacity: 0, duration: 2.4, ease: 'expo.out' }, 0)
      .from('.hg-cap', { y: 30, opacity: 0, duration: 1, ease: 'expo.out' }, .6);
  }
  if (motion && ST) {
    gsap.to('[data-hero-copy]', { yPercent: -22, opacity: 0, scale: .92, ease: 'none', scrollTrigger: { trigger: '[data-hero-copy]', start: 'top top', end: 'bottom 25%', scrub: true } });
    $$('[data-hg-words] span').forEach(function (w) {
      gsap.timeline({ scrollTrigger: { trigger: w, start: 'top 95%', end: 'bottom 5%', scrub: .4 } })
        .fromTo(w, { opacity: 0, scale: .55, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'power2.out', duration: .45 })
        .to(w, { opacity: 0, scale: 1.6, filter: 'blur(8px)', ease: 'power2.in', duration: .55 });
    });
  }

  /* ---------- section headings, reveals, parallax ---------- */
  if (motion && window.SplitText) $$('[data-split]').forEach(function (el) {
    SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: function (self) { return gsap.from(self.lines, { yPercent: 110, duration: 1.25, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }); } });
  });
  if (motion) {
    $$('[data-up]').forEach(function (el) { gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }); });
    $$('[data-reveal]').forEach(function (fig) {
      var img = $('img', fig);
      gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } })
        .fromTo(fig, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
        .from(img, { scale: 1.35, duration: 1.8, ease: 'expo.out' }, '<.1');
    });
    $$('[data-par]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- why: statement fills word by word, stripes, star ---------- */
  (function why() {
    var st = $('[data-statement]'); if (!st) return;
    var words = [];
    Array.prototype.slice.call(st.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        var s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.appendChild(s);
      });
      st.replaceChild(frag, n);
    });
    words = $$('.w, .pill', st);
    if (!motion) return;
    var tl = gsap.timeline({ scrollTrigger: { trigger: st, start: 'top 82%', end: 'bottom 48%', scrub: .6 } });
    words.forEach(function (w, i) {
      if (w.classList.contains('pill')) tl.fromTo(w, { clipPath: 'inset(0 50% 0 50% round 999px)' }, { clipPath: 'inset(0 0% 0 0% round 999px)', duration: 1, ease: 'none' }, i * .5).from($('img', w), { scale: 1.8, duration: 1, ease: 'none' }, '<');
      else tl.to(w, { opacity: 1, duration: .5, ease: 'none' }, i * .5);
    });
    gsap.to('[data-star]', { rotation: 100, ease: 'none', scrollTrigger: { trigger: '#why', start: 'top bottom', end: 'bottom top', scrub: true } });
    if ($('.reasons')) gsap.from('.rs', { y: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.reasons', start: 'top 85%', once: true } });
  })();

  /* ---------- places: a game-style tactical map; drag to pan, scroll to zoom, regions set a waypoint from KLIA ---------- */
  (function gameMap() {
    var root = $('[data-gm]'); if (!root) return;
    var view = $('[data-gm-view]', root), world = $('[data-gm-world]', root), marks = $$('[data-gm-marks] > *', root), regs = $$('.gm-rg', root), lis = $$('.gm-li', root);
    var paths = $$('.gm-st', root), route = $('[data-gm-path]', root), route2 = $('[data-gm-path2]', root), ret = $('[data-gm-ret]', root), retT = $('[data-gm-ret-t]', root);
    var coordEl = $('[data-gm-coord]', root), gridEl = $('[data-gm-grid]', root), scaleI = $('[data-gm-scale]', root), scaleT = $('[data-gm-scale-t]', root);
    var zbar = $('[data-gm-zbar]', root), zt = $('[data-gm-zt]', root), mini = $('[data-gm-mini]', root), mrect = $('[data-gm-minirect]', root), needle = $('.gm-needle', root);
    var intel = $('[data-gm-intel]', root), engageBtn = $('[data-gm-go]', root);
    var WX = -60, WY = -40, WW = 1140, WH = 555, KLIA = [154, 333];
    var cam = { x: 0, y: 0, k: 1 }, kCov = 1, kMin = 1, kMax = 8, W = 0, H = 0, cur = -1, engaged = false, intelW = 0, leftW = 0;
    /* ticks on the compass */
    var tk = $('.gm-ticks', root); if (tk) { var h = ''; for (var a = 0; a < 360; a += 15) { var r1 = a % 90 ? 40 : 37, rad = a * Math.PI / 180; h += '<line x1="' + (Math.sin(rad) * r1).toFixed(1) + '" y1="' + (-Math.cos(rad) * r1).toFixed(1) + '" x2="' + (Math.sin(rad) * 44).toFixed(1) + '" y2="' + (-Math.cos(rad) * 44).toFixed(1) + '"/>'; } tk.innerHTML = h; }
    function size() {
      W = view.clientWidth; H = view.clientHeight;
      kCov = Math.max(W / WW, H / WH); kMin = Math.min(W / WW, H / WH) * .55; kMax = kCov * 7;
      intelW = intel.hidden || W < 900 ? 0 : intel.offsetWidth + 40; leftW = W < 900 ? 0 : $('.gm-tl', root).offsetWidth + 50;
    }
    function clampCam(c) {
      c.k = clamp(kMin, kMax, c.k);
      var px = W * .4, py = H * .3;
      c.x = clamp(Math.min(W - (WX + WW) * c.k, (W - (WX * 2 + WW) * c.k) / 2) - px, Math.max(-WX * c.k, (W - (WX * 2 + WW) * c.k) / 2) + px, c.x);
      c.y = clamp(Math.min(H - (WY + WH) * c.k, (H - (WY * 2 + WH) * c.k) / 2) - py, Math.max(-WY * c.k, (H - (WY * 2 + WH) * c.k) / 2) + py, c.y);
      return c;
    }
    function toScreen(x, y) { return [x * cam.k + cam.x, y * cam.k + cam.y]; }
    function toWorld(sx, sy) { return [(sx - cam.x) / cam.k, (sy - cam.y) / cam.k]; }
    function latlon(x, y) {
      var b = x > 332, lon = b ? 115.3 + (x - 737) / 68.4 : 101.687 + (x - 153) / 68.5, lat = b ? 7.36 - (y - 10) / 68.3 : 3.139 - (y - 306) / 68.3;
      return Math.abs(lat).toFixed(3) + '°' + (lat >= 0 ? 'N' : 'S') + ' ' + lon.toFixed(3) + '°E';
    }
    function grid(x, y) { var c = clamp(0, 9, Math.floor((x - WX) / 114)), r = clamp(0, 4, Math.floor((y - WY) / 111)); return String.fromCharCode(65 + c) + (r + 1); }
    var wpTo = null;
    function apply() {
      world.style.transform = 'translate(' + cam.x.toFixed(2) + 'px,' + cam.y.toFixed(2) + 'px) scale(' + cam.k.toFixed(4) + ')';
      marks.forEach(function (m) { var p = toScreen(+m.getAttribute('data-x'), +m.getAttribute('data-y')); m.style.transform = 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)'; });
      root.classList.toggle('zoomed', cam.k > kCov * 1.6);
      var zr = (cam.k - kMin) / (kMax - kMin); zbar.style.width = (zr * 100).toFixed(1) + '%'; zt.textContent = (cam.k / kCov).toFixed(1) + '×';
      /* scale bar: one world unit is about 1.63 km */
      var kmpx = 1.627 / cam.k, nice = [5, 10, 20, 50, 100, 200, 500], len = nice[0];
      for (var i = 0; i < nice.length; i++) { if (nice[i] / kmpx <= 150) len = nice[i]; }
      scaleI.style.width = (len / kmpx).toFixed(0) + 'px'; scaleT.textContent = len + ' km';
      var v0 = toWorld(0, 0), v1 = toWorld(W, H);
      mrect.setAttribute('x', v0[0].toFixed(1)); mrect.setAttribute('y', v0[1].toFixed(1)); mrect.setAttribute('width', (v1[0] - v0[0]).toFixed(1)); mrect.setAttribute('height', (v1[1] - v0[1]).toFixed(1));
      if (wpTo) {
        var A = toScreen(KLIA[0], KLIA[1]), B = toScreen(wpTo[0], wpTo[1]), mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - Math.hypot(B[0] - A[0], B[1] - A[1]) * .28;
        var d = 'M' + A[0].toFixed(1) + ' ' + A[1].toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + B[0].toFixed(1) + ' ' + B[1].toFixed(1);
        route.setAttribute('d', d); route2.setAttribute('d', d);
      } else { route.setAttribute('d', ''); route2.setAttribute('d', ''); }
    }
    function fly(t, dur) {
      clampCam(t);
      if (motion) gsap.to(cam, { x: t.x, y: t.y, k: t.k, duration: dur == null ? 1.3 : dur, ease: 'power3.inOut', onUpdate: apply, overwrite: true });
      else { cam.x = t.x; cam.y = t.y; cam.k = t.k; apply(); }
    }
    function zoomAt(sx, sy, f, dur) {
      var w = toWorld(sx, sy), k = clamp(kMin, kMax, cam.k * f);
      fly({ k: k, x: sx - w[0] * k, y: sy - w[1] * k }, dur == null ? .45 : dur);
    }
    function home() { fly({ k: kCov, x: (W - (WX * 2 + WW) * kCov) / 2, y: (H - (WY * 2 + WH) * kCov) / 2 }); }
    /* region selection */
    function select(i) {
      if (i < 0 || i >= regs.length) return;
      cur = i; var r = regs[i], x = +r.getAttribute('data-x'), y = +r.getAttribute('data-y'), z = +r.getAttribute('data-z');
      regs.forEach(function (g, j) { g.classList.toggle('on', j === i); }); lis.forEach(function (g, j) { g.classList.toggle('on', j === i); });
      var st = r.getAttribute('data-states').split('|');
      paths.forEach(function (p) { p.classList.toggle('on', st.indexOf(p.getAttribute('data-ms')) > -1); });
      $('[data-gm-img]', intel).src = r.getAttribute('data-img'); $('[data-gm-img]', intel).alt = r.getAttribute('data-name');
      $('[data-gm-code]', intel).textContent = r.getAttribute('data-code'); $('[data-gm-n]', intel).textContent = pad(i + 1) + ' / ' + pad(regs.length);
      $('[data-gm-tag]', intel).textContent = r.getAttribute('data-tag'); $('[data-gm-name]', intel).textContent = r.getAttribute('data-name'); $('[data-gm-text]', intel).textContent = r.getAttribute('data-text');
      $('[data-gm-mode]', intel).textContent = r.getAttribute('data-mode');
      var ch = $('[data-gm-chips]', intel); ch.innerHTML = ''; r.getAttribute('data-chips').split('|').forEach(function (t) { var s = document.createElement('span'); s.textContent = t; ch.appendChild(s); });
      $('[data-gm-dir]', intel).href = './universities.html?state=' + encodeURIComponent(st[0]);
      var wasHidden = intel.hidden; intel.hidden = false; size();
      if (motion && wasHidden) gsap.fromTo(intel, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: .6, ease: 'expo.out' });
      if (motion) gsap.fromTo($$('.gm-intel-b > *', intel), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out', stagger: .04 });
      countTo($('[data-gm-count]', intel), +r.getAttribute('data-count'), .9); countTo($('[data-gm-km]', intel), +r.getAttribute('data-km'), 1.1);
      var k = kCov * z, fcx = (leftW + W - intelW) / 2;
      fly({ k: k, x: fcx - x * k, y: H * (W < 900 ? .34 : .55) - y * k });
      wpTo = null; apply();
      if (needle) needle.style.transform = 'rotate(' + (Math.atan2(x - KLIA[0], -(y - KLIA[1])) * 180 / Math.PI).toFixed(0) + 'deg)';
    }
    function waypoint() {
      if (cur < 0) return; var r = regs[cur]; wpTo = [+r.getAttribute('data-x'), +r.getAttribute('data-y')];
      /* frame both KLIA and the destination */
      var x0 = Math.min(KLIA[0], wpTo[0]) - 60, x1 = Math.max(KLIA[0], wpTo[0]) + 110, y0 = Math.min(KLIA[1], wpTo[1]) - 60, y1 = Math.max(KLIA[1], wpTo[1]) + 40;
      var mob = W < 900, freeW = W - intelW - leftW, freeH = mob ? H * .5 : H, fcx = leftW + freeW / 2, k = Math.min(freeW / (x1 - x0), freeH / (y1 - y0)) * .8;
      fly({ k: k, x: fcx - (x0 + x1) / 2 * k, y: (mob ? H * .3 : H / 2) - (y0 + y1) / 2 * k });
      if (motion) { var L = 2000; gsap.fromTo(route2, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', delay: .4, onComplete: function () { route2.style.strokeDasharray = ''; } }); }
      apply();
    }
    function closeIntel() { intel.hidden = true; cur = -1; wpTo = null; regs.forEach(function (g) { g.classList.remove('on'); }); lis.forEach(function (g) { g.classList.remove('on'); }); paths.forEach(function (p) { p.classList.remove('on'); }); size(); apply(); }
    regs.forEach(function (r, i) { r.addEventListener('click', function (e) { e.stopPropagation(); engage(true); select(i); }); });
    lis.forEach(function (l, i) { l.addEventListener('click', function () { engage(true); select(i); }); });
    $('[data-gm-wp]', intel).addEventListener('click', waypoint);
    $('[data-gm-close]', intel).addEventListener('click', function () { closeIntel(); home(); });
    $('[data-gm-next]', intel).addEventListener('click', function () { select((cur + 1) % regs.length); });
    $('[data-gm-prev]', intel).addEventListener('click', function () { select((cur - 1 + regs.length) % regs.length); });
    $('[data-gm-zin]', root).addEventListener('click', function () { zoomAt(W / 2, H / 2, 1.6); });
    $('[data-gm-zout]', root).addEventListener('click', function () { zoomAt(W / 2, H / 2, 1 / 1.6); });
    $('[data-gm-home]', root).addEventListener('click', function () { closeIntel(); home(); });
    /* engage: the wheel only zooms once the visitor has clicked into the map, so the page still scrolls normally */
    function engage(on) { engaged = on; root.classList.toggle('engaged', on); if (on) view.setAttribute('data-lenis-prevent', ''); else view.removeAttribute('data-lenis-prevent'); }
    engageBtn.addEventListener('click', function () { engage(true); view.focus({ preventScroll: true }); });
    document.addEventListener('pointerdown', function (e) { if (engaged && !root.contains(e.target)) engage(false); });
    view.addEventListener('wheel', function (e) {
      if (!engaged) return; e.preventDefault();
      var r = view.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.25 : 1 / 1.25, .35);
    }, { passive: false });
    view.addEventListener('dblclick', function (e) { var r = view.getBoundingClientRect(); engage(true); zoomAt(e.clientX - r.left, e.clientY - r.top, 1.8); });
    /* drag to pan with a little inertia */
    var drag = null;
    view.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button, a')) return;
      if (e.pointerType === 'touch' && !engaged) return;
      engage(true); gsap && gsap.killTweensOf(cam);
      drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, t: performance.now(), vx: 0, vy: 0, lx: e.clientX, ly: e.clientY };
      view.setPointerCapture(e.pointerId); view.classList.add('dragging');
    });
    view.addEventListener('pointermove', function (e) {
      var r = view.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, w = toWorld(sx, sy);
      ret.style.transform = 'translate(' + sx + 'px,' + sy + 'px)'; var ll = latlon(w[0], w[1]); retT.textContent = ll; coordEl.textContent = ll; gridEl.textContent = grid(w[0], w[1]);
      if (!drag) return;
      var now = performance.now(), dt = Math.max(1, now - drag.t);
      drag.vx = (e.clientX - drag.lx) / dt; drag.vy = (e.clientY - drag.ly) / dt; drag.lx = e.clientX; drag.ly = e.clientY; drag.t = now;
      cam.x = drag.cx + e.clientX - drag.x; cam.y = drag.cy + e.clientY - drag.y; clampCam(cam); apply();
      if (needle) needle.style.transform = 'rotate(' + clamp(-25, 25, drag.vx * 30).toFixed(1) + 'deg)';
    });
    function endDrag() {
      if (!drag) return; view.classList.remove('dragging');
      var t = { x: cam.x + drag.vx * 260, y: cam.y + drag.vy * 260, k: cam.k }; drag = null;
      if (motion) fly(t, .8); if (needle && cur < 0) needle.style.transform = 'rotate(0deg)';
    }
    view.addEventListener('pointerup', endDrag); view.addEventListener('pointercancel', endDrag);
    /* minimap: click to move there */
    mini.addEventListener('click', function (e) {
      var r = mini.getBoundingClientRect(), wx = WX + (e.clientX - r.left) / r.width * WW, wy = WY + (e.clientY - r.top) / r.height * WH;
      engage(true); fly({ k: cam.k, x: W / 2 - wx * cam.k, y: H / 2 - wy * cam.k }, .7);
    });
    /* keyboard, like a game */
    view.addEventListener('keydown', function (e) {
      var step = 80, k = e.key;
      if (k >= '1' && k <= String(regs.length)) { select(+k - 1); e.preventDefault(); }
      else if (k === '+' || k === '=') zoomAt(W / 2, H / 2, 1.4); else if (k === '-' || k === '_') zoomAt(W / 2, H / 2, 1 / 1.4);
      else if (k === 'ArrowLeft') fly({ x: cam.x + step, y: cam.y, k: cam.k }, .35); else if (k === 'ArrowRight') fly({ x: cam.x - step, y: cam.y, k: cam.k }, .35);
      else if (k === 'ArrowUp') { e.preventDefault(); fly({ x: cam.x, y: cam.y + step, k: cam.k }, .35); } else if (k === 'ArrowDown') { e.preventDefault(); fly({ x: cam.x, y: cam.y - step, k: cam.k }, .35); }
      else if (k === 'r' || k === 'R') { closeIntel(); home(); } else if (k === 'Enter' && cur > -1) waypoint();
      else if (k === 'Escape') { if (!intel.hidden) { closeIntel(); home(); } else engage(false); }
    });
    window.addEventListener('resize', function () { size(); clampCam(cam); apply(); });
    size(); cam.k = kCov; cam.x = (W - (WX * 2 + WW) * kCov) / 2; cam.y = (H - (WY * 2 + WH) * kCov) / 2; clampCam(cam); apply();
    if (ST) ST.create({ trigger: root, start: 'top 55%', once: true, onEnter: function () {
      if (!motion) return;
      gsap.from(regs.map(function (r) { return $('.gm-rg-d', r); }), { scale: 0, rotation: 180, duration: .8, ease: 'back.out(2)', stagger: .12, clearProps: 'transform' });
      gsap.from('.gm-hud', { opacity: 0, y: 20, duration: .9, ease: 'expo.out', stagger: .1 });
      /* a slow establishing shot toward the peninsula */
      var k0 = kCov * 1.25; fly({ k: k0, x: W * .56 - 210 * k0, y: H * .55 - 280 * k0 }, 2.4);
    } });
  })();

  /* ---------- services: a 3D ring of cards you can spin ---------- */
  (function ring() {
    var stage = $('[data-ring-stage]'), ringEl = $('[data-ring]'); if (!stage || !ringEl) return;
    var cs = $$('.rc', ringEl), N = cs.length, STEP = 360 / N, st = { rot: 0 }, front = -1, R = 0, auto = true, drag = false, vel = 0, lastX = 0, lastT = 0, snapT = null;
    var rdN = $('[data-rd-n]'), rdT = $('[data-rd-t]'), rdD = $('[data-rd-d]'), rdA = $('[data-rd-a]');
    function radius() { var w = cs[0].offsetWidth; R = Math.round(w / 2 / Math.tan(Math.PI / N) * 1.3); }
    function render() {
      ringEl.style.transform = 'translateZ(' + (-R) + 'px) rotateY(' + st.rot.toFixed(2) + 'deg)';
      var f = ((Math.round(-st.rot / STEP) % N) + N) % N;
      cs.forEach(function (c, i) {
        var a = ((i * STEP + st.rot) % 360 + 540) % 360 - 180, cos = Math.cos(a * Math.PI / 180);
        c.style.transform = 'rotateY(' + (i * STEP) + 'deg) translateZ(' + R + 'px)';
        c.style.setProperty('--dim', (.75 * (1 - (cos + 1) / 2)).toFixed(3));
      });
      if (f !== front) { front = f; cs.forEach(function (c, i) { c.classList.toggle('front', i === f); }); detail(f); }
    }
    function detail(i) {
      var c = cs[i], apply = function () { rdN.textContent = pad(i + 1) + ' / ' + pad(N); rdT.textContent = c.getAttribute('data-name'); rdD.textContent = c.getAttribute('data-desc'); rdA.textContent = c.getAttribute('data-cta') + ' →'; rdA.setAttribute('href', c.getAttribute('data-href')); };
      if (motion) gsap.timeline().to([rdT, rdD], { y: -12, opacity: 0, duration: .15 }).add(apply).fromTo([rdT, rdD], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out', stagger: .05 });
      else apply();
    }
    function goTo(i) {
      var target = -i * STEP, cur = st.rot, k = Math.round((cur - target) / 360);
      target += k * 360; auto = false; clearTimeout(snapT);
      if (gsap) gsap.to(st, { rot: target, duration: 1, ease: 'expo.out', onUpdate: render, onComplete: resume }); else { st.rot = target; render(); }
    }
    function resume() { clearTimeout(snapT); snapT = setTimeout(function () { auto = true; }, 5000); }
    function snap() { var i = ((Math.round(-st.rot / STEP) % N) + N) % N; goTo(i); }
    radius(); render();
    window.addEventListener('resize', function () { radius(); render(); });
    var live = false; inView(stage, function (v) { live = v; });
    if (gsap) gsap.ticker.add(function (t, dt) { if (live && auto && !drag && motion) { st.rot -= .012 * dt; render(); } });
    stage.addEventListener('pointerdown', function (e) { drag = true; auto = false; lastX = e.clientX; lastT = performance.now(); vel = 0; if (gsap) gsap.killTweensOf(st); stage.setPointerCapture && stage.setPointerCapture(e.pointerId); stage._moved = 0; });
    stage.addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - lastX, now = performance.now(); st.rot += dx * .22; vel = dx / Math.max(1, now - lastT); lastX = e.clientX; lastT = now; stage._moved += Math.abs(dx); render(); });
    var up = function () {
      if (!drag) return; drag = false;
      if (stage._moved < 6) return;
      if (gsap) gsap.to(st, { rot: st.rot + vel * 260, duration: .8, ease: 'power3.out', onUpdate: render, onComplete: snap }); else snap();
    };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    cs.forEach(function (c, i) { c.addEventListener('click', function () { if (stage._moved > 6) return; goTo(i); }); });
    $('[data-rd-prev]').addEventListener('click', function () { goTo((front - 1 + N) % N); });
    $('[data-rd-next]').addEventListener('click', function () { goTo((front + 1) % N); });
    if (motion) gsap.from(stage, { scale: .7, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: stage, start: 'top 85%', once: true } });
  })();

  /* ---------- universities: leaderboard + spotlight ---------- */
  (function board() {
    var list = $('[data-lb]'); if (!list) return;
    var lis = $$('[data-lr]', list), btns = lis.map(function (l) { return $('.lr', l); }), imgs = $$('[data-si]'), cur = 0, z = 2, touched = false, timer = null;
    var sp = { rank: $('[data-sp-rank]'), type: $('[data-sp-type]'), name: $('[data-sp-name]'), loc: $('[data-sp-loc]'), f: $('[data-sp-f]'), acc: $('[data-sp-acc]'), g: $('[data-sp-g]'), link: $('[data-sp-link]') };
    var maxA = +sp.g.getAttribute('data-max');
    function show(i, user) {
      if (user) touched = true;
      if (i === cur && !user && sp.name.textContent) return;
      var prev = cur; cur = i; var li = lis[i], b = btns[i];
      btns.forEach(function (x, j) { x.classList.toggle('on', j === i); x.setAttribute('aria-pressed', String(j === i)); });
      var im = imgs[+li.getAttribute('data-i')];
      if (motion) { gsap.set(im, { zIndex: ++z }); gsap.fromTo(im, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.2 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1, ease: 'expo.out' }); }
      else imgs.forEach(function (x) { x.classList.toggle('on', x === im); });
      var apply = function () {
        sp.rank.textContent = li.getAttribute('data-rank'); sp.type.textContent = b.getAttribute('data-typ') + (b.getAttribute('data-typ') === 'Private' ? ' university' : ' university');
        sp.name.textContent = b.getAttribute('data-name'); sp.loc.textContent = b.getAttribute('data-loc');
        sp.f.innerHTML = ''; b.getAttribute('data-fields').split('|').forEach(function (t) { var s = document.createElement('span'); s.textContent = t; sp.f.appendChild(s); });
        var a = +li.getAttribute('data-acc'); countTo(sp.acc, a, 1); sp.g.style.strokeDashoffset = (100 - a / maxA * 100).toFixed(1);
        sp.link.href = './universities.html?q=' + encodeURIComponent(b.getAttribute('data-name').replace(/\s*\(.*\)/, ''));
      };
      if (motion && prev !== i) gsap.timeline().to([sp.name, sp.loc, sp.f, sp.type], { y: -12, opacity: 0, duration: .18, stagger: .02 }).add(apply).fromTo([sp.type, sp.name, sp.loc, sp.f], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'expo.out', stagger: .05 });
      else apply();
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { show(i, true); }); if (fine) b.addEventListener('mouseenter', function () { if (touched) show(i, true); }); });
    show(0); sp.name.textContent = btns[0].getAttribute('data-name');
    var live = false; inView(list, function (v) { live = v; });
    timer = setInterval(function () {
      if (touched || !live || !motion || document.hidden) return;
      var vis = lis.filter(function (l) { return !l.hidden; }), k = vis.indexOf(lis[cur]);
      show(lis.indexOf(vis[(k + 1) % vis.length]));
    }, 4200);
    var fil = 'all', sort = 'rank';
    function apply() {
      var state = window.Flip && motion ? Flip.getState(lis) : null;
      lis.forEach(function (l) { l.hidden = !(fil === 'all' || l.getAttribute('data-type') === fil); });
      lis.slice().sort(function (a, b) { return sort === 'rank' ? a.getAttribute('data-rank') - b.getAttribute('data-rank') : b.getAttribute('data-acc') - a.getAttribute('data-acc'); }).forEach(function (l) { list.appendChild(l); });
      if (state) Flip.from(state, { duration: .8, ease: 'expo.inOut', stagger: .02, onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: .5 }); }, onLeave: function (els) { return gsap.to(els, { opacity: 0, duration: .25 }); }, onComplete: function () { if (ST) ST.refresh(); } });
      if (lis[cur].hidden) { var v = lis.filter(function (l) { return !l.hidden; })[0]; show(lis.indexOf(v), true); }
    }
    $$('[data-filters] button').forEach(function (b, _, all) { b.addEventListener('click', function () { all.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); fil = b.getAttribute('data-f'); touched = true; apply(); }); });
    $$('[data-sorter] button').forEach(function (b, _, all) { b.addEventListener('click', function () { all.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); sort = b.getAttribute('data-s'); touched = true; apply(); }); });
    if (motion) gsap.from(lis, { x: -60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .04, scrollTrigger: { trigger: list, start: 'top 85%', once: true } });
  })();

  /* ---------- journey: your Student Pass on a tracker app; steps on the left drive the phone ---------- */
  (function tracker() {
    var root = $('[data-trk]'); if (!root) return;
    var D = JSON.parse($('[data-trk-json]', root).textContent);
    var steps = $$('.ts', root), imgs = $$('[data-trk-photo] img', root), list = $$('[data-trk-list] li', root), rail = $('[data-trk-rail]', root);
    var notif = $('[data-trk-notif]', root), nic = $('[data-trk-nic]', root), nfrom = $('[data-trk-nfrom]', root), nmsg = $('[data-trk-nmsg]', root);
    var tag = $('[data-trk-tag]', root), title = $('[data-trk-title]', root), text = $('[data-trk-text]', root), note = $('[data-trk-note]', root), chip = $('[data-trk-chip]', root), arc = $('[data-trk-arc]', root), pct = $('[data-trk-pct]', root), body = $('[data-trk-body]', root);
    var cur = -1, z = 2, timer = null, live = false, userT = 0, HOLD = 6200;
    function show(i, user) {
      i = (i + D.length) % D.length; if (i === cur) return; var dir = i > cur ? 1 : -1; cur = i; if (user) userT = Date.now();
      var d = D[i];
      steps.forEach(function (s, j) { s.setAttribute('aria-pressed', String(j === i)); s.classList.toggle('done', j < i); });
      list.forEach(function (l, j) { l.classList.toggle('done', j < i); l.classList.toggle('on', j === i); });
      if (gsap) gsap.to(rail, { scaleY: i / (D.length - 1), duration: .9, ease: 'expo.out' }); else rail.style.transform = 'scaleY(' + i / (D.length - 1) + ')';
      arc.style.strokeDashoffset = (119.4 * (1 - (i + 1) / D.length)).toFixed(1); pct.textContent = (i + 1) + '/' + D.length;
      var fill = function () {
        tag.textContent = 'Step ' + pad(i + 1) + ' · ' + d.tag; title.textContent = d.title; text.textContent = d.text; note.hidden = !d.note; note.textContent = d.note || ''; chip.textContent = d.chip;
      };
      var im = imgs[i]; if (im.loading === 'lazy') im.loading = 'eager';
      if (motion) {
        gsap.set(im, { zIndex: ++z }); im.classList.add('on');
        gsap.fromTo(im, { clipPath: 'circle(0% at 50% 50%)', scale: 1.2 }, { clipPath: 'circle(75% at 50% 50%)', scale: 1, duration: 1, ease: 'expo.inOut', onComplete: function () { imgs.forEach(function (x) { if (x !== im) x.classList.remove('on'); }); } });
        gsap.timeline().to(body, { x: -30 * dir, opacity: 0, duration: .25, ease: 'power2.in' }).add(fill).fromTo(body, { x: 30 * dir }, { x: 0, opacity: 1, duration: .6, ease: 'expo.out' });
        nic.textContent = d.ic; nfrom.textContent = d.from; nmsg.textContent = d.msg;
        gsap.timeline({ delay: .5 }).fromTo(notif, { yPercent: -140, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .7, ease: 'back.out(1.6)' }).to(notif, { yPercent: -140, opacity: 0, duration: .5, ease: 'power2.in', delay: 3.4 });
        gsap.fromTo(steps[i].querySelector('.ts-n'), { scale: .7 }, { scale: 1.08, duration: .7, ease: 'elastic.out(1,.4)' });
      } else { imgs.forEach(function (x) { x.classList.toggle('on', x === im); }); fill(); nic.textContent = d.ic; nfrom.textContent = d.from; nmsg.textContent = d.msg; notif.style.transform = 'none'; notif.style.opacity = 1; }
      tick();
    }
    function tick() { clearTimeout(timer); if (!motion || !live) return; timer = setTimeout(function () { if (Date.now() - userT > 12000) show(cur + 1); else tick(); }, HOLD); }
    steps.forEach(function (s, j) { s.addEventListener('click', function () { show(j, true); }); });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); show(cur + 1, true); steps[cur].focus(); } if (e.key === 'ArrowUp') { e.preventDefault(); show(cur - 1, true); steps[cur].focus(); } });
    var clk = $('[data-trk-time]', root);
    function clock() { try { clk.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' }); } catch (e) { /* keep default */ } }
    clock(); setInterval(clock, 30000);
    if (ST) {
      inView(root, function (v) { live = v; if (v) tick(); else clearTimeout(timer); });
      ST.create({ trigger: root, start: 'top 75%', once: true, onEnter: function () { show(0); } });
      if (motion) {
        gsap.from('.trk-device', { y: 120, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: root, start: 'top 80%', once: true } });
        gsap.from(steps, { x: -50, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: root, start: 'top 80%', once: true } });
        gsap.from('.trk-float', { scale: .5, opacity: 0, duration: 1, ease: 'back.out(1.8)', stagger: .2, delay: .6, scrollTrigger: { trigger: root, start: 'top 70%', once: true } });
      }
    } else { live = true; show(0); }
  })();

  /* ---------- course finder ---------- */
  (function finder() {
    var F = window.MY_FIELDS, IDX = window.MY_INDEX, card = $('[data-cf-card]'); if (!F || !card) return;
    var chips = $$('.fchip'), kicker = $('[data-cf-kicker]'), count = $('[data-cf-count]'), sub = $('[data-cf-sub]'), list = $('[data-cf-list]'), states = $('[data-cf-states]'), q = $('[data-cf-q]');
    var curF = chips[0].getAttribute('data-field'), curL = $('.fchip-name', chips[0]).textContent;
    var norm = function (t) { return String(t).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); };
    var COL = ['#FFCC00', '#C8102E', '#0A1A5C', '#0E5C5A', '#B0225E', '#E07A1F'];
    function rows(items) {
      list.innerHTML = '';
      if (!items.length) { var e = document.createElement('li'); e.className = 'cf-empty'; e.textContent = 'No institution matches that name. Try a shorter word, or ask us.'; list.appendChild(e); return; }
      items.forEach(function (u, i) {
        var li = document.createElement('li'), rk = document.createElement('span'), mid = document.createElement('div'), b = document.createElement('b'), sm = document.createElement('small'), ty = document.createElement('span');
        rk.className = 'cf-rank' + (u.r ? '' : ' mqa'); rk.textContent = u.r ? '#' + u.r : (u.a && u.a !== 'n/a' ? u.a + ' prog' : 'EMGS');
        if (u.r) { rk.style.background = COL[i % COL.length]; if (i % COL.length) rk.style.color = '#fff'; }
        var a = document.createElement('a'); a.href = './universities.html?q=' + encodeURIComponent(u.n.replace(/\s*\(.*\)/, '')); a.target = '_blank'; a.rel = 'opener'; a.textContent = u.n; b.appendChild(a); sm.textContent = u.l; mid.appendChild(b); mid.appendChild(sm);
        ty.className = 'cf-type'; ty.textContent = u.t;
        li.appendChild(rk); li.appendChild(mid); li.appendChild(ty); list.appendChild(li);
      });
      if (motion) gsap.from(list.children, { x: 40, opacity: 0, duration: .6, ease: 'expo.out', stagger: .05 });
    }
    function bars(pairs) {
      states.innerHTML = ''; states.hidden = !pairs.length; var max = pairs.length ? pairs[0][1] : 1;
      pairs.forEach(function (p, i) {
        var r = document.createElement('div'), l = document.createElement('span'), bar = document.createElement('i'), nn = document.createElement('b');
        l.textContent = p[0]; nn.textContent = p[1]; bar.style.width = (p[1] / max * 100) + '%'; bar.style.background = COL[(i + 1) % COL.length];
        r.appendChild(l); r.appendChild(bar); r.appendChild(nn); states.appendChild(r);
        if (motion) gsap.from(bar, { scaleX: 0, duration: 1, ease: 'expo.out', delay: i * .05 });
      });
    }
    var dirLink = $('[data-cf-dir]');
    function field() { var d = F[curF]; kicker.textContent = curL; if (dirLink) dirLink.href = './universities.html?field=' + encodeURIComponent(curF); countTo(count, d.count, 1); sub.textContent = 'institutions list this among their three biggest fields'; rows(d.top); bars(d.states); }
    chips.forEach(function (c) { c.addEventListener('click', function () { chips.forEach(function (x) { x.setAttribute('aria-checked', String(x === c)); }); curF = c.getAttribute('data-field'); curL = $('.fchip-name', c).textContent; q.value = ''; field(); }); });
    var t;
    q.addEventListener('input', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var term = norm(q.value); if (term.length < 2) { field(); return; }
        var hits = IDX.filter(function (u) { return norm(u.n + ' ' + u.alt + ' ' + u.l).indexOf(term) > -1; }).sort(function (a, b) { return (a.r || 999) - (b.r || 999); });
        kicker.textContent = 'Search: ' + q.value.trim(); countTo(count, hits.length, .6); if (dirLink) dirLink.href = './universities.html?q=' + encodeURIComponent(q.value.trim());
        sub.textContent = hits.length === 1 ? 'institution matches your search' : 'institutions match your search';
        rows(hits.slice(0, 6)); bars([]);
      }, 160);
    });
    field();
  })();

  /* ---------- life: parallax photo columns, phrases, festival tilt ---------- */
  (function life() {
    if (motion && ST) {
      var mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', function () {
        var sp = [-10, 8, -16, 6, -8];
        $$('[data-gal-col]').forEach(function (c, i) { gsap.fromTo(c, { yPercent: -sp[i] / 2 }, { yPercent: sp[i], ease: 'none', scrollTrigger: { trigger: '[data-gal]', start: 'top bottom', end: 'bottom top', scrub: true } }); });
      });
      ST.batch('.gi', { start: 'top 92%', once: true, onEnter: function (b) { gsap.fromTo(b, { clipPath: 'inset(22% 0% 0% 0% round 20px)', y: 70 }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', y: 0, duration: 1.3, ease: 'expo.out', stagger: .08 }); } });
      if ($('.fe')) gsap.from('.fe', { y: 80, opacity: 0, rotationX: -14, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.fest', start: 'top 88%', once: true } });
    }
    var chips = $$('[data-chips] .chip'), my = $('[data-sp-my]'), pr = $('[data-sp-pr]'), en = $('[data-sp-en]'), tip = $('[data-sp-tip]'), say = $('[data-say]');
    function pick(c) {
      chips.forEach(function (x) { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', String(x === c)); });
      var apply = function () { my.textContent = c.getAttribute('data-my'); pr.textContent = c.getAttribute('data-pr'); en.textContent = c.getAttribute('data-en'); tip.textContent = c.getAttribute('data-tip'); };
      if (motion) gsap.timeline().to([my, pr, en, tip], { y: -16, opacity: 0, duration: .2, stagger: .03, ease: 'power2.in' }).add(apply).fromTo([my, pr, en, tip], { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .05 });
      else apply();
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { pick(c); }); });
    if (say) {
      if (!('speechSynthesis' in window)) say.hidden = true;
      else say.addEventListener('click', function () {
        var u = new SpeechSynthesisUtterance(my.textContent), vs = speechSynthesis.getVoices();
        var v = vs.filter(function (x) { return /^ms/i.test(x.lang); })[0] || vs.filter(function (x) { return /^id/i.test(x.lang); })[0];
        if (v) u.voice = v; u.lang = v ? v.lang : 'ms-MY'; u.rate = .85;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
        if (motion) gsap.fromTo(say, { scale: .92 }, { scale: 1, duration: .6, ease: 'elastic.out(1,.4)' });
      });
    }
    if (motion && fine) $$('.fe').forEach(function (f) {
      var rx = gsap.quickTo(f, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(f, 'rotationY', { duration: .6, ease: 'power3' });
      f.addEventListener('pointermove', function (e) { var r = f.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 14); rx(-((e.clientY - r.top) / r.height - .5) * 14); });
      f.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  })();

  /* ---------- escapes: postcard marquees that speed up and lean with your scroll ---------- */
  (function escapes() {
    var rows = $$('[data-marq-row]'); if (!rows.length || !motion) return;
    var live = false, boost = 0, hover = 1;
    var state = rows.map(function (r, i) { return { el: r, x: i ? -0.5 : 0, dir: i ? 1 : -1, w: 0 }; });
    function measure() { state.forEach(function (s) { s.w = s.el.scrollWidth / 2; if (s.x === -0.5) s.x = -s.w; }); }
    measure(); window.addEventListener('resize', measure);
    inView($('#escapes'), function (v) { live = v; });
    rows.forEach(function (r) { r.addEventListener('mouseenter', function () { hover = .25; }); r.addEventListener('mouseleave', function () { hover = 1; }); });
    gsap.ticker.add(function (t, dt) {
      if (!live) return;
      var v = lenis ? lenis.velocity : 0; boost += (Math.abs(v) * .6 - boost) * .08;
      state.forEach(function (s) {
        s.x += s.dir * (0.6 + boost) * hover * (dt / 16.7);
        if (s.x <= -s.w) s.x += s.w; if (s.x > 0) s.x -= s.w;
        s.el.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,0,0) skewX(' + clamp(-8, 8, -v * .25).toFixed(2) + 'deg)';
      });
    });
  })();

  /* ---------- money: three funding cards, staggered in and tilting toward the pointer ---------- */
  (function money() {
    var cards = $$('.fc'); if (!cards.length) return;
    if (motion) {
      gsap.from(cards, { y: 160, rotation: function (i) { return [-6, 0, 6][i % 3]; }, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '[data-fcards]', start: 'top 80%', once: true } });
      gsap.from('.fc-coin', { rotationY: 540, scale: 0, duration: 1.6, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: '[data-fcards]', start: 'top 70%', once: true } });
    }
    if (!motion || !fine) return;
    cards.forEach(function (c) {
      var rx = gsap.quickTo(c, 'rotationX', { duration: .6, ease: 'power3.out' }), ry = gsap.quickTo(c, 'rotationY', { duration: .6, ease: 'power3.out' });
      c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 10); rx(-((e.clientY - r.top) / r.height - .5) * 8); });
      c.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  })();

  /* ---------- family: drag (or tap) your family onto the Dependant Pass ---------- */
  (function family() {
    var root = $('[data-fam]'); if (!root) return;
    var ask = $('[data-ask]', root), lv = $$('[data-level]', ask), nt = $$('[data-nat]', ask), st = { level: 'pg', nat: 'in' };
    var tray = $('[data-tray-in]', root), dp = $('[data-dp]', root), slots = $$('.dp-slot[data-si]', root), toks = $$('.fm', root);
    var nEl = $('[data-dp-n]', root), stamp = $('[data-dp-stamp]', root), msg = $('[data-dp-msg]', root), title = $('[data-v-title]', root), text = $('[data-v-text]', root);
    var Fl = window.Flip, anim = motion && !!Fl;
    var R = {
      pg: ['on', 'Can apply', 'Your whole family can apply', 'As a postgraduate you may apply for Dependant Passes for your spouse, children, parents and parents-in-law. We prepare every application with yours.', '#0F7B5F', '#9FF0C9'],
      'ug-in': ['off', 'Not eligible', 'Not for Indian undergraduates', 'Undergraduate dependants are limited to citizens of 17 listed countries, and India is not currently one of them. A postgraduate route opens this up, so ask us about it.', '#C8102E', '#FF9DA8'],
      'ug-other': ['maybe', 'Check first', 'It depends on your nationality', 'Undergraduates may bring dependants only if they are citizens of one of 17 listed countries. Tell us your nationality and we will confirm before you plan.', '#C77700', '#FFD48A']
    };
    function rule() { return R[st.level === 'pg' ? 'pg' : 'ug-' + st.nat]; }
    function inPass(t) { return !!t.closest('[data-dp]'); }
    function relocate(t, dest, before) {
      var s = anim ? Fl.getState(t) : null;
      if (gsap) gsap.set(t, { x: 0, y: 0 });
      dest.insertBefore(t, before || null);
      if (s) Fl.from(s, { duration: .7, ease: 'expo.out' });
    }
    function paint(flash) {
      var r = rule(), n = 0;
      toks.forEach(function (t) { t.classList.remove('on', 'maybe'); if (inPass(t)) { n++; t.classList.add(r[0]); } t.setAttribute('aria-pressed', String(inPass(t))); });
      nEl.textContent = n; root.style.setProperty('--fv', r[4]);
      stamp.textContent = r[1]; stamp.style.color = r[5];
      title.textContent = n && r[0] === 'on' ? (n === 7 ? 'Your whole family can apply' : n + (n === 1 ? ' family member' : ' family members') + ' can apply with you') : r[2];
      text.textContent = r[3];
      if (flash && motion) { gsap.fromTo(msg, { x: -10 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)' }); gsap.fromTo(stamp, { scale: 2, opacity: 0, rotation: -30 }, { scale: 1, opacity: 1, rotation: -9, duration: .55, ease: 'back.out(2)' }); }
    }
    function nope(t) {
      t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope');
      if (gsap) gsap.to(t, { x: 0, y: 0, duration: .5, ease: 'back.out(2)' });
      paint(true);
    }
    function add(t) {
      if (inPass(t)) return;
      if (rule()[0] === 'off') { nope(t); return; }
      var slot = slots[+t.getAttribute('data-i')]; relocate(t, slot); paint();
      if (motion) gsap.fromTo(slot, { scale: .92 }, { scale: 1, duration: .7, ease: 'elastic.out(1,.45)', delay: .35 });
      if (motion) gsap.fromTo(nEl, { yPercent: -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'back.out(2)' });
    }
    function remove(t) {
      if (!inPass(t)) return;
      var i = +t.getAttribute('data-i'), next = $$('.fm', tray).filter(function (x) { return +x.getAttribute('data-i') > i; })[0];
      relocate(t, tray, next); paint();
    }
    toks.forEach(function (t) {
      if (window.Draggable && gsap) {
        Draggable.create(t, { type: 'x,y', minimumMovement: 6, zIndexBoost: false,
          onPress: function () { t.classList.add('is-drag'); },
          onDrag: function () { dp.classList.toggle('is-over', !inPass(t) && this.hitTest(dp, '20%')); },
          onRelease: function () {
            t.classList.remove('is-drag'); var over = this.hitTest(dp, '20%'); dp.classList.remove('is-over');
            if (!this.isDragging && Math.abs(this.x) < 6 && Math.abs(this.y) < 6) return;
            if (!inPass(t) && over) add(t);
            else if (inPass(t) && !over) remove(t);
            else gsap.to(t, { x: 0, y: 0, duration: .5, ease: 'back.out(1.6)' });
          },
          onClick: function () { if (inPass(t)) remove(t); else add(t); } });
      } else t.addEventListener('click', function () { if (inPass(t)) remove(t); else add(t); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (inPass(t)) remove(t); else add(t); } });
    });
    $('[data-fam-all]', root).addEventListener('click', function () {
      var out = toks.filter(function (t) { return !inPass(t); });
      if (rule()[0] === 'off') { out.forEach(function (t, i) { setTimeout(function () { nope(t); }, i * 60); }); return; }
      out.forEach(function (t, i) { setTimeout(function () { add(t); }, i * 110); });
    });
    $('[data-fam-reset]', root).addEventListener('click', function () { toks.slice().reverse().forEach(function (t, i) { setTimeout(function () { remove(t); }, i * 70); }); });
    function bind(btns, k, attr) {
      btns.forEach(function (b) { b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); st[k] = b.getAttribute(attr);
        nt.forEach(function (x) { x.disabled = st.level === 'pg'; });
        if (rule()[0] === 'off') toks.filter(inPass).reverse().forEach(function (t, i) { setTimeout(function () { remove(t); }, i * 80); });
        paint(true);
      }); });
    }
    bind(lv, 'level', 'data-level'); bind(nt, 'nat', 'data-nat');
    nt.forEach(function (x) { x.disabled = true; });
    paint();
    if (motion) {
      gsap.from(toks, { y: 30, opacity: 0, scale: .8, duration: .8, ease: 'back.out(1.7)', stagger: .06, scrollTrigger: { trigger: tray, start: 'top 85%', once: true } });
      gsap.from(dp, { y: 60, rotation: 2, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: dp, start: 'top 85%', once: true } });
      /* a little demo: the spouse hops onto the pass the first time the section is reached */
      ST.create({ trigger: dp, start: 'top 55%', once: true, onEnter: function () { setTimeout(function () { var t = toks[0]; if (!inPass(t) && rule()[0] !== 'off') add(t); }, 900); } });
    }
  })();

  /* ---------- voices: a wall of postcards you can move around ---------- */
  (function wall() {
    var board = $('[data-board]'); if (!board) return;
    var posts = $$('[data-post]', board), z = 10, mmDesk = window.matchMedia('(min-width: 901px)'), drags = [], focused = null;
    function scatter(anim) {
      if (!mmDesk.matches || !gsap) { posts.forEach(function (p) { if (gsap) gsap.set(p, { clearProps: 'x,y,rotation,zIndex,scale' }); }); return; }
      var W = board.clientWidth, H = board.clientHeight, pw = posts[0].offsetWidth, ph = posts[0].offsetHeight, cols = 3, rows = 3;
      var order = posts.map(function (p, i) { return i; }).sort(function () { return Math.random() - .5; });
      posts.forEach(function (p, i) {
        var k = order[i], c = k % cols, r = Math.floor(k / cols);
        var x = (W - pw) * (c / (cols - 1)) + gsap.utils.random(-40, 40), y = (H - ph) * (r / (rows - 1)) + gsap.utils.random(-30, 30);
        var v = { x: clamp(0, W - pw, x), y: clamp(0, H - ph, y), rotation: gsap.utils.random(-9, 9), zIndex: ++z, scale: 1 };
        if (anim && motion) gsap.to(p, Object.assign({ duration: 1, ease: 'expo.out', delay: i * .04 }, v)); else gsap.set(p, v);
      });
      focused = null;
    }
    function focus(p) {
      if (!mmDesk.matches) return;
      if (focused === p) { focused = null; gsap.to(p, { scale: 1, rotation: gsap.utils.random(-6, 6), duration: .6, ease: 'expo.out' }); return; }
      focused = p; var W = board.clientWidth, H = board.clientHeight;
      gsap.to(p, { x: (W - p.offsetWidth) / 2, y: (H - p.offsetHeight) / 2, rotation: 0, scale: 1.18, zIndex: ++z, duration: .8, ease: 'expo.out' });
    }
    function setup() {
      drags.forEach(function (d) { d.kill(); }); drags = [];
      if (mmDesk.matches && gsap && window.Draggable) posts.forEach(function (p) {
        drags.push(Draggable.create(p, { type: 'x,y', bounds: board, inertia: !!window.InertiaPlugin, edgeResistance: .7,
          onPress: function () { gsap.set(p, { zIndex: ++z }); gsap.to(p, { scale: 1.04, duration: .2 }); },
          onRelease: function () { if (focused !== p) gsap.to(p, { scale: 1, duration: .3 }); },
          onClick: function () { focus(p); } })[0]);
      });
      scatter(false);
    }
    setup();
    mmDesk.addEventListener && mmDesk.addEventListener('change', setup);
    window.addEventListener('resize', function () { if (mmDesk.matches) scatter(false); });
    posts.forEach(function (p) { p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focus(p); } }); });
    $('[data-shuffle]').addEventListener('click', function () { scatter(true); });
    if (motion) gsap.from(posts, { y: -200, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: .07, scrollTrigger: { trigger: board, start: 'top 80%', once: true } });
  })();

  /* ---------- FAQ: Tanya Tutee chat ---------- */
  (function chat() {
    var body = $('[data-chat-body]'), form = $('[data-chat-form]'), input = $('[data-chat-in]'), sugg = $('[data-chat-sugg]'); if (!body || !form) return;
    var data; try { data = JSON.parse($('[data-faq-data]').textContent); } catch (e) { return; }
    body.setAttribute('data-lenis-prevent', '');
    var asked = {};
    function time() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
    function bubble(cls, html) {
      var m = document.createElement('div'); m.className = 'msg ' + cls; m.innerHTML = html + '<span class="msg-t">' + time() + '</span>'; body.appendChild(m);
      if (motion) gsap.from(m, { y: 16, opacity: 0, scale: .96, duration: .45, ease: 'back.out(1.6)', transformOrigin: cls === 'me' ? '100% 100%' : '0 100%' });
      body.scrollTop = body.scrollHeight; return m;
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function suggest(exclude) {
      sugg.innerHTML = '';
      data.map(function (d, i) { return i; }).filter(function (i) { return i !== exclude && !asked[i]; }).slice(0, 4).forEach(function (i) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = data[i].s; b.addEventListener('click', function () { ask(i); }); sugg.appendChild(b);
      });
    }
    function reply(html, after) {
      var t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); body.scrollTop = body.scrollHeight;
      setTimeout(function () { t.remove(); bubble('bot', html); if (after) after(); }, motion ? 700 + Math.min(900, html.length * 2) : 0);
    }
    function ask(i, typed) {
      var d = data[i]; asked[i] = true;
      bubble('me', esc(typed || d.q));
      reply('<b>' + esc(d.q) + '</b>' + esc(d.a), function () { suggest(i); });
    }
    function match(q) {
      var t = ' ' + q.toLowerCase() + ' ', best = -1, score = 0;
      data.forEach(function (d, i) { var s = 0; d.k.forEach(function (k) { if (t.indexOf(k) > -1) s += k.length > 5 ? 2 : 1; }); if (s > score) { score = s; best = i; } });
      return best;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = '';
      var i = match(q);
      if (i > -1) ask(i, q);
      else { bubble('me', esc(q)); reply('Good question. That one needs a counsellor who can see your profile. <a href="https://wa.me/917010902329" target="_blank" rel="noopener">Ask us on WhatsApp ↗</a> or book a <a href="#begin">free evaluation</a>.', function () { suggest(-1); }); }
    });
    $$('[data-qchips] .qc').forEach(function (b) { b.addEventListener('click', function () { ask(+b.getAttribute('data-q')); if (window.innerWidth < 900) $('[data-chat]').scrollIntoView({ behavior: 'smooth', block: 'center' }); }); });
    var started = false;
    function start() { if (started) return; started = true; reply('Selamat datang! 👋 I am the Tutee Connect Malaysia desk. Tap a question below or type your own.', function () { suggest(-1); }); }
    once($('[data-chat]'), 'top 80%', start);
  })();

  /* ---------- study passport: the left page fills in as the form is answered ---------- */
  var PP = (function () {
    var pp = $('[data-pp]'); if (!pp) return null;
    var dd = {}; $$('[data-pp]', pp).forEach(function (d) { dd[d.getAttribute('data-pp')] = d; });
    var ini = $('[data-pp-ini]', pp), mrz = $('[data-pp-mrz]', pp), box = $('[data-pp-stamps]', pp), done = {};
    var EMPTY = { name: 'Your name', email: '—', phone: '—' };
    var clean = function (t) { return String(t || '').toUpperCase().normalize('NFD').replace(/[^A-Z0-9 ]/g, '').trim(); };
    var fill = function (t, n) { t = t.slice(0, n); while (t.length < n) t += '<'; return t; };
    function set(k, v) {
      var d = dd[k]; if (!d) return; v = String(v || '').trim(); var nv = v || EMPTY[k] || d.textContent;
      if (d.textContent === nv) return; d.textContent = nv; d.classList.toggle('is-set', !!v);
      if (motion) gsap.fromTo(d, { backgroundColor: 'rgba(255,204,0,.55)' }, { backgroundColor: 'rgba(255,204,0,0)', duration: 1, ease: 'power2.out' });
    }
    function code(name, phone, intake) {
      var parts = clean(name).split(/\s+/).filter(Boolean), sur = parts.length > 1 ? parts.pop() : (parts[0] || 'STUDENT'), giv = parts.join('<');
      var yr = (String(intake || '').match(/20\d\d/) || ['2027'])[0], num = String(phone || '').replace(/\D/g, '').slice(-9);
      mrz.innerHTML = '';
      mrz.appendChild(document.createTextNode(fill('P<MYS' + sur + '<<' + giv, 44))); mrz.appendChild(document.createElement('br'));
      mrz.appendChild(document.createTextNode(fill('TC' + (num || '000000000') + '<MYS<<' + yr + '<<TUTEE<CONNECT', 44)));
      var i = clean(name).split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).join('').slice(0, 2);
      if (ini.textContent !== (i || '?')) { ini.textContent = i || '?'; if (motion) gsap.fromTo(ini, { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: 'back.out(2)' }); }
    }
    var SLOTS = [[0, 2, -12], [22, 10, 6], [58, 0, -7], [3, 62, 9], [79, 34, -14]];
    var MARKS = [['Identity noted', '#C8102E', 'round'], ['Email received', '#0A1A5C', ''], ['Reachable', '#0F7B5F', 'round'], ['Course chosen', '#B0225E', ''], ['Intake booked', '#C77700', 'round']];
    function stamp(i, label, col, cls, x, y, rot) {
      if (done[i]) return; done[i] = true;
      var el = document.createElement('span'); el.className = 'stp' + (cls ? ' ' + cls : ''); el.textContent = label;
      el.style.left = x + '%'; el.style.top = y + '%'; el.style.color = col; box.appendChild(el);
      if (motion) gsap.fromTo(el, { scale: 2.8, opacity: 0, rotation: rot - 20 }, { scale: 1, opacity: .92, rotation: rot, duration: .42, ease: 'power4.in', onComplete: function () { gsap.fromTo(pp, { y: 0 }, { y: 3, duration: .06, yoyo: true, repeat: 1 }); } });
      else { el.style.opacity = .92; el.style.transform = 'rotate(' + rot + 'deg)'; }
    }
    return {
      set: set, code: code,
      step: function (i) { var m = MARKS[i], sl = SLOTS[i]; if (m) stamp(i, m[0], m[1], m[2], sl[0] + Math.random() * 3, sl[1] + Math.random() * 4, sl[2]); },
      approve: function () { stamp('ok', 'Approved for counselling', '#C8102E', 'big', 30, 50, -6); }
    };
  })();
  function setDestination(name) {
    var di = $('[data-destination-input]'); if (di) di.value = name;
    if (PP) PP.set('destination', name);
  }
  window.TCsetDestination = setDestination;

  /* ---------- conversational form -> /api/enquiry ---------- */
  (function convo() {
    var form = $('form[data-lead-form]'); if (!form) return;
    var steps = $$('.cv-step', form), next = $('[data-cv-next]', form), back = $('[data-cv-back]', form), submit = $('[data-submit-btn]', form), prog2 = $('[data-cv-prog]');
    var err = $('[data-form-error]', form), errT = $('[data-form-error-text]', form), done = $('[data-form-success]'), nameOut = $('[data-cv-name]'), cur = 0;
    function error(m) { err.hidden = !m; errT.textContent = m || ''; if (m && motion) gsap.fromTo(err, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)' }); }
    function valid(k) {
      var s = steps[k].getAttribute('data-step'), v = function (n) { return String((form.elements[n] || {}).value || '').trim(); };
      if (s === 'name' && !v('name')) return 'Please tell us your name.';
      if (s === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) return 'Please enter a valid email address, like name@example.com.';
      if (s === 'phone' && !/^[0-9]{7,15}$/.test(v('phone_number').replace(/\D/g, ''))) return 'Please enter a phone number of 7 to 15 digits.';
      return '';
    }
    function show(k, dir) {
      var from = steps[cur]; cur = k; var to = steps[k];
      steps.forEach(function (s) { s.classList.remove('is-on'); }); to.classList.add('is-on');
      if (motion) gsap.fromTo(to, { x: 40 * (dir || 1), opacity: 0 }, { x: 0, opacity: 1, duration: .55, ease: 'expo.out' });
      prog2.style.transform = 'scaleX(' + ((k + 1) / steps.length) + ')';
      back.hidden = k === 0; next.hidden = k === steps.length - 1; submit.hidden = k !== steps.length - 1;
      var inp = to.querySelector('input:not([type="hidden"]), textarea, .opts button.on');
      if (inp && from !== to) setTimeout(function () { inp.focus({ preventScroll: true }); }, 50);
    }
    function sync() {
      var v = function (n) { return String((form.elements[n] || {}).value || '').trim(); };
      if (!PP) return;
      PP.set('name', v('name')); PP.set('email', v('email'));
      PP.set('phone', v('phone_number') ? v('country_code') + ' ' + v('phone_number') : '');
      PP.set('study_level', v('study_level')); PP.set('intake', v('intake'));
      PP.code(v('name'), v('phone_number'), v('intake'));
    }
    form.addEventListener('input', sync); form.addEventListener('change', sync);
    next.addEventListener('click', function () {
      var m = valid(cur); if (m) { error(m); return; } error('');
      if (PP) PP.step(cur);
      if (steps[cur].getAttribute('data-step') === 'name') nameOut.textContent = String(form.elements.name.value).trim().split(' ')[0] || 'friend';
      show(Math.min(cur + 1, steps.length - 1), 1);
    });
    back.addEventListener('click', function () { error(''); show(Math.max(cur - 1, 0), -1); });
    form.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') { e.preventDefault(); if (!next.hidden) next.click(); } });
    $$('[data-opts]', form).forEach(function (g) {
      var hidden = form.elements[g.getAttribute('data-opts')], bs = $$('button', g);
      bs.forEach(function (b) { b.addEventListener('click', function () { bs.forEach(function (x) { x.classList.toggle('on', x === b); }); hidden.value = b.textContent; sync(); if (motion) gsap.fromTo(b, { scale: .9 }, { scale: 1, duration: .5, ease: 'elastic.out(1,.4)' }); }); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var k = 0; k < steps.length; k++) { var m = valid(k); if (m) { show(k); error(m); return; } }
      error('');
      var d = {}; new FormData(form).forEach(function (v, key) { d[key] = v; });
      d.phone = (d.country_code || '') + ' ' + (d.phone_number || ''); delete d.country_code; delete d.phone_number;
      if (!String(d.message || '').trim()) delete d.message;
      try { d.page = location.host + location.pathname; } catch (x) { d.page = ''; }
      submit.disabled = true; var label = submit.textContent; submit.textContent = 'Sending…';
      fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
        .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
        .then(function (res) {
          if (res && res.success) {
            if (PP) PP.approve();
            form.reset(); form.hidden = true; prog2.style.transform = 'scaleX(1)'; done.hidden = false;
            if (motion) {
              gsap.from('.done-star', { scale: 0, rotation: -180, duration: 1.2, ease: 'back.out(1.6)' });
              gsap.from($$('h3, p', done), { y: 20, opacity: 0, duration: .7, ease: 'expo.out', stagger: .1, delay: .4 });
            }
          } else error((res && res.message) || 'We could not send that. Please try again, or message us on WhatsApp.');
        })
        .catch(function () { error('No connection. Check your internet and try again, or message us on WhatsApp.'); })
        .then(function () { submit.disabled = false; submit.textContent = label; });
    });
    show(0);
  })();
  window.addEventListener('storage', function (e) {
    if (e.key !== 'selectedUniversity' || !e.newValue) return;
    setDestination(e.newValue);
    try { localStorage.removeItem('selectedUniversity'); } catch (x) { /* ignore */ }
    var t = $('#begin'); if (t) travel(t);
  });
  try { var picked = localStorage.getItem('selectedUniversity'); if (picked) { setDestination(picked); localStorage.removeItem('selectedUniversity'); } } catch (x) { /* storage unavailable */ }

  /* ---------- directory: its own tab on the live site; an in-page panel when the page is embedded (previews block new tabs) ---------- */
  (function dirpop() {
    var pop = $('[data-dirpop]'); if (!pop) return;
    var embedded = false; try { embedded = window.self !== window.top; } catch (e) { embedded = true; }
    if (/[?&]dirpop\b/.test(location.search)) embedded = true;
    if (!embedded) return;
    var droot = $('[data-dir-root]', pop), loaded = null, open = false, last = null, tEl = null, tT;
    function load(src) { return new Promise(function (res, rej) { var sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); }
    function ready() {
      if (!loaded) loaded = (window.MY_UNIVERSITIES ? Promise.resolve() : load('./assets/js/universities-data.js')).then(function () { return window.TCDir ? null : load('./assets/js/dir.js'); });
      return loaded;
    }
    function say(m) {
      if (!tEl) { tEl = document.createElement('div'); tEl.className = 'mtoast'; tEl.setAttribute('role', 'status'); document.body.appendChild(tEl); }
      tEl.textContent = m; tEl.hidden = false; clearTimeout(tT); tT = setTimeout(function () { tEl.hidden = true; }, 3400);
      if (motion) gsap.fromTo(tEl, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out' });
    }
    function show(params) {
      ready().then(function () {
        window.TCDir.init(droot, { params: params, scroller: pop, onBack: function (h) { close(h); },
          onPick: function (name) { setDestination(name); close('#begin'); say(name + ' is on your study passport.'); } });
        if (open) return; open = true;
        pop.hidden = false; pop.scrollTop = 0; root.classList.add('dir-open'); if (lenis) lenis.stop();
        if (motion) gsap.fromTo(pop, { clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)', duration: .9, ease: 'expo.inOut', clearProps: 'clipPath' });
        var b = $('button[data-back]', pop); if (b) b.focus({ preventScroll: true });
      }).catch(function () { if (last) window.open(last.href, '_blank'); });
    }
    function close(hash) {
      if (!open) return; open = false;
      var fin = function () {
        pop.hidden = true; root.classList.remove('dir-open'); if (lenis) lenis.start();
        var t = hash && hash.length > 1 ? document.querySelector(hash) : null;
        if (t) travel(t); else if (last) last.focus({ preventScroll: true });
      };
      if (motion) gsap.to(pop, { clipPath: 'circle(0% at 50% 100%)', duration: .7, ease: 'expo.inOut', onComplete: fin }); else fin();
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="universities.html"]'); if (!a || pop.contains(a)) return;
      e.preventDefault(); e.stopPropagation(); last = a;
      var u = a.getAttribute('href'), k = u.indexOf('?');
      show(k > -1 ? u.slice(k) : '');
    }, true);
    pop.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      e.preventDefault(); e.stopPropagation(); close(a.getAttribute('href'));
    });
    document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') close(''); });
  })();

  /* ---------- footer: the Petronas Twin Towers at night; windows light up round the pointer, click for fireworks ---------- */
  (function towers() {
    var box = $('[data-towers]'), cv = $('[data-towers-cv]'); if (!box || !cv) return;
    var ctx = cv.getContext('2d'), bg = document.createElement('canvas'), bctx = bg.getContext('2d'), boostT = 0, boost = 0;
    window.addEventListener('tc:jumpa', function (e) { boostT = e.detail ? 1 : 0; if (e.detail === 'burst') { tops.forEach(function (tp, i) { setTimeout(function () { burst(tp.x + (i ? 50 : -50), tp.y - H * .1); }, i * 250); }); } });
    var W, H, dpr, mob, wins = [], bridge = null, tops = [], parts = [], mx = -1e4, my = -1e4, gx = -1e4, gy = -1e4, live = false, raf = 0, reveal = motion ? 0 : 1, sweep = 0;
    var TIERS = [[0, .56, 1], [.56, .655, .9], [.655, .735, .8], [.735, .795, .69], [.795, .845, .58], [.845, .882, .46], [.882, .905, .36], [.905, .935, .22]];
    var rnd = (function () { var s = 7; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    function layout() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.75); W = box.clientWidth; H = box.clientHeight; mob = W < 760;
      cv.width = bg.width = Math.round(W * dpr); cv.height = bg.height = Math.round(H * dpr);
      var th = H * (mob ? .56 : .84), tw = mob ? Math.min(W * .17, 78) : Math.min(W * .072, 118), cx = mob ? W * .5 : W * .74, ground = H;
      var centres = [cx - tw * .98, cx + tw * .98];
      wins = []; tops = [];
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H);
      /* stars */
      for (var i = 0; i < 140; i++) { bctx.fillStyle = 'rgba(255,255,255,' + (.15 + rnd() * .5).toFixed(2) + ')'; bctx.fillRect(rnd() * W, rnd() * H * .7, rnd() < .1 ? 2 : 1, rnd() < .1 ? 2 : 1); }
      /* far skyline, KL Tower and Merdeka 118 */
      var far = function (x, w, h, c) { bctx.fillStyle = c; bctx.fillRect(x, ground - h, w, h); };
      for (var x = -20; x < W; ) { var w = 30 + rnd() * 70, h = 40 + rnd() * (mob ? 90 : 170); far(x, w, h, '#0A1035'); for (var wy = ground - h + 8; wy < ground - 6; wy += 9) for (var wx = x + 5; wx < x + w - 5; wx += 8) if (rnd() < .12) { bctx.fillStyle = 'rgba(255,214,140,' + (.15 + rnd() * .35).toFixed(2) + ')'; bctx.fillRect(wx, wy, 3, 4); } x += w + 2 + rnd() * 10; }
      var kx = mob ? W * .14 : cx - W * .27, kh = th * .78;
      bctx.fillStyle = '#0C1442'; bctx.fillRect(kx - 7, ground - kh, 14, kh); bctx.beginPath(); bctx.ellipse(kx, ground - kh * .9, 30, 16, 0, 0, Math.PI * 2); bctx.fill();
      bctx.fillRect(kx - 18, ground - kh * .9 - 22, 36, 8); bctx.fillRect(kx - 1.5, ground - kh * 1.12, 3, kh * .24);
      bctx.fillStyle = 'rgba(255,90,90,.9)'; bctx.fillRect(kx - 1.5, ground - kh * 1.12, 3, 3);
      var mx8 = mob ? W * .86 : cx + W * .2, mh = th * .98;
      bctx.fillStyle = '#0C1442'; bctx.beginPath(); bctx.moveTo(mx8 - 34, ground); bctx.lineTo(mx8 - 26, ground - mh * .7); bctx.lineTo(mx8 - 10, ground - mh * .86); bctx.lineTo(mx8, ground - mh); bctx.lineTo(mx8 + 4, ground - mh * .84); bctx.lineTo(mx8 + 22, ground - mh * .66); bctx.lineTo(mx8 + 30, ground); bctx.closePath(); bctx.fill();
      bctx.strokeStyle = 'rgba(120,170,255,.18)'; bctx.lineWidth = 1; for (var m = 0; m < 6; m++) { bctx.beginPath(); bctx.moveTo(mx8 - 30 + m * 10, ground); bctx.lineTo(mx8 - 6 + m * 2, ground - mh * .8); bctx.stroke(); }
      /* the twin towers */
      centres.forEach(function (c, ti) {
        var top = ground - th;
        TIERS.forEach(function (tr, k) {
          var y0 = ground - th * tr[1], y1 = ground - th * tr[0], hw = tw * tr[2] / 2;
          var g = bctx.createLinearGradient(c - hw, 0, c + hw, 0);
          g.addColorStop(0, '#1A2345'); g.addColorStop(.35, '#55648E'); g.addColorStop(.55, '#3A4670'); g.addColorStop(1, '#121A38');
          bctx.fillStyle = g; bctx.fillRect(c - hw, y0, hw * 2, y1 - y0);
          bctx.fillStyle = 'rgba(210,225,255,.35)'; bctx.fillRect(c - hw, y0, hw * 2, 1.2);
          bctx.strokeStyle = 'rgba(0,0,0,.25)'; bctx.lineWidth = 1;
          for (var fx = c - hw + 3; fx < c + hw; fx += mob ? 4 : 5) { bctx.beginPath(); bctx.moveTo(fx, y0); bctx.lineTo(fx, y1); bctx.stroke(); }
          var fh = Math.max(4.2, th / 120), cols = Math.max(2, Math.floor(hw * 2 / (mob ? 4 : 5)) - 1);
          for (var fy = y0 + 3; fy < y1 - 2; fy += fh) for (var ci = 0; ci < cols; ci++) {
            var wx2 = c - hw + 2.5 + ci * (hw * 2 - 4) / cols;
            wins.push({ x: wx2, y: fy, w: Math.max(1.6, (hw * 2 - 4) / cols - 1.6), h: fh * .55, f: (ground - fy) / th, on: rnd() < .42, ph: rnd() * 6.28, sp: .4 + rnd() * 1.2 });
          }
        });
        /* pinnacle and spire */
        var py = ground - th * .935;
        bctx.fillStyle = '#4A5884'; bctx.beginPath(); bctx.moveTo(c - tw * .11, py); bctx.lineTo(c, py - th * .03); bctx.lineTo(c + tw * .11, py); bctx.fill();
        bctx.fillStyle = '#9FB0D8'; bctx.fillRect(c - 1.2, ground - th * 1.0, 2.4, th * .065);
        for (var r = 0; r < 4; r++) { bctx.beginPath(); bctx.arc(c, py - th * .03 - r * th * .009, 3 - r * .5, 0, 6.28); bctx.fillStyle = '#B9C7EA'; bctx.fill(); }
        tops.push({ x: c, y: ground - th });
      });
      /* skybridge with its legs */
      var by = ground - th * .42, bx0 = centres[0] + tw * .5, bx1 = centres[1] - tw * .5;
      bctx.fillStyle = '#5A6894'; bctx.fillRect(bx0, by, bx1 - bx0, th * .018); bctx.fillStyle = '#2B3560'; bctx.fillRect(bx0, by + th * .018, bx1 - bx0, th * .008);
      bctx.strokeStyle = '#46547F'; bctx.lineWidth = 2.2; var bm = (bx0 + bx1) / 2;
      bctx.beginPath(); bctx.moveTo(bm, by + th * .025); bctx.lineTo(bx0, ground - th * .31); bctx.moveTo(bm, by + th * .025); bctx.lineTo(bx1, ground - th * .31); bctx.stroke();
      bridge = { x: bx0, y: by, w: bx1 - bx0, h: th * .018 };
    }
    function burst(x, y) {
      var cols = ['#FFCC00', '#FF5468', '#FFFFFF', '#7FE3FF', '#FFB000'], col = cols[Math.floor(Math.random() * cols.length)], n = mob ? 50 : 80;
      for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 1.2 + Math.random() * 3.6; parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, d: .008 + Math.random() * .012, c: Math.random() < .25 ? '#FFFFFF' : col }); }
      if (parts.length > 900) parts.splice(0, parts.length - 900);
    }
    function frame(now) {
      if (!live) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
      var t = now / 1000;
      gx += (mx - gx) * .18; gy += (my - gy) * .18; boost += (boostT - boost) * .08;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(bg, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      /* sweeping searchlights behind the towers */
      if (motion) sweep = Math.sin(t * .35) * .5;
      tops.forEach(function (tp, i) {
        var ang = -Math.PI / 2 + (i ? -sweep : sweep) - (i ? .18 : -.18), len = H * 1.1, sp = .05;
        var g = ctx.createLinearGradient(tp.x, H, tp.x + Math.cos(ang) * len, H + Math.sin(ang) * len);
        g.addColorStop(0, 'rgba(255,214,140,.10)'); g.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tp.x, H); ctx.lineTo(tp.x + Math.cos(ang - sp) * len, H + Math.sin(ang - sp) * len); ctx.lineTo(tp.x + Math.cos(ang + sp) * len, H + Math.sin(ang + sp) * len); ctx.closePath(); ctx.fill();
      });
      /* pointer glow */
      if (gx > -1000) { var rg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 170); rg.addColorStop(0, 'rgba(255,190,90,.22)'); rg.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = rg; ctx.fillRect(gx - 170, gy - 170, 340, 340); }
      /* windows */
      ctx.fillStyle = '#FFD58A';
      for (var i = 0; i < wins.length; i++) {
        var w = wins[i], b = (w.on ? .42 + .2 * Math.sin(t * w.sp + w.ph) : .07) + boost * (.35 + .3 * Math.sin(t * 4 + w.y * .05));
        var dx = w.x - gx, dy = w.y - gy, d2 = dx * dx + dy * dy; if (d2 < 32400) b += (1 - Math.sqrt(d2) / 180) * .95;
        if (w.f > reveal) b *= .08;
        if (b < .04) continue;
        ctx.globalAlpha = Math.min(1, b); ctx.fillRect(w.x, w.y, w.w, w.h);
      }
      ctx.globalAlpha = 1;
      if (bridge) { var bd = Math.hypot(bridge.x + bridge.w / 2 - gx, bridge.y - gy), bb = .35 + Math.max(0, 1 - bd / 220) * .6; ctx.fillStyle = 'rgba(255,224,160,' + (bb * reveal).toFixed(2) + ')'; ctx.fillRect(bridge.x + 2, bridge.y + bridge.h * .35, bridge.w - 4, bridge.h * .35); }
      tops.forEach(function (tp) { var a = (.5 + .5 * Math.sin(t * 3)) * reveal; ctx.fillStyle = 'rgba(255,80,80,' + a.toFixed(2) + ')'; ctx.beginPath(); ctx.arc(tp.x, tp.y, 2.2, 0, 6.28); ctx.fill(); });
      /* fireworks */
      for (var p = parts.length - 1; p >= 0; p--) {
        var q = parts[p]; q.x += q.vx; q.y += q.vy; q.vx *= .985; q.vy = q.vy * .985 + .035; q.l -= q.d;
        if (q.l <= 0) { parts.splice(p, 1); continue; }
        ctx.globalAlpha = q.l; ctx.fillStyle = q.c; ctx.fillRect(q.x - 1.6, q.y - 1.6, 3.2, 3.2); ctx.globalAlpha = q.l * .35; ctx.fillRect(q.x - q.vx * 3 - 1, q.y - q.vy * 3 - 1, 2, 2);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    layout();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
    box.addEventListener('pointermove', function (e) { var r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; if (gx < -1000) { gx = mx; gy = my; } });
    box.addEventListener('pointerleave', function () { mx = my = -1e4; gx = gy = -1e4; });
    box.addEventListener('click', function (e) { if (e.target.closest('a')) return; var r = box.getBoundingClientRect(); burst(e.clientX - r.left, e.clientY - r.top); });
    inView(box, function (v) { live = v; if (v) start(); });
    if (motion && ST) {
      var o = { r: 0 };
      ST.create({ trigger: box, start: 'top 75%', once: true, onEnter: function () {
        gsap.to(o, { r: 1, duration: 2.6, ease: 'power2.inOut', onUpdate: function () { reveal = o.r; }, onComplete: function () { tops.forEach(function (tp, i) { setTimeout(function () { burst(tp.x + (i ? 60 : -60), tp.y - H * .12); }, i * 450); }); } });
      } });
      gsap.from(cv, { y: 80, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }
  })();

  /* ---------- footer ---------- */
  if (motion && window.SplitText) {
    var fw = SplitText.create('.foot-word', { type: 'chars' });
    gsap.from(fw.chars, { yPercent: 100, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .04, scrollTrigger: { trigger: '.foot-sky', start: 'top 60%', once: true } });
    /* "Jumpa lagi." swells letter by letter under the pointer, glows gold and lights up the towers */
    var word = $('.foot-word'), chars = fw.chars, base = chars.map(function (c) { return c.closest('em') ? 340 : 380; });
    word.classList.add('is-live');
    chars.forEach(function (c) { c.__w = 0; });
    word.addEventListener('pointerenter', function () { window.dispatchEvent(new CustomEvent('tc:jumpa', { detail: true })); word.classList.add('is-hot'); });
    word.addEventListener('pointermove', function (e) {
      chars.forEach(function (c, i) {
        var r = c.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)), f = Math.max(0, 1 - d / 260); f = f * f * (3 - 2 * f);
        gsap.to(c, { fontWeight: base[i] + (900 - base[i]) * f, y: -f * 18, rotation: (e.clientX < r.left + r.width / 2 ? -1 : 1) * f * 4, color: c.closest('em') ? 'rgb(255,' + Math.round(204 + f * 46) + ',' + Math.round(f * 170) + ')' : 'rgb(255,' + Math.round(255 - f * 51) + ',' + Math.round(255 - f * 255) + ')', textShadow: '0 0 ' + Math.round(f * 40) + 'px rgba(255,204,0,' + (f * .75).toFixed(2) + ')', duration: .45, ease: 'power3.out', overwrite: 'auto' });
      });
    });
    word.addEventListener('pointerleave', function () {
      window.dispatchEvent(new CustomEvent('tc:jumpa', { detail: false })); word.classList.remove('is-hot');
      chars.forEach(function (c, i) { gsap.to(c, { fontWeight: base[i], y: 0, rotation: 0, color: c.closest('em') ? 'rgb(255,204,0)' : 'rgb(255,255,255)', textShadow: '0 0 0px rgba(255,204,0,0)', duration: .8, ease: 'elastic.out(1,.5)', overwrite: 'auto' }); });
    });
    word.addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent('tc:jumpa', { detail: 'burst' }));
      gsap.fromTo(chars, { y: 0 }, { y: -26, duration: .25, ease: 'power2.out', stagger: .03, yoyo: true, repeat: 1 });
    });
  }

  if (ST && document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { if (ST) ST.refresh(); });
  /* sections change height after the page has loaded (the 3D scenes load as their section comes near and size
     themselves, images arrive, cards open). Every scroll reveal is measured from the page's height, so when it changes
     the reveals are measured again; otherwise on a phone everything below the change stays faded and half-shown */
  if (ST && 'ResizeObserver' in window) {
    var lastH = 0, rt = 0;
    new ResizeObserver(function () {
      var h = document.documentElement.scrollHeight; if (Math.abs(h - lastH) < 4) return; lastH = h;
      clearTimeout(rt); rt = setTimeout(function () { ST.refresh(); }, 160);
    }).observe(document.body);
  }
})();
