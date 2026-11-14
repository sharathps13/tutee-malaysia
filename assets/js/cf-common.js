/* Course finder lab · shared data and helpers for the three options.
   Reads window.MY_FIELDS (ten fields: count, top six ranked institutions, busiest states)
   and window.MY_INDEX (all 391 EMGS institutions) from course-data.js. */
(function () {
  if (window.gsap) window.gsap.registerPlugin.apply(window.gsap, ['ScrollTrigger', 'Flip', 'Draggable', 'InertiaPlugin', 'SplitText', 'DrawSVGPlugin', 'MotionPathPlugin', 'ScrambleTextPlugin'].map(function (n) { return window[n]; }).filter(Boolean));
  var F = window.MY_FIELDS || {}, IDX = window.MY_INDEX || [];
  var FIELDS = [
    { key: 'Engineering & Construction', name: 'Engineering & construction', code: 'ENG', color: '#C8102E', svg: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>' },
    { key: 'Computing & IT', name: 'Computing & IT', code: 'ICT', color: '#2442C4', svg: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M8 9l-2 1.5L8 12M16 9l2 1.5-2 1.5"/>' },
    { key: 'Business & Law', name: 'Business & law', code: 'BIZ', color: '#D99A00', svg: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>' },
    { key: 'Health & Welfare', name: 'Health & medicine', code: 'MED', color: '#0F7B5F', svg: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/><path d="M3.5 12h4l2-3 3 6 2-3h6"/>' },
    { key: 'Natural Sciences & Mathematics', name: 'Sciences & maths', code: 'SCI', color: '#6A3FB5', svg: '<path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2l-6-10V3"/><path d="M7 15h10"/>' },
    { key: 'Arts & Humanities', name: 'Arts, design & humanities', code: 'ART', color: '#D9466F', svg: '<path d="M12 22a10 10 0 1 1 10-10c0 2.8-2.2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 22z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16.5" cy="10.5" r="1"/>' },
    { key: 'Social Sciences & Journalism', name: 'Social sciences & media', code: 'SOC', color: '#E0701A', svg: '<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3"/>' },
    { key: 'Education', name: 'Education', code: 'EDU', color: '#0E8FA8', svg: '<path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z"/>' },
    { key: 'Services', name: 'Hospitality, tourism & services', code: 'HOS', color: '#9A5B2A', svg: '<path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10 6h4"/>' },
    { key: 'Agriculture & Veterinary', name: 'Agriculture & veterinary', code: 'AGR', color: '#5E8C1F', svg: '<path d="M12 22V12M12 12C12 7 8 4 3 4c0 5 4 8 9 8zM12 14c0-4 3-7 9-7 0 5-4 7-9 7z"/>' }
  ].filter(function (f) { return F[f.key]; });
  FIELDS.forEach(function (f) { var d = F[f.key]; f.count = d.count; f.top = d.top || []; f.states = d.states || []; });

  // which fields list an institution among their top six (the "interchanges")
  var lines = {};
  FIELDS.forEach(function (f) { f.top.forEach(function (u) { (lines[u.n] = lines[u.n] || []).push(f); }); });

  var norm = function (t) { return String(t).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var acro = function (n) { var m = String(n).match(/\(([^)]+)\)\s*$/); return m ? m[1] : ''; };
  var base = function (n) { return String(n).replace(/\s*\([^)]*\)\s*$/, ''); };
  var ABBR = [[/Universiti|University/g, 'Univ'], [/Technology/g, 'Tech'], [/International/g, 'Intl'], [/Institute/g, 'Inst'], [/College/g, 'Coll'], [/Malaysia/g, 'M\'sia']];
  // fit a name into n characters: full name, then the acronym, then abbreviations, then a cut
  function fit(name, n) {
    var b = base(name), a = acro(name);
    if (b.length <= n) return b;
    if (a && a.length <= n) return a;
    var s = b; ABBR.forEach(function (r) { if (s.length > n) s = s.replace(r[0], r[1]); });
    return s.length <= n ? s : s.slice(0, n - 1).trim() + '.';
  }
  var city = function (u) { return String(u.l || '').split(',')[0].trim(); };
  var progs = function (u) { return u.a && u.a !== 'n/a' ? +u.a : 0; };
  function search(q, max) {
    var t = norm(q); if (t.length < 2) return null;
    return IDX.filter(function (u) { return norm(u.n + ' ' + (u.alt || '') + ' ' + u.l).indexOf(t) > -1; })
      .sort(function (a, b) { return (a.r || 999) - (b.r || 999) || progs(b) - progs(a); }).slice(0, max || 6);
  }
  // links resolve against the main site; a preview page can point them at the live site with window.CF_HOME
  var HOME = window.CF_HOME || '', local = !HOME;
  var dirHref = function (u) { return local ? './universities.html?q=' + encodeURIComponent(base(u.n)) : HOME; };
  var fieldHref = function (f) { return local ? './universities.html?field=' + encodeURIComponent(f.key) : HOME; };
  var begin = local ? '#begin' : HOME + '#begin';
  var icon = function (f, size) { return '<svg viewBox="0 0 24 24" width="' + (size || 20) + '" height="' + (size || 20) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + f.svg + '</svg>'; };
  // a regional photo for an institution's state (a view of the region, never presented as the campus)
  var REG = [[/Kuala Lumpur|Selangor/, 'pl-kl', 'Klang Valley'], [/Pinang|Penang|Perak|Kedah|Perlis/, 'pl-penang', 'Northern region'], [/Melaka|Johor|Negeri Sembilan/, 'pl-melaka', 'Southern region'], [/Sabah|Sarawak|Labuan/, 'pl-borneo', 'Borneo'], [/Putrajaya/, 'pl-putrajaya', 'Putrajaya'], [/Pahang|Terengganu|Kelantan/, 'pl-islands', 'East coast']];
  var region = function (u) { var l = String(u.l || '') + ' ' + String(u.alt || ''); for (var i = 0; i < REG.length; i++) if (REG[i][0].test(l)) return { img: './assets/img/photos/' + REG[i][1] + '.jpg', name: REG[i][2] }; return { img: './assets/img/photos/pl-kl.jpg', name: 'Klang Valley' }; };
  var motion = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.CF = { FIELDS: FIELDS, IDX: IDX, lines: lines, norm: norm, esc: esc, acro: acro, base: base, fit: fit, city: city, progs: progs, search: search, dirHref: dirHref, fieldHref: fieldHref, begin: begin, dir: local ? './universities.html' : HOME, icon: icon, region: region, motion: motion, total: IDX.length };
})();
