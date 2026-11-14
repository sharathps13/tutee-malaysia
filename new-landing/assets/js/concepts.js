/* Concept lab: Destinations (window seat, expanding panels), Student Pass (your file, boarding gate),
   Universities (shared card + leaderboard with a 3D card). The two WebGL university scenes live in concepts-3d.js. */
(function () {
  'use strict';
  var D = window.CX, P = './assets/img/photos/';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gsap.registerPlugin(ScrollTrigger, Flip, CustomEase, MotionPathPlugin, DrawSVGPlugin);
  CustomEase.create('silk', 'M0,0 C0.16,1 0.3,1 1,1');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var stateQ = function (p) { return './universities.html?state=' + encodeURIComponent(p.states[0]); };

  /* nav: highlight the concept in view */
  var links = $$('.cx-jump a');
  links.forEach(function (a) {
    var s = $(a.getAttribute('href'));
    ScrollTrigger.create({ trigger: s, start: 'top 50%', end: 'bottom 50%', onToggle: function (st) { if (st.isActive) { links.forEach(function (x) { x.classList.toggle('on', x === a); }); } } });
  });

  /* split a heading into letters for the reveal */
  function letters(el, text) {
    el.innerHTML = text.split(' ').map(function (w) { return '<span style="display:inline-block;white-space:nowrap">' + w.split('').map(function (c) { return '<span class="ch">' + esc(c) + '</span>'; }).join('') + '</span>'; }).join(' ');
    return $$('.ch', el);
  }

  /* =================== D1 · WINDOW SEAT =================== */
  (function () {
    var root = $('[data-ws]'); if (!root) return;
    var canvas = $('[data-ws-gl]', root), pane = $('[data-ws-pane]', root), fb = $('[data-ws-fb]', root), list = $('[data-ws-list]', root);
    var places = D.places, cur = 0, busy = false, queued = -1;
    var srcs = places.map(function (p) { return P + p.img + '.jpg'; });
    fb.innerHTML = srcs.map(function (s, i) { return '<img src="' + s + '" alt=""' + (i ? ' loading="lazy"' : '') + (i === 0 ? ' class="on"' : '') + '>'; }).join('');
    list.innerHTML = places.map(function (p, i) { return '<li><button type="button" data-i="' + i + '"' + (i === 0 ? ' aria-current="true"' : '') + '><small>' + pad(i + 1) + '</small><i>' + p.code + '</i><span>' + esc(p.name) + '</span><em>' + p.count + '</em></button></li>'; }).join('');
    var btns = $$('button', list);
    var nameEl = $('[data-ws-name]', root);

    function fill(i, animate) {
      var p = places[i];
      $('[data-ws-tag]', root).textContent = p.tag;
      $('[data-ws-text]', root).textContent = p.text;
      $('[data-ws-count]', root).textContent = p.count;
      $('[data-ws-code]', root).textContent = p.code;
      $('[data-ws-chips]', root).innerHTML = p.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('');
      $('[data-ws-cta]', root).href = stateQ(p);
      $('[data-ws-hud]', root).textContent = 'Now over ' + p.name;
      var ch = letters(nameEl, p.name);
      if (animate && !reduce) {
        gsap.from(ch, { yPercent: 80, opacity: 0, rotationX: -70, transformOrigin: '50% 100%', duration: .9, ease: 'silk', stagger: .022 });
        gsap.from($$('[data-ws-tag], [data-ws-text], .ws-stats, [data-ws-chips], [data-ws-cta]', root), { y: 18, opacity: 0, duration: .8, ease: 'silk', stagger: .06, delay: .15 });
      }
      btns.forEach(function (b, k) { b.removeAttribute('aria-current'); if (k === i) { void b.offsetWidth; b.setAttribute('aria-current', 'true'); } });
      tint(i);
    }
    /* the cabin glow takes the colour of the view outside */
    var glowCache = {};
    function tint(i) {
      var set = function (c) { $('[data-ws-glow]', root).style.setProperty('--glow', c); };
      if (glowCache[i]) return set(glowCache[i]);
      var im = new Image(); im.onload = function () {
        try { var c = document.createElement('canvas'); c.width = c.height = 6; var x = c.getContext('2d'); x.drawImage(im, 0, 0, 6, 6); var d = x.getImageData(0, 0, 6, 6).data, r = 0, g = 0, b = 0; for (var k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; } var n = d.length / 4; glowCache[i] = 'rgba(' + Math.round(r / n) + ',' + Math.round(g / n) + ',' + Math.round(b / n) + ',.55)'; set(glowCache[i]); } catch (e) {}
      }; im.src = srcs[i];
    }

    /* WebGL: slow drift through the window, clouds racing past during a change of region */
    var gl = null, prog, uni = {}, tex = [], sizes = [], state = { p: 0, a: 0, b: 0 }, t0 = performance.now(), visible = false, raf = 0;
    try { gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch (e) {}
    var VS = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
    var FS = [
      'precision highp float;',
      'uniform sampler2D tA, tB; uniform vec2 uRes, uSa, uSb; uniform float uP, uT; varying vec2 v;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }',
      'float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 6; i++) { s += a * n(p); p = p * 2.02 + vec2(1.7, 9.2); a *= .5; } return s; }',
      'vec2 cover(vec2 uv, vec2 im){ float rs = uRes.x / uRes.y, ri = im.x / im.y; vec2 s = rs < ri ? vec2(rs / ri, 1.) : vec2(1., ri / rs); return (uv - .5) * s + .5; }',
      'void main(){',
      '  vec2 uv = vec2(v.x, 1. - v.y);',
      '  float d = sin(uP * 3.14159);',
      '  vec2 drift = vec2(sin(uT * .045) * .018, cos(uT * .037) * .014);',
      '  float zA = .9 - .03 * sin(uT * .06) - d * .1 - uP * .08;',
      '  float zB = .9 - .03 * sin(uT * .06) + (1. - uP) * .12;',
      '  vec3 A = texture2D(tA, cover((uv - .5) * zA + .5 + drift, uSa)).rgb;',
      '  vec3 B = texture2D(tB, cover((uv - .5) * zB + .5 + drift, uSb)).rgb;',
      '  float nn = fbm(uv * 3.2 + vec2(0., uT * .2));',
      '  float k = smoothstep(.38, .62, uP + (nn - .5) * .55);',
      '  vec3 col = mix(A, B, k);',
      '  float speed = .05 + d * .9;',
      '  float c1 = fbm(uv * vec2(1.6, 2.4) + vec2(uT * .015, uT * speed));',
      '  float c2 = fbm(uv * vec2(3.4, 5.) + vec2(-uT * .02, uT * speed * 1.6) + 4.);',
      '  float wisp = smoothstep(.55, .95, c1) * .16 + smoothstep(.6, .95, c2) * .08;',
      '  float dense = smoothstep(.62 - d * .55, 1.05 - d * .3, c1 * .7 + c2 * .45) * d * 1.15;',
      '  float cl = clamp(wisp + dense, 0., 1.);',
      '  vec3 cc = mix(vec3(.78, .84, .93), vec3(1., .99, .97), smoothstep(.3, .9, c2 + (1. - uv.y) * .3));',
      '  col = mix(col, cc, cl);',
      '  col = mix(col, vec3(.74, .82, .93), .05 + d * .08);',
      '  col *= 1. - .38 * pow(length((uv - .5) * vec2(1.1, .9)) * 1.25, 2.6);',
      '  gl_FragColor = vec4(col, 1.);',
      '}'].join('\n');
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    function loadTex(i) {
      if (tex[i]) return Promise.resolve();
      return new Promise(function (res) {
        var im = new Image(); im.onload = function () {
          var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
          tex[i] = t; sizes[i] = [im.naturalWidth, im.naturalHeight]; res();
        }; im.onerror = res; im.src = srcs[i];
      });
    }
    function size() { var r = pane.getBoundingClientRect(), dp = Math.min(devicePixelRatio || 1, 2); canvas.width = Math.round(r.width * dp); canvas.height = Math.round(r.height * dp); if (gl) gl.viewport(0, 0, canvas.width, canvas.height); }
    function draw() {
      raf = 0; if (!gl || !tex[state.a]) return;
      var b = tex[state.b] ? state.b : state.a;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[state.a]);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex[b]);
      gl.uniform2f(uni.uRes, canvas.width, canvas.height); gl.uniform2fv(uni.uSa, sizes[state.a]); gl.uniform2fv(uni.uSb, sizes[b]);
      gl.uniform1f(uni.uP, state.p); gl.uniform1f(uni.uT, reduce ? 0 : (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (visible && !reduce) raf = requestAnimationFrame(draw);
    }
    if (gl) {
      try {
        prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
        var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        ['tA', 'tB', 'uRes', 'uSa', 'uSb', 'uP', 'uT'].forEach(function (k) { uni[k] = gl.getUniformLocation(prog, k); });
        gl.uniform1i(uni.tA, 0); gl.uniform1i(uni.tB, 1);
        size(); new ResizeObserver(function () { size(); if (!raf) draw(); }).observe(pane);
        loadTex(0).then(function () { root.classList.add('gl-on'); draw(); places.forEach(function (_, i) { if (i) loadTex(i); }); });
      } catch (e) { gl = null; }
    }
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && !raf) draw(); }, { rootMargin: '100px' }).observe(root);

    function go(i) {
      if (i === cur) return;
      if (busy) { queued = i; return; }
      busy = true;
      var done = function () { busy = false; if (queued > -1) { var q = queued; queued = -1; go(q); } };
      if (gl) {
        loadTex(i).then(function () {
          state.b = i; state.p = 0;
          gsap.to(state, { p: 1, duration: reduce ? .01 : 2.6, ease: 'power2.inOut', onUpdate: function () { if (!raf) draw(); }, onComplete: function () { state.a = i; state.p = 0; done(); } });
          gsap.delayedCall(reduce ? 0 : 1.05, function () { fill(i, true); });
        });
      } else {
        $$('img', fb).forEach(function (im, k) { im.classList.toggle('on', k === i); });
        fill(i, true); gsap.delayedCall(1.2, done);
      }
      cur = i;
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.i); }); });
    /* autoplay: the progress line under the current row drives the next change */
    list.addEventListener('animationend', function (e) { if (e.target.getAttribute('aria-current') === 'true') go((cur + 1) % places.length); });
    root.addEventListener('mouseenter', function () { root.classList.add('paused'); });
    root.addEventListener('mouseleave', function () { root.classList.remove('paused'); });
    root.style.setProperty('--dur', reduce ? '9999s' : '8s');
    fill(0, false);
    /* opening the window shade when the section arrives */
    var shade = $('[data-ws-shade]', root);
    if (!reduce) {
      shade.style.transform = 'translateY(0)';
      root.classList.add('paused');
      ScrollTrigger.create({ trigger: root, start: 'top 55%', once: true, onEnter: function () {
        gsap.to(shade, { yPercent: -104, duration: 2.2, ease: 'power3.inOut', delay: .2, onComplete: function () { root.classList.remove('paused'); } });
        gsap.from($$('.ws-info .kick, .ws-h, .ws-now, .ws-list li', root), { y: 40, opacity: 0, duration: 1.1, ease: 'silk', stagger: .07 });
      } });
    }
  })();

  /* =================== D3 · EXPANDING PANELS =================== */
  (function () {
    var root = $('[data-xp]'); if (!root) return;
    var row = $('[data-xp-row]', root), places = D.places, open = null, cur = 0;
    row.innerHTML = places.map(function (p, i) {
      return '<button type="button" class="xp-p" data-i="' + i + '" aria-label="Open ' + esc(p.name) + '"><img src="' + P + p.img + '.jpg" alt="" loading="lazy"><span class="xp-n">' + pad(i + 1) + ' · ' + p.code + '</span><span class="xp-cnt">' + p.count + ' campuses</span><span class="xp-v">' + esc(p.name) + '</span><span class="xp-c"><small>' + esc(p.tag) + '</small><b>' + esc(p.name) + '</b><span>' + esc(p.text) + '</span></span></button>';
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
      return '<div class="xo-body"><small>' + pad(i + 1) + ' · ' + esc(p.tag) + '</small><h3>' + esc(p.name) + '</h3><p>' + esc(p.text) + '</p><div class="xo-stat"><b>' + p.count + '</b><span>EMGS-registered<br>institutions</span></div><div class="xo-chips">' + p.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div><div class="xo-acts"><a class="btn btn--sun btn--sm" href="' + stateQ(p) + '">See these campuses →</a><a class="btn btn--glass btn--sm" href="./index.html#begin">Plan a visit</a></div></div>';
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
      if (reduce || mobile) { o.remove(); target.focus({ preventScroll: true }); return; }
      gsap.to($$('.xo-body, .xo-nav, .xo-thumbs, .xo-close', o), { opacity: 0, duration: .3 });
      gsap.to(o, { clipPath: rectInset(target), duration: 1, ease: 'expo.inOut', delay: .1, onComplete: function () { o.remove(); target.focus({ preventScroll: true }); } });
    }
  })();

  /* =================== S1 · YOUR FILE, PAGE BY PAGE =================== */
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

  (function () {
    var root = $('[data-fl]'); if (!root) return;
    var desk = $('[data-fl-desk]', root), steps = D.steps, n = steps.length, cur = -1, stamped = {};
    var docs = steps.map(function (s, k) { var d = document.createElement('div'); d.className = 'doc'; d.setAttribute('role', 'button'); d.tabIndex = 0; d.setAttribute('aria-label', 'Page ' + (k + 1) + ': ' + s.tag); d.innerHTML = docHTML(k); desk.appendChild(d); d.addEventListener('click', function () { go(k); }); d.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(k); } }); return d; });
    var mob = function () { return matchMedia('(max-width: 600px)').matches; };
    function pose(k, a) {
      var m = mob() ? .62 : 1;
      if (k === a) return { x: -10 * m, y: 40 * m, z: 120, rotationZ: 5, rotationX: -24, zIndex: 50 };
      if (k < a) { var j = a - 1 - k; return { x: -215 * m - j * 5, y: (20 - j * 6) * m, z: 2 + (n - j) * 1.4, rotationZ: -15 + j * 3.2, rotationX: 0, zIndex: 20 - j }; }
      var q = k - a - 1; return { x: 205 * m + q * 6, y: (-14 + q * 5) * m, z: 2 + (n - q) * 1.4, rotationZ: 10 - q * 2.6, rotationX: 0, zIndex: 20 - q };
    }
    var mark = stageNav(root, n, function (i, rel) { go(rel ? (cur + i + n) % n : i); }, 'fl');
    function go(i) {
      if (i === cur) return; var prev = cur; cur = i;
      docs.forEach(function (d, k) {
        var p = pose(k, i); d.classList.toggle('on', k === i); d.style.zIndex = p.zIndex;
        gsap.to(d, { x: p.x, y: p.y, z: p.z, rotationZ: p.rotationZ, rotationX: p.rotationX, duration: reduce ? 0 : (k === i ? 1.25 : 1), ease: k === i ? 'expo.out' : 'power3.inOut', delay: k === i && prev > -1 ? .12 : 0, overwrite: true });
      });
      mark(i); stageText(root, 'fl', steps[i], i, 'Page');
      if (!stamped[i]) {
        stamped[i] = true;
        var d = docs[i], st = $('.stamp', d), sg = $('.d-sig path', d);
        var tl = gsap.timeline({ delay: reduce ? 0 : 1 });
        if (sg) tl.fromTo(sg, { drawSVG: '0%' }, { drawSVG: '100%', duration: reduce ? 0 : .9, ease: 'power1.inOut' });
        tl.fromTo(st, { scale: 2.6, opacity: 0, rotation: -24 }, { scale: 1, opacity: .88, rotation: -11 + (Math.random() * 6 - 3), duration: reduce ? 0 : .34, ease: 'power4.in' });
        if (!reduce) tl.to(d, { z: '-=16', duration: .07, yoyo: true, repeat: 1, ease: 'power2.out' });
        tl.add(function () { st.classList.add('done'); });
      }
    }
    docs.forEach(function (d, k) { gsap.set(d, pose(k, -1 + 0)); });
    gsap.set(docs, { transformPerspective: 0 });
    ScrollTrigger.create({ trigger: root, start: 'top 60%', once: true, onEnter: function () {
      if (!reduce) gsap.from(docs, { y: '-=420', z: 600, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .06 });
      gsap.delayedCall(reduce ? 0 : .8, function () { go(0); });
    } });
    stageText(root, 'fl', steps[0], 0, 'Page'); mark(0);
  })();

  /* =================== S3 · BOARDING GATE =================== */
  (function () {
    var root = $('[data-bp]'); if (!root) return;
    var svg = $('svg', root), path = $('[data-bp-prog]', root), plane = $('[data-bp-plane]', root), steps = D.steps, n = steps.length, cur = -1, at = 0;
    var NAMES = ['Check-in', 'Ticketed', 'Security', 'Boarding', 'Landed', 'Connection', 'Destination'];
    var grid = $('[data-bp-grid]', root), gh = '';
    for (var x = 0; x <= 1200; x += 60) gh += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="380"/>';
    for (var y = 20; y <= 380; y += 60) gh += '<line x1="0" y1="' + y + '" x2="1200" y2="' + y + '"/>';
    grid.innerHTML = gh;
    var L = path.getTotalLength(), kul = 0, best = 1e9;
    for (var s = 0; s <= 400; s++) { var pt = path.getPointAtLength(L * s / 400), dd = Math.hypot(pt.x - 820, pt.y - 250); if (dd < best) { best = dd; kul = s / 400; } }
    var F = [0, kul * .27, kul * .52, kul * .76, kul, kul + (1 - kul) * .5, 1];
    var nodes = $('[data-bp-nodes]', root);
    nodes.innerHTML = F.map(function (f, i) {
      var p = path.getPointAtLength(L * f), up = i % 2 === 0 && i !== 0 && i !== 4 ? 1 : (i === 1 || i === 3 || i === 5 ? -1 : 1);
      var ty = i === 0 || i === 4 ? -24 : up > 0 ? 30 : -22;
      return '<g class="bp-node" data-i="' + i + '" transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')" role="button" tabindex="0" aria-label="Checkpoint ' + (i + 1) + ': ' + NAMES[i] + '"><circle class="h" r="22"/><circle class="o" r="8"/><text class="n" y="' + (ty - 13) + '">' + pad(i + 1) + '</text><text y="' + ty + '">' + NAMES[i] + '</text></g>';
    }).join('');
    var nodeEls = $$('.bp-node', nodes);
    nodeEls.forEach(function (g) { var go_ = function () { go(+g.dataset.i); }; g.addEventListener('click', go_); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go_(); } }); });
    gsap.set(path, { drawSVG: '0% 0%' });
    gsap.set(plane, { motionPath: { path: path, align: path, alignOrigin: [.5, .5], autoRotate: true, start: 0, end: 0 } });
    var ph = $('[data-bp-ph]', root);
    ph.innerHTML = steps.map(function (s, k) { return '<img src="' + P + s.img + '.jpg" alt="" ' + (k ? 'loading="lazy" ' : '') + 'style="opacity:' + (k ? 0 : 1) + '">'; }).join('');
    var phs = $$('img', ph);
    function flap(el, text) {
      var old = $$('span', el), len = Math.max(old.length, text.length), t = text.padEnd(len, ' ');
      if (old.length !== len) { el.innerHTML = Array.from({ length: len }, function (_, k) { return '<span>' + (old[k] ? old[k].textContent : ' ') + '</span>'; }).join(''); old = $$('span', el); }
      old.forEach(function (sp, k) {
        var ch = t[k] === ' ' ? ' ' : t[k]; if (sp.textContent === ch) return;
        if (reduce) { sp.textContent = ch; return; }
        gsap.timeline({ delay: k * .045 }).to(sp, { rotationX: 90, duration: .11, ease: 'power1.in' }).add(function () { sp.textContent = ch; }).fromTo(sp, { rotationX: -90 }, { rotationX: 0, duration: .16, ease: 'power2.out' });
      });
    }
    var mark = stageNav(root, n, function (i, rel) { go(rel ? Math.min(n - 1, Math.max(0, cur + i)) : i); }, 'bp');
    function go(i) {
      if (i === cur) return; cur = i;
      var f = F[i];
      gsap.to(plane, { motionPath: { path: path, align: path, alignOrigin: [.5, .5], autoRotate: true, start: at, end: f }, duration: reduce ? 0 : Math.max(.8, Math.abs(f - at) * 4.5), ease: 'power2.inOut', overwrite: true });
      gsap.to(path, { drawSVG: '0% ' + (f * 100) + '%', duration: reduce ? 0 : Math.max(.8, Math.abs(f - at) * 4.5), ease: 'power2.inOut' });
      at = f;
      var rt = $('[data-bp-route]', root); if (rt.scrollWidth > rt.clientWidth + 4) { var pt = path.getPointAtLength(L * f), sc = rt.scrollWidth / 1200; rt.scrollTo({ left: Math.max(0, pt.x * sc - rt.clientWidth / 2), behavior: reduce ? 'auto' : 'smooth' }); }
      nodeEls.forEach(function (g, k) { g.classList.toggle('on', k === i); g.classList.toggle('done', k < i); });
      phs.forEach(function (im, k) { gsap.to(im, { opacity: k === i ? 1 : 0, scale: k === i ? 1 : 1.08, duration: reduce ? 0 : 1, ease: 'power2.out' }); });
      flap($('[data-bp-gate]', root), pad(i + 1));
      flap($('[data-bp-now]', root), NAMES[i].toUpperCase());
      $('[data-bp-num]', root).textContent = pad(i + 1) + ' / ' + pad(n);
      mark(i); stageText(root, 'bp', steps[i], i, 'Checkpoint');
    }
    flap($('[data-bp-gate]', root), '01'); flap($('[data-bp-now]', root), 'CHECK-IN');
    stageText(root, 'bp', steps[0], 0, 'Checkpoint'); mark(0);
    ScrollTrigger.create({ trigger: svg, start: 'top 75%', once: true, onEnter: function () {
      if (!reduce) { gsap.from($('.bp-base', root), { opacity: 0, duration: 1.4 }); gsap.from(nodeEls, { scale: 0, transformOrigin: '50% 50%', opacity: 0, duration: .6, ease: 'back.out(2)', stagger: .08, delay: .5 }); gsap.from($('[data-bp-pass]', root), { y: 80, rotationX: 18, transformPerspective: 1400, opacity: 0, duration: 1.3, ease: 'silk' }); }
      go(0);
    } });
  })();

  /* =================== UNIVERSITIES · shared bits =================== */
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
      '<div class="uc-acts"><a class="btn btn--sun btn--sm" href="./index.html#begin">Ask about this</a><a class="btn btn--glass btn--sm" href="./universities.html?q=' + encodeURIComponent(short(u)) + '">All 391 →</a></div>';
  }
  function setCard(el, i) {
    if (!el) return; var u = D.unis[i];
    if (reduce || !el.innerHTML) { el.innerHTML = cardHTML(u); return; }
    gsap.to(el.children, { y: -10, opacity: 0, duration: .22, stagger: .02, onComplete: function () { el.innerHTML = cardHTML(u); gsap.from(el.children, { y: 16, opacity: 0, duration: .6, ease: 'silk', stagger: .045 }); } });
  }
  function chips(el, onPick) {
    el.innerHTML = D.unis.map(function (u, i) { return '<button type="button" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '"><b>' + pad(u.rank) + '</b>' + esc(short(u)) + '</button>'; }).join('');
    var bs = $$('button', el); bs.forEach(function (b) { b.addEventListener('click', function () { onPick(+b.dataset.i); }); });
    return function (i) { bs.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); }); };
  }
  window.CXU = { short: short, setCard: setCard, chips: chips, maxA: maxA, reduce: reduce };

  /* =================== U3 · LEADERBOARD + 3D CARD =================== */
  (function () {
    var root = $('[data-lb3]'); if (!root) return;
    var list = $('[data-l3-list]', root), card = $('[data-l3-card]', root), scene = $('[data-l3-scene]', root), cur = 0, flipped = false;
    list.innerHTML = D.unis.map(function (u, i) { return '<li><button type="button" role="tab" aria-selected="' + (i === 0) + '" data-i="' + i + '"><span class="n">' + pad(u.rank) + '</span><span class="nm"><b>' + esc(u.name) + '</b><small>' + esc(u.location) + '</small></span><span class="br" style="--p:' + Math.round(u.accredited / maxA * 100) + '%"><i></i>' + u.accredited + '</span></button></li>'; }).join('');
    var rows = $$('button', list);
    var ph = $('[data-l3-ph]', root);
    function fillFront(i) {
      var u = D.unis[i];
      ph.innerHTML = '<img src="' + P + 'u-' + (i + 1) + '.jpg" alt="' + esc(u.alt || '') + '">';
      $('[data-l3-rank]', root).textContent = u.rank; $('[data-l3-type]', root).textContent = TYPE[u.type] || u.type;
      $('[data-l3-name]', root).textContent = u.name; $('[data-l3-loc]', root).textContent = u.location;
      $('[data-l3-back]', root).innerHTML = '<p class="fl-k">No. ' + u.rank + ' · QS 2027 in Malaysia</p><h3>' + esc(u.name) + '</h3>' +
        '<div class="bk-row"><span>Type</span><b>' + (TYPE[u.type] || u.type) + '</b></div><div class="bk-row"><span>Location</span><b>' + esc(u.location) + '</b></div><div class="bk-row"><span>MQA-accredited programmes</span><b>' + u.accredited + '</b></div>' +
        '<p class="fl-k" style="margin-top:6px">Largest fields</p><div class="uc-f">' + fields(u).map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>' +
        '<div class="bk-acts"><a class="btn btn--sun btn--sm" href="./index.html#begin">Ask about this</a><button type="button" class="btn btn--glass btn--sm" data-l3-unflip>↻ Flip back</button></div>';
      $('[data-l3-unflip]', root).addEventListener('click', toggle);
    }
    var base = function () { return flipped ? 180 : 0; };
    function toggle() { flipped = !flipped; gsap.to(card, { rotationY: base(), rotationX: 0, duration: reduce ? 0 : 1.1, ease: 'expo.out' }); }
    $('[data-l3-flip]', root).addEventListener('click', toggle);
    function pick(i) {
      if (i === cur) return; cur = i;
      rows.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); });
      if (reduce) { fillFront(i); return; }
      gsap.timeline().to(card, { rotationY: base() + 90, duration: .35, ease: 'power2.in' }).add(function () { fillFront(i); gsap.set(card, { rotationY: base() - 90 }); }).to(card, { rotationY: base(), duration: .9, ease: 'expo.out' });
    }
    rows.forEach(function (b) { b.addEventListener('click', function () { pick(+b.dataset.i); }); });
    scene.addEventListener('pointermove', function (e) {
      if (reduce || e.pointerType === 'touch') return;
      var r = scene.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      gsap.to(card, { rotationY: base() + (px - .5) * (flipped ? -22 : 22), rotationX: -(py - .5) * 16, duration: .7, ease: 'power3.out', overwrite: 'auto' });
      card.style.setProperty('--gx', (px * 100) + '%'); card.style.setProperty('--gy', (py * 100) + '%'); card.style.setProperty('--go', '1');
      $('[data-l3-glare]', root).style.setProperty('--gx', (px * 100) + '%'); $('[data-l3-glare]', root).style.setProperty('--gy', (py * 100) + '%'); $('[data-l3-glare]', root).style.setProperty('--go', '1');
    });
    scene.addEventListener('pointerleave', function () { gsap.to(card, { rotationY: base(), rotationX: 0, duration: 1.2, ease: 'elastic.out(1, .6)' }); $('[data-l3-glare]', root).style.setProperty('--go', '0'); });
    fillFront(0);
    if (!reduce) {
      gsap.from(rows, { x: -40, opacity: 0, duration: .9, ease: 'silk', stagger: .04, scrollTrigger: { trigger: list, start: 'top 80%', once: true } });
      gsap.from(card, { rotationY: -70, rotationX: 10, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: scene, start: 'top 75%', once: true } });
    }
  })();
})();
