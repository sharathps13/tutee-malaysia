/* ---------- Students & parents · social post testimonial ----------
   Follows the motion of 21st's "Social Post Testimonial" (MIT, 21st.dev/@21st/components/post-card), frame for frame at 30 fps:
   the card springs up from below and tilts flat (0–14), the avatar pops (from 5), the name slides in (8–18), each word fades up
   out of a blur (from 16), the key phrase gets a highlighter sweep (64–74), the footer rises (64–74), the rating counts up
   (72–106) and the star pops with a burst of dots at 80. Here it plays through our nine reviews in turn while the section is on
   screen; the page is never pinned. The dots under the card jump to any review. */
(function () {
  var root = document.querySelector('[data-pt]'); if (!root) return;
  var VO = [
    { name: 'Ramana S.', role: 'Parent of a student', city: 'Chennai', topic: 'Complex profile', post: 'My son has got the Pass for his higher studies at one of Malaysia\'s reputed universities. Despite his complicated profile, *the team made this happen.*' },
    { name: 'Priya K.', role: 'Master\'s student, Universiti Malaya', city: 'Kuala Lumpur', topic: 'Student Pass', post: 'Tutee Connect got my EMGS application and every supporting document exactly right. *My Student Pass was approved on the very first attempt.*' },
    { name: 'Vishal M.', role: 'Undergraduate, Taylor\'s University', city: 'Subang Jaya', topic: 'Post-landing', post: 'They didn\'t just help with the admission. The *post-landing support for finding accommodation* in Kuala Lumpur was a lifesaver.' },
    { name: 'Sneha R.', role: 'Graduate student, UPM', city: 'Serdang', topic: 'Visa refusal', post: 'I had a previous visa refusal and was losing hope. My coordinator *turned it around* and guided me through the entire documentation process.' },
    { name: 'Rahul V.', role: 'Engineering, UTM', city: 'Skudai', topic: 'Education loan', post: 'The non-collateral education loan assistance is genuine. They connected me directly with their banking partners and *sorted my finances fast.*' },
    { name: 'Anita D.', role: 'MBA candidate, Sunway University', city: 'Petaling Jaya', topic: 'Career pathway', post: 'Their consultation on the Graduate Pass and the Employment Pass pathway *gave me the clarity I needed* before flying out.' },
    { name: 'Karthik N.', role: 'Computer Science, USM', city: 'George Town', topic: 'Choosing a university', post: 'The counselling opened my eyes to *universities I hadn\'t even considered.* Now I\'m loving my term in Penang.' },
    { name: 'Divya P.', role: 'Data Science, APU', city: 'Bukit Jalil', topic: 'Applications', post: 'From application essays to final pass prep, *the whole journey felt personal.* Highly recommended for anyone aiming for Malaysia.' },
    { name: 'Siddharth J.', role: 'PhD student, UKM', city: 'Bangi', topic: 'Scholarship', post: 'A graduate assistantship felt impossible, but with their profile-building strategy *I got a full tuition waiver.*' }
  ];
  window.TC_REVIEWS = VO;   // the site's AI guide searches these too
  // each review runs 5 seconds in all (150 frames, the reference's own length): 108 frames in, a hold, then a 9-frame fade
  var FPS = 30, SETTLE = 108, HOLD = 141, OUT = 9, LIKED = 80, WORDS = 16, HL = 64, FOOT = 70;
  var still = matchMedia('(prefers-reduced-motion: reduce)');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var initials = function (n) { return n.split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(''); };

  // ---------- the reference's maths ----------
  var clamp01 = function (t) { return t < 0 ? 0 : t > 1 ? 1 : t; };
  var H = function (t, a, b) { return clamp01((t - a) / Math.max(1e-6, b - a)); };
  var expo = function (t) { var s = clamp01(t); return s >= 1 ? 1 : 1 - Math.pow(2, -10 * s); };
  // a damped spring from 0 to 1, starting at rest (closed form of the spring the reference uses)
  function spring(frame, cfg) {
    if (frame <= 0) return 0;
    var t = frame / FPS, w0 = Math.sqrt(cfg.stiffness / cfg.mass), z = cfg.damping / (2 * Math.sqrt(cfg.stiffness * cfg.mass)), v;
    if (z < 1) { var wd = w0 * Math.sqrt(1 - z * z); v = 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
    else v = 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    return Math.abs(1 - v) < .001 && t > .3 ? 1 : v;
  }
  var CARD = { damping: 16, stiffness: 120, mass: .9 }, AVATAR = { damping: 11, stiffness: 160, mass: .7 }, POP = { damping: 8, stiffness: 220, mass: .6 };
  var r2 = function (n) { return Math.round(n * 100) / 100; };

  // words, with *stars* marking the highlighted phrase
  function parse(post) {
    var words = [], cur = [], em = false;
    var push = function (ch) { var last = cur[cur.length - 1]; if (last && last.em === em) last.text += ch; else cur.push({ text: ch, em: em }); };
    for (var i = 0; i < post.length; i++) { var ch = post[i]; if (ch === '*') em = !em; else if (/\s/.test(ch)) { if (cur.length) words.push(cur); cur = []; } else push(ch); }
    if (cur.length) words.push(cur);
    return words;
  }

  var ICON = {
    msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    pin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    badge: '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4" stroke="#fff"/>'
  };
  var svg = function (k, cls) { return '<svg class="' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; };

  root.innerHTML =
    '<div class="pt-stage"><i class="pt-glow" aria-hidden="true"></i>' +
      '<article class="pt-card" aria-live="polite" aria-atomic="true">' +
        '<header class="pt-top"><div class="pt-av" aria-hidden="true"><span></span></div>' +
          '<div class="pt-who"><div class="pt-nm"><span class="pt-name"></span><span class="pt-badge" title="Tutee Connect family">' + svg('badge', 'pt-bdg') + '</span></div><div class="pt-meta"><span class="pt-role"></span></div></div></header>' +
        '<p class="pt-post"></p>' +
        '<footer class="pt-foot"><div class="pt-it">' + svg('msg', 'pt-ic') + '<span class="pt-topic"></span></div><div class="pt-it">' + svg('pin', 'pt-ic') + '<span class="pt-city"></span></div>' +
          '<div class="pt-it pt-rate"><div class="pt-pop">' + svg('star', 'pt-ic pt-star') + '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="pt-val">0.0</span><span class="sr-only"> out of 5</span></div></footer>' +
      '</article></div>' +
    '<div class="pt-dots" role="group" aria-label="Choose a review">' + VO.map(function (v, i) { return '<button type="button" aria-label="Review ' + (i + 1) + ' of ' + VO.length + ', ' + esc(v.name) + '"><i></i></button>'; }).join('') + '</div>';

  var $ = function (s) { return root.querySelector(s); };
  var card = $('.pt-card'), av = $('.pt-av'), who = $('.pt-who'), post = $('.pt-post'), foot = $('.pt-foot'), pop = $('.pt-pop'), rate = $('.pt-rate'), val = $('.pt-val');
  var dots = [].slice.call(root.querySelectorAll('.pt-dots button')), burst = [].slice.call(pop.querySelectorAll('i'));
  var words = [], emIdx = [], wordEls = [], gapEls = [];
  // sizes the animation scales by, measured on resize instead of every frame
  var FS = { post: 20, foot: 17, unit: 5.6 };
  function measure() { FS.post = parseFloat(getComputedStyle(post).fontSize) || 20; FS.foot = parseFloat(getComputedStyle(foot).fontSize) || 17; FS.unit = Math.min(root.clientWidth, 560) / 100; }

  function fill(i) {
    var v = VO[i];
    av.firstChild.textContent = initials(v.name);
    $('.pt-name').textContent = v.name; $('.pt-role').textContent = v.role; $('.pt-topic').textContent = v.topic; $('.pt-city').textContent = v.city;
    words = parse(v.post);
    var hasEm = words.map(function (w) { return w.some(function (s) { return s.em; }); }), n = 0;
    emIdx = hasEm.map(function (e) { return e ? n++ : -1; }); emIdx.count = n;
    post.innerHTML = words.map(function (w, k) {
      var inner = w.map(function (s) { return s.em ? '<b class="pt-em">' + esc(s.text) + '</b>' : esc(s.text); }).join('');
      var gap = k < words.length - 1 ? '<span class="pt-gap' + (hasEm[k] && hasEm[k + 1] ? ' pt-hlg' : '') + '"> </span>' : '';
      return '<span class="pt-w">' + inner + '</span>' + gap;
    }).join('');
    wordEls = [].slice.call(post.querySelectorAll('.pt-w')); gapEls = [].slice.call(post.querySelectorAll('.pt-gap'));
    dots.forEach(function (d, k) { d.classList.toggle('on', k === i); d.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
  }

  // ---------- one frame of the sequence ----------
  function render(p, out) {
    var fs = FS.post, unit = FS.unit;
    var z = spring(p, CARD), fade = out ? 1 - H(out, 0, OUT) : 1;
    card.style.opacity = (H(p, 0, 6) * fade).toFixed(3);
    card.style.transform = out ? 'translateY(' + r2(-H(out, 0, OUT) * unit * 3) + 'px)' : (z < 1 ? 'translateY(' + r2((1 - z) * unit * 7) + 'px) rotateX(' + r2((1 - z) * 16) + 'deg) scale(' + r2(.94 + .06 * z) + ')' : 'none');
    var za = spring(p - 5, AVATAR); av.style.transform = za < 1 ? 'scale(' + r2(Math.max(0, za)) + ')' : 'none';
    var mt = expo(H(p, 8, 18)); who.style.opacity = mt; who.style.transform = mt < 1 ? 'translateX(' + r2((1 - mt) * -fs * .47) + 'px)' : 'none';
    var stepW = Math.min(2.2, 46 / Math.max(1, words.length));
    wordEls.forEach(function (w, k) {
      var T = WORDS + k * stepW, K = expo(H(p, T, T + 7));
      w.style.opacity = K; w.style.transform = K < 1 ? 'translateY(' + r2((1 - K) * fs * .35) + 'px)' : 'none'; w.style.filter = K < 1 ? 'blur(' + r2((1 - K) * fs * .12) + 'px)' : 'none';
    });
    var hl = function (k) { if (emIdx[k] < 0) return 0; var T = HL + emIdx[k] / Math.max(1, emIdx.count) * 10; return expo(H(p, T, T + 4)); };
    wordEls.forEach(function (w, k) { var e = hl(k); [].forEach.call(w.querySelectorAll('.pt-em'), function (b) { b.style.backgroundSize = r2(e * 100) + '% 100%'; }); });
    gapEls.forEach(function (g, k) { if (g.classList.contains('pt-hlg')) g.style.backgroundSize = r2(hl(k + 1) * 100) + '% 100%'; });
    var ut = expo(H(p, FOOT - 6, FOOT + 4)); foot.style.opacity = ut; foot.style.transform = ut < 1 ? 'translateY(' + r2((1 - ut) * fs * .34) + 'px)' : 'none';
    val.textContent = (5 * expo(H(p, FOOT + 2, SETTLE - 2))).toFixed(1);
    var liked = p >= LIKED, s = liked ? spring(p - LIKED, POP) : 1;
    rate.classList.toggle('on', liked);
    pop.style.transform = 'scale(' + r2(.6 + .4 * s) + ')';
    var Z = H(p, LIKED, LIKED + 16), B = FS.foot;
    burst.forEach(function (b, k) {
      if (!(Z > 0 && Z < 1)) { b.style.opacity = 0; return; }
      var a = k / 8 * Math.PI * 2 + .3, d = B * (.5 + 1.1 * expo(Z));
      b.style.opacity = (1 - Z).toFixed(3); b.style.transform = 'translate(' + r2(Math.cos(a) * d) + 'px,' + r2(Math.sin(a) * d) + 'px) scale(' + r2(1 - Z * .6) + ')';
    });
  }

  // ---------- playing through the reviews while the section is on screen ----------
  var cur = 0, t0 = 0, outAt = 0, raf = 0, inView = false, held = false;
  function frameNow(now) { return (now - t0) / 1000 * FPS; }
  function loop(now) {
    raf = 0;
    if (outAt) {
      var o = (now - outAt) / 1000 * FPS; render(SETTLE + 40, o);
      if (o >= OUT) { outAt = 0; cur = (cur + 1) % VO.length; fill(cur); t0 = now; render(0); }
      raf = requestAnimationFrame(loop); return;
    }
    var p = frameNow(now);
    if (p < SETTLE + 20) render(p);
    if (p >= HOLD && inView && !held) outAt = now;
    if (inView) raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !still.matches) raf = requestAnimationFrame(loop); }
  function go(i) { cancelAnimationFrame(raf); raf = 0; outAt = 0; cur = i; fill(i); if (still.matches) { render(SETTLE + 40); return; } t0 = performance.now(); render(0); start(); }

  dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
  // keyboard focus on the dots holds the current review; a resting mouse never does
  root.addEventListener('focusin', function (ev) { if (ev.target.matches(':focus-visible')) held = true; });
  root.addEventListener('focusout', function (ev) { if (!root.contains(ev.relatedTarget)) held = false; });

  // the stage keeps the height of the longest review, so nothing below jumps as they change
  function fit() {
    measure(); var h = 0; card.style.transform = 'none';
    VO.forEach(function (v, i) { fill(i); render(SETTLE + 40); h = Math.max(h, card.offsetHeight); });
    $('.pt-stage').style.minHeight = (h + 40) + 'px'; fill(cur);
  }
  fit();
  var played = false;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
    inView = es[0].isIntersecting;
    if (inView && !played) { played = true; go(0); }
    else if (inView) { var p = frameNow(performance.now()); if (p > HOLD) t0 = performance.now() - (SETTLE + 20) / FPS * 1000; start(); }
  }, { threshold: .45 }).observe($('.pt-stage'));
  else { inView = true; go(0); }
  if (still.matches) render(SETTLE + 40); else render(0);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && inView) start(); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { fit(); render(still.matches ? SETTLE + 40 : Math.min(frameNow(performance.now()), SETTLE + 40)); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
})();
