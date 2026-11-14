/* ---------- The news relay: real Malaysia education news, newest first ----------
   A ticker docked to the bottom of the screen, in view on every section (the × hides it until the page is
   reloaded; the other floating buttons sit above it through the --nr-h variable in news-relay.css).
   It always has something true to show, and takes the freshest edition it can reach:
     1. the built-in edition shipped with the page (news-data.js), shown at once;
     2. a newer edition saved for this page (the "news/latest" record, refreshed by Tutee Connect), if there is one;
     3. the live feed: the past week's headlines for Malaysian universities and international students, read from
        Google News through a public feed reader, re-checked every 30 minutes. Where the host blocks outside
        requests this step quietly fails and the newest saved edition stays up.
   Every item shows its source and how long ago it ran, worked out from the clock, and opens the story in a new tab.
   The label also follows Kuala Lumpur time (morning, afternoon, evening or late edition). */
(function () {
  'use strict';
  var root = document.querySelector('[data-nr]'); if (!root) return;
  var track = root.querySelector('[data-nr-track]'), label = root.querySelector('[data-nr-label]'), stamp = root.querySelector('[data-nr-stamp]'), view = root.querySelector('.nr-view');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COL = ['#E0405A', '#2E9A63', '#3B6FE0', '#C9820A', '#9B4FC0', '#0E8C8A'];

  function ago(iso) {
    var h = (Date.now() - Date.parse(iso)) / 36e5;
    if (!(h >= 0)) return '';
    if (h < 1) return 'just now';
    if (h < 24) return Math.round(h) + 'h ago';
    var d = Math.round(h / 24);
    return d === 1 ? 'yesterday' : d < 14 ? d + ' days ago' : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function klHour() { try { return +new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', hour12: false }).slice(0, 2); } catch (e) { return new Date().getHours(); } }
  function edition() { var h = klHour(); return h < 5 ? 'Late edition' : h < 12 ? 'Morning edition' : h < 17 ? 'Afternoon edition' : h < 22 ? 'Evening edition' : 'Late edition'; }
  function safeUrl(u, it) { return /^https:\/\//.test(u || '') ? u : 'https://news.google.com/search?q=' + encodeURIComponent(it.t + ' ' + it.s); }

  var current = { items: [], at: 0, mode: '' };
  function paint(items, mode, at) {
    items = (items || []).filter(function (n) { return n && n.t && n.s; }).sort(function (a, b) { return Date.parse(b.d || 0) - Date.parse(a.d || 0); }).slice(0, 12);
    if (items.length < 3) return false;
    current = { items: items, at: at || Date.now(), mode: mode };
    var row = items.map(function (n, i) {
      var hue = COL[(n.s.charCodeAt(0) + n.s.length) % COL.length];
      return '<a class="nr-item" href="' + esc(safeUrl(n.u, n)) + '" target="_blank" rel="noopener nofollow"><i class="nr-src" style="background:' + hue + '">' + esc(n.s.replace(/^the /i, '').charAt(0).toUpperCase()) + '</i><b>' + esc(n.t) + '</b><small>' + esc([n.s, n.d ? ago(n.d) : ''].filter(Boolean).join(' · ')) + '</small></a>';
    }).join('');
    track.innerHTML = '<div class="nr-set">' + row + '</div><div class="nr-set" aria-hidden="true">' + row.replace(/<a /g, '<a tabindex="-1" ') + '</div>';
    root.classList.toggle('is-live', mode === 'live');
    head();
    requestAnimationFrame(function () { var w = track.firstChild.getBoundingClientRect().width; track.style.setProperty('--nr-dur', Math.max(40, w / 48).toFixed(1) + 's'); });
    return true;
  }
  function head() {
    label.textContent = (current.mode === 'live' ? 'Live' : 'Latest') + ' · Malaysia education news';
    var when = current.mode === 'live' ? 'updated ' + ago(new Date(current.at).toISOString()) : 'edition of ' + new Date(current.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    stamp.textContent = edition() + ' · ' + when;
  }

  // 1 · the built-in edition
  var snap = window.TC_NEWS || { items: [] };
  paint(snap.items, 'snap', Date.parse(snap.at) || Date.now());

  // 2 · a newer saved edition for this page
  function saved() {
    if (!window.claude || !window.claude.use) return;
    var done = false, t = setTimeout(function () { done = true; }, 8000);
    Promise.resolve(window.claude.use('db')).then(function (db) { return db ? db.doc('news/latest').get() : null; }).then(function (snapDoc) {
      clearTimeout(t); if (done || !snapDoc || !snapDoc.exists) return;
      var d = snapDoc.data() || {}, at = Date.parse(d.at);
      if (current.mode !== 'live' && Array.isArray(d.items) && at > current.at) paint(d.items, 'saved', at);
    }).catch(function () { clearTimeout(t); });
  }

  // 3 · the live feed
  var FEED = 'https://news.google.com/rss/search?q=' + encodeURIComponent('Malaysia (university OR universities OR "international students" OR EMGS OR "student pass") when:7d') + '&hl=en-MY&gl=MY&ceid=MY:en';
  var RELEVANT = /universit|student|graduate|campus|education|emgs|ranking|\bqs\b|scholar|degree|college|academic|tuition|visa|study/i;
  function live() {
    var ctrl = window.AbortController ? new AbortController() : null, stop = setTimeout(function () { if (ctrl) ctrl.abort(); }, 9000);
    fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(FEED), { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        clearTimeout(stop);
        if (!j || j.status !== 'ok' || !Array.isArray(j.items)) return;
        var seen = {}, items = [];
        j.items.forEach(function (it) {
          var full = String(it.title || ''), cut = full.lastIndexOf(' - '); if (cut < 12) return;
          var t = full.slice(0, cut).trim(), s = full.slice(cut + 3).trim();
          if (t.length < 28 || !RELEVANT.test(t) || t === t.toUpperCase()) return;
          var key = t.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').slice(0, 4).join(' '); if (seen[key]) return; seen[key] = 1;
          var d = Date.parse(String(it.pubDate || '').replace(' ', 'T') + 'Z');
          items.push({ t: t, s: s, d: d ? new Date(d).toISOString() : '', u: it.link });
        });
        if (items.length >= 3) paint(items, 'live', Date.now());
      })
      .catch(function () { clearTimeout(stop); });
  }

  // fetch once the relay is near the screen; keep it fresh while the page stays open; run only while visible
  var started = false;
  function start() { if (started) return; started = true; saved(); live(); setInterval(function () { if (!document.hidden) live(); }, 30 * 60 * 1000); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { var on = es[0].isIntersecting; root.classList.toggle('is-paused', !on); if (on) start(); }, { rootMargin: '40% 0px' }).observe(root);
  } else start();
  setInterval(function () { if (!document.hidden) { head(); [].forEach.call(track.querySelectorAll('.nr-item'), function (a, i) { var n = current.items[i % current.items.length]; if (n && n.d) a.querySelector('small').textContent = n.s + ' · ' + ago(n.d); }); } }, 60000);
  if (reduce) root.classList.add('is-still');
  var shut = root.querySelector('[data-nr-x]');
  if (shut) shut.addEventListener('click', function () { document.documentElement.classList.add('nr-off'); root.classList.add('is-paused'); });
  // the ticker rests while the pointer or keyboard is on it
  view.addEventListener('pointerenter', function () { root.classList.add('is-held'); }); view.addEventListener('pointerleave', function () { root.classList.remove('is-held'); });
  view.addEventListener('focusin', function () { root.classList.add('is-held'); }); view.addEventListener('focusout', function () { root.classList.remove('is-held'); });
})();
