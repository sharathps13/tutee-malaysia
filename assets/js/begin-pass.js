/* Free evaluation · the six questions, their validation and the enquiry payload.
   Field names and messages match the original study-passport form; send() posts to /api/enquiry. */
(function () {
  if (window.gsap) window.gsap.registerPlugin.apply(window.gsap, ['ScrollTrigger', 'Flip', 'SplitText', 'DrawSVGPlugin', 'MotionPathPlugin', 'ScrambleTextPlugin', 'CustomEase'].map(function (n) { return window[n]; }).filter(Boolean));
  var STEPS = [
    { k: 'name', q: 'Hi! What should we call you?', type: 'text', ph: 'Your full name', ac: 'name', short: 'Name' },
    { k: 'email', q: 'Nice to meet you, {first}. Your email?', type: 'email', ph: 'you@example.com', ac: 'email', short: 'Email' },
    { k: 'phone', q: 'Best number to call you on?', type: 'phone', short: 'Phone' },
    { k: 'study_level', q: 'What do you want to study?', type: 'choice', short: 'Study level', opts: ['Undergraduate degree', 'Master\'s / MBA', 'PhD', 'Foundation / Diploma', 'Not sure yet'] },
    { k: 'intake', q: 'When would you like to start?', type: 'choice', short: 'Intake', opts: ['February / March 2027', 'September / October 2027', '2028', 'Not sure yet'] },
    { k: 'message', q: 'Anything we should know?', type: 'textarea', ph: 'Course, marks, budget, previous refusals…', optional: true, short: 'Notes' }
  ];
  var CODES = [['+91', 'IN'], ['+971', 'AE'], ['+60', 'MY'], ['+94', 'LK'], ['+880', 'BD'], ['+977', 'NP'], ['+92', 'PK'], ['+966', 'SA'], ['+974', 'QA'], ['+968', 'OM'], ['+965', 'KW'], ['+973', 'BH'], ['+65', 'SG'], ['+44', 'GB'], ['+1', 'US']];
  // the live page keeps its full list of country codes in a template; fall back to the short list
  function ccOptions() { var t = document.querySelector('template[data-cc]'); return t ? t.innerHTML : CODES.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + ' (' + c[0] + ')</option>'; }).join(''); }
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var motion = !matchMedia('(prefers-reduced-motion: reduce)').matches && !!window.gsap;
  function newState() { return { name: '', email: '', country_code: '+91', phone_number: '', study_level: '', intake: '', message: '', destination: 'General Malaysia Inquiry' }; }
  function first(s) { return String(s.name || '').trim().split(/\s+/)[0] || 'friend'; }
  function q(step, s) { return step.q.replace('{first}', esc(first(s))); }
  function valid(step, s) {
    if (step.k === 'name' && !s.name.trim()) return 'Please tell us your name.';
    if (step.k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) return 'Please enter a valid email address, like name@example.com.';
    if (step.k === 'phone' && !/^[0-9]{7,15}$/.test(s.phone_number.replace(/\D/g, ''))) return 'Please enter a phone number of 7 to 15 digits.';
    if (step.type === 'choice' && !s[step.k]) return 'Pick one to continue.';
    return '';
  }
  function display(step, s) {
    if (step.k === 'phone') return s.phone_number ? s.country_code + ' ' + s.phone_number : '';
    return String(s[step.k] || '').trim();
  }
  // one control per question; onChange fires on every edit, onPick when a choice is tapped
  function control(step, s, onChange, onPick) {
    var w = document.createElement('div'); w.className = 'ev-ctl ev-' + step.type;
    if (step.type === 'text' || step.type === 'email') {
      w.innerHTML = '<input class="ev-in" type="' + (step.type === 'email' ? 'email' : 'text') + '" autocomplete="' + step.ac + '" placeholder="' + esc(step.ph) + '" aria-label="' + esc(step.short) + '">';
      var i = w.firstChild; i.value = s[step.k]; i.addEventListener('input', function () { s[step.k] = i.value; onChange && onChange(step); });
    } else if (step.type === 'phone') {
      w.innerHTML = '<select class="ev-cc" aria-label="Country code">' + ccOptions() + '</select><input class="ev-in" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="Phone number" aria-label="Phone number">';
      var sel = w.querySelector('select'), ph = w.querySelector('input'); sel.value = s.country_code; ph.value = s.phone_number;
      sel.addEventListener('change', function () { s.country_code = sel.value; onChange && onChange(step); });
      ph.addEventListener('input', function () { s.phone_number = ph.value; onChange && onChange(step); });
    } else if (step.type === 'choice') {
      w.setAttribute('role', 'radiogroup'); w.setAttribute('aria-label', step.short);
      w.innerHTML = step.opts.map(function (o, j) { return '<button type="button" class="ev-opt" role="radio" aria-checked="' + (s[step.k] === o) + '" data-v="' + esc(o) + '"><kbd>' + String.fromCharCode(65 + j) + '</kbd><span>' + esc(o) + '</span></button>'; }).join('');
      [].forEach.call(w.children, function (b) { b.addEventListener('click', function () { s[step.k] = b.getAttribute('data-v'); [].forEach.call(w.children, function (x) { x.setAttribute('aria-checked', String(x === b)); }); onChange && onChange(step); onPick && onPick(step, b); }); });
    } else {
      w.innerHTML = '<textarea class="ev-in" rows="3" placeholder="' + esc(step.ph) + '" aria-label="' + esc(step.short) + '"></textarea>';
      var ta = w.firstChild; ta.value = s[step.k]; ta.addEventListener('input', function () { s[step.k] = ta.value; onChange && onChange(step); });
    }
    return w;
  }
  function focusIn(el) { var f = el.querySelector('input, textarea, .ev-opt[aria-checked="true"], .ev-opt'); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60); }
  // the payload the live form posts; this preview never sends it
  function payload(s) { var d = { name: s.name.trim(), email: s.email.trim(), phone: s.country_code + ' ' + s.phone_number.trim(), study_level: s.study_level, intake: s.intake, destination: s.destination, subject: 'New Lead from Tutee Connect Landing Page!', from_name: 'Tutee Connect Notification System' }; if (s.message.trim()) d.message = s.message.trim(); return d; }
  // posts exactly what the old study-passport form posted
  var NO_SEND = 'We could not send that from here. Please message us on WhatsApp at +91 70109 02329 and a counsellor will take it from there.';
  function viaApi(d) {
    return fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) {
        // no enquiry endpoint behind this page (for example the Claude artifact preview)
        if (r.status === 404 || r.status === 405 || r.status === 501) return { success: false, missing: true };
        return r.json().catch(function () { return { success: false }; });
      })
      .catch(function () { return { success: false, missing: true }; });
  }
  // where the page runs as a Claude artifact, keep the enquiry in its database: each sender writes under their own id,
  // and only the owner reads them all
  function viaDb(d) {
    var c = window.claude; if (!c || !c.use) return Promise.resolve(null);
    return Promise.all([c.use('db'), c.use('user')]).then(function (r) {
      var db = r[0], user = r[1]; if (!db || !user) return null;
      return user.id().then(function (id) {
        if (!id) return null;
        if (d.botcheck) return { success: true };
        return db.collection('enquiries/' + id + '/items').add(Object.assign({}, d, { at: new Date().toISOString() })).then(function () { return { success: true, stored: 'artifact' }; }, function () { return null; });
      });
    }).catch(function () { return null; });
  }
  function send(s) {
    var d = payload(s), di = document.querySelector('[data-destination-input]'), hp = document.querySelector('#begin [name="botcheck"]');
    if (di && di.value) d.destination = di.value;
    if (hp && hp.checked) d.botcheck = true;
    try { d.page = location.host + location.pathname; } catch (x) { d.page = ''; }
    return viaApi(d).then(function (res) {
      if (res && res.success) return res;
      if (!res || !res.missing) return res;
      return viaDb(d).then(function (r) { return r || { success: false, message: NO_SEND }; });
    });
  }
  function initials(s) { return String(s.name || '').trim().split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() || '?'; }
  window.EV = { STEPS: STEPS, CODES: CODES, esc: esc, motion: motion, newState: newState, first: first, q: q, valid: valid, display: display, control: control, focusIn: focusIn, payload: payload, send: send, initials: initials };
})();

