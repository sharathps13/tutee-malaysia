/* What we do · three 3D options (three.js)
   A · Photo helix: nine photo panels on a spiral that turns with scroll and drag; panels wake on hover and fly forward on click.
   B · Glass monoliths: nine glass pillars on a gallery floor, each holding its service inside; hover lights one, click calls it forward.
   C · The services book: a real page-curling book, one spread per service; drag, click or jump to a chapter. */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const S = window.SVC, P = './assets/img/photos/', TAU = Math.PI * 2;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => (n < 10 ? '0' : '') + n;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
const glOK = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const fontsReady = document.fonts && document.fonts.load ? Promise.all(['400 60px Fraunces', 'italic 300 60px Fraunces', '700 30px Manrope', '400 30px Manrope', '800 30px Manrope'].map((f) => document.fonts.load(f))).catch(() => {}) : Promise.resolve();
const imgs = {};
const loadImg = (src) => imgs[src] || (imgs[src] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
const iconImg = (s, color = '#fff') => loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>`));
function cover(x, im, dx, dy, dw, dh) { if (!im) { x.fillStyle = '#3A0A18'; x.fillRect(dx, dy, dw, dh); return; } const r = Math.max(dw / im.naturalWidth, dh / im.naturalHeight), w = im.naturalWidth * r, h = im.naturalHeight * r; x.drawImage(im, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h); }
function wrap(x, text, max) { const out = []; let line = ''; text.split(' ').forEach((w) => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; }); if (line) out.push(line); return out; }
function rrect(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
function tex(c, renderer) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }

/* a renderer that draws only while its section is on screen */
function stage(root, { fov = 36, alpha = true } = {}) {
  const canvas = root.querySelector('[data-gl]');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const camera = new THREE.PerspectiveCamera(fov, 1, .1, 200), scene = new THREE.Scene();
  const fit = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); };
  fit(); new ResizeObserver(fit).observe(canvas);
  let visible = false, raf = 0, tick = null, last = performance.now();
  const loop = () => { raf = 0; if (!visible) return; const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; tick && tick(now / 1000, dt); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) { last = performance.now(); loop(); } }, { rootMargin: '100px' }).observe(canvas);
  const ptr = { x: 0, y: 0, nx: -9, ny: -9, inside: false };
  canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); ptr.nx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.ny = -((e.clientY - r.top) / r.height) * 2 + 1; });
  canvas.addEventListener('pointerenter', (e) => { ptr.inside = e.pointerType !== 'touch'; });
  canvas.addEventListener('pointerleave', () => { ptr.inside = false; ptr.nx = ptr.ny = -9; });
  return { canvas, renderer, camera, scene, ptr, onTick: (f) => { tick = f; } };
}
/* drag on the canvas: reports horizontal movement, momentum and taps */
function dragger(canvas, { onMove, onEnd, onTap, onStart }) {
  let d = null;
  canvas.addEventListener('pointerdown', (e) => { if (e.button > 0) return; d = { x: e.clientX, y: e.clientY, lx: e.clientX, t: performance.now(), v: 0, moved: false, axis: null }; onStart && onStart(e); });
  window.addEventListener('pointermove', (e) => {
    if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.axis && Math.hypot(dx, dy) > 7) d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (d.axis !== 'x') return;
    if (!d.moved) { d.moved = true; canvas.classList.add('grab'); }
    const now = performance.now(), step = e.clientX - d.lx; d.v = step / Math.max(8, now - d.t) * 1000; d.lx = e.clientX; d.t = now;
    onMove(step, dx, e);
  });
  const up = (e) => { if (!d) return; const was = d; d = null; canvas.classList.remove('grab'); if (was.moved) onEnd && onEnd(was.v, e.clientX - was.x); else if (was.axis !== 'y') onTap && onTap(e); };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  return () => !!(d && d.moved);
}
function chips(root, onPick) {
  const el = root.querySelector('[data-chips]');
  el.innerHTML = S.map((s, i) => `<button type="button" role="tab" aria-selected="false" data-i="${i}"><b>${pad(i + 1)}</b>${esc(s.title)}</button>`).join('');
  const bs = [...el.querySelectorAll('button')]; bs.forEach((b) => b.addEventListener('click', () => onPick(+b.dataset.i)));
  return (i) => bs.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
}
function card(root, { onPrev, onNext, onClose }) {
  const el = root.querySelector('[data-card]');
  return (i) => {
    if (i < 0) { el.classList.remove('on'); return; }
    const s = S[i];
    const fill = () => {
      el.style.setProperty('--c', s.color);
      el.innerHTML = `<button type="button" class="cd-x" aria-label="Close">✕</button><span class="cd-n">${pad(i + 1)}</span><small>${esc(s.sub)}</small><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><div class="cd-nav"><a class="btn btn--sun btn--sm" href="./index.html${s.href}">${esc(s.cta)} →</a><button type="button" class="rbtn" data-d="-1" aria-label="Previous service">←</button><button type="button" class="rbtn" data-d="1" aria-label="Next service">→</button></div>`;
      el.querySelector('.cd-x').addEventListener('click', onClose);
      el.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => (+b.dataset.d < 0 ? onPrev() : onNext())));
      el.classList.add('on');
      if (!reduce && window.gsap) window.gsap.fromTo([...el.children], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .04 });
    };
    if (el.classList.contains('on') && !reduce && window.gsap) window.gsap.to([...el.children], { y: -10, opacity: 0, duration: .2, stagger: .015, onComplete: fill }); else fill();
  };
}
function keys(root, prev, next, close) {
  root.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); } if (e.key === 'Escape') close && close(); });
}

/* ================= A · PHOTO HELIX ================= */
async function helix() {
  const root = document.querySelector('[data-hx]'); if (!root) return;
  const st = stage(root, { fov: 36 }), { camera, scene, renderer, canvas, ptr } = st;
  let sel = -1, hover = -1;
  const mark = chips(root, (i) => select(i));
  const show = card(root, { onPrev: () => select((sel - 1 + 9) % 9), onNext: () => select((sel + 1) % 9), onClose: () => select(-1) });
  keys(root, () => select(((sel < 0 ? 0 : sel) - 1 + 9) % 9), () => select(((sel < 0 ? -1 : sel) + 1) % 9), () => select(-1));
  await fontsReady;
  const R = 4.7, STEP = TAU / 6.2, DY = .95, W = 3.1, H = 2.02;
  const vert = `uniform float uHover, uActive, uTime, uR; varying vec2 vUv; varying float vEdge;
    void main(){ vUv = uv; vec3 p = position;
      p.z -= (p.x * p.x) / (2. * uR);
      p.z += (uHover * .35 + uActive * .2) * (1. - pow(abs(uv.x - .5) * 2., 2.)) * (1. - pow(abs(uv.y - .5) * 2., 2.));
      p.z += sin(uv.x * 9. + uTime * 3.) * .04 * uHover;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`;
  const frag = `uniform sampler2D tMap; uniform float uHover, uActive, uDim; uniform vec3 uColor; uniform vec2 uSize; varying vec2 vUv;
    float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
    void main(){
      vec2 uv = vUv; uv = (uv - .5) * (1. - uHover * .04) + .5;
      vec3 c = texture2D(tMap, uv).rgb;
      float g = dot(c, vec3(.3, .59, .11));
      c = mix(c, vec3(g) * vec3(1., .86, .8), uDim * .75);
      c *= 1. - uDim * .45;
      float d = rbox((vUv - .5) * uSize, uSize * .5, .14);
      if (d > 0.) discard;
      float edge = smoothstep(-.035, -.012, d);
      c = mix(c, mix(uColor, vec3(1., .85, .45), .5) * 1.3, edge * max(uHover, uActive) * .85);
      if (!gl_FrontFacing) c = c * .38 + vec3(.06, .01, .03);
      gl_FragColor = vec4(c, 1.);
    }`;
  const group = new THREE.Group(); scene.add(group);
  const panels = [];
  for (let i = 0; i < 9; i++) {
    const s = S[i], c = document.createElement('canvas'); c.width = 1024; c.height = 666; const x = c.getContext('2d');
    const [im, ic] = await Promise.all([loadImg(P + s.img + '.jpg'), iconImg(s)]);
    cover(x, im, 0, 0, 1024, 666);
    const g = x.createLinearGradient(0, 260, 0, 666); g.addColorStop(0, 'rgba(20,4,10,0)'); g.addColorStop(1, 'rgba(20,4,10,.92)'); x.fillStyle = g; x.fillRect(0, 0, 1024, 666);
    x.fillStyle = 'rgba(0,0,0,.35)'; rrect(x, 40, 36, 92, 44, 22); x.fill(); x.fillStyle = '#F3D88A'; x.font = '700 24px Manrope'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(pad(i + 1), 86, 59);
    x.fillStyle = s.color; rrect(x, 900, 30, 86, 86, 24); x.fill(); if (ic) x.drawImage(ic, 916, 46, 54, 54);
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillStyle = '#E9B949'; x.font = '800 24px Manrope'; x.fillText(s.sub.toUpperCase().slice(0, 52), 44, 560);
    x.fillStyle = '#fff'; x.font = '400 66px Fraunces'; x.fillText(s.title, 42, 628);
    const u = { tMap: { value: tex(c, renderer) }, uHover: { value: 0 }, uActive: { value: 0 }, uDim: { value: 0 }, uTime: { value: 0 }, uR: { value: R }, uColor: { value: new THREE.Color(s.color) }, uSize: { value: new THREE.Vector2(W, H) } };
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H, 40, 20), new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide }));
    const a = i * STEP, y = (4 - i) * DY;
    m.position.set(Math.sin(a) * R, y, Math.cos(a) * R); m.rotation.y = a; m.userData.i = i;
    group.add(m); panels.push({ m, u, a, y, h: 0, act: 0, dim: 0, out: 0 });
  }
  // a gold spine running through the spiral
  const pts = []; for (let k = 0; k <= 160; k++) { const t = k / 160 * 8.6 - .3, a = t * STEP; pts.push(new THREE.Vector3(Math.sin(a) * (R - .9), (4 - t) * DY, Math.cos(a) * (R - .9))); }
  group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, .025, 8), new THREE.MeshBasicMaterial({ color: 0xE9B949, transparent: true, opacity: .55 })));
  const dust = new THREE.BufferGeometry(), dp = new Float32Array(500 * 3); for (let k = 0; k < 500; k++) dp.set([(Math.random() - .5) * 26, (Math.random() - .5) * 14, (Math.random() - .5) * 18], k * 3);
  dust.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  scene.add(new THREE.Points(dust, new THREE.PointsMaterial({ color: 0xF3D88A, size: .04, transparent: true, opacity: .55, depthWrite: false })));

  // scroll turns the spiral; drag adds to it with momentum
  let scrollP = 0, dragA = 0, vel = 0, rotY = 0, posY = 0, selRot = 0, selY = 0;
  if (window.ScrollTrigger) window.ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { scrollP = s.progress; } });
  const ray = new THREE.Raycaster(), V2 = new THREE.Vector2();
  const pick = () => { if (ptr.nx < -5) return -1; V2.set(ptr.nx, ptr.ny); ray.setFromCamera(V2, camera); const h = ray.intersectObjects(panels.map((p) => p.m), false)[0]; return h ? h.object.userData.i : -1; };
  dragger(canvas, { onMove: (step) => { dragA += step * .006; vel = 0; }, onEnd: (v) => { vel = Math.max(-5, Math.min(5, v * .006)); }, onTap: (e) => { const r = canvas.getBoundingClientRect(); ptr.nx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.ny = -((e.clientY - r.top) / r.height) * 2 + 1; const i = pick(); select(i === sel ? -1 : i); } });
  function select(i) {
    if (i > -1 && !panels[i]) return;
    sel = i; mark(i); show(i); root.classList.toggle('picked', i > -1);
    if (i < 0) return;
    // turn the shortest way so this panel faces the camera
    const target = -panels[i].a, cur = rotY;
    let d = ((target - cur) % TAU + TAU) % TAU; if (d > Math.PI) d -= TAU;
    selRot = cur + d; selY = -panels[i].y;
  }
  onTickHelix();
  function onTickHelix() {
    st.onTick((t, dt) => {
      if (ptr.inside) hover = pick(); else hover = -1;
      canvas.classList.toggle('pt', hover > -1);
      const mob = camera.aspect < 1;
      if (Math.abs(vel) > .01) { dragA += vel * dt; vel *= Math.exp(-dt * 2.5); }
      const free = -(scrollP - .5) * Math.PI * 1.6 + dragA + (reduce ? 0 : t * .04);
      if (sel > -1) { // stay locked on the chosen panel; dragging releases it
        if (Math.abs(dragA) > .001 || Math.abs(vel) > .05) { selRot += dragA; dragA = 0; }
        rotY = damp(rotY, selRot, 4, dt); posY = damp(posY, selY, 4, dt);
      } else { rotY = damp(rotY, free, 3, dt); posY = damp(posY, (scrollP - .5) * DY * 4.2, 3, dt); }
      group.rotation.y = rotY; group.position.y = posY;
      group.position.x = damp(group.position.x, mob ? 0 : sel > -1 ? -2.2 : 1.6, 3, dt);
      camera.position.set(ptr.nx > -5 ? ptr.nx * .5 : 0, ptr.ny > -5 ? ptr.ny * .3 : 0, mob ? 24 : 17); camera.lookAt(group.position.x * .25, 0, 0);
      panels.forEach((p, k) => {
        p.h = damp(p.h, k === hover ? 1 : 0, 9, dt); p.act = damp(p.act, k === sel ? 1 : 0, 5, dt); p.dim = damp(p.dim, sel > -1 && k !== sel ? 1 : hover > -1 && k !== hover ? .4 : 0, 5, dt);
        p.u.uHover.value = p.h; p.u.uActive.value = p.act; p.u.uDim.value = p.dim; p.u.uTime.value = t;
        const out = p.act * 1.1 + p.h * .3, sc = 1 + p.act * .28;
        p.m.position.set(Math.sin(p.a) * (R + out), p.y, Math.cos(p.a) * (R + out)); p.m.scale.setScalar(sc);
      });
    });
  }
}

/* ================= B · GLASS MONOLITHS ================= */
async function monoliths() {
  const root = document.querySelector('[data-mo]'); if (!root) return;
  const st = stage(root, { fov: 38 }), { camera, scene, renderer, canvas, ptr } = st;
  let sel = -1, hover = -1;
  const mark = chips(root, (i) => select(i));
  const show = card(root, { onPrev: () => select((sel - 1 + 9) % 9), onNext: () => select((sel + 1) % 9), onClose: () => select(-1) });
  keys(root, () => select(((sel < 0 ? 0 : sel) - 1 + 9) % 9), () => select(((sel < 0 ? -1 : sel) + 1) % 9), () => select(-1));
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  scene.fog = new THREE.Fog(0x1A040B, 14, 34);
  await fontsReady;
  const top = new THREE.SpotLight(0xFFE2B8, 120, 40, .6, .6); top.position.set(0, 14, 2); scene.add(top, top.target);
  scene.add(new THREE.AmbientLight(0xffffff, .25));
  // floor: polished stone with a soft glow in front of every monolith
  const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x2A0812, roughness: .25, metalness: .6 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  // rounded glass slab
  const W = 1.6, H = 4.4, Dp = .55, r = .18, sh = new THREE.Shape();
  sh.moveTo(-W / 2 + r, 0); sh.lineTo(W / 2 - r, 0); sh.quadraticCurveTo(W / 2, 0, W / 2, r); sh.lineTo(W / 2, H - r); sh.quadraticCurveTo(W / 2, H, W / 2 - r, H); sh.lineTo(-W / 2 + r, H); sh.quadraticCurveTo(-W / 2, H, -W / 2, H - r); sh.lineTo(-W / 2, r); sh.quadraticCurveTo(-W / 2, 0, -W / 2 + r, 0);
  const slab = new THREE.ExtrudeGeometry(sh, { depth: Dp, bevelEnabled: true, bevelThickness: .08, bevelSize: .08, bevelSegments: 4, curveSegments: 10 }); slab.translate(0, 0, -Dp / 2);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .9, roughness: .08, ior: 1.45, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, attenuationColor: new THREE.Color(0xF6E3C8), attenuationDistance: 3 });
  const R = 14, SPAN = .19, items = [];
  for (let i = 0; i < 9; i++) {
    const s = S[i], c = document.createElement('canvas'); c.width = 480; c.height = 1320; const x = c.getContext('2d');
    const [im, ic] = await Promise.all([loadImg(P + s.img + '.jpg'), iconImg(s)]);
    x.fillStyle = '#1C0409'; x.fillRect(0, 0, 480, 1320);
    cover(x, im, 0, 0, 480, 820);
    const g = x.createLinearGradient(0, 520, 0, 830); g.addColorStop(0, 'rgba(28,4,9,0)'); g.addColorStop(1, 'rgba(28,4,9,1)'); x.fillStyle = g; x.fillRect(0, 500, 480, 340);
    x.fillStyle = s.color; x.fillRect(0, 820, 480, 6);
    x.fillStyle = s.color; rrect(x, 40, 870, 96, 96, 26); x.fill(); if (ic) x.drawImage(ic, 58, 888, 60, 60);
    x.fillStyle = '#E9B949'; x.font = '300 110px Fraunces'; x.textAlign = 'right'; x.fillText(pad(i + 1), 440, 960);
    x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = '400 62px Fraunces';
    wrap(x, s.title, 400).slice(0, 2).forEach((l, k) => x.fillText(l, 40, 1060 + k * 68));
    x.fillStyle = '#E9B949'; x.font = '800 22px Manrope'; wrap(x, s.sub.toUpperCase(), 400).slice(0, 2).forEach((l, k) => x.fillText(l, 40, 1215 + k * 30));
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(W - .25, H - .3), new THREE.MeshBasicMaterial({ map: tex(c, renderer), toneMapped: false, color: 0xffffff }));
    inner.position.set(0, H / 2, 0);
    const g0 = new THREE.Group(), body = new THREE.Mesh(slab, glass); body.userData.i = i; inner.userData.i = i;
    g0.add(inner, body);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(s.color), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, .01, .8);
    g0.add(pool);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, .12, 40), new THREE.MeshStandardMaterial({ color: 0xD9B25A, metalness: 1, roughness: .3 })); base.position.y = .06; base.scale.set(1, 1, .55); g0.add(base);
    scene.add(g0);
    items.push({ g: g0, inner, pool, body, ang: (i - 4) * SPAN, h: 0, act: 0, y: 0, spin: 0 });
  }
  let look = 0, lookV = 0, lookT = 0;
  const ray = new THREE.Raycaster(), V2 = new THREE.Vector2();
  const pick = () => { if (ptr.nx < -5) return -1; V2.set(ptr.nx, ptr.ny); ray.setFromCamera(V2, camera); const h = ray.intersectObjects(items.map((p) => p.body), false)[0]; return h ? h.object.userData.i : -1; };
  dragger(canvas, { onMove: (step) => { lookT -= step * .0012; lookV = 0; }, onEnd: (v) => { lookV = -v * .0012; }, onTap: (e) => { const r = canvas.getBoundingClientRect(); ptr.nx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.ny = -((e.clientY - r.top) / r.height) * 2 + 1; const i = pick(); select(i === sel ? -1 : i); } });
  function select(i) {
    if (i > -1 && !items[i]) return;
    const prev = sel; sel = i; mark(i); show(i); root.classList.toggle('picked', i > -1);
    if (i > -1 && i !== prev && window.gsap && !reduce) window.gsap.fromTo(items[i], { spin: 0 }, { spin: TAU, duration: 1.6, ease: 'expo.inOut' });
    if (i > -1) lookT = items[i].ang * (camera.aspect < 1 ? .95 : .5);
  }
  st.onTick((t, dt) => {
    if (ptr.inside) hover = pick(); else hover = -1;
    canvas.classList.toggle('pt', hover > -1);
    const mob = camera.aspect < 1;
    if (Math.abs(lookV) > .001) { lookT += lookV * dt; lookV *= Math.exp(-dt * 3); }
    lookT = Math.max(-.85, Math.min(.85, lookT));
    look = damp(look, lookT + (ptr.nx > -5 && sel < 0 ? ptr.nx * .06 : 0), 3, dt);
    const camZ = mob ? 1 : 3.2, RR = mob ? 15 : R;
    camera.position.set(0, (mob ? 2.8 : 3) + (ptr.ny > -5 ? ptr.ny * .15 : 0), camZ);
    camera.lookAt(Math.sin(look) * 10 + (sel > -1 && !mob ? 1.6 : 0), mob ? 2.1 : 1.7, camZ - Math.cos(look) * 10);
    items.forEach((it, k) => {
      it.h = damp(it.h, k === hover ? 1 : 0, 8, dt); it.act = damp(it.act, k === sel ? 1 : 0, 3.5, dt);
      // the chosen monolith steps forward; its neighbours part to either side and sink a little
      const part = sel > -1 && k !== sel ? Math.sign(k - sel) * .07 : 0;
      it.y = damp(it.y, (k === hover && k !== sel ? .35 : 0) + (sel > -1 && k !== sel ? -.25 : 0), 6, dt);
      const ang = it.ang + part * (1 - it.act), dist = RR - it.act * (mob ? 5 : 3.6);
      it.g.position.set(Math.sin(ang) * dist, it.y, camZ - Math.cos(ang) * dist);
      it.g.rotation.y = -ang + it.spin + (k === sel ? (ptr.nx > -5 ? ptr.nx * .25 : 0) : Math.sin(t * .4 + k) * .04);
      const lit = Math.max(it.h, it.act), dim = sel > -1 && k !== sel ? .45 : 1;
      it.inner.material.color.setScalar((.55 + lit * .45) * dim);
      it.pool.material.opacity = (.18 + lit * .55) * dim;
    });
  });
}

/* ================= C · THE SERVICES BOOK ================= */
async function book() {
  const root = document.querySelector('[data-bk]'); if (!root) return;
  const st = stage(root, { fov: 32 }), { camera, scene, renderer, canvas, ptr } = st;
  const cta = root.querySelector('[data-bk-cta]');
  const mark = chips(root, (i) => goTo(i + 1));
  const leaves = [];
  await fontsReady;
  const PW = 700, PH = 930, W = 3, H = W * PH / PW, L = 10;
  const paper = (x) => { x.fillStyle = '#F7F1E3'; x.fillRect(0, 0, PW, PH); const g = x.createLinearGradient(0, 0, PW, 0); g.addColorStop(0, 'rgba(120,90,40,.10)'); g.addColorStop(.08, 'rgba(120,90,40,0)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH); };
  const songket = (x, w, h, col, a) => { x.save(); x.globalAlpha = a; x.strokeStyle = col; x.lineWidth = 1.5; for (let yy = -40; yy < h + 40; yy += 60) for (let xx = -40; xx < w + 40; xx += 60) { x.beginPath(); x.moveTo(xx + 30, yy); x.lineTo(xx + 60, yy + 30); x.lineTo(xx + 30, yy + 60); x.lineTo(xx, yy + 30); x.closePath(); x.stroke(); } x.restore(); };
  async function textPage(i) {
    const s = S[i], c = document.createElement('canvas'); c.width = PW; c.height = PH; const x = c.getContext('2d'); paper(x);
    const ic = await iconImg(s, '#fff');
    x.fillStyle = '#7A5A2A'; x.font = '800 15px Manrope'; x.textAlign = 'left'; x.fillText('TUTEE CONNECT · WHAT WE DO', 70, 86); x.textAlign = 'right'; x.fillText('CHAPTER ' + pad(i + 1), PW - 70, 86); x.textAlign = 'left';
    x.strokeStyle = 'rgba(122,90,42,.35)'; x.beginPath(); x.moveTo(70, 104); x.lineTo(PW - 70, 104); x.stroke();
    x.fillStyle = s.color; x.beginPath(); x.arc(118, 190, 48, 0, TAU); x.fill(); if (ic) x.drawImage(ic, 88, 160, 60, 60);
    x.fillStyle = '#C8902E'; x.font = '300 120px Fraunces'; x.textAlign = 'right'; x.fillText(pad(i + 1), PW - 70, 236); x.textAlign = 'left';
    x.fillStyle = '#1B1430'; x.font = '400 58px Fraunces'; const tl = wrap(x, s.title, PW - 140); tl.forEach((l, k) => x.fillText(l, 70, 330 + k * 62));
    let y = 330 + tl.length * 62 + 4;
    x.fillStyle = s.color; x.font = '800 17px Manrope'; wrap(x, s.sub.toUpperCase(), PW - 140).forEach((l) => { x.fillText(l, 70, y); y += 26; });
    y += 22; x.fillStyle = '#3A3346'; x.font = '400 24px Manrope'; wrap(x, s.text, PW - 140).slice(0, 11).forEach((l) => { x.fillText(l, 70, y); y += 37; });
    x.fillStyle = '#7A5A2A'; x.font = 'italic 300 24px Fraunces'; x.fillText(s.cta + ' →', 70, PH - 80);
    x.font = '700 15px Manrope'; x.textAlign = 'right'; x.fillText(String(i * 2 + 3), PW - 70, PH - 80);
    return tex(c, renderer);
  }
  async function photoPage(i) {
    const s = S[i], c = document.createElement('canvas'); c.width = PW; c.height = PH; const x = c.getContext('2d'); paper(x);
    const im = await loadImg(P + s.img + '.jpg');
    x.save(); rrect(x, 46, 46, PW - 92, PH - 92, 10); x.clip(); cover(x, im, 46, 46, PW - 92, PH - 92);
    const g = x.createLinearGradient(0, PH * .45, 0, PH); g.addColorStop(0, 'rgba(15,5,10,0)'); g.addColorStop(1, 'rgba(15,5,10,.85)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH); x.restore();
    x.fillStyle = '#F3D88A'; x.font = '300 140px Fraunces'; x.fillText(pad(i + 1), 80, PH - 190);
    x.fillStyle = '#fff'; x.font = '400 46px Fraunces'; wrap(x, s.title, PW - 170).slice(0, 2).forEach((l, k) => x.fillText(l, 82, PH - 130 + k * 50));
    return tex(c, renderer);
  }
  function plain(draw) { const c = document.createElement('canvas'); c.width = PW; c.height = PH; draw(c.getContext('2d')); return tex(c, renderer); }
  const coverT = plain((x) => {
    const g = x.createLinearGradient(0, 0, PW, PH); g.addColorStop(0, '#22336F'); g.addColorStop(1, '#0E1740'); x.fillStyle = g; x.fillRect(0, 0, PW, PH);
    songket(x, PW, PH, '#D9B25A', .22);
    x.strokeStyle = '#D9B25A'; x.lineWidth = 3; x.strokeRect(40, 40, PW - 80, PH - 80); x.lineWidth = 1; x.strokeRect(52, 52, PW - 104, PH - 104);
    x.fillStyle = '#D9B25A'; x.textAlign = 'center'; x.font = '800 18px Manrope'; x.fillText('TUTEE CONNECT · MALAYSIA', PW / 2, 160);
    x.font = '400 92px Fraunces'; x.fillText('Nine', PW / 2, 400); x.font = 'italic 300 92px Fraunces'; x.fillText('services,', PW / 2, 490);
    x.font = '400 60px Fraunces'; x.fillText('one counsellor.', PW / 2, 580);
    x.font = '700 18px Manrope'; x.fillText('DRAG THE PAGE TO OPEN', PW / 2, PH - 140);
  });
  const endT = plain((x) => { paper(x); x.fillStyle = '#1B1430'; x.textAlign = 'center'; x.font = 'italic 300 54px Fraunces'; ['One counsellor,', 'from your first', 'question to your', 'first week in KL.'].forEach((l, k) => x.fillText(l, PW / 2, 330 + k * 66)); x.fillStyle = '#7A5A2A'; x.font = '700 20px Manrope'; x.fillText('+91 701-090-2329 · info@tuteeconnect.com', PW / 2, 720); });
  const fronts = [coverT], backs = [];
  for (let i = 0; i < 9; i++) { backs.push(await photoPage(i)); fronts.push(await textPage(i)); }
  backs.push(endT);

  const vert = `uniform float uFlip, uCurl, uZ, uW; varying vec2 vUv; varying vec3 vP; varying float vShade;
    void main(){ vUv = uv; vec3 p = position; float d = p.x; float u = d / uW;
      float bend = sin(uFlip * 3.14159) * uCurl;
      float a = uFlip * 3.14159 + bend * (u * u * .9 - .25 * u);
      vec3 q = vec3(cos(a) * d, p.y, sin(a) * d + uZ);
      vShade = sin(a);
      vec4 w = modelMatrix * vec4(q, 1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
  const frag = `uniform sampler2D tFront, tBack; varying vec2 vUv; varying vec3 vP; varying float vShade;
    void main(){
      vec3 n = normalize(cross(dFdx(vP), dFdy(vP)));
      vec3 c = gl_FrontFacing ? texture2D(tFront, vUv).rgb : texture2D(tBack, vec2(1. - vUv.x, vUv.y)).rgb;
      float l = .72 + .28 * abs(dot(n, normalize(vec3(-.3, .5, 1.))));
      float gutter = smoothstep(0., .1, vUv.x);
      c *= l * mix(.72, 1., gutter);
      c *= 1. - .12 * vShade;
      gl_FragColor = vec4(c, 1.);
    }`;
  const bookG = new THREE.Group(); scene.add(bookG);
  const geo = new THREE.PlaneGeometry(W, H, 48, 1); geo.translate(W / 2, 0, 0);
  for (let j = 0; j < L; j++) {
    const u = { tFront: { value: fronts[j] }, tBack: { value: backs[j] }, uFlip: { value: 0 }, uCurl: { value: .9 }, uZ: { value: 0 }, uW: { value: W } };
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide }));
    m.renderOrder = j; bookG.add(m); leaves.push({ m, u, f: 0, target: 0 });
  }
  // leather boards, spine and page edges
  const leather = new THREE.MeshStandardMaterial({ color: 0x18245E, roughness: .55, metalness: .15 }), goldM = new THREE.MeshStandardMaterial({ color: 0xD9B25A, roughness: .3, metalness: 1 });
  [-1, 1].forEach((sgn) => { const b = new THREE.Mesh(new THREE.BoxGeometry(W + .14, H + .22, .06), leather); b.position.set(sgn * (W / 2 + .03), 0, -.05); bookG.add(b); const e = new THREE.Mesh(new THREE.BoxGeometry(W, H, .045), new THREE.MeshStandardMaterial({ color: 0xEFE6D2, roughness: .9 })); e.position.set(sgn * W / 2, 0, -.005); bookG.add(e); });
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, H + .22, 20, 1, false, Math.PI, Math.PI), leather); spine.position.z = -.06; bookG.add(spine);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(.08, .6, .005), new THREE.MeshStandardMaterial({ color: 0xC8102E, roughness: .5 })); ribbon.position.set(.25, -H / 2 - .2, .03); bookG.add(ribbon);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2)); const dl = new THREE.DirectionalLight(0xFFF1D6, 1.6); dl.position.set(-3, 4, 6); scene.add(dl);
  const tableGlow = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false })); tableGlow.position.z = -.12; bookG.add(tableGlow);
  bookG.rotation.x = -.42;

  let spread = 0, peel = 0, peelSide = 0, dragLeaf = -1, dragF = 0;
  const setTargets = () => leaves.forEach((lf, j) => { lf.target = j < spread ? 1 : 0; });
  function goTo(n) {
    if (leaves.length < L) return;
    n = Math.max(0, Math.min(L, n)); if (n === spread) return;
    const dir = n > spread ? 1 : -1, from = spread; spread = n;
    // flip one leaf after another for a riffle when jumping several chapters
    const list = []; for (let j = Math.min(from, n); j < Math.max(from, n); j++) list.push(j); if (dir < 0) list.reverse();
    list.forEach((j, k) => setTimeout(() => { leaves[j].target = j < spread ? 1 : 0; }, reduce ? 0 : k * 90));
    status();
  }
  function status() {
    const i = spread - 1;
    mark(i >= 0 && i < 9 ? i : -1);
    if (i >= 0 && i < 9) { cta.href = './index.html' + S[i].href; cta.textContent = S[i].cta + ' →'; } else { cta.href = './index.html#begin'; cta.textContent = 'Book a consultation →'; }
  }
  // a hit plane over the open book tells left page from right page
  const hit = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H), new THREE.MeshBasicMaterial({ visible: false })); bookG.add(hit);
  const ray = new THREE.Raycaster(), V2 = new THREE.Vector2();
  const side = () => { if (ptr.nx < -5) return 0; V2.set(ptr.nx, ptr.ny); ray.setFromCamera(V2, camera); const h = ray.intersectObject(hit, false)[0]; if (!h) return 0; const lp = bookG.worldToLocal(h.point.clone()); return lp.x > 0 ? 1 : -1; };
  let pxW = 1;
  dragger(canvas, {
    onStart: () => { const sd = side(); dragLeaf = sd > 0 && spread < L ? spread : sd < 0 && spread > 0 ? spread - 1 : -1; dragF = dragLeaf > -1 ? leaves[dragLeaf].f : 0; pxW = canvas.getBoundingClientRect().width * .32; },
    onMove: (step, dx) => { if (dragLeaf < 0) return; const lf = leaves[dragLeaf]; lf.target = Math.max(0, Math.min(1, dragF - dx / pxW / 1.6)); lf.f = lf.target; },
    onEnd: (v, dx) => { if (dragLeaf < 0) return; const lf = leaves[dragLeaf]; const done = lf.f > .5 || v < -400; const back = lf.f < .5 || v > 400;
      if (dragLeaf === spread && done) { spread++; } else if (dragLeaf === spread - 1 && back) { spread--; }
      setTargets(); status(); dragLeaf = -1; },
    onTap: (e) => { const r = canvas.getBoundingClientRect(); ptr.nx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.ny = -((e.clientY - r.top) / r.height) * 2 + 1; const sd = side(); if (sd > 0) goTo(spread + 1); else if (sd < 0) goTo(spread - 1); },
  });
  keys(root, () => goTo(spread - 1), () => goTo(spread + 1));
  if (window.ScrollTrigger) window.ScrollTrigger.create({ trigger: root, start: 'top 45%', once: true, onEnter: () => { if (spread === 0) setTimeout(() => goTo(1), 300); } });
  status();
  st.onTick((t, dt) => {
    const mob = camera.aspect < 1;
    const sd = ptr.inside && dragLeaf < 0 ? side() : 0;
    canvas.classList.toggle('pt', sd !== 0);
    peel = damp(peel, sd !== 0 ? 1 : 0, 6, dt); if (sd) peelSide = sd;
    const halfOpen = spread === 0 ? .5 : spread === L ? -.5 : 0; // centre the closed book
    bookG.position.x = damp(bookG.position.x, -halfOpen * W * (mob ? 1 : .9) + (mob ? 0 : 1.5), 3, dt);
    bookG.rotation.y = damp(bookG.rotation.y, ptr.nx > -5 ? ptr.nx * .12 : 0, 3, dt);
    bookG.rotation.x = damp(bookG.rotation.x, -.42 + (ptr.ny > -5 ? ptr.ny * .06 : 0), 3, dt);
    const fit = mob ? (W * 2.3) / camera.aspect : H * 1.75;
    camera.position.set(0, -.2, Math.max(9, fit / (2 * Math.tan(THREE.MathUtils.degToRad(16)))));
    camera.lookAt(0, mob ? .2 : .55, 0);
    leaves.forEach((lf, j) => {
      if (j !== dragLeaf) {
        let tgt = lf.target;
        if (!reduce && peel > .01) { if (peelSide > 0 && j === spread && spread < L) tgt += .07 * peel; if (peelSide < 0 && j === spread - 1) tgt -= .07 * peel; }
        lf.f = damp(lf.f, tgt, reduce ? 50 : 4.2, dt);
      }
      lf.u.uFlip.value = lf.f;
      lf.u.uCurl.value = j === dragLeaf ? .7 : 1.1;
      // keep the stacks thick and in order on both sides
      lf.u.uZ.value = THREE.MathUtils.lerp((L - j) * .004, j * .004, lf.f) + .02;
      lf.m.renderOrder = lf.f > .5 ? j : L * 2 - j;
    });
  });
}

if (glOK) { helix(); monoliths(); book(); }
const links = [...document.querySelectorAll('.sl-jump a')];
if (window.ScrollTrigger) links.forEach((a) => window.ScrollTrigger.create({ trigger: document.querySelector(a.getAttribute('href')), start: 'top 50%', end: 'bottom 50%', onToggle: (s) => { if (s.isActive) links.forEach((x) => x.classList.toggle('on', x === a)); } }));
