/* ---------- Tutee Connect AI · the site-wide guide ----------
   A glowing launcher sits above the WhatsApp button on every part of the page. It opens a chat panel that answers
   questions about studying in Malaysia with Tutee Connect by searching this website's own text and the FAQ, right in the
   visitor's browser: no AI service and no account needed. Answers quote the best-matching sentences and link to the
   section they come from. The suggestions change with the section on screen.
   window.TanyaAI.open({ask, context, hint}) lets other parts of the page open it. */
(function () {
  var gsap = window.gsap, still = matchMedia('(prefers-reduced-motion: reduce)');
  var M = function () { return !!gsap && !still.matches; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var faq = []; try { faq = JSON.parse(document.querySelector('[data-faq-data]').textContent); } catch (e) {}

  // what to suggest while each section is on screen
  var SUGG = {
    home: ['Why study in Malaysia?', 'How does Tutee Connect help?', 'How much does it cost?'],
    why: ['Why study in Malaysia?', 'How much does it cost?', 'Can I work while I study?'],
    places: ['Which city is best for students?', 'Tell me about Penang', 'Where are most campuses?'],
    services: ['Do you help with loans?', 'Do you help with the language test?', 'Do you help after I land?'],
    unis: ['How many institutions can I choose from?', 'How do you help me choose a college?', 'What do I need to apply?'],
    journey: ['How does the Student Pass work?', 'Is there a visa interview?', 'What documents do I need?'],
    courses: ['Can I study computing?', 'How do you help me choose a college?', 'Is Duolingo accepted?'],
    life: ['What is the food like?', 'Which festivals will I see?', 'Do you help after I land?'],
    escapes: ['How do I get to Langkawi?', 'When is the monsoon?', 'How do I climb Mount Kinabalu?'],
    money: ['What scholarships can I get?', 'Can I work while I study?', 'Do you help with loans?'],
    family: ['Can my family come with me?', 'Who can get a Dependant Pass?', 'What papers does my family need?'],
    voices: ['Can you help after a visa refusal?', 'Do you help with scholarships?', 'Do you help after I land?'],
    faq: ['What do I need to apply?', 'Is Duolingo accepted?', 'What is the Graduate Pass?'],
    begin: ['What happens after the evaluation?', 'How do I contact you?', 'Where is your office?']
  };
  var NAMES = {}; [].forEach.call(document.querySelectorAll('main section.sec[id]'), function (s) { NAMES[s.id] = (s.getAttribute('data-name') || s.id).replace(/&amp;/g, '&'); });

  // ---------- markup ----------
  var orbSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.3 6.4 6.7 2.4-6.7 2.4L12 20.1l-2.3-6.4-6.7-2.4 6.7-2.4z" fill="currentColor"/><path d="M19 2.5l.8 2.1 2.1.8-2.1.8L19 8.3l-.8-2.1-2.1-.8 2.1-.8z" fill="currentColor" opacity=".7"/></svg>';
  var host = document.createElement('div'); host.className = 'ta'; host.setAttribute('data-lenis-prevent', '');
  host.innerHTML =
    '<button type="button" class="ta-fab" aria-label="Ask Tutee Connect AI" aria-expanded="false" aria-controls="ta-panel"><span class="ta-orb">' + orbSvg + '</span><span class="ta-fab-l"><b>Tutee Connect AI</b><small>Ask me anything</small></span></button>' +
    '<section class="ta-panel" id="ta-panel" role="dialog" aria-modal="false" aria-label="Tutee Connect AI" hidden>' +
      '<div class="ta-aura" aria-hidden="true"></div>' +
      '<header class="ta-h"><span class="ta-orb ta-orb--sm">' + orbSvg + '</span><div class="ta-id"><b>Tutee Connect <em>AI</em></b><small><i></i><span data-ta-status>Answers from this website</span></small></div>' +
        '<button type="button" class="ta-ib" data-ta-new aria-label="Start a new chat" title="New chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></button>' +
        '<button type="button" class="ta-ib" data-ta-close aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
      '<div class="ta-body" data-ta-body role="log" aria-live="polite"></div>' +
      '<div class="ta-sugg" data-ta-sugg></div>' +
      '<form class="ta-f" data-ta-form><label class="sr-only" for="ta-in">Ask Tutee Connect AI a question</label><textarea id="ta-in" rows="1" placeholder="Ask about visas, costs, courses…" data-ta-in></textarea>' +
        '<button type="submit" class="ta-send" aria-label="Send" data-ta-send><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 20.5 21 12 3 3.5 5.5 12z"/></svg></button>' +
        '<button type="button" class="ta-stop" aria-label="Stop answering" data-ta-stop hidden><i></i></button></form>' +
      '<p class="ta-note">Answers come straight from this website. A counsellor confirms anything important.</p>' +
    '</section>';
  document.body.appendChild(host);
  var $ = function (s) { return host.querySelector(s); };
  var fab = $('.ta-fab'), panel = $('.ta-panel'), body = $('[data-ta-body]'), sugg = $('[data-ta-sugg]'), form = $('[data-ta-form]'), input = $('[data-ta-in]'), sendB = $('[data-ta-send]'), stopB = $('[data-ta-stop]'), status = $('[data-ta-status]');

  // ---------- which section is on screen ----------
  var current = 'home';
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { current = e.target.id; if (!panel.hidden && !busy && !turns.length) renderSugg(); } }); }, { rootMargin: '-45% 0px -45% 0px' });
    [].forEach.call(document.querySelectorAll('main section.sec[id]'), function (s) { io.observe(s); });
  }

  // ---------- the website as a search index (no AI service, no account: everything runs in the visitor's browser) ----------
  var STOP = ' a an the and or but if of to in on at for from by with about into is are was were be been am do does did can could will would should may might must i im me my we our you your it its this that these those there here what which who whom whose when where how much many any some all more most very just also so than then too not no yes please tell know want need get got have has had let us them they he she him her his as up out over under again like going go really ok okay ';
  var SYN = { visa: 'pass emgs immigration', visas: 'pass emgs immigration', pass: 'visa', cost: 'fee tuition price budget living rm', costs: 'fee tuition price budget living rm', fee: 'cost tuition', fees: 'cost tuition', price: 'cost fee', cheap: 'cost afford budget', cheaper: 'cost afford budget', expensive: 'cost fee', afford: 'cost budget loan', work: 'job part-time hour', job: 'work employment', jobs: 'work employment', family: 'spouse dependant child parent', wife: 'spouse dependant', husband: 'spouse dependant', kids: 'child dependant', children: 'child dependant', uni: 'university institution', unis: 'university institution', university: 'institution campus', universities: 'institution university campus', college: 'university institution', scholarship: 'bursary grant award waiver merit', scholarships: 'bursary grant award waiver merit', loan: 'finance bank lender', loans: 'finance bank lender', english: 'ielts toefl pte muet', house: 'accommodation housing', hostel: 'accommodation housing', rent: 'accommodation housing', food: 'eat dish nasi laksa satay', eat: 'food dish', trip: 'escape weekend break', travel: 'escape weekend break flight', holiday: 'escape break weekend', apply: 'application requirement document admission', requirements: 'requirement document', documents: 'document passport transcript', course: 'courses programme degree', masters: 'master postgraduate', mba: 'master postgraduate', phd: 'doctoral postgraduate', evaluation: 'free counsellor profile calls shortlist budget plan', office: 'address floor complex chennai dubai', counsellor: 'counselor evaluation whatsapp', contact: 'whatsapp counsellor', city: 'cities kuala lumpur penang', weather: 'monsoon rain dry', safe: 'safety secure', airport: 'arrival klia landing' };
  function stem(w) { if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y'; if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3); if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1); return w; }
  function words(t) { return String(t).toLowerCase().replace(/[’']/g, '').match(/[a-z0-9]+(?:-[a-z0-9]+)?/g) || []; }
  function toks(t) { return words(t).filter(function (w) { return w.length > 1 && STOP.indexOf(' ' + w + ' ') < 0; }).map(stem); }
  var IDX = null;
  function build() {
    var docs = [];
    faq.forEach(function (d) { docs.push({ sec: 'faq', faq: d, text: d.a, t: toks(d.q + ' ' + d.q + ' ' + d.a + ' ' + d.k.join(' ')), boost: 1.1 }); });
    [].forEach.call(document.querySelectorAll('main section.sec[id]'), function (s) {
      if (s.id === 'faq') return;
      // drop the interface around the words: kickers and tags in capitals, numbers, and short button labels that do not head a sentence
      var raw = (s.innerText || '').split(/\n+/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(function (l) { return l && /[a-z]/.test(l) && !/^(hover|tap|click|scroll|drag|keep scrolling|get yours|open region|see all)\b/i.test(l); });
      if (s.id === 'escapes') raw = raw.slice(0, 4);
      var lines = raw.filter(function (l, i) { return l.split(' ').length >= 4 || (raw[i + 1] && raw[i + 1].split(' ').length >= 6); });
      var buf = [], len = 0;
      var nameT = toks(NAMES[s.id] || '');
      var flush = function (keep) { var text = buf.join(' '); if (words(text).length >= 7) docs.push({ sec: s.id, text: text, t: toks(text).concat(nameT), boost: 1 }); buf = keep ? buf.slice(-1) : []; len = buf.join(' ').length; };
      // short labels (course fields, the top-12 crests, the nine services) become one list passage
      var h2 = s.querySelector('h2'), head = h2 ? h2.textContent.replace(/\s+/g, ' ').trim() : '', seenS = {};
      var shorts = raw.filter(function (l) { var n = l.split(' ').length; if (n > 5 || l.length < 4 || seenS[l] || /\d{1,2}:\d{2}|→|↓|^ask |^listen|^next|^search|^shortlist|^directory|^free evaluation$/i.test(l) || head.indexOf(l.replace(/[.,]$/, '')) > -1) return false; seenS[l] = 1; return true; });
      if (shorts.length >= 5) { var lt = (head ? head + ' ' : '') + shorts.slice(0, 40).join(', ') + '.'; docs.push({ sec: s.id, text: lt, t: toks(lt).concat(nameT), boost: .75 }); }
      lines.forEach(function (l) {
        var n = l.split(' ').length;
        buf.push(/[.!?:]$/.test(l) ? l : n < 5 ? l + ':' : l + '.'); len += l.length;
        if (len > 300) flush(true);
      });
      if (buf.length) flush(false);
    });
    // what students and parents said, one passage per review
    if (window.TC_REVIEWS) window.TC_REVIEWS.forEach(function (v) { var text = '**' + v.name + '**, ' + v.role + ' (' + v.city + '), on ' + v.topic.toLowerCase() + ':\n"' + v.post.replace(/\*/g, '') + '"'; docs.push({ sec: 'voices', text: text, whole: true, t: toks(text + ' review student parent say'), boost: 1 }); });
    // what we do, one passage per service, and the site's own one-line summary
    if (window.SVC) window.SVC.forEach(function (v) { var text = v.title + ': ' + v.sub + '. ' + v.text; docs.push({ sec: 'services', text: text, t: toks(text + ' ' + v.title + ' service help'), boost: 1.05 }); });
    var meta = document.querySelector('meta[name="description"]'); if (meta) docs.push({ sec: 'home', text: meta.content, t: toks(meta.content + ' tutee connect help service'), boost: 1 });
    // the twelve escapes, one passage each, from the strip's own data
    if (window.BRK && window.BRK.ESC) window.BRK.ESC.forEach(function (e) { var text = e.name + ' (' + e.region + '). Getting there: ' + e.get + '. Best time: ' + e.best + '. Trip length: ' + e.trip + '. ' + e.tip; docs.push({ sec: 'escapes', text: '**' + e.name + '** (' + e.region + ')\n- Getting there: ' + e.get + '\n- Best time: ' + e.best + '\n- Trip length: ' + e.trip + '\n\n' + e.tip, whole: true, t: toks(text + ' ' + e.name + ' escape weekend trip'), boost: 1.05 }); });
    var df = {}, total = 0;
    docs.forEach(function (d) { var seen = {}; d.tf = {}; d.t.forEach(function (w) { d.tf[w] = (d.tf[w] || 0) + 1; if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } }); total += d.t.length; });
    return { docs: docs, df: df, N: docs.length, avg: total / Math.max(1, docs.length) };
  }
  function search(q, ctx) {
    if (!IDX) IDX = build();
    var want = {}, add = function (list, wt) { list.forEach(function (w) { want[w] = Math.max(want[w] || 0, wt); }); };
    add(toks(q), 1);
    words(q).forEach(function (r) { if (SYN[r]) add(toks(SYN[r]), .45); });
    // the earlier question only helps short follow-ups ("and in Penang?"), never a full question of its own
    if (ctx && toks(q).length <= 3) add(toks(ctx), .15);
    var k1 = 1.3, b = .72;
    return IDX.docs.map(function (d) {
      var s = 0, hits = 0;
      for (var w in want) {
        var tf = d.tf[w]; if (!tf) continue;
        var idf = Math.log(1 + (IDX.N - IDX.df[w] + .5) / (IDX.df[w] + .5));
        s += want[w] * idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * d.t.length / IDX.avg));
        if (want[w] === 1) hits++;
      }
      return { d: d, s: s * d.boost * (d.sec === current ? 1.08 : 1), hits: hits };
    }).filter(function (r) { return r.s > 0; }).sort(function (x, y) { return y.s - x.s; });
  }
  // the one or two sentences of a passage that best match the question
  function excerpt(text, q) {
    var want = toks(q), parts = (text.match(/[^.!?]+[.!?]*/g) || [text]).map(function (p) { return p.trim(); }).filter(Boolean);
    var best = 0, bestS = -1;
    parts.forEach(function (p, i) { var t = toks(p), s = 0; want.forEach(function (w) { if (t.indexOf(w) > -1) s++; }); if (s > bestS) { bestS = s; best = i; } });
    var out = parts[best], j = best + 1;
    while (j < parts.length && parts[j].split(' ').length >= 5 && (out + ' ' + parts[j]).length < 320) { out += ' ' + parts[j]; j++; }
    if (out.length < 120 && best > 0) out = parts[best - 1] + ' ' + out;
    return out.replace(/:\s*(?=[A-Z])/g, ': ').replace(/\s+/g, ' ').trim();
  }
  var MIN = 2.2;
  function answer(q, ctx) {
    var low = q.toLowerCase();
    if (/^\s*(hi|hello|hey|hai|hola|salam|selamat|good (morning|afternoon|evening))\b/.test(low) && words(q).length < 5) return 'Hello! Ask me about **visas, costs, universities, scholarships, part-time work or family**, and I\'ll pull the answer from this website.';
    if (/(thank|terima kasih|thx|cheers)/.test(low) && words(q).length < 6) return 'You\'re welcome! Anything else about studying in Malaysia?';
    // contact details and offices, exactly as printed in the Free evaluation section
    if (/\b(contact|reach you|phone number|email|whatsapp|call you|office|offices|address|where are you|located)\b/.test(low)) return 'Talk to a counsellor any time on [WhatsApp](https://wa.me/917010902329), or call **+91 701-090-2329** (India) or **+971 55-379 9068** (UAE). Email **info@tuteeconnect.com**.\n- India office: 1st Floor, ALA Corner Complex, Virugambakkam, Chennai 600092\n- UAE office: Tutee Connect LLC FZ, Meydan Grandstand, Dubai\n\nOr book a [free evaluation](#begin) and a counsellor calls you.';
    current = where();
    var res = search(q, ctx);
    var top = res[0], qt = toks(q).filter(function (w) { return w.length > 3; });
    // a question built on words this site never uses (say, another country) is not one it can answer
    var unknown = qt.filter(function (w) { return !IDX.df[w] && !SYN[w]; }).length;
    if (!top || top.s < MIN || !top.hits || (unknown && unknown >= qt.length - top.hits)) {
      if (/(whatsapp|phone|call|contact|talk|counsel|human|person|someone)/.test(low)) return 'You can talk to a counsellor any time on [WhatsApp](https://wa.me/917010902329), or book a [free evaluation](#begin) and one will call you.';
      return 'I couldn\'t find that on this website. A counsellor can answer it for your profile: book a [free evaluation](#begin) or [WhatsApp us](https://wa.me/917010902329).';
    }
    var out;
    if (top.d.faq) out = '**' + top.d.faq.q + '**\n' + top.d.faq.a;
    else out = 'From **' + (NAMES[top.d.sec] || 'this site') + '**:\n' + (top.d.whole ? top.d.text : excerpt(top.d.text, q));
    var link = top.d.faq ? '[Open the FAQ](#faq)' : '[Go to ' + (NAMES[top.d.sec] || 'this section') + '](#' + top.d.sec + ')';
    var more = res.filter(function (r, i) { return i > 0 && r.d.sec !== top.d.sec && r.s >= top.s * .6 && r.hits; }).slice(0, 1)[0];
    out += '\n\n' + link + (more ? ' · Also see [' + (NAMES[more.d.sec] || more.d.sec) + '](#' + more.d.sec + ')' : '');
    return out;
  }
  window.TanyaAI_answer = answer;
  // ---------- tiny, safe markdown: bold, bullets, links to sections or WhatsApp ----------
  function md(text) {
    var h = esc(text.trim());
    h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
    // links: sections on this page, the directory page, WhatsApp and the like; anything else stays plain text
    h = h.replace(/\[([^\]]+)\]\((#[\w-]+|\.\/[\w.-]+(?:\?[^\s)]*)?|https:\/\/[^\s)]+)\)/g, function (m, label, href) { return '<a href="' + href.replace(/&amp;amp;/g, '&amp;') + '"' + (href[0] === '#' ? ' data-ta-jump' : ' target="_blank" rel="noopener"') + '>' + label + '</a>'; });
    var out = [], list = false;
    h.split('\n').forEach(function (line) {
      var b = /^\s*[-•*]\s+(.*)/.exec(line);
      if (b) { if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + b[1] + '</li>'); return; }
      if (list) { out.push('</ul>'); list = false; }
      if (line.trim()) out.push('<p>' + line + '</p>');
    });
    if (list) out.push('</ul>');
    return out.join('');
  }

  // ---------- messages ----------
  function msg(role, html) {
    var m = document.createElement('div'); m.className = 'ta-m ta-m--' + role;
    m.innerHTML = role === 'ai' ? '<span class="ta-orb ta-orb--xs">' + orbSvg + '</span><div class="ta-b">' + html + '</div>' : '<div class="ta-b">' + html + '</div>';
    body.appendChild(m);
    if (M()) gsap.from(m, { y: 14, opacity: 0, scale: .97, duration: .45, ease: 'back.out(1.7)', transformOrigin: role === 'me' ? '100% 100%' : '0 100%' });
    body.scrollTop = body.scrollHeight;
    return m.querySelector('.ta-b');
  }
  // the section across the middle of the screen, measured on demand so it never depends on an observer having fired
  function where() { var mid = window.innerHeight / 2, secs = document.querySelectorAll('main section.sec[id]'); for (var i = 0; i < secs.length; i++) { var r = secs[i].getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) return secs[i].id; } return current; }
  function renderSugg(list) {
    current = where();
    list = list || SUGG[current] || SUGG.home;
    sugg.innerHTML = list.map(function (s) { return '<button type="button">' + esc(s) + '</button>'; }).join('');
    if (M()) gsap.from(sugg.children, { y: 10, opacity: 0, duration: .4, ease: 'expo.out', stagger: .05 });
  }
  sugg.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) ask(b.textContent); });
  body.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[data-ta-jump]'); if (!a) return;
    var t = document.querySelector(a.getAttribute('href')); if (!t) return;
    ev.preventDefault(); if (window.innerWidth < 761) close();
    if (window.TClenis) window.TClenis.scrollTo(t, { duration: 1.4 }); else t.scrollIntoView({ behavior: M() ? 'smooth' : 'auto' });
  });
  function greet() {
    current = where();
    var b = msg('ai', '');
    var hello = 'Selamat datang! I\'m **Tutee Connect AI**, your guide to studying in Malaysia. Ask me anything about studying in Malaysia: visas, costs, universities, part-time work or family. I find the answers on this website' + (current && current !== 'home' ? ', and I can see you\'re on **' + (NAMES[current] || '') + '**.' : '.');
    typeOut(b, hello);
    renderSugg();
  }
  function typeOut(el, text) {
    if (!M()) { el.innerHTML = md(text); return; }
    var i = 0, inc = Math.max(3, Math.ceil(text.length / 160)), step = function () { i = Math.min(text.length, i + inc); el.innerHTML = md(text.slice(0, i)) ; el.classList.toggle('is-typing', i < text.length); body.scrollTop = body.scrollHeight; if (i < text.length) setTimeout(step, 14); };
    step();
  }

  // ---------- answering ----------
  var busy = false, ctl = null, turns = [], extraCtx = '', lastQ = '';
  function ask(q) {
    q = String(q || '').trim(); if (!q || busy) return;
    input.value = ''; autosize(); sugg.innerHTML = '';
    msg('me', esc(q));
    var bubble = msg('ai', '<span class="ta-think"><i></i><i></i><i></i></span>');
    busy = true;
    var t0 = Date.now(), wait = M() ? 500 + Math.random() * 400 : 0;
    var fallback = function () { try { return { text: answer(q, (extraCtx + ' ' + lastQ).trim()), chips: null }; } catch (e) { return { text: 'Something went wrong on my side. Try asking another way, or [WhatsApp a counsellor](https://wa.me/917010902329).', chips: null }; } };
    // the answer engine first (live directory data, the page's own data, the knowledge base); the page-text search if it has nothing
    var brain = window.TuteeBrain ? window.TuteeBrain.answer(q).catch(function () { return null; }) : Promise.resolve(null);
    brain.then(function (r) {
      r = r && r.text ? r : fallback();
      setTimeout(function () { typeOut(bubble, r.text); busy = false; turns.push(q); lastQ = q; renderSugg(r.chips && r.chips.length ? r.chips : null); }, Math.max(0, wait - (Date.now() - t0)));
    });
  }  form.addEventListener('submit', function (ev) { ev.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); ask(input.value); } });
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; }
  input.addEventListener('input', autosize);

  // ---------- open and close ----------
  var greeted = false;
  function openPanel(opts) {
    opts = opts || {};
    if (opts.context) extraCtx = opts.context;
    if (panel.hidden) {
      panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); host.classList.add('is-open');
      if (M()) gsap.fromTo(panel, { opacity: 0, scale: .6, y: 40, filter: 'blur(10px)' }, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: .6, ease: 'expo.out', clearProps: 'filter' });
      if (!greeted) { greeted = true; greet(); } else if (!turns.length && !busy) renderSugg();
    }
    if (opts.hint && !opts.ask) { input.placeholder = opts.hint; }
    if (opts.ask) ask(opts.ask);
    setTimeout(function () { input.focus({ preventScroll: true }); }, 50);
  }
  function close() {
    if (panel.hidden) return;
    fab.setAttribute('aria-expanded', 'false'); host.classList.remove('is-open');
    var done = function () { panel.hidden = true; };
    if (M()) gsap.to(panel, { opacity: 0, scale: .7, y: 30, duration: .3, ease: 'power3.in', onComplete: done }); else done();
    fab.focus({ preventScroll: true });
  }
  fab.addEventListener('click', function () { panel.hidden ? openPanel() : close(); });
  $('[data-ta-close]').addEventListener('click', close);
  $('[data-ta-new]').addEventListener('click', function () { if (ctl) ctl.abort(); if (window.TuteeBrain) window.TuteeBrain.reset(); turns = []; extraCtx = ''; input.placeholder = 'Ask about visas, costs, courses…'; body.innerHTML = ''; greet(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !panel.hidden) close(); });

  // the launcher shows its label for a moment the first time, then tucks it away
  setTimeout(function () { host.classList.add('is-hello'); setTimeout(function () { host.classList.remove('is-hello'); }, 4200); }, 2600);

  window.TanyaAI = { open: openPanel, close: close };
})();