/* Free evaluation · pass builder
   A holographic Student Pass tilts toward the pointer and fills in as each question is answered.
   The steps fold up as they are done (GSAP Flip). At the end the pass flips to a summary,
   drops into an envelope, gets a wax seal and flies off. */
(function () {
  var root = document.querySelector('[data-pb]'); if (!root || !window.EV) return;
  var E = window.EV, S = E.STEPS, gsap = window.gsap, M = E.motion, esc = E.esc;
  var scene = root.querySelector('[data-pb-scene]'), card = root.querySelector('[data-pb-card]'), backF = root.querySelector('[data-pb-back]'), envF = root.querySelector('[data-pb-env]'), stepsEl = root.querySelector('[data-pb-steps]');
  var ini = root.querySelector('[data-pb-ini]'), ticks = root.querySelector('[data-pb-ticks]'), noEl = root.querySelector('[data-pb-no]');
  var dd = {}; root.querySelectorAll('[data-pb]').forEach(function (d) { dd[d.getAttribute('data-pb')] = d; });
  var EMPTY = { name: 'Your name' };
  var st = E.newState(), cur = 0, reached = 0, doneSet = {}, phase = 'form';

  /* tilt and flip share one transform */
  var T = { rx: 0, ry: 0, flip: 0, s: 1, y: 0 };
  function apply() { card.style.transform = 'translateY(' + T.y + 'px) scale(' + T.s + ') rotateX(' + T.rx + 'deg) rotateY(' + (T.ry + T.flip) + 'deg)'; }
  apply();
  if (M && matchMedia('(hover: hover)').matches) {
    scene.addEventListener('pointermove', function (e) {
      if (phase === 'seal') return;
      var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      gsap.to(T, { rx: (.5 - py) * 18, ry: (px - .5) * 24, duration: .5, ease: 'power2.out', overwrite: 'auto', onUpdate: apply });
    });
    scene.addEventListener('pointerleave', function () { gsap.to(T, { rx: 0, ry: 0, duration: .9, ease: 'elastic.out(1, .5)', overwrite: 'auto', onUpdate: apply }); });
  } else if (M) {
    // no pointer: a slow idle sway keeps the hologram alive
    gsap.to(T, { ry: 8, rx: -4, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true, onUpdate: function () { apply(); card.style.setProperty('--mx', (50 + T.ry * 4) + '%'); } });
  }

  /* the card's fields */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function cardNo() { var h = hash(st.name + st.email + st.phone_number), d = String(h).padStart(10, '0'); return 'TC · ' + d.slice(0, 4) + ' ' + d.slice(4, 8); }
  function live() {
    S.forEach(function (s) { var d = dd[s.k]; if (!d) return; var v = E.display(s, st); d.textContent = v || EMPTY[s.k] || '—'; });
    var i = E.initials(st); if (ini.textContent !== i) { ini.textContent = i; if (M) gsap.fromTo(ini, { scale: .4, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out(2)' }); }
    noEl.textContent = cardNo();
  }
  function commit(k) {
    var s = S[k], d = dd[s.k];
    if (d && M && window.ScrambleTextPlugin) gsap.to(d, { scrambleText: { text: E.display(s, st) || '—', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', speed: .8 }, duration: .7 });
    if (d && M) gsap.fromTo(d, { backgroundColor: 'rgba(255,204,0,.55)' }, { backgroundColor: 'rgba(255,204,0,0)', duration: 1.1 });
    if (!doneSet[k]) {
      doneSet[k] = true; var t = document.createElement('i'); t.textContent = '✓'; t.title = s.short + ' verified'; ticks.appendChild(t);
      if (M) { gsap.from(t, { scale: 0, rotation: -120, duration: .6, ease: 'back.out(2.4)' }); gsap.fromTo(T, { rx: T.rx }, { rx: T.rx - 7, duration: .12, yoyo: true, repeat: 1, onUpdate: apply }); }
    }
  }

  /* the steps: one open at a time; finished ones fold to a summary line */
  stepsEl.innerHTML = S.map(function (s, k) { return '<div class="pb-st" data-k="' + k + '"><button type="button" class="pb-st-h"><i>' + (k + 1) + '</i><span><b>' + esc(s.short) + (s.optional ? ' (optional)' : '') + '</b><small data-sum></small></span><em>Edit</em></button><div class="pb-st-b"></div></div>'; }).join('');
  var items = [].slice.call(stepsEl.children);
  items.forEach(function (it, k) { it.querySelector('.pb-st-h').addEventListener('click', function () { if (phase === 'form' && k <= reached && k !== cur) open(k); }); });
  function summaries() { items.forEach(function (it, k) { var v = E.display(S[k], st); it.querySelector('[data-sum]').textContent = k === cur ? '' : (v || (k <= reached ? (S[k].optional ? 'Skipped' : 'Not answered yet') : '')); it.classList.toggle('done', !!doneSet[k] && k !== cur); it.querySelector('i').textContent = doneSet[k] && k !== cur ? '✓' : k + 1; it.querySelector('em').hidden = !(k <= reached && k !== cur); }); }
  function open(k) {
    var state = M && window.Flip ? Flip.getState(items) : null;
    cur = k; reached = Math.max(reached, k);
    items.forEach(function (it, j) { it.classList.toggle('on', j === k); var b = it.querySelector('.pb-st-b'); if (j !== k) b.innerHTML = ''; });
    var s = S[k], body = items[k].querySelector('.pb-st-b');
    body.innerHTML = '<h3>' + E.q(s, st) + '</h3><div data-ctl></div><p class="ev-err" role="alert"></p><div class="pb-go"><button type="button" class="btn btn--sun btn--sm" data-next>' + (k === S.length - 1 ? 'Flip my pass' : 'Next') + ' <span aria-hidden="true">→</span></button>' + (k ? '<button type="button" class="btn btn--sm" style="background:#F1EDE4;color:var(--ink)" data-prev>Back</button>' : '') + '</div>';
    var ctl = E.control(s, st, function () { body.querySelector('.ev-err').textContent = ''; live(); }, function (step, b) { if (M) gsap.fromTo(b, { scale: .9 }, { scale: 1, duration: .5, ease: 'elastic.out(1, .4)' }); setTimeout(next, 320); });
    body.querySelector('[data-ctl]').replaceWith(ctl);
    body.querySelector('[data-next]').addEventListener('click', next);
    var pv = body.querySelector('[data-prev]'); if (pv) pv.addEventListener('click', function () { open(cur - 1); });
    summaries();
    if (state) Flip.from(state, { duration: .6, ease: 'expo.inOut', nested: true });
    if (M) gsap.from(body.children, { y: 16, opacity: 0, duration: .5, ease: 'expo.out', stagger: .05, delay: .2 });
    if (open.used) E.focusIn(ctl); open.used = true;
  }
  function next() {
    if (phase !== 'form') return;
    var m = E.valid(S[cur], st), body = items[cur].querySelector('.pb-st-b');
    if (m) { body.querySelector('.ev-err').textContent = m; if (M) gsap.fromTo(body.querySelector('.ev-ctl'), { x: -12 }, { x: 0, duration: .6, ease: 'elastic.out(1, .3)' }); return; }
    commit(cur);
    if (cur < S.length - 1) open(cur + 1); else finish();
  }
  stepsEl.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); next(); } });

  /* the back of the pass and the send sequence */
  function qr(seed) {
    var n = 21, h = hash(seed || 'tutee'), r = '';
    var finder = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#0B1030"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#0B1030"/>'; };
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; if (h & 1) r += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#0B1030"/>'; }
    return '<svg class="qr" viewBox="-1 -1 23 23" aria-hidden="true"><rect x="-1" y="-1" width="23" height="23" fill="#fff"/>' + r + finder(0, 0) + finder(14, 0) + finder(0, 14) + '</svg>';
  }
  function finish() {
    phase = 'review';
    var di = document.querySelector('[data-destination-input]'), dest = di && di.value && di.value !== 'General Malaysia Inquiry' ? di.value : '';
    backF.innerHTML = '<h4>Ready for your counsellor</h4><dl>' + S.map(function (s) { return '<dt>' + esc(s.short) + '</dt><dd>' + esc(E.display(s, st) || (s.optional ? 'Skipped' : '—')) + '</dd>'; }).join('') + (dest ? '<dt>Destination</dt><dd>' + esc(dest) + '</dd>' : '') + '</dl>' + qr(st.name + st.email);
    var state = M && window.Flip ? Flip.getState(items) : null;
    items.forEach(function (it) { it.classList.remove('on'); it.querySelector('.pb-st-b').innerHTML = ''; }); cur = -1; summaries();
    var panel = document.createElement('div'); panel.className = 'pb-done'; panel.setAttribute('data-panel', '');
    panel.innerHTML = '<h3>Your pass is ready.</h3><p>Check the back of the card, then send it. A Malaysia counsellor calls within one working day.</p><div class="pb-go"><button type="button" class="btn btn--red" data-send>Seal and send</button><button type="button" class="btn btn--sm" style="background:#F1EDE4;color:var(--ink)" data-edit>Edit answers</button></div><p class="ev-err" role="alert"></p>';
    stepsEl.appendChild(panel);
    if (state) Flip.from(state, { duration: .6, ease: 'expo.inOut' });
    if (M) { gsap.from(panel, { y: 30, opacity: 0, duration: .7, ease: 'expo.out', delay: .2 }); gsap.to(T, { flip: 180, duration: 1.2, ease: 'power3.inOut', onUpdate: apply }); } else { T.flip = 180; apply(); }
    panel.querySelector('[data-edit]').addEventListener('click', function () { panel.remove(); phase = 'form'; if (M) gsap.to(T, { flip: 0, duration: 1, ease: 'power3.inOut', onUpdate: apply }); else { T.flip = 0; apply(); } open(0); });
    var sb = panel.querySelector('[data-send]');
    sb.addEventListener('click', function () { var er = panel.querySelector('.ev-err'); er.textContent = ''; sb.disabled = true; sb.textContent = 'Sealing…'; E.send(st).then(function (res) { if (res && res.success) { seal(panel); return; } sb.disabled = false; sb.textContent = 'Seal and send'; er.textContent = (res && res.message) || 'We could not send that. Please try again, or message us on WhatsApp.'; }); });
  }
  var envB = document.createElement('div'); envB.className = 'pb-envb'; envB.setAttribute('aria-hidden', 'true'); scene.insertBefore(envB, scene.firstChild);
  // the envelope is two layers around the card: the back (with the open flap) sits behind it; the front panel and the closed flap sit in front, so the pass disappears inside
  var FLAP = 'M0 14 A14 14 0 0 1 14 0 H296 A14 14 0 0 1 310 14 L155 118 Z';
  envB.innerHTML = '<svg viewBox="0 0 310 200"><path data-bflap d="' + FLAP + '" fill="#E8DABF" stroke="rgba(0,0,0,.08)" stroke-width="2"/><rect width="310" height="200" rx="14" fill="#E2D3B5"/><path d="M0 14 L155 110 L310 14" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="2"/></svg>';
  envF.innerHTML = '<svg viewBox="0 0 310 200"><path d="M0 14 A14 14 0 0 1 14 0 H296 A14 14 0 0 1 310 14 V186 A14 14 0 0 1 296 200 H14 A14 14 0 0 1 0 186 Z" fill="#F5EAD3"/><path d="M2 196 L130 104 M308 196 L180 104" fill="none" stroke="rgba(0,0,0,.1)" stroke-width="2"/><path data-flap d="' + FLAP + '" fill="#EFE2C6" stroke="rgba(0,0,0,.08)" stroke-width="2"/><g data-seal><circle cx="155" cy="114" r="22" fill="#C8102E"/><circle cx="155" cy="114" r="16" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/><path d="M155 101 l3.6 8.4 9 .6-6.9 5.8 2.2 8.8-7.9-4.8-7.9 4.8 2.2-8.8-6.9-5.8 9-.6z" fill="#FFCC00"/></g></svg>';
  var flap = envF.querySelector('[data-flap]'), bflap = envB.querySelector('[data-bflap]'), sealG = envF.querySelector('[data-seal]');
  function seal(panel) {
    phase = 'seal';
    var finishUp = function () {
      panel.innerHTML = '<h3>Sealed and sent.</h3><p>Terima kasih, ' + esc(E.first(st)) + '! A Malaysia counsellor will call you within one working day with a shortlist, a budget and a Student Pass plan.</p><div class="pb-go"><button type="button" class="btn btn--sun btn--sm" data-again>Build another pass</button></div>';
      if (M) gsap.from(panel.children, { y: 20, opacity: 0, duration: .6, stagger: .08, ease: 'expo.out' });
      panel.querySelector('[data-again]').addEventListener('click', reset);
    };
    if (!M) { finishUp(); return; }
    // open flap points up behind the card; the front flap starts folded flat at the top edge
    gsap.set(bflap, { scaleY: -1, svgOrigin: '155 0' }); gsap.set(flap, { scaleY: 0, svgOrigin: '155 0' }); gsap.set(sealG, { scale: 0, svgOrigin: '155 114' });
    // fit the card to the pocket from the real sizes, so it ends fully inside at any screen width
    T.rx = 0; T.ry = 0; apply(); gsap.set([envB, envF], { y: 0 });
    var er = envB.getBoundingClientRect(), cr = card.getBoundingClientRect();
    var fitS = Math.min(1, er.width * .84 / (cr.width / T.s)), restY = T.y + (er.top + er.height * .56) - (cr.top + cr.height / 2);
    var tl = gsap.timeline({ onComplete: finishUp });
    tl.to([envB, envF], { opacity: 1, duration: .35 })
      .fromTo([envB, envF], { y: 60 }, { y: 0, duration: .6, ease: 'back.out(1.6)' }, '<')
      .to(T, { s: fitS, y: restY - er.height * .62, duration: .55, ease: 'power2.inOut', onUpdate: apply })
      .to(T, { y: restY, duration: .5, ease: 'power2.in', onUpdate: apply })
      .to(bflap, { scaleY: 0, duration: .22, ease: 'power2.in' })
      .to(flap, { scaleY: 1, duration: .28, ease: 'power2.out' })
      .to(sealG, { scale: 1, duration: .5, ease: 'back.out(3)' })
      .to([card, envB, envF], { x: 420, y: -320, rotation: 18, scale: .3, opacity: 0, duration: .9, ease: 'power3.in', stagger: 0 }, '+=.25');
    if (window.confetti) tl.call(function () { var r = scene.getBoundingClientRect(); window.confetti({ particleCount: 90, spread: 70, origin: { x: (r.left + r.width * .7) / innerWidth, y: (r.top + r.height * .25) / innerHeight }, colors: ['#FFCC00', '#C8102E', '#FFFFFF'] }); }, null, '-=.3');
  }
  function reset() {
    st = E.newState(); cur = 0; reached = 0; doneSet = {}; phase = 'form'; ticks.innerHTML = '';
    var p = stepsEl.querySelector('[data-panel]'); if (p) p.remove();
    T.flip = 0; T.s = 1; T.y = 0; apply();
    if (gsap) { gsap.set([card, envB, envF], { clearProps: 'transform' }); gsap.set([envB, envF], { opacity: 0 }); gsap.set(card, { opacity: 1 }); }
    apply(); live(); open(0);
    if (M) { gsap.fromTo(T, { s: .7, ry: -40 }, { s: 1, ry: 0, duration: 1, ease: 'expo.out', onUpdate: apply }); gsap.from(card, { opacity: 0, duration: .5 }); }
  }
  live(); open(0);
})();
