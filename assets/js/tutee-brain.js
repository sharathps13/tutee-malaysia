/* ==========================================================================
   Tutee Connect AI — the answer engine (Malaysia)
   Built the same way as the Finland site's engine: it runs entirely in the browser (no model, no key, no network
   beyond this site's own files) and answers from, in order:

     1. Live data — the 391 EMGS-registered institutions (universities-data.js, loaded on the first question) and
        their fields of study: a university by name, rankings, counts, institutions by state or city, institutions
        by field ("computing in Penang"), and follow-ups on the last answer ("which of these are in Johor?").
     2. The page's own data — the five regions, the nine services, the twelve semester-break escapes and the
        students' and parents' reviews.
     3. A knowledge base written from the page's own copy (KB below), found by weighted keyword search with
        synonyms and light stemming.

   It never invents an answer: what this site cannot answer reliably (whether your marks are enough, distances,
   a university's exact fee or test score, which intakes are still open) it says so and hands over to a counsellor.
   When nothing here matches, it returns null so the chat can fall back to searching the page's text.

   API: TuteeBrain.answer(text) -> Promise<{ text, chips[] } | null>
        TuteeBrain.reset() — forget the conversation context
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Text helpers
   * ------------------------------------------------------------------ */
  function fold(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[’'`]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  var STOP = ('a an the and or of to in on at for from by with about into over is are was were be been being am do does did done can could ' +
    'should would will shall may might must i me my mine we us our you your yours it its this that these those there here what which who whom whose ' +
    'how when where why if then than so as not no yes please tell know want like get got give need any some all each more most much many ' +
    'just also too very really kind sort thing things anything something someone anyone ok okay hi hello hey thanks thank ' +
    'had have has having im ive dont doesnt isnt let lets go going way malaysia malaysian study studying').split(' ');
  var STOPSET = {}; STOP.forEach(function (w) { STOPSET[w] = 1; });
  function stem(w) {
    if (w.length > 5 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 5 && /ing$/.test(w)) return w.slice(0, -3);
    if (w.length > 4 && /ed$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && /es$/.test(w) && !/(ss|us)es$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
    return w;
  }
  // Words people use for the same thing, mapped onto the knowledge base's terms.
  var SYN = {
    visa: 'pass', visas: 'pass', permit: 'pass', emgs: 'pass', eval: 'pass', immigration: 'pass', studentpass: 'pass',
    fee: 'cost', fees: 'cost', tuition: 'cost', costs: 'cost', price: 'cost', expensive: 'cost', cheap: 'cost', cheaper: 'cost', afford: 'cost', money: 'cost', budget: 'cost', ringgit: 'cost', rm: 'cost',
    job: 'work', jobs: 'work', employment: 'work', earn: 'work', earning: 'work', salary: 'work', parttime: 'work', wage: 'work',
    pr: 'permanent', citizenship: 'permanent', settle: 'permanent', residency: 'permanent',
    spouse: 'family', wife: 'family', husband: 'family', partner: 'family', dependant: 'family', dependent: 'family', dependants: 'family', dependents: 'family',
    kid: 'children', kids: 'children', child: 'children', son: 'children', daughter: 'children',
    uni: 'university', unis: 'university', universities: 'university', college: 'university', colleges: 'university', institution: 'university', institutions: 'university', campus: 'university', campuses: 'university',
    programme: 'course', programmes: 'course', program: 'course', programs: 'course', degree: 'course', degrees: 'course', courses: 'course', major: 'course',
    scholarships: 'scholarship', grant: 'scholarship', grants: 'scholarship', waiver: 'scholarship', bursary: 'scholarship', bursaries: 'scholarship', merit: 'scholarship',
    loans: 'loan', lender: 'loan', lenders: 'loan', bank: 'loan', banks: 'loan', collateral: 'loan', finance: 'fund', funding: 'fund', funds: 'fund', financial: 'fund',
    house: 'accommodation', housing: 'accommodation', hostel: 'accommodation', dorm: 'accommodation', apartment: 'accommodation', rent: 'accommodation',
    english: 'language', ielts: 'language', toefl: 'language', pte: 'language', muet: 'language', cambridge: 'language', els: 'language', duolingo: 'duolingo',
    apply: 'application', applying: 'application', admission: 'application', admissions: 'application', requirement: 'application', requirements: 'application', eligibility: 'application', eligible: 'application', documents: 'application', document: 'application',
    counselor: 'counsellor', advisor: 'counsellor', adviser: 'counsellor', expert: 'counsellor', consultant: 'counsellor', agent: 'counsellor',
    graduation: 'graduate', graduating: 'graduate', poststudy: 'graduate',
    eat: 'food', eating: 'food', cuisine: 'food', dish: 'food', dishes: 'food', makan: 'food',
    festival: 'festival', festivals: 'festival', celebration: 'festival', celebrations: 'festival', holiday: 'festival',
    trip: 'escape', trips: 'escape', travel: 'escape', weekend: 'escape', getaway: 'escape', break: 'escape', breaks: 'escape', vacation: 'escape',
    airport: 'arrival', landing: 'arrival', land: 'arrival', arrive: 'arrival', arriving: 'arrival',
    ranking: 'rank', rankings: 'rank', ranked: 'rank', qs: 'rank'
  };
  function tokens(s) { return fold(s).split(' ').filter(function (w) { return w && !STOPSET[w]; }).map(function (w) { return SYN[w] || stem(w); }); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
  function pick(id) { for (var i = 0; i < KB.length; i++) if (KB[i].id === id) return { text: KB[i].a, chips: KB[i].c || [] }; return null; }
  var WA = '[WhatsApp a counsellor](https://wa.me/917010902329)';
  var EVAL = '[free evaluation](#begin)';
  var FALLBACK_CHIPS = ['How does the Student Pass work?', 'How much does it cost?', 'Computing in Kuala Lumpur', 'Talk to a counsellor'];

  /* ------------------------------------------------------------------ *
   * Data: the 391 institutions, loaded on the first question
   * ------------------------------------------------------------------ */
  var dataReady = null;
  function loadScript(src) {
    return new Promise(function (res) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = res; document.head.appendChild(s); });
  }
  function ensureData() {
    if (dataReady) return dataReady;
    dataReady = (window.MY_UNIVERSITIES ? Promise.resolve() : loadScript('./assets/js/universities-data.js')).then(buildIndex);
    return dataReady;
  }
  var UNIS = [], ALIAS = [], STATES = {}, TOWNS = {};
  // States and the everyday names people use for them
  var STATE_ALIAS = { 'kl': 'Kuala Lumpur', 'kuala lumpur': 'Kuala Lumpur', 'penang': 'Pulau Pinang', 'pulau pinang': 'Pulau Pinang', 'george town': 'Pulau Pinang', 'georgetown': 'Pulau Pinang',
    'malacca': 'Melaka', 'melaka': 'Melaka', 'johor': 'Johor', 'johor bahru': 'Johor', 'jb': 'Johor', 'selangor': 'Selangor', 'putrajaya': 'Putrajaya', 'sabah': 'Sabah', 'sarawak': 'Sarawak',
    'perak': 'Perak', 'ipoh': 'Perak', 'kedah': 'Kedah', 'kelantan': 'Kelantan', 'pahang': 'Pahang', 'perlis': 'Perlis', 'terengganu': 'Terengganu', 'negeri sembilan': 'Negeri Sembilan', 'nilai': 'Negeri Sembilan', 'seremban': 'Negeri Sembilan',
    'borneo': 'Borneo' };
  // Everyday names for institutions, on top of the names and acronyms in the data
  var NICK = { 'monash': /^monash university malaysia/, 'nottingham': /^university of nottingham malaysia/, 'southampton': /^university of southampton malaysia/, 'heriot watt': /^heriot-watt university malaysia/,
    'curtin': /^curtin university malaysia/, 'swinburne': /^swinburne university/, 'reading': /^university of reading malaysia/, 'newcastle': /^newcastle university medicine/, 'xiamen': /^xiamen university malaysia/,
    'taylors': /^taylor's university$/, 'sunway': /^sunway university$/, 'ucsi': /^ucsi university$/, 'apu': /^asia pacific university/, 'segi': /^segi university$/, 'inti': /^inti international university/,
    'limkokwing': /^limkokwing university/, 'mmu': /^multimedia university \(mmu\)/, 'multimedia university': /^multimedia university \(mmu\)/, 'uitm': /^universiti teknologi mara \(uitm\)$/, 'utar': /universiti tunku abdul rahman/, 'unimy': /^unimy/,
    'malaya': /^universiti malaya/, 'university of malaya': /^universiti malaya/, 'usm': /^universiti sains malaysia/, 'ukm': /^universiti kebangsaan/, 'upm': /^universiti putra/, 'utm': /^universiti teknologi malaysia \(utm\)/, 'utp': /^universiti teknologi petronas/, 'petronas': /^universiti teknologi petronas/ };
  var GENERIC = /^(university|universiti|college|kolej|malaysia|international|campus|institute|institut|academy|akademi|school|centre|center|sdn|bhd|of|the|and|for|technology|teknologi|science|sciences|management|business|health|medical|education|creative|design|arts?|islamic|islam|national|regional)$/;
  function stateOf(u) { var p = u.location.split(','); return p[p.length - 1].trim(); }
  function townOf(u) { var p = u.location.split(','); return p.length > 1 ? p[0].trim() : ''; }
  function buildIndex() {
    UNIS = (window.MY_UNIVERSITIES || []).slice().sort(function (a, b) { return a.rank - b.rank; });
    UNIS.forEach(function (u) {
      u._st = stateOf(u); u._town = townOf(u); u._f = String(u.programs || '').split(/\s*,\s*/).filter(Boolean);
      STATES[fold(u._st)] = u._st;
      if (u._town && !/floor|lot |jalan|level/i.test(u._town)) TOWNS[fold(u._town)] = u;
      var names = [u.name, u.name.replace(/\s*\(.*?\)/g, '')];
      var acr = /\(([A-Za-z]{2,8})\)/.exec(u.name); if (acr) names.push(acr[1]);
      String(u.alt || '').split(/\s*,\s*/).forEach(function (a) { if (a && !STATES[fold(a)] && !/^(du|dk|kpt)\d/i.test(a) && fold(a).length > 1 && fold(a) !== fold(u._st)) names.push(a); });
      names.forEach(function (n) { var f = fold(n); if (f.length > 1) ALIAS.push({ f: f, u: u }); });
    });
    Object.keys(NICK).forEach(function (k) { for (var i = 0; i < UNIS.length; i++) if (NICK[k].test(UNIS[i].name.toLowerCase())) { ALIAS.push({ f: k, u: UNIS[i] }); break; } });
    ALIAS.sort(function (a, b) { return b.f.length - a.f.length; });
  }
  function findUni(q) {
    var padded = ' ' + q + ' ';
    for (var i = 0; i < ALIAS.length; i++) {
      var a = ALIAS[i];
      if (a.f.length <= 3 && !/^[a-z]+$/.test(a.f)) continue;
      // two- and three-letter acronyms only count as whole words, and never the ones that are ordinary words
      if (a.f.length <= 3 && /^(it|is|am|an|me|my|he|in|on|at|or|so|us|we|do|go|no|to|up|of|as|by|be|if|the|and|for|you|can|any|how|who|pg|ug|ma|ba|ai|ib|pr|rm|kl|jb)$/.test(a.f)) continue;
      if (padded.indexOf(' ' + a.f + ' ') > -1) return a.u;
    }
    return null;
  }
  function findState(q) {
    var padded = ' ' + q + ' ', best = '', hit = '';
    Object.keys(STATE_ALIAS).forEach(function (k) { if (padded.indexOf(' ' + k + ' ') > -1 && k.length > best.length) { best = k; hit = STATE_ALIAS[k]; } });
    return hit;
  }
  function dirLink(o) {
    o = o || {}; var p = [];
    if (o.q) p.push('q=' + encodeURIComponent(o.q)); if (o.field) p.push('field=' + encodeURIComponent(o.field)); if (o.state) p.push('state=' + encodeURIComponent(o.state));
    return '[' + (o.label || 'Search them all in the directory') + '](./universities.html' + (p.length ? '?' + p.join('&') : '') + ')';
  }
  function uniLink(u) { return '[' + u.name + '](./universities.html?q=' + encodeURIComponent(u.name.replace(/\s*\(.*?\)/g, '')) + ')'; }
  function shortName(u) { var a = /\(([A-Za-z]{2,8})\)/.exec(u.name); return a ? a[1] : u.name.replace(/\s*\(.*?\)/g, '').replace(/ Malaysia$/, '').replace(/^University of /, ''); }
  function inState(u, st) { return st === 'Borneo' ? (u._st === 'Sabah' || u._st === 'Sarawak') : u._st === st; }
  function stateName(st) { return st === 'Pulau Pinang' ? 'Penang' : st === 'Borneo' ? 'Sabah and Sarawak' : st; }

  /* Fields of study (the MQR's broad fields, as the course finder shows them) and the words people use for them. */
  var FIELDS = [
    ['Computing & IT', 'computing and IT', /\b(computer\w*|computing|software|ict|information technology|informatics|data science|data|artificial intelligence|ai|machine learning|cyber\w*|programming|coding|game\w*|network\w*)\b/],
    ['Engineering & Construction', 'engineering', /\b(engineer\w*|mechanical|electrical|electronic\w*|civil|chemical|mechatronic\w*|petroleum|construction|architecture|architect|quantity survey\w*|aerospace|aeronautic\w*|robotics)\b/],
    ['Business & Law', 'business and law', /\b(business|management|mba|marketing|finance|accounting|accountancy|commerce|entrepreneur\w*|banking|hr|human resource\w*|law|legal|llb|logistics|supply chain)\b/],
    ['Health & Welfare', 'health and medicine', /\b(medicine|medical|mbbs|md|doctor|nursing|nurse|pharmacy|dentistry|dental|health\w*|physiotherapy|biomedical|optometry|nutrition|dietetics)\b/],
    ['Natural Sciences & Mathematics', 'sciences and maths', /\b(biology|chemistry|physics|math\w*|statistics|science|sciences|biotech\w*|environment\w*|actuarial|geology)\b/],
    ['Arts & Humanities', 'arts, design and humanities', /\b(art|arts|design|graphic|music|film|animation|fashion|interior design|languages?|literature|history|philosophy|creative|photography)\b/],
    ['Social Sciences & Journalism', 'social sciences and media', /\b(psychology|sociology|economics|journalism|mass communication|communication\w*|media|international relations|political|politics|social science\w*)\b/],
    ['Education', 'education', /\b(education|teaching|teacher|tesl|tesol|early childhood|pedagogy)\b/],
    ['Services', 'hospitality, tourism and services', /\b(hospitality|hotel|tourism|culinary|chef|events?|sports?|aviation|pilot|beauty)\b/],
    ['Agriculture & Veterinary', 'agriculture and veterinary', /\b(agricultur\w*|veterinary|vet|forestry|fisheries|plantation|aquaculture)\b/]
  ];
  function fieldOf(q) { for (var i = 0; i < FIELDS.length; i++) if (FIELDS[i][2].test(q)) return FIELDS[i]; return null; }
  var LEVEL = /\b(diploma|foundation|bachelor\w*|degree|undergrad\w*|master\w*|msc|mba|postgrad\w*|phd|doctora\w*|ug|pg)\b/;

  /* ------------------------------------------------------------------ *
   * Knowledge base — written from this page's own copy
   * ------------------------------------------------------------------ */
  var KB = [
    { id: 'apply', t: 'What you need to apply', k: 'application need document passport transcript requirement eligibility admission start gmat apply how',
      a: "To apply to study in Malaysia you need:\n- A **passport valid for at least 18 months**\n- Your **academic transcripts**\n- **Proof of English** from the EMGS list: MUET, IELTS, TOEFL iBT, PTE Academic, Cambridge English or ELS\n\nAttach the English certificate to your application, or EMGS may not grant a pass for the full length of your course. Some postgraduate courses, **MBAs** in particular, also ask for a **GMAT** score or work experience.\n\nIt starts with a [free evaluation](#begin): six quick questions, then a counsellor calls you with a shortlist.",
      c: ['How does the Student Pass work?', 'Is Duolingo accepted?', 'How much does it cost?'] },
    { id: 'pass', t: 'The Student Pass, step by step', k: 'pass visa emgs eval process permit immigration medical interview bond step approval letter how work',
      a: "Malaysia runs **no credibility interview**, so the decisive work is on paper:\n- **Before you apply:** a free consultation, a shortlist, and an English test EMGS accepts. Your passport must be valid for **18+ months**\n- **Offer letter:** we prepare transcripts, statement of purpose and references so your offer and EMGS details match exactly\n- **EMGS:** your institution applies for you, with a health declaration and pre-arrival medical screening, and signs a **personal bond** with the Immigration Department\n- **eVAL:** your **Visa Approval Letter** is your permission to travel\n- **Arrival:** a post-arrival medical screening, health insurance bought in Malaysia, and the Student Pass endorsed in your passport\n\n[See the Student Pass section](#journey)",
      c: ['What documents do I need?', 'Is there a visa interview?', 'What is the Graduate Pass?'] },
    { id: 'interview', t: 'Visa interview', k: 'interview credibility embassy',
      a: "No. Malaysia runs **no credibility interview** for a Student Pass. The decisive work is on paper: we check every field of your EMGS application against your offer letter, build your financial evidence, arrange the pre-arrival medical screening, and catch the **18-month passport validity rule**, the most common avoidable error.",
      c: ['How does the Student Pass work?', 'What documents do I need?'] },
    { id: 'passport', t: 'Passport validity', k: 'passport valid validity month expire renew',
      a: "Your passport must be **valid for at least 18 months** when you apply. It's the most common avoidable error on a Student Pass file, so we check it at the very start.",
      c: ['What do I need to apply?', 'How does the Student Pass work?'] },
    { id: 'language', t: 'English tests', k: 'language english test muet ielts toefl pte cambridge els accept score certificate',
      a: "EMGS accepts **MUET, IELTS, TOEFL iBT, PTE Academic, Cambridge English and ELS**. Attach the certificate to your application: without it EMGS may not grant a pass for the full length of your course.\n\nOur **Language test** service gives you training, mock tests and free study material, then books a test EMGS accepts.",
      c: ['Is Duolingo accepted?', 'What do I need to apply?'] },
    { id: 'duolingo', t: 'Duolingo English Test', k: 'duolingo det',
      a: "**Not for a Malaysian Student Pass.** EMGS lists the tests it accepts, and Duolingo is not among them. Sitting the wrong test can cost you an intake, so we book one that is on the list: MUET, IELTS, TOEFL iBT, PTE Academic, Cambridge English or ELS.",
      c: ['Which English tests are accepted?', 'What do I need to apply?'] },
    { id: 'cost', t: 'What it costs', k: 'cost tuition fee living budget expensive cheap afford money price rm public private service tax',
      a: "- **Public universities:** tuition from about **RM 14,000 a year**\n- **Private universities and branch campuses:** cost more, and their tuition for international students carries **6% service tax**, but they stay well below UK, US or Australian fees\n- **Living costs** depend heavily on the city. Street food is cheap: **satay at RM 1–2 a stick**, **curry laksa RM 8–12**\n\nYour counsellor builds an exact figure for your offer in the " + EVAL + ".",
      c: ['What scholarships can I get?', 'Do you help with loans?', 'Can I work while I study?'] },
    { id: 'work', t: 'Working while you study', k: 'work job part time earn hour week break semester holiday restaurant hotel approval',
      a: "**Not during term.** In semester breaks longer than seven days you may work **up to 20 hours a week** in **restaurants, petrol kiosks, mini markets or hotels**, and only with **prior Immigration Department approval**, which your institution applies for.",
      c: ['What is the Graduate Pass?', 'How can I fund my studies?'] },
    { id: 'graduate', t: 'The Graduate Pass', k: 'graduate pass after graduate stay post study twelve 12 month sponsor long term visit',
      a: "The **Graduate Pass** is a Long-Term Visit Pass that lets you stay in Malaysia for **twelve months after a bachelor's degree or higher**, with part-time work in approved sectors and no employer sponsor.\n- Open to **32 nationalities**\n- Needs a **personal bond signed by a Malaysian citizen sponsor** earning at least **RM 1,500 a month**\n- For **Indian and Chinese nationals** it is decided **case by case** and is currently authorised until **31 December 2026**, so we check the rule before you rely on it",
      c: ['What comes after the Graduate Pass?', 'Can I work while I study?'] },
    { id: 'career', t: 'Employment Pass and Permanent Residence', k: 'employment pass permanent residence pr career long term job after graduate pass entry permit settle',
      a: "After the Graduate Pass, the long-term route is an **employer-sponsored Employment Pass**, and later an **Entry Permit for Permanent Residence** once you are established. Our **End-to-end settlement** service maps it out: checking your nationality against the Graduate Pass list, lining up the sponsor it needs, then employer sponsorship.",
      c: ['What is the Graduate Pass?', 'Talk to a counsellor'] },
    { id: 'family', t: 'Bringing your family', k: 'family spouse children dependant pass bring parent wife husband postgraduate undergraduate',
      a: "Your family joins you on a **Dependant Pass**:\n- **Postgraduates** can bring a **spouse, children, parents and parents-in-law**\n- **Undergraduates** only if they are citizens of one of **17 listed countries**, and **India is not currently one of them**\n\nWe prepare each Dependant Pass application alongside your Student Pass, with the passports, photos and marriage or birth certificates that prove each relationship.\n\n[See the Family section](#family)",
      c: ['What papers does my family need?', 'How does the Student Pass work?'] },
    { id: 'familydocs', t: 'Papers for a Dependant Pass', k: 'papers documents family dependant passport photo marriage birth certificate checklist',
      a: "Each family member needs a **passport and photos**, plus the **marriage or birth certificate** that proves the relationship. We send you the checklist and prepare each Dependant Pass application alongside your Student Pass, keeping you updated until it is approved.",
      c: ['Can my family come with me?'] },
    { id: 'accommodation', t: 'Accommodation and arrival', k: 'accommodation housing hostel arrival airport bank touch n go sim first week land klia',
      a: "Yes. We work with **student housing providers near your campus**, run a **pre-departure briefing** on culture, academics, packing and immigration, and help in your **first week** with:\n- the post-arrival **medical screening** and Student Pass endorsement\n- **local health insurance**\n- a **Malaysian bank account** and a **Touch 'n Go card**\n- your institution's application for **vacation work** permission",
      c: ['Do you help with loans?', 'Can I work while I study?'] },
    { id: 'scholarship', t: 'Scholarships', k: 'scholarship merit bursary grant award essay interview fund',
      a: "We match strong profiles to **institutional scholarships** that can cover **part or all of tuition**, and coach you through the essays that win them:\n- **Merit and need-based** awards\n- **Essay and interview** coaching\n- **Deadlines tracked** for you\n\n[See Scholarships, loans and work](#money)",
      c: ['Do you help with loans?', 'How much does it cost?'] },
    { id: 'loan', t: 'Education loans', k: 'loan bank lender collateral finance fund tuition accommodation partner',
      a: "Yes. Direct tie-ups with **national banks and private lenders** cover **tuition and accommodation**, with **collateral and non-collateral** options, and the paperwork handled alongside your offer letter. We work with **10 lending partners**.",
      c: ['What scholarships can I get?', 'How much does it cost?'] },
    { id: 'why', t: 'Why study in Malaysia', k: 'why malaysia reason benefit worth good choose advantage',
      a: "- **391 EMGS institutions**: research universities, private universities, branch campuses and colleges, all registered for international students\n- **World-ranked degrees**, from about **RM 14,000 a year** at a public university\n- **UK and Australian branch campuses** (Monash, Nottingham, Southampton, Heriot-Watt, Curtin, Swinburne) awarding the same degree certificate as their home campuses\n- A **12-month Graduate Pass** after your degree\n- About **4 hours from Chennai**; lectures and exams all run in English\n- Food from **three great cuisines**, Tamil widely spoken and **South Indian food everywhere**",
      c: ['How much does it cost?', 'Which universities are ranked highest?', 'Where could I live?'] },
    { id: 'branch', t: 'Branch campuses', k: 'branch campus uk australia british australian foreign monash nottingham southampton heriot watt curtin swinburne same degree certificate',
      a: "Malaysia hosts **branch campuses of British and Australian universities**, including **Monash, Nottingham, Southampton, Heriot-Watt, Curtin and Swinburne**. They award **the same degree certificate as their home campuses**, at Malaysian prices. There are **10 foreign branch campuses** in the directory.",
      c: ['Tell me about Monash', 'How much does it cost?'] },
    { id: 'food', t: 'Food', k: 'food eat cuisine dish nasi laksa satay hawker vegetarian south indian tamil',
      a: "**Jom makan!** Malay, Chinese and Indian Malaysia share the same streets, so your weekly food bill stays small. **South Indian food is everywhere** and Tamil is widely spoken. Try **satay (RM 1–2 a stick)**, **curry laksa (RM 8–12)**, nasi kerabu from Kelantan, night markets in Kuala Lumpur and the hawker spreads.\n\n[See Life and food](#life)",
      c: ['Which festivals will I see?', 'How much does it cost?'] },
    { id: 'festival', t: 'Festivals', k: 'festival celebration chinese new year thaipusam hari raya merdeka deepavali calendar',
      a: "There's a festival every season:\n- **Chinese New Year** (January or February): lanterns, open houses and lion dances\n- **Thaipusam** (January or February): hundreds of thousands climb the **272 steps of Batu Caves**\n- **Hari Raya Aidilfitri** (Islamic calendar): the end of Ramadan, with open houses where everyone is welcome\n- **Merdeka Day** (31 August): Independence Day, with fireworks over Kuala Lumpur",
      c: ['What is the food like?', 'Where can I travel on breaks?'] },
    { id: 'malay', t: 'Malay phrases', k: 'malay phrase language local speak bahasa selamat terima kasih jom makan word',
      a: "A few words to speak like a local:\n- **Selamat datang**: welcome\n- **Terima kasih**: thank you\n- **Apa khabar?**: how are you?\n- **Berapa harga?**: how much is it?\n- **Jom makan!**: let's eat!\n- **Boleh**: can / OK\n- **Tapau**: takeaway\n- **Selamat pagi**: good morning\n\nLectures and exams all run in **English**.",
      c: ['What is the food like?'] },
    { id: 'distance', t: 'Distance from home', k: 'far home hour flight chennai india travel back fly time',
      a: "Malaysia is about **4 hours from Chennai** by air, so a short-notice trip home is easy. Penang has direct flights too, and Kuala Lumpur International Airport (**KLIA**) is in Selangor.",
      c: ['Why study in Malaysia?', 'Where could I live?'] },
    { id: 'evaluation', t: 'The free evaluation', k: 'free evaluation counsellor profile call shortlist plan next step start question begin',
      a: "Your place in Malaysia starts with a **free evaluation**:\n- **Answer six quick questions**: your marks, your budget and the course you have in mind\n- **A counsellor calls you** with a shortlist of universities and intakes that fit you\n- **You get your plan**: a budget and a Student Pass plan, ready when you are\n\n[Start my free evaluation](#begin)",
      c: ['How do I contact you?', 'What services do you offer?'] },
    { id: 'contact', t: 'Contact', k: 'contact phone whatsapp email call office address reach number',
      a: "Talk to a counsellor any time on [WhatsApp](https://wa.me/917010902329), or call **+91 701-090-2329** (India) or **+971 55-379 9068** (UAE). Email **info@tuteeconnect.com**.\n- **India office:** 1st Floor, ALA Corner Complex, Virugambakkam, Chennai 600092\n- **UAE office:** Tutee Connect LLC FZ, Meydan Grandstand, Dubai\n\nOr book a " + EVAL + " and a counsellor calls you.",
      c: ['What happens in the free evaluation?'] },
    { id: 'ai', t: 'About this assistant', k: 'who are you bot robot human ai assistant your name',
      a: "I'm **Tutee Connect AI**. I answer from this website: the 391 institutions in our directory, the regions, the Student Pass steps, costs, scholarships, family rules and the rest. I run in your browser, need no account, and I won't guess: anything that depends on your profile goes to a counsellor.",
      c: FALLBACK_CHIPS.slice(0, 3) },
    { id: 'choose', t: 'Choosing a university', k: 'choose select pick college university shortlist compare best suit help decide right',
      a: "Our **College selection** service compares all **391 EMGS institutions** against your interests and marks: public research universities, private universities, foreign branch campuses and university colleges. You see **module structures, credit requirements, placement years and graduate outcomes** before you choose.\n\nTell me a subject and a place (say, *computing in Penang*) and I'll show you who teaches it.",
      c: ['Which universities are ranked highest?', 'Engineering in Selangor', 'Start my free evaluation'] },
    { id: 'intake', t: 'Intakes', k: 'intake start month semester deadline session january september february',
      a: "Intakes and deadlines are set by **each institution and course**, and they change from year to year, so I'd rather not guess a list. Tell us when you'd like to start in the " + EVAL + " (it asks for your intake) and a counsellor comes back with the courses that fit, or " + WA + ".",
      c: ['What do I need to apply?', 'How does the Student Pass work?'] }
  ];
  var DF = {}, KBI = [];
  KB.forEach(function (e) {
    var w = {};
    tokens(e.t).forEach(function (x) { w[x] = (w[x] || 0) + 3; });
    tokens(e.k).forEach(function (x) { w[x] = (w[x] || 0) + 2; });
    tokens(e.a.replace(/\[[^\]]*\]\([^)]*\)/g, ' ')).forEach(function (x) { w[x] = (w[x] || 0) + .4; });
    Object.keys(w).forEach(function (x) { DF[x] = (DF[x] || 0) + 1; });
    KBI.push({ e: e, w: w });
  });
  var NDOC = KB.length;
  function kbSearch(q) {
    var qt = tokens(q), seen = {};
    qt = qt.filter(function (x) { if (seen[x]) return false; seen[x] = 1; return true; });
    var scored = KBI.map(function (d) { var s = 0; qt.forEach(function (x) { if (d.w[x]) s += d.w[x] * Math.log(1 + NDOC / DF[x]); }); return { d: d, s: s }; }).sort(function (a, b) { return b.s - a.s; });
    var best = scored[0], total = 0, got = 0;
    qt.forEach(function (x) { var idf = Math.log(1 + NDOC / (DF[x] || .5)); total += idf; if (best && best.d.w[x]) got += idf; });
    return { best: best && best.d.e, s: best ? best.s : 0, cover: total ? got / total : 0 };
  }

  /* ------------------------------------------------------------------ *
   * Answers built from live data
   * ------------------------------------------------------------------ */
  function typeWord(u) { return /research/i.test(u.type) ? '**public research university**' : /public/i.test(u.type) ? '**public university**' : /branch/i.test(u.type) ? '**foreign branch campus**' : '**' + u.type.toLowerCase() + '**'; }
  function uniSummary(u) {
    var acc = parseInt(u.accredited, 10);
    var t = '**' + u.name + '** is a ' + typeWord(u) + ' in **' + u.location + '**' + (u.ranked ? ', ranked **#' + u.rank + ' in Malaysia** in the QS World University Rankings 2027' : '') + '.\n\n' +
      (acc ? '- **' + acc + ' MQA-accredited programmes** on the Malaysian Qualifications Register\n' : '') +
      (u._f.length ? '- **Largest fields:** ' + u._f.join(', ') + '\n' : '') +
      '- **Registered with EMGS**, so it can enrol international students\n\n' + uniLink(u) + ' in the directory.';
    return { text: t, chips: ['Does ' + shortName(u) + ' teach computing?', 'Other universities in ' + stateName(u._st), 'Evaluate my profile'] };
  }
  function rankingAnswer(st) {
    var top = UNIS.filter(function (u) { return u.ranked && (!st || inState(u, st)); });
    if (!top.length) return { text: 'None of the institutions in **' + stateName(st) + '** is covered by the QS World University Rankings 2027. That says nothing bad about them for your field. ' + dirLink({ state: st === 'Borneo' ? '' : st, label: 'Browse ' + stateName(st) + ' in the directory' }) + '.', chips: ['Which universities are ranked highest?'] };
    var show = top.slice(0, st ? 8 : 12);
    return { text: '**' + plural(top.length, 'Malaysian institution is', 'Malaysian institutions are') + '** ranked in the **QS World University Rankings 2027**' + (st ? ' in **' + stateName(st) + '**' : '') + '. ' + (st ? '' : 'The top ' + show.length + ':') + '\n' +
      show.map(function (u) { return '- **#' + u.rank + '** ' + uniLink(u) + ' · ' + u.location; }).join('\n') +
      (top.length > show.length ? '\n\n' + dirLink({ label: 'See all ' + top.length + ' in the directory' }) + '.' : ''),
      chips: st ? ['Which universities are ranked highest?'] : ['Tell me about Universiti Malaya', 'Engineering at top universities', 'Universities in Penang'] };
  }
  function countsAnswer() {
    var by = {}; UNIS.forEach(function (u) { by[u.type] = (by[u.type] || 0) + 1; });
    var LBL = { 'Research University': 'public research universities', 'Public University': 'other public universities', 'Private University': 'private universities', 'Foreign Branch Campus': 'foreign branch campuses',
      'University College': 'university colleges', 'Private College': 'private colleges', 'Polytechnic & Community College': 'polytechnics and community colleges' };
    return { text: 'You can choose from **' + UNIS.length + ' institutions registered with EMGS**, which means every one of them can enrol international students:\n' +
      Object.keys(LBL).filter(function (k) { return by[k]; }).map(function (k) { return '- **' + by[k] + '** ' + LBL[k]; }).join('\n') +
      '\n\n**' + UNIS.filter(function (u) { return u.ranked; }).length + '** of them are ranked in the QS World University Rankings 2027. ' + dirLink({ label: 'Open the directory' }) + '.',
      chips: ['Which universities are ranked highest?', 'Universities in Kuala Lumpur', 'Tell me about branch campuses'] };
  }
  function listUnis(rows, n) { return rows.slice(0, n).map(function (u) { return '- ' + uniLink(u) + ' · ' + u.location + (u.ranked ? ' · **#' + u.rank + '** in Malaysia' : ''); }).join('\n'); }
  function stateAnswer(st, q) {
    var rows = UNIS.filter(function (u) { return inState(u, st); });
    if (/\b(public|government)\b/.test(q)) rows = rows.filter(function (u) { return /public|research/i.test(u.type); });
    else if (/\b(private)\b/.test(q)) rows = rows.filter(function (u) { return /private/i.test(u.type); });
    else if (/\bbranch\b/.test(q)) rows = rows.filter(function (u) { return /branch/i.test(u.type); });
    var uniOnly = /\buniversit/.test(q) && !/\bcolleges?\b/.test(q) ? rows.filter(function (u) { return /universit|branch/i.test(u.type); }) : rows;
    var show = uniOnly.length ? uniOnly : rows;
    if (!rows.length) return { text: 'I couldn\'t find an EMGS-registered institution of that kind in **' + stateName(st) + '**. ' + dirLink({}) + '.', chips: ['Universities in Kuala Lumpur'] };
    var region = null; (window.CX && window.CX.places || []).forEach(function (p) { if (p.states.indexOf(st) > -1 || (st === 'Borneo' && p.code === 'BOR')) region = p; });
    var t = (region ? '**' + region.name + '**, ' + region.tag.toLowerCase() + '. ' + region.text + '\n\n' : '') +
      '**' + plural(rows.length, 'EMGS-registered institution', 'EMGS-registered institutions') + '** in **' + stateName(st) + '**' + (show !== rows ? ', ' + show.length + ' of them universities or branch campuses' : '') + '. ' + (show.some(function (u) { return u.ranked; }) ? 'Highest ranked first:' : 'Some of them:') + '\n' + listUnis(show, 6) +
      '\n\n' + dirLink({ state: st === 'Borneo' ? '' : st, label: 'See all of them in the directory' }) + '.';
    ctx.list = { kind: 'state', st: st };
    return { text: t, chips: ['Computing in ' + stateName(st), 'Engineering in ' + stateName(st), 'Which of these are public?'] };
  }
  function fieldAnswer(fld, opts) {
    opts = opts || {};
    var rows = UNIS.filter(function (u) { return u._f.indexOf(fld[0]) > -1 && (!opts.st || inState(u, opts.st)); }), all = rows.length;
    if (opts.type === 'public') rows = rows.filter(function (u) { return /public|research/i.test(u.type); });
    if (opts.type === 'private') rows = rows.filter(function (u) { return /private/i.test(u.type); });
    if (opts.top) rows = rows.filter(function (u) { return u.ranked; });
    ctx.list = { kind: 'field', fld: fld, st: opts.st || '' };
    var where = opts.st ? ' in **' + stateName(opts.st) + '**' : '';
    if (!rows.length && all) return { text: 'None of the ' + all + ' institutions' + where + ' that list **' + fld[1] + '** among their largest fields is ' + (opts.top ? 'ranked by QS' : 'a **' + opts.type + '** institution') + '. ' + dirLink({ field: fld[0], state: opts.st && opts.st !== 'Borneo' ? opts.st : '', label: 'See all ' + all + ' in the directory' }) + ', or ask a counsellor: ' + WA + '.', chips: [fld[1].replace(/^./, function (c) { return c.toUpperCase(); }) + ' at public universities', 'Talk to a counsellor'] };
    if (!rows.length) return { text: 'None of the institutions' + where + ' lists **' + fld[1] + '** among its largest fields on the Malaysian Qualifications Register. Some may still teach a course in it, so ' + dirLink({ field: fld[0], label: 'search the directory' }) + ' or ask a counsellor: ' + WA + '.', chips: [fld[1].replace(/^./, function (c) { return c.toUpperCase(); }) + ' in Kuala Lumpur', 'Talk to a counsellor'] };
    var t = '**' + plural(rows.length, 'institution', 'institutions') + '**' + where + ' list **' + fld[1] + '** among their largest fields' + (opts.top ? ' and are ranked by QS' : '') + '. ' + (rows[0].ranked ? 'Highest ranked first:' : 'Some of them:') + '\n' + listUnis(rows, 6) +
      '\n\n' + dirLink({ field: fld[0], state: opts.st && opts.st !== 'Borneo' ? opts.st : '', label: 'See the full list in the directory' }) + '. Fields come from each institution\'s accredited programmes on the Malaysian Qualifications Register; your counsellor checks the exact course and intake.';
    var chips = [];
    if (!opts.st) chips.push('Which of these are in Penang?');
    else chips.push(fld[1].replace(/^./, function (c) { return c.toUpperCase(); }) + ' in Kuala Lumpur');
    chips.push('Which of these are public?', 'Evaluate my profile');
    return { text: t, chips: chips };
  }
  function regionAnswer(p) {
    var rows = UNIS.filter(function (u) { return p.states.some(function (s) { return inState(u, s); }) || (p.code === 'BOR' && (u._st === 'Sabah' || u._st === 'Sarawak')); });
    ctx.list = { kind: 'state', st: p.code === 'BOR' ? 'Borneo' : p.states[0] };
    return { text: '**' + p.name + '**, ' + p.tag.toLowerCase() + '. ' + p.text + '\n\n- **' + rows.length + ' EMGS-registered institutions**, including ' + p.chips.join(', ') + '\n' + listUnis(rows.filter(function (u) { return u.ranked; }).length ? rows.filter(function (u) { return u.ranked; }) : rows, 4) + '\n\n[See Where you could live](#places) · ' + dirLink({ state: p.code === 'BOR' ? '' : p.states[0], label: 'browse them' }),
      chips: ['Computing in ' + p.name.split(' &')[0], 'Which of these are public?', 'Where else could I live?'] };
  }
  function placesAnswer() {
    var ps = (window.CX && window.CX.places) || [];
    return { text: 'Five regions, five ways to live:\n' + ps.map(function (p) { return '- **' + p.name + '** (' + p.tag.toLowerCase() + '): ' + p.count + ' campuses. ' + p.text; }).join('\n') + '\n\n[See Where you could live](#places)',
      chips: ps.slice(0, 3).map(function (p) { return 'Tell me about ' + p.name.split(' &')[0]; }) };
  }
  function services() { return window.SVC || []; }
  function findService(q) {
    var best = null, bs = 0;
    services().forEach(function (s) {
      var t = fold(s.title), sc = 0;
      if ((' ' + q + ' ').indexOf(' ' + t + ' ') > -1) sc = 10;
      else t.split(' ').forEach(function (w) { if (w.length > 3 && (' ' + q + ' ').indexOf(' ' + w) > -1) sc += 2; });
      if (sc > bs) { bs = sc; best = s; }
    });
    return bs >= 4 ? best : null;
  }
  function serviceAnswer(s) { return { text: '**' + s.title + '** (' + s.sub + ')\n\n' + s.text + '\n\n[See What we do](#services) · [' + (s.cta || 'Get started') + '](' + (s.href || '#begin') + ')', chips: ['What services do you offer?', 'Evaluate my profile'] }; }
  function servicesAnswer() {
    return { text: 'Tutee Connect is one team from your first question to your first week in Kuala Lumpur. **Nine services**:\n' + services().map(function (s, i) { return '- **' + s.title + '**: ' + s.sub; }).join('\n') + '\n\nAsk about any of them for the details.',
      chips: services().slice(0, 3).map(function (s) { return 'Tell me about ' + s.title.toLowerCase(); }) };
  }
  function escapes() { return (window.BRK && window.BRK.ESC) || []; }
  function findEscape(q) {
    var best = null, bs = 0;
    escapes().forEach(function (e) {
      var sc = 0; fold(e.name + ' ' + e.region).split(' ').forEach(function (w) { if (w.length > 3 && !/^(island|islands|sabah|kedah|pahang|terengganu|borneo|malaysian|around|valley|such|east|coast|walks?)$/.test(w) && (' ' + q + ' ').indexOf(' ' + w) > -1) sc += 2; });
      if (sc > bs) { bs = sc; best = e; }
    });
    return best;
  }
  function escapeAnswer(e) { return { text: '**' + e.name + '** (' + e.region + ')\n- **Getting there:** ' + e.get + '\n- **Best time:** ' + e.best + '\n- **Trip length:** ' + e.trip + '\n\n' + e.tip + '\n\n[See Semester breaks](#escapes)', chips: ['Where else can I travel on breaks?', 'Can I work during breaks?'] }; }
  function escapesAnswer() { return { text: 'Twelve favourite long-weekend escapes from the semester breaks:\n' + escapes().map(function (e) { return '- **' + e.name + '** (' + e.region + '): ' + e.trip; }).join('\n') + '\n\n[See Semester breaks](#escapes)', chips: ['How do I get to Langkawi?', 'How do I climb Mount Kinabalu?'] }; }
  function reviewsAnswer() {
    var v = (window.TC_REVIEWS || []).slice(0, 3);
    if (!v.length) return null;
    return { text: 'A few of the students and parents we\'ve helped:\n' + v.map(function (r) { return '- **' + r.name + '**, ' + r.role + ' (' + r.city + '): "' + r.post.replace(/\*/g, '') + '"'; }).join('\n') + '\n\n[Read more in Students and parents](#voices)', chips: ['Can you help after a visa refusal?', 'Evaluate my profile'] };
  }

  /* ------------------------------------------------------------------ *
   * What this site can't answer reliably: say so, then hand over
   * ------------------------------------------------------------------ */
  var NEEDS_COUNSELLOR = [
    [/\b(how far|distance (from|to|between)|how long (does it|will it|would it|to) (take|get|reach|travel|commute)|commut\w*|travel time|minutes? (from|to|away)|km (from|to|away))\b/, /\b(campus|university|uni|college|city|airport|station|from my|to the)\b/,
      'I can\'t give reliable distances or travel times between campuses and places: they depend on the exact campus and where you\'d live.'],
    [/\b(next|this|coming) (month|week|few weeks)\b|\bstart\w* (soon|immediately|asap|right away)\b|\b(still|currently) (open|accepting)\b/, null,
      'Which courses can still take you that soon depends on each institution\'s current deadlines and places, which change all the time.'],
    [/\b\d{2}(\.\d+)? ?(%|percent)|\b(percentage|marks|cgpa|gpa|backlogs?|gap year|study gap|year gap|education gap|arrears)\b/, /\b(admission|admit|get in|get into|eligib\w*|accept\w*|apply|qualify|enough|chances?|possible|can i)\b/,
      'Whether your marks are enough depends on the institution, the course and the rest of your profile, so I won\'t guess.'],
    [/\b(best|good|safe|safest|cheap\w*|nice) (area|areas|suburbs?|neighbou?rhoods?|localit(y|ies)|part of (the )?(city|town)) (to (live|stay)|for students?)\b|\bwhere (should|can|do) (i|students) (live|stay)\b/, null,
      'The best area to live depends on your campus, budget and lifestyle, and this site doesn\'t compare neighbourhoods.'],
    [/\b(ielts|pte|toefl|muet|cambridge)\b.*\b(scores?|bands?|minimum)\b|\b(scores?|bands?|minimum)\b.*\b(ielts|pte|toefl|muet)\b/, null,
      'Each institution sets its own minimum English score, and it varies by course, so I won\'t quote one. The tests EMGS accepts are MUET, IELTS, TOEFL iBT, PTE Academic, Cambridge English and ELS.'],
    [/\b(distance learning|distance education|online (course|courses|degree|degrees|study|studies|classes|programmes?|programs?)|study online|studying online|remote study)\b/, null,
      'A Student Pass is for full-time study on campus, and this site doesn\'t cover online or distance courses.'],
    [/\b(refus\w*|reject\w*|denied|declined)\b/, /\b(visa|pass|emgs|application|eval)\b/,
      'Every refusal has its own reasons, so a counsellor needs to look at your file. Our documentation team is how complicated profiles still clear.']
  ];
  function needsCounsellor(q) { for (var i = 0; i < NEEDS_COUNSELLOR.length; i++) { var n = NEEDS_COUNSELLOR[i]; if (n[0].test(q) && (!n[1] || n[1].test(q))) return n[2]; } return ''; }

  /* ------------------------------------------------------------------ *
   * The dialogue
   * ------------------------------------------------------------------ */
  var ctx = {};
  function reset() { ctx = { uni: null, list: null }; }
  reset();

  function answer(raw) {
    var q = fold(String(raw).replace(/\bIT\b/g, 'ICT'));
    if (!q) return Promise.resolve({ text: 'Ask me anything about studying in Malaysia.', chips: FALLBACK_CHIPS });
    var n = q.split(' ').length;

    // Small talk first: no data needed
    if (/^(hi|hello|hey|hai|hii+|hola|salam|selamat (pagi|petang|datang)|good (morning|afternoon|evening)|namaste|vanakkam)\b/.test(q) && n <= 4)
      return Promise.resolve({ text: 'Hello! What would you like to know about studying in Malaysia? Ask about **universities and courses**, the **Student Pass**, **costs and scholarships**, **work**, **family**, or anything else on this page.', chips: FALLBACK_CHIPS });
    if (/^(thanks|thank you|thx|ty|terima kasih|great|awesome|cool|ok|okay|nice|perfect)\b/.test(q) && n <= 4)
      return Promise.resolve({ text: 'You\'re welcome! Anything else I can help with?', chips: ['Evaluate my profile', 'Which universities are ranked highest?'] });
    if (/^(bye|goodbye|see you|cya)\b/.test(q)) return Promise.resolve({ text: 'Good luck with your Malaysia plans! A counsellor is a message away whenever you need one: ' + WA + '.', chips: ['Evaluate my profile'] });
    if (/\b(talk|speak|chat) (to|with) (a |an )?(counsellor|counselor|human|person|someone|agent)\b|^talk to a counsellor$/.test(q))
      return Promise.resolve({ text: 'Of course. ' + WA + ' any time, call **+91 701-090-2329**, or book a ' + EVAL + ' and a counsellor calls you with a shortlist, a budget and a Student Pass plan.', chips: ['What happens in the free evaluation?'] });
    if (/^(evaluate my profile|start my free evaluation)$/.test(q)) return Promise.resolve(pick('evaluation'));

    var unsure = needsCounsellor(q);
    if (unsure) return Promise.resolve({ text: unsure + ' A counsellor can check it for you: ' + WA + ', or ask in the ' + EVAL + '.', chips: ['Talk to a counsellor', 'Evaluate my profile'] });

    return ensureData().then(function () {
      var uni = findUni(q), st = findState(q), fld = fieldOf(q);
      // "it", "this one" refer back to the last university discussed
      if (!uni && ctx.uni && /\b(it|its|this (university|uni|one|college|place)|that (university|uni|one|college)|they)\b/.test(q) && !/\b(these|those|them)\b/.test(q)) uni = ctx.uni;
      if (uni) ctx.uni = uni;
      var prev = ctx.list; ctx.list = null;

      // Follow-ups that refine the list just given ("which of these are in Penang / public?")
      if (prev && /\b(these|those|them|which of|of them|among them|same|there)\b/.test(q)) {
        var type = /\bpublic|government\b/.test(q) ? 'public' : /\bprivate\b/.test(q) ? 'private' : '';
        var top = /\b(rank\w*|top|best|qs)\b/.test(q);
        if (prev.kind === 'field') return fieldAnswer(prev.fld, { st: st || prev.st, type: type, top: top });
        if (prev.kind === 'state') {
          if (fld) return fieldAnswer(fld, { st: prev.st, type: type, top: top });
          if (top) return rankingAnswer(prev.st);
          return stateAnswer(prev.st, q);
        }
      }

      var byId = function (id) { return pick(id); };
      if (/^(why|should i|is it worth|what makes|what is good about|whats good about|benefits? of)\b/.test(q) && !fld && !uni && !st && !/\b(pass|visa|work|family|cost|fee)\b/.test(q)) return byId('why');
      if (/\b(who|what) are you\b|\bare you (a )?(bot|robot|human|real|ai)\b|\byour name\b/.test(q)) return byId('ai');
      if (/\bduolingo\b/.test(q)) return byId('duolingo');
      if (/\b(other|more|different) (countr\w*|destination\w*)\b|\b(study|studying|go)\b.*\b(usa|america|uk|united kingdom|canada|australia|new zealand|ireland|germany|france|finland|dubai|uae|singapore)\b/.test(q) && !/\bbranch|campus|degree certificate\b/.test(q))
        return { text: 'This page is about **studying in Malaysia**. Tutee Connect\'s counsellors can talk you through other destinations too: ' + WA + '.', chips: ['Why study in Malaysia?', 'Tell me about branch campuses'] };

      // Contact details, asked in many ways
      if (/\b(phone|whatsapp|email|e mail|mail id|contact|call you|address|office|reach you|number|located|location of (your|tutee))\b/.test(q) && !uni && !st) return byId('contact');

      // Money: the page's own figures; a specific university's fee goes to a counsellor
      var money = /\b(how much|fees?|tuition|cost|costs|price|ringgit|rm|inr|rupees|lakh|expensive|cheap\w*|affordable|budget)\b/.test(q);
      if (money && uni) return { text: 'This site doesn\'t list **' + uni.name + '**\'s fees, and they vary by course. In general:\n\n' + pick('cost').text + '\n\nA counsellor can get the exact figure for your course: ' + WA + '.', chips: ['What scholarships can I get?', 'Do you help with loans?'] };

      // Family: parents are covered for postgraduates only
      if (/\b(family|spouse|wife|husband|partner|children|child|kids|parents?|mother|father|dependants?|dependents?)\b/.test(q) && /\b(bring|come|join|take|with me|move|visa|pass|accompany)\b/.test(q)) return byId('family');

      // Rankings and counts
      if (/\b(rank\w*|top|best|qs|highest|leading)\b/.test(q) && !uni && !fld && /\b(universit\w*|uni|unis|college\w*|institution\w*|ranked|ranking|rankings|qs)\b/.test(q)) return rankingAnswer(st);
      if (/\bhow many\b/.test(q) && /\b(universit\w*|uni|unis|college\w*|institution\w*|campus\w*|options|choices)\b/.test(q) && !uni && !st && !fld) return countsAnswer();
      if (/\bbranch campus\w*\b|\bforeign (universit\w*|campus\w*)\b|\b(uk|british|australian) (universit\w*|campus\w*|degree)\b/.test(q) && !uni) return byId('branch');

      // Common questions with a fixed answer on this page
      if (/\b(choose|select|pick|shortlist|decide|compare)\b/.test(q) && /\b(college\w*|universit\w*|uni|unis|institution\w*|course\w*)\b/.test(q) && !uni && !st && !fld) return byId('choose');
      if (/\b(accommodation|housing|hostels?|rent|room|apartment|place to stay|where (will|do) i stay)\b/.test(q) && !uni) return byId('accommodation');
      if (/\b(english|tamil|hindi|language)\b.*\b(spoken|speak|used|medium|taught|common)\b|\bmedium of instruction\b|\bdo (people|they|locals) speak\b/.test(q))
        return { text: '**Lectures and exams all run in English.** Day to day you\'ll hear Malay, English, Chinese dialects and Tamil, and **Tamil is widely spoken**, with **South Indian food everywhere**. A few Malay words go a long way: *selamat datang* (welcome), *terima kasih* (thank you), *jom makan!* (let\'s eat!).', chips: ['Teach me some Malay phrases', 'Which English tests are accepted?'] };
      if (/\b(most|biggest|largest) (campus\w*|universit\w*|institution\w*|colleges?)\b|\bwhere are (the |most )?(campus\w*|universit\w*|institution\w*|colleges?)\b/.test(q) && !st) {
        var cnt = {}; UNIS.forEach(function (u) { cnt[u._st] = (cnt[u._st] || 0) + 1; });
        var ks = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
        return { text: 'Most campuses sit in and around **Kuala Lumpur**. EMGS-registered institutions by state:\n' + ks.slice(0, 8).map(function (k) { return '- **' + stateName(k) + '**: ' + cnt[k]; }).join('\n') + '\n- and ' + ks.slice(8).reduce(function (s, k) { return s + cnt[k]; }, 0) + ' more across ' + ks.slice(8).map(stateName).join(', ') + '\n\n[See Where you could live](#places)',
          chips: ['Universities in Selangor', 'Tell me about Penang', 'Which universities are ranked highest?'] };
      }

      // Services by name
      var svc = findService(q);
      if (svc && /\b(service|help with|tell me about|what is|whats|do you (do|offer|help))\b/.test(q) && !uni) return serviceAnswer(svc);
      if (/\b(services?|what do you (do|offer)|how (can|do) you help|how does tutee connect help|what does tutee connect do)\b/.test(q) && !uni) return servicesAnswer();

      // A university by name
      if (uni) {
        if (fld) {
          var yes = uni._f.indexOf(fld[0]) > -1;
          return { text: yes ? '**Yes.** ' + fld[1].replace(/^./, function (c) { return c.toUpperCase(); }) + ' is one of the largest fields at **' + uni.name + '** on the Malaysian Qualifications Register (' + uni._f.join(', ') + '). ' + uniLink(uni) + ', and a counsellor confirms the exact course and intake.'
            : '**' + fld[1].replace(/^./, function (c) { return c.toUpperCase(); }) + '** isn\'t among the largest fields at **' + uni.name + '** on the Malaysian Qualifications Register' + (uni._f.length ? ' (those are ' + uni._f.join(', ') + ')' : '') + ', though it may still run a course in it. A counsellor can check: ' + WA + '.',
            chips: [fld[1].replace(/^./, function (c) { return c.toUpperCase(); }) + ' in ' + stateName(uni._st), 'Tell me about ' + shortName(uni)] };
        }
        if (/\b(rank\w*|position|qs)\b/.test(q)) return { text: uni.ranked ? '**' + uni.name + '** is ranked **#' + uni.rank + ' in Malaysia** in the QS World University Rankings 2027.' : '**' + uni.name + '** isn\'t covered by the QS World University Rankings 2027. That isn\'t a judgement on its quality for your field. ' + uniLink(uni) + '.', chips: ['Which universities are ranked highest?', 'Tell me about ' + shortName(uni)] };
        if (/\b(where|city|located|location|state|campus)\b/.test(q)) return { text: '**' + uni.name + '** is in **' + uni.location + '**. ' + uniLink(uni) + '.', chips: ['Other universities in ' + stateName(uni._st), 'Tell me about ' + shortName(uni)] };
        if (/\b(apply|application|admission|requirement\w*|eligib\w*|documents?|english|ielts)\b/.test(q)) return { text: 'Each course at **' + uni.name + '** sets its own entry requirements, and we check them course by course. In general:\n\n' + pick('apply').text, chips: ['Tell me about ' + shortName(uni), 'Evaluate my profile'] };
        if (/\b(scholarship\w*|bursar\w*)\b/.test(q)) return { text: 'This site doesn\'t list **' + uni.name + '**\'s own scholarships. ' + pick('scholarship').text, chips: ['Do you help with loans?'] };
        return uniSummary(uni);
      }

      // Regions and states
      var place = null; (window.CX && window.CX.places || []).forEach(function (p) { var nm = fold(p.name.split(' &')[0]); if ((' ' + q + ' ').indexOf(' ' + nm + ' ') > -1) place = p; });
      if (/\b(borneo|sabah and sarawak)\b/.test(q)) place = (window.CX.places || []).filter(function (p) { return p.code === 'BOR'; })[0] || place;
      if (fld) {
        var type0 = /\bpublic|government\b/.test(q) ? 'public' : /\bprivate\b/.test(q) ? 'private' : '';
        var fa = fieldAnswer(fld, { st: st, type: type0, top: /\b(top|best|rank\w*|qs)\b/.test(q) });
        var lv = LEVEL.exec(q);
        if (lv && /^\*\*\d/.test(fa.text)) fa.text += ' Fields here cover every level an institution teaches, so we check which of them run the **' + lv[1].replace(/^(ug|undergrad\w*)$/, 'bachelor\'s').replace(/^(pg|postgrad\w*|msc|mba)$/, 'master\'s').replace(/^masters?$/, 'master\'s').replace(/^bachelors?$/, 'bachelor\'s').replace(/^(phd|doctora\w*)$/, 'PhD') + '** you want.';
        return fa;
      }
      if (/\b(where (could|can|should) i live|which (city|cities|region|state)|best city|cities|regions|places to (live|study))\b/.test(q)) return placesAnswer();
      if ((place || st) && (/\b(universit\w*|uni|unis|college\w*|institution\w*|campus\w*|study|where)\b/.test(q) || n <= 4)) {
        if (/\b(rank\w*|top|best)\b/.test(q)) return rankingAnswer(st || (place && (place.code === 'BOR' ? 'Borneo' : place.states[0])));
        if (/\b(universit\w*|college\w*|institution\w*|public|private)\b/.test(q) && st) return stateAnswer(st, q);
        if (place && !/\b(universit\w*|college\w*|institution\w*)\b/.test(q)) return regionAnswer(place);
        return stateAnswer(st || (place.code === 'BOR' ? 'Borneo' : place.states[0]), q);
      }

      // Semester-break escapes, by name or as a list
      var esc0 = findEscape(q);
      if (esc0 && !/\b(universit\w*|college\w*)\b/.test(q)) return escapeAnswer(esc0);
      if (/\b(escape\w*|trip\w*|weekend\w*|getaway\w*|holiday\w*|travel\w*|visit|places to see|things to do)\b/.test(q) && /\b(break\w*|weekend\w*|holiday\w*|where|places?|go|visit|travel)\b/.test(q) && !/\b(home|india|chennai)\b/.test(q)) return escapesAnswer();
      if (/\b(review\w*|testimonial\w*|what (do|did) (students|parents) say|feedback|experience\w*)\b/.test(q)) { var rv = reviewsAnswer(); if (rv) return rv; }
      if (/\b(what comes after|after the graduate pass)\b/.test(q)) return byId('career');
      if (/\b(papers?|documents?|certificates?|checklist)\b/.test(q) && /\b(family|spouse|wife|husband|children|kids|parents?|dependants?|dependents?)\b/.test(q)) return byId('familydocs');
      if (/\b(evaluation|evaluate)\b/.test(q)) return byId('evaluation');
      if (/\b(safe|safety|secure|crime|dangerous)\b/.test(q) && !/\b(accommodation|housing|hostel|rent)\b/.test(q))
        return { text: 'This site doesn\'t cover safety statistics, so I won\'t make claims about them. What we do is practical: **safe accommodation** near your campus through our housing partners, a **pre-departure briefing** on culture and immigration, and help in your **first week** with the medical screening, insurance, a bank account and a Touch \'n Go card. A counsellor (and our students\' families) can tell you more: ' + WA + '.', chips: ['What do students say?', 'Do you help after I land?'] };
      if (/\b(weather|climate|monsoon|rain\w*|hot|humid|temperature|season\w*|dry)\b/.test(q) && escapes().length) {
        var seen = {}, rows = escapes().filter(function (e) { var k = e.best.slice(0, 40); if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 6);
        return { text: 'This site covers the weather for the **semester-break trips**, where it matters most:\n' + rows.map(function (e) { return '- **' + e.name + '**: ' + e.best; }).join('\n') + '\n\n[See Semester breaks](#escapes)', chips: ['Where can I travel on breaks?', 'How do I get to Langkawi?'] };
      }
      if (LEVEL.test(q) && n <= 3 && !fld)
        return { text: 'Tell me the subject too, say *master\'s in computing* or *PhD in engineering*, and I\'ll show you who teaches it. Good to know: **postgraduates** can bring a spouse, children and parents on Dependant Passes, and a bachelor\'s or higher leads to the **12-month Graduate Pass**.', chips: ['Master\'s in computing', 'PhD in engineering', 'Bachelor\'s in business'] };

      // Everything else: the knowledge base
      var hit = kbSearch(q);
      if (hit.best && hit.s >= 3 && hit.cover >= .5) return pick(hit.best.id);
      return null;   // let the chat search the page's text before giving up
    });
  }

  window.TuteeBrain = { answer: answer, reset: reset, fallbackChips: FALLBACK_CHIPS };
})();
