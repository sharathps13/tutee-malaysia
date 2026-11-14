/* v13.6 sections: Destinations as expanding panels, the Student Pass as a file you can handle page by page,
   and the shared university card used by the crests scene (crests.js). Data comes from sections-data.js. */
(function () {
  'use strict';
  if (!window.gsap || !window.CX) return;
  var D = window.CX, P = './assets/img/photos/';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  if (window.DrawSVGPlugin) gsap.registerPlugin(DrawSVGPlugin);
  if (!CustomEase.get('silk')) CustomEase.create('silk', 'M0,0 C0.16,1 0.3,1 1,1');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var stateQ = function (p) { return './universities.html?state=' + encodeURIComponent(p.states[0]); };

  /* =================== D3 · EXPANDING PANELS =================== */
  (function () {
    var root = $('[data-xp]'); if (!root) return;
    var row = $('[data-xp-row]', root), places = D.places, open = null, cur = 0;
    row.innerHTML = places.map(function (p, i) {
      return '<button type="button" class="xp-p" data-i="' + i + '" aria-label="Open ' + esc(p.name) + '"><img src="' + P + p.img + '.jpg" alt="" loading="lazy"><span class="xp-n">' + pad(i + 1) + ' · ' + p.code + '</span><span class="xp-cnt">' + p.count + ' campuses</span><span class="xp-v">' + esc(p.name) + '</span><span class="xp-c"><small>' + esc(p.tag) + '</small><b>' + esc(p.name) + '</b><span>' + esc(p.text) + '</span><em>Open region →</em></span></button>';
    }).join('');
    var panels = $$('.xp-p', row);
    panels.forEach(function (b) {
      var im = $('img', b); gsap.set(im, { xPercent: -50, scale: 1.12 });
      b.addEventListener('pointermove', function (e) { if (reduce) return; var r = b.getBoundingClientRect(); gsap.to(im, { x: ((e.clientX - r.left) / r.width - .5) * -40, duration: 1.2, ease: 'power3.out', overwrite: 'auto' }); });
      b.addEventListener('pointerleave', function () { gsap.to(im, { x: 0, duration: 1.4, ease: 'power3.out', overwrite: 'auto' }); });
      b.addEventListener('click', function () { openAt(+b.dataset.i, b); });
    });
    if (!reduce) gsap.from(panels, { clipPath: 'inset(100% 0% 0% 0% round 26px)', y: 60, duration: 1.4, ease: 'silk', stagger: .09, scrollTrigger: { trigger: row, start: 'top 80%', once: true }, clearProps: 'clipPath' });

    function rectInset(el) {
      var a = row.getBoundingClientRect(), b = el.getBoundingClientRect();
      return 'inset(' + (b.top - a.top) + 'px ' + (a.right - b.right) + 'px ' + (a.bottom - b.bottom) + 'px ' + (b.left - a.left) + 'px round 26px)';
    }
    function body(p, i) {
      return '<div class="xo-body"><small>' + pad(i + 1) + ' · ' + esc(p.tag) + '</small><h3>' + esc(p.name) + '</h3><p>' + esc(p.text) + '</p><div class="xo-stat"><b>' + p.count + '</b><span>EMGS-registered<br>institutions</span></div><div class="xo-chips">' + p.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div><div class="xo-acts"><a class="btn btn--sun btn--sm" href="' + stateQ(p) + '">See these campuses →</a><a class="btn btn--glass btn--sm" href="#begin">Plan a visit</a></div></div>';
    }
    function openAt(i, from) {
      if (open) return; cur = i;
      var p = places[i];
      open = document.createElement('div'); open.className = 'xp-open'; open.setAttribute('role', 'dialog'); open.setAttribute('aria-label', p.name);
      open.innerHTML = '<img class="xo-img" src="' + P + p.img + '.jpg" alt="">' + body(p, i) +
        '<button type="button" class="rbtn xo-close" aria-label="Close">✕</button>' +
        '<div class="xo-thumbs">' + places.map(function (q, k) { return '<button type="button" data-k="' + k + '"' + (k === i ? ' class="on"' : '') + ' aria-label="' + esc(q.name) + '"><img src="' + P + q.img + '.jpg" alt=""></button>'; }).join('') + '</div>' +
        '<div class="xo-nav"><button type="button" class="rbtn" data-d="-1" aria-label="Previous region">←</button><span>' + pad(i + 1) + ' / ' + pad(places.length) + '</span><button type="button" class="rbtn" data-d="1" aria-label="Next region">→</button></div>';
      row.appendChild(open);
      var mobile = matchMedia('(max-width: 1000px)').matches;
      if (!reduce && !mobile) {
        gsap.fromTo(open, { clipPath: rectInset(from) }, { clipPath: 'inset(0px 0px 0px 0px round 26px)', duration: 1.2, ease: 'expo.inOut' });
        gsap.fromTo($('.xo-img', open), { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'silk' });
      } else if (!reduce) gsap.from(open, { opacity: 0, duration: .5 });
      revealBody(.55);
      $('.xo-close', open).addEventListener('click', close);
      $$('.xo-nav .rbtn', open).forEach(function (b) { b.addEventListener('click', function () { swap((cur + (+b.dataset.d) + places.length) % places.length, +b.dataset.d); }); });
      $$('.xo-thumbs button', open).forEach(function (b) { b.addEventListener('click', function () { var k = +b.dataset.k; if (k !== cur) swap(k, k > cur ? 1 : -1); }); });
      document.addEventListener('keydown', key);
      if (mobile && window.TClenis) window.TClenis.stop();
      $('.xo-close', open).focus({ preventScroll: true });
    }
    function revealBody(delay) { if (!reduce) gsap.from($$('.xo-body > *', open), { y: 34, opacity: 0, duration: .9, ease: 'silk', stagger: .06, delay: delay || 0 }); }
    function swap(i, dir) {
      var p = places[i]; cur = i;
      var ni = document.createElement('img'); ni.className = 'xo-img'; ni.src = P + p.img + '.jpg'; ni.alt = '';
      var old = $$('.xo-img', open); open.insertBefore(ni, old[old.length - 1].nextSibling);
      var from = dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
      gsap.fromTo(ni, { clipPath: from, scale: 1.15 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: reduce ? .01 : 1.3, ease: 'expo.inOut', onComplete: function () { old.forEach(function (o) { o.remove(); }); } });
      gsap.to($$('.xo-body > *', open), { y: -20, opacity: 0, duration: .35, stagger: .03, onComplete: function () {
        var b = $('.xo-body', open); b.outerHTML = body(p, i); revealBody(0);
      } });
      $('.xo-nav span', open).textContent = pad(i + 1) + ' / ' + pad(places.length);
      $$('.xo-thumbs button', open).forEach(function (b, k) { b.classList.toggle('on', k === i); });
    }
    function key(e) { if (!open) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') swap((cur + 1) % places.length, 1); if (e.key === 'ArrowLeft') swap((cur - 1 + places.length) % places.length, -1); }
    function close() {
      if (!open) return; var o = open; open = null; document.removeEventListener('keydown', key);
      var target = panels[cur], mobile = matchMedia('(max-width: 1000px)').matches;
      if (mobile && window.TClenis) window.TClenis.start();
      if (reduce || mobile) { o.remove(); target.focus({ preventScroll: true }); return; }
      gsap.to($$('.xo-body, .xo-nav, .xo-thumbs, .xo-close', o), { opacity: 0, duration: .3 });
      gsap.to(o, { clipPath: rectInset(target), duration: 1, ease: 'expo.inOut', delay: .1, onComplete: function () { o.remove(); target.focus({ preventScroll: true }); } });
    }
  })();

  var SIG = 'M2 30 C 10 6, 18 4, 20 22 S 30 34, 36 14 C 40 4, 46 30, 52 22 S 62 8, 66 20 C 70 30, 78 26, 84 16 S 96 12, 104 22';
  function lines(ws) { return ws.map(function (w) { return '<div class="d-ln" style="width:' + w + '%"></div>'; }).join(''); }
  function docHTML(k) {
    var head = function (crest, org, sub, ref, col) { return '<div class="d-head" style="--dc:' + (col || '#0A1A5C') + '"><span class="d-crest">' + crest + '</span><span class="d-org"><b>' + org + '</b><small>' + sub + '</small></span><span class="d-ref">' + ref + '</span></div>'; };
    var sig = function (who) { return '<div class="d-sig"><svg viewBox="0 0 108 36"><path d="' + SIG + '"/></svg><small>' + who + '</small></div>'; };
    var stamp = function (t, sub, col, round) { return '<span class="stamp' + (round ? ' stamp--round' : '') + '" style="--ink-c:' + (col || '#C8102E') + '">' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; };
    switch (k) {
      case 0: return head('TC', 'Tutee Connect', 'Profile assessment', 'TC/MY/2027<br>Page 1', '#C8102E') +
        '<div class="d-photo"></div><h4 class="d-title">Profile and shortlist</h4>' +
        '<div class="d-row"><span>Passport valid 18+ months</span><span class="ok">✓</span></div><div class="d-row"><span>English test</span><b>IELTS 6.5</b></div><div class="d-row"><span>Academic record</span><span class="ok">✓</span></div><div class="d-row"><span>Shortlist</span><b>3 universities</b></div>' + lines([92, 70]) + sig('Counsellor') + stamp('Shortlisted', 'Tutee Connect');
      case 1: return head('U', 'Office of Admissions', 'Malaysian university', 'Ref. OL-2027-0412<br>Page 2') +
        '<h4 class="d-title">Offer of admission</h4><p class="d-p">Dear applicant, we are pleased to offer you a place on the programme below, starting in the next intake.</p>' + lines([96, 88, 93, 60]) +
        '<div class="d-row"><span>Programme</span><b>BSc (Hons)</b></div><div class="d-row"><span>Duration</span><b>3 years</b></div>' + sig('Registrar') + stamp('Accepted', 'Place confirmed');
      case 2: return head('EM', 'Student Pass application', 'Submitted via EMGS', 'App. 27-118204<br>Page 3', '#0E5C5A') +
        '<h4 class="d-title">Application filed</h4>' + lines([90, 76]) +
        '<div class="d-row"><span>Institution</span><b>Submitted</b></div><div class="d-row"><span>Medical screening</span><span class="ok">Booked</span></div><div class="d-row"><span>Fees</span><span class="ok">Paid</span></div><div class="d-row"><span>Documents</span><b>12 of 12</b></div>' + lines([84, 66, 72]) + stamp('Submitted', '', '#1B4FA0');
      case 3: return head('VAL', 'Visa Approval Letter', 'eVAL · Student Pass', 'VAL 2027 / 55301<br>Page 4', '#0A1A5C') +
        '<h4 class="d-title">Approved to travel</h4><p class="d-p">The holder may enter Malaysia to take up the Student Pass. Present this letter on arrival.</p>' + lines([94, 80, 88]) + '<div class="d-bar"></div>' + stamp('Approved', 'eVAL issued');
      case 4: return head('MY', 'Passport · Visas', 'Arrival in Malaysia', 'Page 5', '#6B1F7A') +
        '<h4 class="d-title">Selamat datang</h4>' + lines([88, 60]) +
        '<div class="d-row"><span>Airport collection</span><span class="ok">✓</span></div><div class="d-row"><span>Sticker on passport</span><span class="ok">✓</span></div><div class="d-row"><span>SIM card and bank</span><span class="ok">✓</span></div>' + stamp('KLIA<br>Entry', '2027', '#5A2A9A', true);
      case 5: return head('GP', 'Graduate Pass', '12 months after your degree', 'GP-2030<br>Page 6', '#0F7B5F') +
        '<div class="d-card" style="--dc:#0F7B5F"><span class="d-photo"></span><span><small>Pass type</small><b>Graduate Pass</b><small>Validity · 12 months</small></span></div>' + lines([92, 78, 64]) + stamp('Granted', '12 months', '#0F7B5F');
      default: return head('EP', 'Employment Pass', 'Employer-sponsored', 'EP-2031<br>Page 7', '#B0225E') +
        '<div class="d-card" style="--dc:#B0225E"><span class="d-photo"></span><span><small>Pass type</small><b>Employment Pass</b><small>Then Entry Permit · PR</small></span></div>' + lines([90, 70]) + sig('Employer') + stamp('Approved', 'Employment Pass', '#B0225E');
    }
  }
  function stageNav(root, n, go, kind) {
    var pips = $('[data-' + kind + '-pips]', root);
    pips.innerHTML = Array.from({ length: n }, function (_, i) { return '<li><button type="button" aria-label="Stage ' + (i + 1) + '"></button></li>'; }).join('');
    var pb = $$('button', pips);
    pb.forEach(function (b, i) { b.addEventListener('click', function () { go(i); }); });
    $('[data-' + kind + '-prev]', root).addEventListener('click', function () { go(-1, true); });
    $('[data-' + kind + '-next]', root).addEventListener('click', function () { go(1, true); });
    return function (i) { pb.forEach(function (b, k) { b.classList.toggle('on', k === i); b.classList.toggle('done', k < i); }); };
  }
  function stageText(root, kind, s, i, head) {
    var set = function () {
      $('[data-' + kind + '-k]', root).textContent = head + ' ' + pad(i + 1) + ' of 07 · ' + s.tag;
      $('[data-' + kind + '-t]', root).textContent = s.title;
      $('[data-' + kind + '-x]', root).textContent = s.text;
      $('[data-' + kind + '-note]', root).textContent = s.note || '';
    };
    if (reduce) return set();
    var els = $$('[data-' + kind + '-k], [data-' + kind + '-t], [data-' + kind + '-x], [data-' + kind + '-note]', root);
    gsap.to(els, { y: -14, opacity: 0, duration: .28, stagger: .03, onComplete: function () { set(); gsap.fromTo(els, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'silk', stagger: .05 }); } });
  }

  /* =================== STUDENT PASS · YOUR FILE =================== */
  (function () {
    var root = $('[data-fl]'); if (!root) return;
    var sec = root.closest('section'), desk = $('[data-fl-desk]', root), stage = $('[data-fl-stage]', root), tabsEl = $('[data-fl-tabs]', sec);
    var steps = D.steps, n = steps.length, cur = -1, stamped = {}, peeked = -1;
    var docs = steps.map(function (s, k) {
      var d = document.createElement('div'); d.className = 'doc'; d.setAttribute('role', 'button'); d.tabIndex = 0;
      d.setAttribute('aria-label', 'Page ' + (k + 1) + ': ' + s.tag + '. ' + s.title);
      d.innerHTML = '<div class="doc-in">' + docHTML(k) + '</div><span class="doc-hint">Click, or drag left, to turn the page</span>';
      desk.appendChild(d); return d;
    });
    var inners = docs.map(function (d) { return $('.doc-in', d); });
    var W = function () { return docs[0].offsetWidth || 300; };
    function pose(k, a) {
      var w = W();
      if (k === a) return { x: -.03 * w, y: .14 * w, z: .42 * w, rotationZ: 5, rotationX: -26, zIndex: 50 };
      if (k < a) { var j = a - 1 - k; return { x: -.8 * w - j * 5, y: .07 * w - j * 6, z: 2 + (n - j) * 1.4, rotationZ: -15 + j * 3.2, rotationX: 0, zIndex: 20 - j }; }
      var q = k - a - 1; return { x: .76 * w + q * 6, y: -.05 * w + q * 5, z: 2 + (n - q) * 1.4, rotationZ: 10 - q * 2.6, rotationX: 0, zIndex: 20 - q };
    }
    /* photo strip + tabs */
    var ph = $('[data-fl-ph]', root);
    ph.insertAdjacentHTML('afterbegin', steps.map(function (s, k) { return '<img src="' + P + s.img + '.jpg" alt="' + esc(s.alt || '') + '"' + (k ? ' loading="lazy"' : '') + '>'; }).join(''));
    var phs = $$('img', ph);
    tabsEl.innerHTML = steps.map(function (s, k) { return '<li><button type="button" data-k="' + k + '"><b>' + pad(k + 1) + '</b><small>' + esc(s.tag) + '</small><span>' + esc(s.title) + '</span><i aria-hidden="true"></i></button></li>'; }).join('');
    var tabs = $$('button', tabsEl);
    var mark = stageNav(root, n, function (i, rel) { go(rel ? (cur + i + n) % n : i); }, 'fl');

    function settle(k, d) { gsap.to(inners[k], { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, duration: d || .7, ease: 'power3.out', overwrite: true }); inners[k].style.setProperty('--go', '.6'); }
    function peek(k) {
      if (peeked === k) return; if (peeked > -1 && peeked !== cur) settle(peeked, .5); peeked = k;
      tabs.forEach(function (t, j) { t.classList.toggle('peek', j === k); });
      if (k < 0 || k === cur || reduce) return;
      var w = W(), side = k < cur ? -1 : 1;
      gsap.to(inners[k], { x: side * .2 * w, y: -.08 * w, z: 60, rotationZ: side * 5, rotationX: -8, duration: .6, ease: 'power3.out', overwrite: true });
    }
    function go(i) {
      if (i === cur) return; var prev = cur; cur = i; peeked = -1;
      docs.forEach(function (d, k) {
        var p = pose(k, i); d.classList.toggle('on', k === i); d.style.zIndex = p.zIndex; settle(k, .5);
        gsap.to(d, { x: p.x, y: p.y, z: p.z, rotationZ: p.rotationZ, rotationX: p.rotationX, duration: reduce ? 0 : (k === i ? 1.25 : 1), ease: k === i ? 'expo.out' : 'power3.inOut', delay: k === i && prev > -1 ? .12 : 0, overwrite: true });
      });
      tabs.forEach(function (t, k) { t.classList.toggle('on', k === i); t.classList.toggle('done', k < i); t.classList.remove('peek'); t.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      phs.forEach(function (im, k) { gsap.to(im, { opacity: k === i ? 1 : 0, scale: k === i ? 1 : 1.08, duration: reduce ? 0 : 1, ease: 'power2.out' }); });
      $('[data-fl-big]', root).textContent = pad(i + 1);
      mark(i); stageText(root, 'fl', steps[i], i, 'Page');
      if (!stamped[i]) {
        stamped[i] = true;
        var d = docs[i], st = $('.stamp', d), sg = $('.d-sig path', d);
        var tl = gsap.timeline({ delay: reduce ? 0 : 1 });
        if (sg && window.DrawSVGPlugin) tl.fromTo(sg, { drawSVG: '0%' }, { drawSVG: '100%', duration: reduce ? 0 : .9, ease: 'power1.inOut' });
        tl.fromTo(st, { scale: 2.6, opacity: 0, rotation: -24 }, { scale: 1, opacity: .88, rotation: -11 + (Math.random() * 6 - 3), duration: reduce ? 0 : .34, ease: 'power4.in' });
        if (!reduce) tl.to(inners[i], { z: -14, duration: .07, yoyo: true, repeat: 1, ease: 'power2.out' });
        tl.add(function () { st.classList.add('done'); });
      }
    }

    /* the open page tilts under the pointer and catches the light; pages in the piles slide out when you point at them */
    var drag = null, moved = false;
    docs.forEach(function (d, k) {
      d.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') peek(k); });
      d.addEventListener('pointerleave', function () { if (k === cur && !drag) settle(k); else if (peeked === k) peek(-1); });
      d.addEventListener('pointermove', function (e) {
        if (k !== cur || drag || reduce || e.pointerType === 'touch') return;
        var r = d.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        gsap.to(inners[k], { rotationY: (px - .5) * 16, rotationX: -(py - .5) * 12, z: 14, duration: .6, ease: 'power3.out', overwrite: 'auto' });
        inners[k].style.setProperty('--gx', (px * 100) + '%'); inners[k].style.setProperty('--gy', (py * 100) + '%'); inners[k].style.setProperty('--go', '1');
      });
      d.addEventListener('pointerdown', function (e) {
        if (k !== cur || e.button > 0) return;
        drag = { x: e.clientX, y: e.clientY, k: k, id: e.pointerId }; moved = false;
      });
      d.addEventListener('click', function () {
        if (moved) { moved = false; return; }
        go(k === cur ? (cur + 1) % n : k);
      });
      d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(k === cur ? (cur + 1) % n : k); } });
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.abs(dx) < 8) return;
      if (!moved && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
      moved = true; docs[drag.k].classList.add('drag');
      gsap.to(inners[drag.k], { x: dx * .95, y: Math.abs(dx) * -.06, z: 40, rotationZ: dx * .02, rotationY: dx * .04, rotationX: 0, duration: .25, ease: 'power2.out', overwrite: true });
    });
    function release(e) {
      if (!drag) return; var k = drag.k, dx = e.clientX - drag.x; drag = null; docs[k].classList.remove('drag');
      if (!moved) return;
      var lim = W() * .32;
      if (dx < -lim) go((cur + 1) % n); else if (dx > lim) go((cur - 1 + n) % n); else gsap.to(inners[k], { x: 0, y: 0, z: 0, rotationZ: 0, rotationY: 0, duration: .9, ease: 'elastic.out(1, .55)', overwrite: true });
      setTimeout(function () { moved = false; }, 60);
    }
    window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { go(k); });
      t.addEventListener('pointerenter', function () { peek(k); }); t.addEventListener('pointerleave', function () { peek(-1); });
      t.addEventListener('focus', function () { peek(k); }); t.addEventListener('blur', function () { peek(-1); });
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go((cur + 1) % n); } if (e.key === 'ArrowLeft') { e.preventDefault(); go((cur - 1 + n) % n); } });
    var resizeT; window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(function () { if (cur < 0) return; docs.forEach(function (d, k) { var p = pose(k, cur); gsap.set(d, { x: p.x, y: p.y, z: p.z }); }); }, 150); });

    docs.forEach(function (d, k) { gsap.set(d, pose(k, -1)); });
    stageText(root, 'fl', steps[0], 0, 'Page'); mark(0); gsap.set(phs[0], { opacity: 1 });
    ScrollTrigger.create({ trigger: stage, start: 'top 70%', once: true, onEnter: function () {
      if (!reduce) {
        gsap.from(docs, { y: '-=420', z: 600, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .06 });
        gsap.from(tabs, { y: 40, opacity: 0, duration: .9, ease: 'silk', stagger: .05, delay: .3 });
      }
      gsap.delayedCall(reduce ? 0 : .8, function () { go(0); });
    } });
  })();

  /* =================== UNIVERSITIES · shared card for the crests =================== */
  var TYPE = { 'Research University': 'Public research', 'Private University': 'Private university', 'Public University': 'Public university' };
  var SHORT = { 7: "Taylor's", 8: 'UCSI', 9: 'Sunway', 10: 'INTI' };
  var maxA = Math.max.apply(null, D.unis.map(function (u) { return +u.accredited || 0; }));
  function short(u) { var m = u.name.match(/\(([^)]+)\)/); return m ? m[1] : (SHORT[u.rank] || u.name.split(' ')[0]); }
  function fields(u) { return (u.programs || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function cardHTML(u) {
    return '<div class="uc-top"><span class="uc-rank">#' + u.rank + '<small>QS · Malaysia</small></span><span class="uc-type">' + (TYPE[u.type] || u.type) + '</span></div>' +
      '<h3>' + esc(u.name) + '</h3><p class="uc-loc">' + esc(u.location) + '</p>' +
      '<div class="uc-acc" style="--p:' + Math.round((+u.accredited || 0) / maxA * 100) + '%"><b>' + u.accredited + '</b><span>MQA-accredited programmes</span><i></i></div>' +
      '<div class="uc-f">' + fields(u).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' +
      '<div class="uc-acts"><a class="btn btn--sun btn--sm" href="#begin" data-ask="' + esc(u.name) + '">Ask about this</a><a class="btn btn--glass btn--sm" href="./universities.html?q=' + encodeURIComponent(short(u)) + '">All 391 →</a></div>';
  }
  function setCard(el, i) {
    if (!el) return; var u = D.unis[i];
    if (reduce || !el.innerHTML) { el.innerHTML = cardHTML(u); return; }
    gsap.to(el.children, { y: -10, opacity: 0, duration: .22, stagger: .02, overwrite: true, onComplete: function () { el.innerHTML = cardHTML(u); gsap.from(el.children, { y: 16, opacity: 0, duration: .6, ease: 'silk', stagger: .045 }); } });
  }
  function chips(el, onPick) {
    el.innerHTML = D.unis.map(function (u, i) { return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '"><b>' + pad(u.rank) + '</b>' + esc(short(u)) + '</button>'; }).join('');
    var bs = $$('button', el); bs.forEach(function (b) { b.addEventListener('click', function () { onPick(+b.dataset.i); }); });
    return function (i) { bs.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); }); };
  }
  document.addEventListener('click', function (e) { var a = e.target.closest('[data-ask]'); if (a && window.TCsetDestination) window.TCsetDestination(a.getAttribute('data-ask')); }, true);
  window.CXU = { short: short, fields: fields, setCard: setCard, chips: chips, maxA: maxA, reduce: reduce, TYPE: TYPE };
})();
