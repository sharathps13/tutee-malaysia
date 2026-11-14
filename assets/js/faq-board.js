/* ---------- Questions · the interactive question board ----------
   A bento board of question cards. Each card tilts toward the cursor with a moving glare; the board cascades in as it
   scrolls into view; search and topic chips reshuffle it with a FLIP animation; clicking a card grows it across the
   board and reveals the answer word by word, with a button to ask the AI guide a follow-up. */
(function () {
  var root = document.querySelector('[data-fq]'); if (!root) return;
  var data; try { data = JSON.parse(document.querySelector('[data-faq-data]').textContent); } catch (e) { return; }
  var gsap = window.gsap, Flip = window.Flip, still = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover: hover) and (pointer: fine)');
  var M = function () { return !!gsap && !still.matches; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var CATS = {
    apply: { name: 'Applying', c1: '#0A1A5C', c2: '#2B4BC9' },
    visa: { name: 'Visa & passes', c1: '#8E0A20', c2: '#E0405A' },
    money: { name: 'Money & work', c1: '#123F2A', c2: '#2E9A63' },
    life: { name: 'Life & family', c1: '#3B1D4A', c2: '#9B4FC0' }
  };
  var CAT_OF = ['apply', 'visa', 'apply', 'money', 'money', 'visa', 'life', 'life'];
  var ICON = {
    apply: '<path d="M6.5 3h7.5l4 4v14h-11.5z"/><path d="M14 3v4h4M9.5 12h5M9.5 15.5h5"/>',
    visa: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><circle cx="12" cy="10" r="3.2"/><path d="M9 17h6"/>',
    money: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-1-1.6-1.5-2.8-1.5-1.6 0-2.8.8-2.8 2.1 0 3 5.8 1.5 5.8 4.4 0 1.3-1.3 2.1-3 2.1-1.3 0-2.5-.6-3-1.6M12 6v1.7M12 16.3V18"/>',
    life: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.8V20h13V9.8"/><path d="M10 20v-5h4v5"/>'
  };
  var WIDE = { 0: 1, 5: 1 };   // the bento: two wide cards
  // the three key points of each answer, previewed when the pointer rests on a card (the full answer opens on click)
  var PTS = [
    ['Passport valid 18+ months', 'Academic transcripts', 'An English test EMGS accepts'],
    ['Institution applies via EMGS', 'eVAL, then medical screening', 'No credibility interview'],
    ['Not accepted for a Student Pass', 'EMGS lists the tests it accepts', 'We book one on the list'],
    ['Public: from RM 14,000 a year', 'Private adds 6% service tax', 'Living costs vary by city'],
    ['Not during term', 'Up to 20 hours a week in breaks', 'Immigration approval first'],
    ['Twelve months after your degree', 'Open to 32 nationalities', 'Needs a Malaysian sponsor'],
    ['Postgraduates can bring family', 'Undergraduates: 17 countries', 'India is not on that list'],
    ['Housing near your campus', 'Pre-departure briefing', 'First-week help with banking']
  ];
  var board = root.querySelector('[data-fq-board]'), q = root.querySelector('[data-fq-q]'), catsEl = root.querySelector('[data-fq-cats]'), empty = root.querySelector('[data-fq-empty]');

  catsEl.innerHTML = '<button type="button" class="on" data-c="all" aria-pressed="true">All</button>' + Object.keys(CATS).map(function (k) { return '<button type="button" data-c="' + k + '" aria-pressed="false" style="--c1:' + CATS[k].c1 + ';--c2:' + CATS[k].c2 + '"><i></i>' + esc(CATS[k].name) + '</button>'; }).join('');
  board.innerHTML = data.map(function (d, i) {
    var k = CAT_OF[i] || 'apply', C = CATS[k], id = 'fq-a-' + i;
    return '<article class="fq-tile' + (WIDE[i] ? ' is-wide' : '') + '" data-i="' + i + '" data-c="' + k + '" style="--c1:' + C.c1 + ';--c2:' + C.c2 + '">' +
      '<div class="fq-in"><i class="fq-glare" aria-hidden="true"></i>' +
        '<button type="button" class="fq-q" aria-expanded="false" aria-controls="' + id + '">' +
          '<span class="fq-top"><span class="fq-n" aria-hidden="true">' + pad(i + 1) + '</span><span class="fq-cat">' + esc(C.name) + '</span></span>' +
          '<svg class="fq-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>' +
          '<span class="fq-t">' + esc(d.q) + '</span>' +
          (PTS[i] ? '<span class="fq-pv" aria-hidden="true">' + PTS[i].map(function (p, k) { return '<span style="--k:' + k + '">' + esc(p) + '</span>'; }).join('') + '</span>' : '') +
          '<span class="fq-go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></span>' +
        '</button>' +
        '<div class="fq-a" id="' + id + '" role="region" aria-label="Answer" hidden><p>' + esc(d.a).split(' ').map(function (w) { return '<span class="fq-w">' + w + '</span>'; }).join(' ') + '</p>' +
          '<div class="fq-acts"><button type="button" class="fq-askai" data-follow><span class="fq-spark" aria-hidden="true"></span>Ask the AI a follow-up</button><button type="button" class="fq-close">Close</button></div></div>' +
      '</div></article>';
  }).join('');
  var tiles = [].slice.call(board.children);

  // ---------- tilt and glare that follow the cursor ----------
  tiles.forEach(function (t) {
    var inner = t.querySelector('.fq-in');
    t.addEventListener('pointermove', function (ev) {
      if (!fine.matches || still.matches || t.classList.contains('is-open')) return;
      var r = t.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      inner.style.setProperty('--rx', ((.5 - y) * 12).toFixed(2) + 'deg'); inner.style.setProperty('--ry', ((x - .5) * 14).toFixed(2) + 'deg');
      inner.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); inner.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      t.classList.add('is-hot');
    });
    t.addEventListener('pointerleave', function () { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); t.classList.remove('is-hot'); });
  });

  // ---------- the board reflows with a FLIP animation ----------
  function reflow(change, then) {
    if (!M() || !Flip) { change(); if (then) then(); return; }
    var state = Flip.getState(tiles, { props: 'opacity' });
    change();
    Flip.from(state, { duration: .7, ease: 'expo.inOut', absolute: false, scale: false, nested: true, prune: true,
      onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.6)', stagger: .04 }); },
      onLeave: function (els) { return gsap.to(els, { opacity: 0, scale: .85, duration: .3 }); },
      onComplete: then });
  }

  // ---------- open one card at a time ----------
  var open = null;
  function setOpen(t, on) {
    var btn = t.querySelector('.fq-q'), ans = t.querySelector('.fq-a');
    t.classList.toggle('is-open', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false'); ans.hidden = !on;
    if (on) { var inner = t.querySelector('.fq-in'); inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); }
  }
  function toggle(t) {
    var was = open;
    reflow(function () {
      if (was) setOpen(was, false);
      open = was === t ? null : t;
      if (open) setOpen(open, true);
    }, function () {
      if (!open) return;
      if (M()) gsap.fromTo(open.querySelectorAll('.fq-w'), { opacity: 0, y: 8, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .45, ease: 'expo.out', stagger: .012 });
      if (M()) gsap.fromTo(open.querySelectorAll('.fq-acts > *'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out', stagger: .08, delay: .25 });
      var r = open.getBoundingClientRect();
      if (r.top < 70 || r.bottom > window.innerHeight - 90) {
        var y = window.scrollY + r.top - 110;
        if (window.TClenis) window.TClenis.scrollTo(y, { duration: 1 }); else window.scrollTo({ top: y, behavior: M() ? 'smooth' : 'auto' });
      }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }
  tiles.forEach(function (t) {
    t.querySelector('.fq-q').addEventListener('click', function () { toggle(t); });
    t.querySelector('.fq-close').addEventListener('click', function () { toggle(t); t.querySelector('.fq-q').focus({ preventScroll: true }); });
    t.querySelector('[data-follow]').addEventListener('click', function () {
      var d = data[+t.getAttribute('data-i')];
      if (window.TanyaAI) window.TanyaAI.open({ context: 'The visitor just read this FAQ answer. Q: ' + d.q + ' A: ' + d.a, hint: 'Ask a follow-up about: ' + d.s });
    });
  });

  // ---------- search and topic chips ----------
  var cat = 'all';
  function apply() {
    var term = q.value.trim().toLowerCase(), shown = 0;
    reflow(function () {
      tiles.forEach(function (t) {
        var d = data[+t.getAttribute('data-i')], hay = (d.q + ' ' + d.a + ' ' + d.k.join(' ')).toLowerCase();
        var ok = (cat === 'all' || t.getAttribute('data-c') === cat) && (!term || term.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; }));
        if (!ok && t === open) { setOpen(t, false); open = null; }
        t.hidden = !ok; if (ok) shown++;
      });
      empty.hidden = shown > 0;
    }, function () { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
  }
  var qt; q.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(apply, 140); });
  q.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !board.querySelector('.fq-tile:not([hidden])') && window.TanyaAI) window.TanyaAI.open({ ask: q.value.trim() }); });
  catsEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return; cat = b.getAttribute('data-c');
    [].forEach.call(catsEl.children, function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    apply();
  });
  root.querySelector('[data-fq-ask]').addEventListener('click', function () { if (window.TanyaAI) window.TanyaAI.open({ ask: q.value.trim() }); });

  // ---------- the board cascades in the first time it scrolls into view ----------
  if (M() && 'IntersectionObserver' in window) {
    gsap.set(tiles, { opacity: 0, rotateX: -55, y: 60, transformPerspective: 900, transformOrigin: '50% 0%' });
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      gsap.to(tiles, { opacity: 1, rotateX: 0, y: 0, duration: 1, ease: 'expo.out', stagger: { each: .07, grid: 'auto', from: 'start' }, clearProps: 'transform,opacity' });
    }, { threshold: .15 });
    io.observe(board);
  }
})();
