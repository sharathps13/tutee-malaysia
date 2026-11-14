/* Tutee Connect · Malaysia institution directory (opens in its own tab from the landing page) */
(function () {
  'use strict';
  function init(ROOT, opts) {
  opts = opts || {};
  if (ROOT.__dirReady) { if (opts.params != null) ROOT.__dirApply(opts.params); return; }
  ROOT.__dirReady = true;
  var $ = function (s, c) { return (c || ROOT).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || ROOT).querySelectorAll(s)); };
  var U = (window.MY_UNIVERSITIES || []).map(function (u) {
    var parts = u.location.split(','), state = parts[parts.length - 1].trim();
    var fields = u.programs ? u.programs.split(',').map(function (f) { return f.trim(); }).filter(Boolean) : [];
    var acc = parseInt(u.accredited, 10);
    return { n: u.name, l: u.location, st: state, t: u.type, r: u.ranked ? u.rank : 0, a: isNaN(acc) ? 0 : acc, f: fields, alt: u.alt || '', key: (u.name + ' ' + u.alt + ' ' + u.location).toLowerCase() };
  });
  var STATE_LABEL = { 'Pulau Pinang': 'Pulau Pinang (Penang)' };
  var TYPE_LABEL = { 'Research University': 'Public research university', 'Public University': 'Public university', 'Private University': 'Private university', 'University College': 'University college', 'Private College': 'Private college', 'Foreign Branch Campus': 'Foreign branch campus', 'Polytechnic & Community College': 'Polytechnic or community college' };
  var TYPE_COL = { 'Research University': '#0F7B5F', 'Public University': '#0E5C5A', 'Private University': '#0A1A5C', 'University College': '#7B4FD1', 'Private College': '#B0225E', 'Foreign Branch Campus': '#C8102E', 'Polytechnic & Community College': '#C77700' };
  var FIELD_ICO = { 'Business & Law': '⚖', 'Computing & IT': '⌨', 'Engineering & Construction': '⚙', 'Arts & Humanities': '✎', 'Services': '☕', 'Health & Welfare': '✚', 'Generic Programmes': '◎', 'Education': '✐', 'Social Sciences & Journalism': '❝', 'Natural Sciences & Mathematics': '∑', 'Agriculture & Veterinary': '❦' };
  var count = function (arr, fn) { var o = {}; arr.forEach(function (x) { [].concat(fn(x)).forEach(function (k) { if (k) o[k] = (o[k] || 0) + 1; }); }); return o; };
  var byState = count(U, function (u) { return u.st; }), byType = count(U, function (u) { return u.t; }), byField = count(U, function (u) { return u.f; });
  var sortKeys = function (o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }); };

  var q = $('[data-q]'), selS = $('[data-state]'), selT = $('[data-type]'), selF = $('[data-field]'), selO = $('[data-sort]');
  var grid = $('[data-grid]'), more = $('[data-more]'), empty = $('[data-empty]'), cnt = $('[data-count]'), cntL = $('[data-count-l]'), reset = $('[data-reset]');
  $('[data-total]').textContent = U.length;
  function opt(sel, val, label) { var o = document.createElement('option'); o.value = val; o.textContent = label; sel.appendChild(o); }
  Object.keys(byState).sort().forEach(function (s) { opt(selS, s, (STATE_LABEL[s] || s) + ' (' + byState[s] + ')'); });
  sortKeys(byType).forEach(function (t) { opt(selT, t, (TYPE_LABEL[t] || t) + ' (' + byType[t] + ')'); });
  sortKeys(byField).forEach(function (f) { opt(selF, f, f + ' (' + byField[f] + ')'); });

  var types = $('[data-types]');
  sortKeys(byType).forEach(function (t) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'tchip'; b.style.setProperty('--c', TYPE_COL[t] || '#0A1A5C'); b.setAttribute('data-t', t);
    b.innerHTML = '<b>' + byType[t] + '</b><span>' + (TYPE_LABEL[t] || t) + '</span>';
    b.addEventListener('click', function () { selT.value = selT.value === t ? '' : t; render(true); jump(); });
    types.appendChild(b);
  });
  var fields = $('[data-fields]');
  sortKeys(byField).forEach(function (f) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'fld'; b.setAttribute('data-f', f);
    b.innerHTML = '<span class="fld-i" aria-hidden="true">' + (FIELD_ICO[f] || '•') + '</span><span class="fld-t">' + f + '</span><b>' + byField[f] + '</b>';
    b.addEventListener('click', function () { selF.value = selF.value === f ? '' : f; render(true); jump(); });
    fields.appendChild(b);
  });
  var scroller = opts.scroller || null;
  function jump() {
    var t = $('[data-tools]'), r = t.getBoundingClientRect();
    if (r.top > 140 || r.top < 0) { if (scroller) scroller.scrollTo({ top: scroller.scrollTop + r.top - 90, behavior: 'smooth' }); else window.scrollTo({ top: r.top + window.scrollY - 90, behavior: 'smooth' }); }
  }

  /* read ?q= and ?field= from the landing page */
  function readParams(str) {
    try {
      var P = new URLSearchParams(str || '');
      q.value = P.get('q') || ''; selF.value = P.get('field') && byField[P.get('field')] ? P.get('field') : ''; selS.value = P.get('state') && byState[P.get('state')] ? P.get('state') : ''; selT.value = '';
    } catch (e) { /* old browser */ }
  }
  readParams(opts.params != null ? opts.params : location.search);

  var PAGE = 24, shown = PAGE, list = [];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function filter() {
    var term = q.value.trim().toLowerCase().replace(/[’']/g, ''), s = selS.value, t = selT.value, f = selF.value;
    list = U.filter(function (u) {
      return (!term || u.key.replace(/[’']/g, '').indexOf(term) > -1) && (!s || u.st === s) && (!t || u.t === t) && (!f || u.f.indexOf(f) > -1);
    });
    var o = selO.value;
    list.sort(function (a, b) {
      if (o === 'az') return a.n.localeCompare(b.n);
      if (o === 'acc') return b.a - a.a || a.n.localeCompare(b.n);
      return (a.r || 999) - (b.r || 999) || b.a - a.a || a.n.localeCompare(b.n);
    });
    var any = !!(term || s || t || f);
    reset.hidden = !any;
    $$('.tchip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-t') === t)); });
    $$('.fld').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-f') === f)); });
  }
  var maxA = Math.max.apply(null, U.map(function (u) { return u.a; }));
  function card(u, i) {
    var li = document.createElement('li'); li.className = 'card'; li.style.setProperty('--c', TYPE_COL[u.t] || '#0A1A5C'); li.style.animationDelay = Math.min(i % PAGE, 12) * 30 + 'ms';
    var rank = u.r ? '<span class="rank"><small>QS</small>#' + u.r + '</span>' : '<span class="rank rank--none">Not ranked</span>';
    var fl = u.f.length ? u.f.map(function (f) { return '<span' + (f === selF.value ? ' class="hit"' : '') + '>' + esc(f) + '</span>'; }).join('') : '<span class="none">Fields not yet listed in MQR</span>';
    var acc = u.a ? '<div class="acc"><span>MQA-accredited programmes</span><b>' + u.a + '</b><i style="width:' + Math.max(3, u.a / maxA * 100).toFixed(1) + '%"></i></div>' : '<div class="acc acc--none"><span>Programme count not matched to MQR</span></div>';
    li.innerHTML = '<div class="card-top">' + rank + '<span class="type">' + esc(TYPE_LABEL[u.t] || u.t) + '</span></div>' +
      '<h3>' + esc(u.n) + '</h3><p class="loc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(u.l) + '</p>' +
      '<div class="flds"><small>Top fields of study</small><div>' + fl + '</div></div>' + acc +
      '<div class="card-act"><button type="button" class="btn btn--sun btn--sm" data-enquire="' + esc(u.n) + '">Ask about this <span aria-hidden="true">→</span></button></div>';
    return li;
  }
  function render(reset0) {
    if (reset0) shown = PAGE;
    filter();
    grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    list.slice(0, shown).forEach(function (u, i) { frag.appendChild(card(u, i)); });
    grid.appendChild(frag);
    cnt.textContent = list.length; cntL.textContent = list.length === 1 ? 'institution' : 'institutions';
    empty.hidden = list.length > 0; more.parentElement.hidden = list.length <= shown;
    more.textContent = 'Show ' + Math.min(PAGE, list.length - shown) + ' more';
  }
  var t;
  q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { render(true); }, 140); });
  [selS, selT, selF, selO].forEach(function (s) { s.addEventListener('change', function () { render(true); }); });
  more.addEventListener('click', function () { shown += PAGE; render(false); });
  reset.addEventListener('click', function () { q.value = ''; selS.value = ''; selT.value = ''; selF.value = ''; render(true); });

  /* back to the landing page: close this tab if the landing page opened it, otherwise navigate */
  function back(hash) {
    if (opts.onBack) { opts.onBack(hash); return; }
    var target = './index.html' + (hash || '');
    try { if (window.opener && !window.opener.closed) { window.opener.focus(); if (hash) window.opener.location.hash = hash; window.close(); return; } } catch (e) { /* cross-origin */ }
    if (history.length <= 1) { window.close(); setTimeout(function () { location.href = target; }, 250); }
    else location.href = target;
  }
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { back(''); }); });
  var toast = $('[data-toast]'), tt;
  function say(msg) { toast.textContent = msg; toast.hidden = false; clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, 3200); }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-enquire]'); if (!b) return;
    var name = b.getAttribute('data-enquire');
    if (opts.onPick) { opts.onPick(name); return; }
    try { localStorage.setItem('selectedUniversity', name); } catch (x) { /* storage blocked */ }
    say(name + ' added to your enquiry. Taking you back…');
    setTimeout(function () { back('#begin'); }, 900);
  });
  ROOT.__dirApply = function (str) { readParams(str); render(true); };
  render(true);
  }
  window.TCDir = { init: init };
  if (document.body.classList.contains('dir')) init(document, {});
})();
