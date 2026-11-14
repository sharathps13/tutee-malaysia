/* ---------- Why Malaysia: the coil ----------
   Rebuilt from the "Our work" section on sybiosme.com, using its own geometry and timings. The cards sit on an
   elliptical helix: card i is placed at e = progress - i, swung sin(e*turn) across, cos(e*turn) in depth and e*pitch up,
   and turned to follow the curve. Scrolling draws the coil past the camera, so the cards climb in from below, sweep
   across the front and lift away round the back, fading into the background haze as they go and dimming when seen
   edge on. Speed swells the coil, leans and twists the cards and blurs each one along its own travel; each card is
   a sheet of film on springs, its corners trailing its middle. The last card is a plain sheet: it stops at the front,
   flattens, and the lens closes on it until it fills the screen, which is where the next section takes over. */
import * as THREE from '../vendor/three.module.min.js';

const root = document.querySelector('[data-wm]');
if (root) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = root.querySelector('.wm-stage'), cv = root.querySelector('.wm-gl');
  const P = './assets/img/photos/';
  const CARDS = [
    { stat: '391', h: 'EMGS institutions', p: 'Research universities, private universities, branch campuses and colleges, all registered for international students.', img: 'wm-campus' },
    { stat: 'RM 14k', h: 'Public tuition, per year, from', p: 'Private universities cost more but stay well below UK, US or Australian fees.', img: 'wm-putrajaya' },
    { phrase: ['Food from three', 'great cuisines'], p: 'Malay, Chinese and Indian kitchens on every street.', img: 'wm-nasilemak' },
    { stat: '12', unit: 'months', h: 'Graduate Pass', p: 'Stay on after your degree, with part-time work in approved sectors.', img: 'wm-skyline' },
    { stat: 'UK·AU', h: 'Branch campuses', p: 'Monash, Nottingham, Southampton, Heriot-Watt, Curtin, Swinburne: the same degree as at home.', img: 'wm-petronas' },
    { phrase: ['Festivals', 'every month'], p: 'The calendar is full all year round.', img: 'wm-lanterns' },
    { stat: '3', unit: 'cultures', h: 'One campus', p: 'Tamil is widely spoken and South Indian food is everywhere.', img: 'wm-batucaves' },
    { stat: '~4', unit: 'hours', h: 'From Chennai', p: 'A trip home is easy, and lectures and exams all run in English.', img: 'wm-klia' }
  ];
  const N = CARDS.length + 1; /* the last one is the plain sheet */

  let ok = false; try { const t = document.createElement('canvas'); ok = !!t.getContext('webgl2'); } catch (e) {}
  if (!ok) { root.classList.add('wm-nogl'); return; }

  /* ---- the original's constants ---- */
  const G = { width: 2.38, height: 1.5771, corner: .04 }, ASPECT = G.width / G.height;
  const CAM = { fov: 65.7, z: 8.1 }, QE = .28, TILT = .042, WOB = .042, EE = .5;
  const S = { print: .33, printTall: .69, standUp: 1.05, spread: 1, round: 1, turn: .73, rise: .42, gap: .06, ribbon: 1.5, bleed: .5, profile: .1, fade: 1, wash: 1, blur: 5,
    cardStep: .5, coilIn: 2.6, coilOut: 1.2, sheen: .66, sharpness: 40, fresnel: .5, shutter: .4, centreHz: 9.5, edgeHz: 3.6, centreZeta: .7, edgeZeta: .75, give: .16, lean: .2, twist: .13, settle: 13, tension: 1.25 };
  const SPIN = { reference: 5, attack: 7, release: 2.2, radius: .11 };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, v) => { const n = clamp((v - a) / Math.max(b - a, 1e-4), 0, 1); return n * n * (3 - 2 * n); };
  const ease = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
  const easeAngle = (a, b, k, dt) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * (1 - Math.exp(-k * dt));
  const heading = (L, r, d) => Math.atan2(d * Math.sin(L), Math.max(1e-4, r) * Math.cos(L));
  const curvR = (L, r, d) => { const c = Math.cos(L), s = Math.sin(L); return Math.pow(r * r * c * c + d * d * s * s, 1.5) / Math.max(1e-4, r * d); };
  const HAZE = [10 / 255, 26 / 255, 92 / 255];
  /* the plain sheet is a shade lighter than the section, so it reads as a sheet; the next section starts on this colour */
  const WELL = [17 / 255, 38 / 255, 111 / 255];

  /* the coil's shape for this frame shape: front card a share of the width, swinging half a frame beyond the edges */
  let geo = null;
  function shape(aspect) {
    const share = lerp(S.printTall, S.print, sstep(S.standUp - .55, S.standUp, aspect)), o = Math.tan(CAM.fov * Math.PI / 360);
    const half = (z) => Math.max(1, CAM.z + QE - z) * o;
    let l = 2, d = 1, f = .9, x = 2;
    for (let k = 0; k < 24; k++) { d = half(l); f = share * 2 * d / G.width; x = Math.max(.05, d * (1 + S.bleed) - G.width / 2 * f) * S.spread; l = lerp(l, S.round * x, .55); }
    const near = CAM.z - (l - QE), far = Math.max(near + .4, CAM.z + QE + G.width / 2 * f * .2);
    /* the rise per card: at least the original's minimum, more when two neighbours would otherwise overlap */
    const cardW = G.width * f, cardH = G.height * f, sep = Math.sin(S.turn) * x;
    /* when neighbours share any width, stack them a full card apart plus the gap (with room for the near one's perspective) */
    const pitch = Math.max(S.rise * cardH, sep < cardW * (1 + S.gap) ? cardH * (1 + S.gap) * 1.1 : 0);
    geo = { share, radius: x, depth: l, size: f, near, far, pitch, cardW, cardH };
  }

  /* ---- card faces ---- */
  const TW = 1200, TH = Math.round(1200 / ASPECT);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  function face(card, i, img) {
    const c = document.createElement('canvas'); c.width = TW; c.height = TH; const g = c.getContext('2d');
    const s = Math.max(TW / img.naturalWidth, TH / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.drawImage(img, (TW - w) / 2, (TH - h) / 2, w, h);
    const sh = g.createLinearGradient(0, TH * .3, 0, TH); sh.addColorStop(0, 'rgba(7,11,34,0)'); sh.addColorStop(1, 'rgba(7,11,34,.92)'); g.fillStyle = sh; g.fillRect(0, 0, TW, TH);
    const tp = g.createLinearGradient(0, 0, 0, 150); tp.addColorStop(0, 'rgba(7,11,34,.5)'); tp.addColorStop(1, 'rgba(7,11,34,0)'); g.fillStyle = tp; g.fillRect(0, 0, TW, 150);
    g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
    g.font = '700 25px "IBM Plex Mono", monospace'; g.fillText(pad(i + 1) + ' / ' + pad(N - 1), 54, 74);
    g.font = '700 25px "IBM Plex Mono", monospace'; g.textAlign = 'right'; g.fillText('WHY MALAYSIA', TW - 54, 74); g.textAlign = 'left';
    const wrap = (txt, x, y, maxW, lh) => { const words = txt.split(' '); let line = '', lines = []; words.forEach((wd) => { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > maxW && line) { lines.push(line); line = wd; } else line = t; }); lines.push(line); lines.slice(0, 2).forEach((ln, k) => g.fillText(ln, x, y + k * lh)); return lines.length; };
    if (card.phrase) {
      g.font = 'italic 400 96px Fraunces, serif'; g.fillText(card.phrase[0], 52, TH - 230); g.fillText(card.phrase[1], 52, TH - 130);
      g.globalAlpha = .82; g.font = '500 32px Manrope, sans-serif'; wrap(card.p, 56, TH - 62, TW - 112, 40); g.globalAlpha = 1;
    } else {
      g.font = '800 196px "Bricolage Grotesque", sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '-9px';
      g.fillText(card.stat, 46, TH - 200); const sw = g.measureText(card.stat).width; if ('letterSpacing' in g) g.letterSpacing = '0px';
      if (card.unit) { g.font = '700 32px "IBM Plex Mono", monospace'; g.fillText(card.unit.toUpperCase(), 46 + sw + 22, TH - 206); }
      g.font = '700 48px "Bricolage Grotesque", sans-serif'; g.fillText(card.h, 52, TH - 128);
      g.globalAlpha = .82; g.font = '500 31px Manrope, sans-serif'; wrap(card.p, 54, TH - 68, TW - 108, 40); g.globalAlpha = 1;
    }
    return tex(c);
  }
  /* the plain sheet: a dashed ring and two lines, drawn over the sheet's own colour in the shader */
  function sheet() {
    const c = document.createElement('canvas'); c.width = TW; c.height = TH; const g = c.getContext('2d');
    const m = TW * .02, r = G.corner * TH - m; g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2.5; g.setLineDash([TW * .012, TW * .009]);
    g.beginPath(); g.roundRect(m, m, TW - 2 * m, TH - 2 * m, Math.max(4, r)); g.stroke(); g.setLineDash([]);
    g.strokeStyle = '#FFCC00'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    const cx = TW / 2, cy = TH * .36; g.beginPath(); g.moveTo(cx - 70, cy); g.lineTo(cx, cy - 34); g.lineTo(cx + 70, cy); g.lineTo(cx, cy + 34); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(cx - 40, cy + 16); g.lineTo(cx - 40, cy + 52); g.quadraticCurveTo(cx, cy + 78, cx + 40, cy + 52); g.lineTo(cx + 40, cy + 16); g.stroke();
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '500 64px "Bricolage Grotesque", sans-serif'; if ('letterSpacing' in g) g.letterSpacing = '-3px';
    g.fillText('Your place in Malaysia', cx, TH * .64); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText('starts with a free evaluation', cx, TH * .64 + 80);
    return tex(c);
  }
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.setClearColor(0, 0);
  function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }

  /* ---- shaders: the original's sheet, bend, wave, springs, blur, sheen, rim, haze ---- */
  const VS = `
    uniform float uCurve; uniform float uTime; uniform float uMotion; uniform vec3 uLagC; uniform vec3 uLagE;
    out vec2 vUv; out vec3 vNormal; out vec3 vWorld;
    const vec2 HALF = vec2(${(G.width / 2).toFixed(4)}, ${(G.height / 2).toFixed(4)});
    const float ASPECT = ${ASPECT.toFixed(5)};
    void main() {
      vec3 p = vec3(HALF.x * (2.0 * uv.x - 1.0), HALF.y * (2.0 * uv.y - 1.0), 0.0);
      float bend = max(uCurve, 0.001); float ang = (p.x / HALF.x) * bend; float rad = HALF.x / bend;
      p.x = sin(ang) * rad; p.z += (cos(ang) - 1.0) * rad;
      p.z += sin((uv.y * 4.0) + (uTime * 0.72)) * 0.006 * uMotion;
      vec4 w = modelMatrix * vec4(p, 1.0);
      vec2 c = (uv - 0.5) * vec2(ASPECT, 1.0);
      float slack = clamp(length(c) / (0.5 * length(vec2(ASPECT, 1.0))), 0.0, 1.0);
      w.xyz += mix(uLagC, uLagE, slack);
      vWorld = w.xyz; vUv = uv;
      vNormal = normalize(mat3(modelMatrix) * vec3(sin(ang), 0.0, cos(ang)));
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;
  const FS = `
    uniform sampler2D map; uniform float uOpacity; uniform vec2 uBlur; uniform vec4 uMist; uniform vec3 uHaze; uniform vec4 uLight;
    uniform float uMatte; uniform vec3 uWell; uniform float uInk; uniform float uDefocus;
    in vec2 vUv; in vec3 vNormal; in vec3 vWorld; out highp vec4 outColor;
    const float ASPECT = ${ASPECT.toFixed(5)}; const float CORNER = ${G.corner.toFixed(3)};
    const vec3 LIGHT = vec3(-0.42, 0.55, 0.72);
    float rounded(vec2 uv, float r, float a) { vec2 hs = vec2(0.5 * a, 0.5); vec2 q = abs((uv - 0.5) * vec2(a, 1.0)) - (hs - r); return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r; }
    void main() {
      if (!gl_FrontFacing) discard;
      float deep = smoothstep(uMist.x, uMist.y, cameraPosition.z - vWorld.z);
      float veil = clamp(pow(deep, max(uMist.z, 0.05)), 0.0, 1.0);
      float cover = 1.0 - smoothstep(-0.004, 0.006, rounded(vUv, CORNER, ASPECT));
      if (cover * uOpacity < 0.008) discard;
      float bias = uDefocus * veil;
      vec4 col = vec4(0.0); vec2 tap = uBlur / 5.0;
      for (int i = 0; i < 5; i++) { vec2 at = clamp(vUv + tap * (float(i) - 2.0), vec2(0.0), vec2(1.0)); col += texture(map, at, bias); }
      vec4 tx = col / 5.0;
      if (uMatte > 0.5) { tx = vec4(mix(uWell, tx.rgb, tx.a * uInk), 1.0); }
      vec3 n = normalize(vNormal), v = normalize(cameraPosition - vWorld), hw = normalize(normalize(LIGHT) + v);
      float spec = pow(max(dot(n, hw), 0.0), max(uLight.y, 1.0)) * uLight.x * (1.0 - uMatte);
      float rim = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 4.0) * uLight.z * (1.0 - uMatte);
      float a = tx.a * cover * uOpacity * (1.0 - veil);
      if (a < 0.008) discard;
      vec3 lit = mix(tx.rgb + spec + rim, uHaze, veil * uMist.w);
      outColor = vec4(lit * a, a);
    }`;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(45, 1, .1, 40); cam.position.set(0, 0, CAM.z);
  const plane = new THREE.PlaneGeometry(1, 1, 48, 24); /* the shader lays the sheet out itself from its uv */
  const cards = [];
  for (let i = 0; i < N; i++) {
    const last = i === N - 1;
    const mat = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      uniforms: { map: { value: null }, uOpacity: { value: 0 }, uBlur: { value: new THREE.Vector2() }, uMist: { value: new THREE.Vector4(6, 10, S.fade, S.wash) }, uHaze: { value: new THREE.Vector3(...HAZE) },
        uLight: { value: new THREE.Vector4(S.sheen, S.sharpness, S.fresnel, 0) }, uMatte: { value: last ? 1 : 0 }, uWell: { value: new THREE.Vector3(...WELL) }, uInk: { value: 1 }, uDefocus: { value: S.blur },
        uCurve: { value: .3 }, uTime: { value: 0 }, uMotion: { value: 1 }, uLagC: { value: new THREE.Vector3() }, uLagE: { value: new THREE.Vector3() } } });
    const m = new THREE.Mesh(plane, mat); m.frustumCulled = false; m.rotation.order = 'XYZ'; scene.add(m);
    cards.push({ m, i, last, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sc: 1, op: 0, rel: 0, prev: new THREE.Vector3(), prevQ: new THREE.Quaternion(), springs: [spring(S.centreHz, S.centreZeta), spring(S.edgeHz, S.edgeZeta)], born: false });
  }
  function spring(hz, zeta) { return { hz, zeta, o: new THREE.Vector3(), v: new THREE.Vector3() }; }
  /* the original's damped spring, stepped exactly */
  function stepSpring(sp, dt, give) {
    const w = 6.2831853 * sp.hz, z = sp.zeta, wd = w * Math.sqrt(Math.max(1 - z * z, 1e-4)), dec = Math.exp(-z * w * dt), co = Math.cos(wd * dt), si = Math.sin(wd * dt);
    ['x', 'y', 'z'].forEach((k) => { const a = sp.o[k], b = (sp.v[k] + z * w * a) / wd; sp.o[k] = dec * (a * co + b * si); sp.v[k] = dec * (-z * w * (a * co + b * si) + wd * (b * co - a * si)); });
    const r = sp.o.length(); if (r > give) sp.o.multiplyScalar(give / r);
  }

  /* ---- textures once the photos and fonts are in ---- */
  const load = (src) => new Promise((res) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const fonts = document.fonts ? Promise.all(['800 100px "Bricolage Grotesque"', '700 48px "Bricolage Grotesque"', '500 64px "Bricolage Grotesque"', '700 25px "IBM Plex Mono"', 'italic 400 96px Fraunces', '500 32px Manrope'].map((f) => document.fonts.load(f).catch(() => {}))) : Promise.resolve();
  Promise.all([fonts].concat(CARDS.map((c) => load(P + c.img + '.jpg')))).then(async (res) => {
    // perf: draw every card's texture, upload them to the GPU one per idle slot, and only then swap them in,
    // so the coil never pays for eight uploads inside a single frame
    const tex = [];
    for (let i = 1; i < res.length; i++) { if (window.TCPerf) await window.TCPerf.idle(); tex.push(res[i] ? face(CARDS[i - 1], i - 1, res[i]) : null); }
    if (window.TCPerf) await window.TCPerf.idle();
    const last = sheet();
    if (window.TCPerf) await window.TCPerf.upload(renderer, tex.concat([last]));
    tex.forEach((t, i) => { if (t) cards[i].m.material.uniforms.map.value = t; });
    cards[N - 1].m.material.uniforms.map.value = last;
    root.classList.add('wm-ready'); fresh = true;
  });

  /* ---- layout ---- */
  let vw = 1, vh = 1, span = 1, prSet = false;
  /* the plain sheet: settles flat at the front, holds there to be read, then the lens closes on it */
  const HOLD = 1.6, ZOOM = 1.2, REST = 1.6;
  /* once the sheet covers the frame, the end panel takes over on it (no empty screen) */
  const endEl = root.querySelector('.wm-end'); let endShown = -1;
  function showEnd(v) {
    if (!endEl || Math.abs(v - endShown) < .002) return; endShown = v;
    stage.style.setProperty('--wm-end', v.toFixed(3));
    endEl.classList.toggle('on', v > .01); endEl.classList.toggle('live', v > .6);
  }
  const FROM = -S.coilIn, TO = (N - 1) + HOLD + ZOOM + REST,
    STEP = matchMedia('(max-width: 560px)').matches ? .27 : matchMedia('(max-width: 760px)').matches ? .36 : S.cardStep;   // a phone gets a shorter scroll through the coil
  function layout() {
    vw = stage.clientWidth || 1; vh = stage.clientHeight || 1;
    if (!prSet) { prSet = true; renderer.setPixelRatio(window.TCPerf ? window.TCPerf.dpr(1.5) : Math.min(window.devicePixelRatio || 1, 1.5)); }
    renderer.setSize(vw, vh, false);
    const aspect = vw / vh; shape(aspect);
    cam.aspect = aspect; cam.fov = 2 * Math.atan(Math.tan(CAM.fov * Math.PI / 360) / aspect) * 180 / Math.PI; cam.updateProjectionMatrix();
    /* the pinned length: half a screen per card, plus the way in and the way out */
    span = (TO - FROM) * STEP; root.style.setProperty('--wm-span', ((span + 1) * 100).toFixed(1) + 'vh');
    cards.forEach((c) => c.m.material.uniforms.uMist.value.set(geo.near, geo.far, S.fade, S.wash));
    fresh = true;
  }

  /* ---- each frame: progress from the scroll, then the original's per-card pass ---- */
  let progress = FROM - 1, spin = 0, last = 0, t0 = performance.now(), inView = false, raf = 0, fresh = true, lens = 1;
  const motion = reduce ? 0 : 1;
  const tmpQ = new THREE.Quaternion(), tmpV = new THREE.Vector3(), mat3 = new THREE.Matrix4(), inv = new THREE.Quaternion();
  function frame(now) {
    raf = inView ? requestAnimationFrame(frame) : 0;
    if (!geo) return;
    const dt = last ? clamp((now - last) / 1000, 1 / 240, .064) : 1 / 60; last = now;
    const time = (now - t0) / 1000;
    const r = root.getBoundingClientRect(), m = -r.top / vh, target = Math.min(FROM + m / STEP, TO);
    const vel = fresh ? 0 : (target - progress) / dt; progress = target;
    /* speed: how hard the coil swells, leans and twists */
    const sv = clamp(vel / SPIN.reference, -1, 1) * motion, k = Math.abs(sv) > Math.abs(spin) ? SPIN.attack : SPIN.release;
    spin = ease(spin, sv, k, dt);
    const ten = S.tension * motion, E = geo.radius * (1 + Math.abs(spin) * ten * SPIN.radius);
    const lean = spin * S.lean * ten, twist = spin * S.twist * ten;
    const u = reduce || fresh ? 1 : 1 - Math.exp(-S.settle * dt);
    /* the plain sheet: holds at the front, flattens, and the lens closes on it until it covers the frame */
    const sheetRel = progress - (N - 1);
    const flat = sstep(-EE, .15, sheetRel);
    /* enough to cover the frame both ways: the sheet is the share of the width, and 1/ASPECT of that tall */
    const zoomTo = Math.max(1 / geo.share, ASPECT * vh / (geo.share * vw)) * 1.06;
    const closing = sstep(HOLD, HOLD + ZOOM, sheetRel);
    lens = 1 + (zoomTo - 1) * closing;
    cam.zoom = lens; cam.updateProjectionMatrix();
    showEnd(sstep(HOLD + ZOOM * .55, HOLD + ZOOM + .7, sheetRel));
    cards.forEach((c) => {
      const rel = progress - c.i; let h = rel;
      if (c.last && rel > -EE) { const q = clamp((rel + EE) / EE, 0, 1); h = rel > 0 ? 0 : -EE * (1 - q) * (1 - q) * (1 + q); }
      const D = c.last ? flat : 0;
      const L = h * S.turn, I = heading(L, E, geo.depth), cosI = Math.cos(I);
      const wob = Math.sin(time * .48 + c.i * 1.37) * WOB * motion * (1 - D);
      const ne = c.last ? Math.min(rel, 0) : rel;
      const tx = lerp(Math.sin(L) * E, 0, D), ty = (c.last ? h : ne) * geo.pitch + wob, tz = lerp(Math.cos(L) * geo.depth - QE, geo.depth - QE, D);
      const trx = ne * -.01 + wob * .05, try_ = I * (1 - D) - twist, trz = Math.sin(ne * .68) * TILT * (1 - D) + lean;
      const op = c.last ? 1 : sstep(0, S.profile, cosI);
      c.x = lerp(c.x, tx, u); c.y = lerp(c.y, ty, u); c.z = lerp(c.z, tz, u); c.rx = lerp(c.rx, trx, u);
      c.ry = u >= 1 ? try_ : easeAngle(c.ry, try_, Math.max(1, S.settle), dt); c.rz = lerp(c.rz, trz, u);
      c.sc = lerp(c.sc, geo.size, u); c.op = lerp(c.op, op, u); c.rel = rel;
      const mm = c.m, un = mm.material.uniforms;
      mm.position.set(c.x, c.y, c.z); mm.rotation.set(c.rx, c.ry, c.rz); mm.scale.setScalar(c.sc);
      un.uCurve.value = clamp(G.width / 2 * c.sc * S.ribbon / curvR(L, geo.radius, geo.depth), .001, .42) * (1 - D);
      un.uOpacity.value = c.op; un.uTime.value = time; un.uMotion.value = motion * (1 - D);
      /* travel since the last frame, in the card's own frame: blur along it, and let the film trail behind it */
      mm.updateMatrixWorld();
      tmpV.copy(mm.position).sub(c.prev); const moved = tmpV.clone();
      mm.getWorldQuaternion(tmpQ); inv.copy(tmpQ).invert(); tmpV.applyQuaternion(inv).divideScalar(Math.max(1e-4, c.sc));
      un.uBlur.value.set(fresh ? 0 : tmpV.x / G.width * S.shutter * motion * (1 - D), fresh ? 0 : tmpV.y / G.height * S.shutter * motion * (1 - D));
      const give = S.give * G.height * c.sc;
      c.springs.forEach((sp, k) => {
        if (fresh || !motion || c.last) { sp.o.set(0, 0, 0); sp.v.set(0, 0, 0); }
        else { sp.o.sub(moved); stepSpring(sp, dt, give); }
        (k ? un.uLagE : un.uLagC).value.copy(sp.o);
      });
      c.prev.copy(mm.position);
      un.uInk.value = c.last ? 1 - sstep(.1, .45, closing) : 1;
    });
    /* far to near, so nearer sheets lie over the farther ones */
    cards.slice().sort((a, b) => a.z - b.z).forEach((c, k) => { c.m.renderOrder = k; });
    gov(); renderer.render(scene, cam);
    fresh = false;
  }
  const gov = window.TCPerf ? window.TCPerf.governor(renderer, () => renderer.setSize(vw, vh, false), 1.5) : () => {};
  const wake = () => { if (!raf && inView) { last = 0; raf = requestAnimationFrame(frame); } };

  layout();
  new ResizeObserver(() => { layout(); wake(); }).observe(stage);
  new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) { fresh = true; wake(); } }, { rootMargin: '300px 0px' }).observe(root);
}
