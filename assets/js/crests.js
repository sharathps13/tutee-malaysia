/* v13.6 Universities: twelve gold crests orbiting the one in focus.
   Drag the ring to browse (it keeps its momentum), hover a crest to lift it, tap to bring it forward,
   drag or tap the big crest to turn it over and read the back. Built with three.js. */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const D = window.CX, U = window.CXU;
const root = document.querySelector('[data-cr]');
if (D && U && root) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const ease = (a, b, k) => a + (b - a) * k;
  const TAU = Math.PI * 2;
  const canvas = root.querySelector('[data-cr-gl]'), card = root.querySelector('[data-ucard]'), tip = root.querySelector('[data-cr-tip]');
  let cur = 0;
  const mark = U.chips(root.querySelector('[data-uchips]'), (i) => select(i));
  U.setCard(card, 0);
  let gl = false; try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
  if (!gl) { canvas.style.display = 'none'; return; }

  /* renderer that only draws while the section is on screen */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(window.TCPerf ? window.TCPerf.dpr(1.5) : Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 200);
  const fit = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); };
  fit(); new ResizeObserver(fit).observe(canvas);
  // perf: steps pixel density down if frames run slow; the first draw waits for shaders and textures to be ready
  const gov = window.TCPerf ? window.TCPerf.governor(renderer, fit, 1.5) : () => {};
  let warmP = null;
  let visible = false, raf = 0; const clock = new THREE.Clock();
  const loop = () => { raf = 0; if (!visible) return; tick(clock.getElapsedTime()); raf = requestAnimationFrame(loop); };
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) (warmP || Promise.resolve()).then(() => { if (visible && !raf) loop(); }); }, { rootMargin: '120px' }).observe(canvas);

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xFFF1D6, 2.2); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9FE2BF, 1.6); rim.position.set(-6, 2, -4); scene.add(rim);

  /* ---- crest artwork, drawn on canvas ---- */
  const ENAMEL = { 'Research University': '#0E5A43', 'Private University': '#132A6E', 'Public University': '#7A1230' };
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
  const star = (x, y, r1, r2) => { x.beginPath(); for (let k = 0; k < 28; k++) { const a = -Math.PI / 2 + k * Math.PI / 14, r = k % 2 ? r2 : r1; x.lineTo(Math.cos(a) * r + y.x, Math.sin(a) * r + y.y); } x.closePath(); x.fill(); };
  function base(x, C, u) {
    const g = x.createRadialGradient(-160, -200, 40, 0, 0, C); g.addColorStop(0, '#FBE7A6'); g.addColorStop(.5, '#D9B25A'); g.addColorStop(1, '#8F6A22');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, C, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(80,55,10,.55)'; x.lineWidth = 4; [496, 452, 360].forEach((r) => { x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke(); });
    const e = x.createRadialGradient(-80, -120, 20, 0, 0, 352), col = ENAMEL[u.type] || '#0E5A43';
    e.addColorStop(0, shade(col, 1.45)); e.addColorStop(1, shade(col, .7)); x.fillStyle = e; x.beginPath(); x.arc(0, 0, 350, 0, TAU); x.fill();
  }
  function ring(x, text) {
    const txt = text.split(''); x.fillStyle = '#4A3408'; x.font = '700 34px Manrope, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const step = TAU / txt.length; txt.forEach((ch, k) => { x.save(); x.rotate(-Math.PI / 2 + k * step); x.translate(0, -404); x.fillText(ch, 0, 0); x.restore(); });
  }
  function canvasTex(draw, srgb = true, flipY = true) {
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); x.translate(S / 2, S / 2); draw(x, S / 2);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.flipY = flipY; return t;
  }
  function face(u, metal) {
    return canvasTex((x, C) => {
      if (metal) { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, C, 0, TAU); x.fill(); x.fillStyle = '#000'; x.beginPath(); x.arc(0, 0, 352, 0, TAU); x.fill(); x.fillStyle = '#fff'; }
      else { base(x, C, u); ring(x, 'QS WORLD UNIVERSITY RANKINGS 2027  ·  MALAYSIA  ·  NO. ' + pad(u.rank) + '  ·  '); x.fillStyle = '#F3D88A'; }
      star(x, { x: 0, y: -215 }, 44, 18);
      const s = U.short(u); let fs = 230; x.font = `600 ${fs}px Fraunces, serif`; while (x.measureText(s).width > 560 && fs > 90) { fs -= 8; x.font = `600 ${fs}px Fraunces, serif`; }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 0, 10);
      x.font = '800 54px Manrope, sans-serif'; x.fillText('#' + u.rank, 0, 205);
    }, !metal);
  }
  function wrap(x, text, max) { const w = text.split(' '), out = []; let line = ''; w.forEach((t) => { const n = line ? line + ' ' + t : t; if (x.measureText(n).width > max && line) { out.push(line); line = t; } else line = n; }); if (line) out.push(line); return out; }
  function back(u) {
    return canvasTex((x, C) => {
      x.scale(-1, 1); // the back cap is mapped mirror-wise
      base(x, C, u); ring(x, U.short(u).toUpperCase() + '  ·  ' + u.location.toUpperCase() + '  ·  ');
      x.fillStyle = '#F3D88A'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const name = u.name.replace(/\s*\(.*\)/, '');
      let fs = 64, lines; do { x.font = `500 ${fs}px Fraunces, serif`; lines = wrap(x, name, 520); fs -= 4; } while (lines.length > 3 && fs > 40);
      const lh = fs * 1.12; lines.forEach((l, k) => x.fillText(l, 0, -150 + k * lh - (lines.length - 1) * lh / 2));
      x.fillRect(-90, -40, 180, 3);
      x.font = '600 132px Fraunces, serif'; x.fillText(u.accredited, 0, 60);
      x.font = '800 30px Manrope, sans-serif'; x.fillText('ACCREDITED PROGRAMMES', 0, 150);
      x.font = '700 30px Manrope, sans-serif'; x.globalAlpha = .8; x.fillText((U.TYPE[u.type] || u.type).toUpperCase(), 0, 215); x.globalAlpha = 1;
    }, true, false);
  }

  /* ---- the crests ---- */
  const geo = new THREE.CylinderGeometry(1, 1, .16, 96, 1); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2);
  const side = new THREE.MeshStandardMaterial({ color: 0xD8B35E, metalness: 1, roughness: .28 });
  const coins = [];
  const fonts = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 100px Fraunces'), document.fonts.load('500 60px Fraunces'), document.fonts.load('800 50px Manrope')]).catch(() => {}) : Promise.resolve();
  warmP = fonts.then(async () => {
    for (let i = 0; i < D.unis.length; i++) { const u = D.unis[i]; if (window.TCPerf) await window.TCPerf.idle();
      const fm = new THREE.MeshStandardMaterial({ map: face(u, false), metalnessMap: face(u, true), metalness: 1, roughness: .34 });
      const bm = new THREE.MeshStandardMaterial({ map: back(u), metalness: .85, roughness: .32 });
      const m = new THREE.Mesh(geo, [side, fm, bm]); m.userData.i = i; scene.add(m);
      coins.push({ m, fm, bm, pos: new THREE.Vector3(0, -6, -8), h: 0, spin: 0, vel: 0, busy: false, phase: i * 1.7 });
    }
  }).then(() => (window.TCPerf ? window.TCPerf.warm(renderer, scene, camera) : null));

  /* ---- interaction ----
     Every crest keeps a fixed slot on the ring, so choosing one only moves two crests (the new one forward,
     the old one home). The ring eases to a stop while you point at a crest, hover is sticky until the pointer
     really leaves it, and all motion is time-based so it feels the same at any frame rate. */
  const ptr = new THREE.Vector2(-9, -9), smooth = new THREE.Vector2(), ray = new THREE.Raycaster(), ZERO = new THREE.Vector2();
  let hover = -1, shownTip = -2, ringAngle = 0, ringSpeed = 0, ringVel = 0, drag = null, inside = false, lastT = 0;
  // the ring keeps eleven evenly spaced slots; choosing a crest swaps it with the one in front, so nothing else moves
  const order = D.unis.map((_, i) => i).filter((i) => i !== cur);
  // hover preview: resting on a crest for a moment brings it forward; the crest that steps back is ignored
  // until the pointer has left it, so the two never bounce back and forth
  let dwell = 0, dwellOn = -1, lockout = -1; const px = { x: -999, y: -999 }, lockAt = { x: 0, y: 0 };
  const toPtr = (e) => { const r = canvas.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const hitList = () => coins.map((c) => c.m);
  function pick() {
    if (!coins.length) return -1;
    ray.setFromCamera(ptr, camera);
    if (hover > -1 && ray.intersectObject(coins[hover].m, false).length) return hover; // sticky
    const hit = ray.intersectObjects(hitList(), false)[0];
    const i = hit ? hit.object.userData.i : -1;
    if (lockout > -1 && ((i > -1 && i !== lockout) || Math.hypot(px.x - lockAt.x, px.y - lockAt.y) > 70)) lockout = -1; // pointer has moved on
    return i;
  }
  canvas.addEventListener('pointerenter', (e) => { inside = e.pointerType !== 'touch'; });
  canvas.addEventListener('pointerleave', () => { inside = false; ptr.set(-9, -9); hover = -1; });
  canvas.addEventListener('pointermove', (e) => { toPtr(e); px.x = e.clientX; px.y = e.clientY; });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return; toPtr(e);
    const hit = pick();
    drag = { x: e.clientX, y: e.clientY, last: e.clientX, lastT: performance.now(), mode: hit === cur ? 'coin' : 'ring', hit, moved: false, axis: null, v: 0 };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, step = e.clientX - drag.last, now = performance.now();
    drag.last = e.clientX;
    if (!drag.axis && Math.hypot(dx, dy) > 7) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (drag.axis !== 'x') return;
    if (!drag.moved) { drag.moved = true; canvas.classList.add('grab'); }
    const dtm = Math.max(8, now - drag.lastT); drag.lastT = now;
    if (drag.mode === 'ring') { ringAngle += step * .006; drag.v = step * .006 / (dtm / 1000); }
    else { const c = coins[cur]; c.busy = false; c.spin += step * .012; c.vel = step * .012 / (dtm / 1000); }
  });
  const up = () => {
    if (!drag) return; const d = drag; drag = null; canvas.classList.remove('grab');
    if (d.moved) { if (d.mode === 'ring') ringVel = THREE.MathUtils.clamp(d.v, -4, 4); else coins[cur].vel = THREE.MathUtils.clamp(coins[cur].vel, -14, 14); return; }
    if (d.hit > -1 && d.hit !== cur) select(d.hit);
    else if (d.hit === cur) flip();
  };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); select((cur + 1) % 12); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); select((cur + 11) % 12); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  });

  function flip() {
    const c = coins[cur]; if (!c) return; c.vel = 0; c.busy = true;
    const to = Math.round(c.spin / Math.PI) * Math.PI + Math.PI;
    if (window.gsap && !reduce) window.gsap.to(c, { spin: to, duration: 1.1, ease: 'expo.out', overwrite: true, onComplete: () => { c.busy = false; } }); else { c.spin = to; c.busy = false; }
  }
  function select(i) {
    if (i === cur || i < 0) return;
    const old = coins[cur]; if (old) { if (window.gsap) window.gsap.killTweensOf(old); old.busy = false; old.vel = 0; }
    const slot = order.indexOf(i); if (slot > -1) order[slot] = cur;
    lockout = cur; lockAt.x = px.x; lockAt.y = px.y; dwell = 0; dwellOn = -1;
    cur = i; mark(i); U.setCard(card, i);
    const c = coins[i]; if (!c || !window.gsap || reduce) return;
    c.vel = 0; c.busy = true; const front = Math.round(c.spin / TAU) * TAU;
    window.gsap.fromTo(c, { spin: front - TAU }, { spin: front, duration: 1.5, ease: 'expo.out', overwrite: true, onComplete: () => { c.busy = false; } });
  }

  const TMP = new THREE.Vector3(), V = new THREE.Vector3(), LOOK = new THREE.Vector3();
  function tick(t) {
    const dt = Math.min(.05, Math.max(.001, t - lastT)); lastT = t;
    const k = (rate) => 1 - Math.exp(-dt * rate);
    smooth.lerp(ptr.x < -5 ? ZERO : ptr, k(3));
    if (!drag && inside) hover = pick();
    canvas.classList.toggle('pt', hover > -1);
    if (!drag && hover > -1 && hover !== cur && hover !== lockout) {
      if (dwellOn !== hover) { dwellOn = hover; dwell = 0; }
      dwell += dt; if (dwell > .32) select(hover);
    } else { dwellOn = -1; dwell = 0; }
    const mob = camera.aspect < 1;
    // layout: the chosen crest in front, the ring tilted around and behind it (front of the ring passes below it)
    const C = mob ? TMP.set(0, .9, 3) : TMP.set(-3.3, .1, 3);
    const cx = C.x, cy = C.y, cz = C.z;
    const rx = mob ? 3.3 : 7.4, rz = mob ? 2.2 : 3.2, low = mob ? 2.9 : 3.0, high = mob ? 2.4 : 2.2, back = mob ? 3.6 : 4.2;
    camera.position.set((mob ? 0 : -1) + smooth.x * .3, (mob ? -1.6 : -.3) + smooth.y * .2, mob ? 31 : 22);
    LOOK.set(mob ? 0 : -1, mob ? -1.6 : -.3, 0); camera.lookAt(LOOK);
    key.position.set(4 + smooth.x * 2.5, 6 + smooth.y * 2, 8);
    // ring: drift slowly, ease to a stop while a crest is pointed at or the ring is held, keep momentum after a flick
    ringSpeed += ((reduce || hover > -1 || drag) ? 0 : .06) * k(2) - ringSpeed * k(2);
    if (!drag) { ringAngle += (ringSpeed + ringVel) * dt; ringVel *= Math.exp(-dt * 2.2); }
    coins.forEach((c, i) => {
      const on = i === cur; c.h += ((i === hover && !on && i !== lockout ? 1 : 0) - c.h) * k(10);
      const bob = reduce ? 0 : Math.sin(t * .8 + c.phase) * (on ? .1 : .07);
      let depth = 1;
      if (on) V.set(cx, cy + bob, cz);
      else {
        const a = ringAngle + (TAU * order.indexOf(i)) / order.length + Math.PI / 2 + Math.PI / order.length, s = Math.sin(a);
        depth = (s + 1) / 2; // 0 back, 1 front
        V.set(cx + Math.cos(a) * rx, cy + (s > 0 ? -s * low : -s * high) + bob + c.h * .18, cz - back + s * rz + c.h * .5);
      }
      c.pos.lerp(V, k(on || c.pos.distanceToSquared(V) > 4 ? 4 : 9)); c.m.position.copy(c.pos);
      const sc = on ? (mob ? 1.4 : 1.85) : (.66 + .3 * depth) * (1 + c.h * .14);
      c.m.scale.setScalar(c.m.scale.x + (sc - c.m.scale.x) * k(8));
      // spin: momentum after a drag, then settle on the nearest face; ring crests settle face-up
      if (!c.busy && !(drag && drag.moved && drag.mode === 'coin' && on)) {
        if (on && Math.abs(c.vel) > .15) { c.spin += c.vel * dt; c.vel *= Math.exp(-dt * 3); }
        else { c.vel = 0; const target = on ? Math.round(c.spin / Math.PI) * Math.PI : Math.round(c.spin / TAU) * TAU; c.spin += (target - c.spin) * k(5); }
      }
      const idle = reduce ? 0 : Math.sin(t * .3 + c.phase) * .35;
      c.m.rotation.y = c.spin + (on ? smooth.x * .3 : idle * (1 - c.h));
      c.m.rotation.x = on ? -smooth.y * .25 : Math.sin(t * .25 + c.phase) * .12 * (1 - c.h);
      const lum = on ? 1 : .42 + .5 * depth + c.h * .4;
      c.fm.color.setScalar(Math.min(1, lum)); c.bm.color.setScalar(Math.min(1, lum));
    });
    // tooltip over the crest under the pointer
    if (hover > -1 && coins[hover]) {
      const c = coins[hover], u = D.unis[hover], r = canvas.getBoundingClientRect();
      if (shownTip !== hover) { tip.innerHTML = '<b>#' + u.rank + '</b>' + (hover === cur ? 'Drag or tap to turn it over' : u.name.replace(/\s*\(.*\)/, '')); shownTip = hover; }
      V.copy(c.pos); V.y += c.m.scale.x * 1.1; V.project(camera);
      tip.style.transform = `translate(${((V.x * .5 + .5) * r.width).toFixed(1)}px, ${((-V.y * .5 + .5) * r.height).toFixed(1)}px) translate(-50%, -115%)`;
      tip.classList.add('on');
    } else if (shownTip !== -1) { tip.classList.remove('on'); shownTip = -1; }
    gov(); renderer.render(scene, camera);
  }
}
