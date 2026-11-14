/* What we do · glass monoliths (three.js)
   Nine glass pillars on an arc, each holding its service. Hover one and its details pop up on the pillar,
   drag to walk the gallery (it stops at the first and last pillar), click to call one forward. */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const root = document.querySelector('[data-mo]');
const S = window.SVC || [], P = './assets/img/photos/', TAU = Math.PI * 2;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => (n < 10 ? '0' : '') + n;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const glOK = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const fontsReady = document.fonts && document.fonts.load ? Promise.all(['400 60px Fraunces', '300 60px Fraunces', '800 30px Manrope'].map((f) => document.fonts.load(f))).catch(() => {}) : Promise.resolve();
const loadImg = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
const iconImg = (s) => loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="192" height="192" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>`));
function cover(x, im, dx, dy, dw, dh) { if (!im) { x.fillStyle = '#3A0A18'; x.fillRect(dx, dy, dw, dh); return; } const r = Math.max(dw / im.naturalWidth, dh / im.naturalHeight), w = im.naturalWidth * r, h = im.naturalHeight * r; x.drawImage(im, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h); }
function wrap(x, text, max) { const out = []; let line = ''; text.split(' ').forEach((w) => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; }); if (line) out.push(line); return out; }
function rrect(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
function radial(stops) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([o, col]) => g.addColorStop(o, col)); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }

if (root && S.length) init();

function init() {
  const stageEl = root.querySelector('[data-mo-stage]'), canvas = root.querySelector('[data-gl]');
  const tipEl = root.querySelector('[data-tip]'), cardEl = root.querySelector('[data-card]'), chipEl = root.querySelector('[data-chips]');
  const N = S.length;
  let sel = -1, hover = -1, chipHover = -1, tipFor = -1, items = [];

  /* chips under the gallery */
  chipEl.innerHTML = S.map((s, i) => `<button type="button" role="tab" aria-selected="false" data-i="${i}"><b>${pad(i + 1)}</b>${esc(s.title)}</button>`).join('');
  const chipBs = [...chipEl.querySelectorAll('button')];
  chipBs.forEach((b) => b.addEventListener('click', () => select(+b.dataset.i === sel ? -1 : +b.dataset.i)));
  // hovering a chip lights its pillar too
  chipBs.forEach((b) => { b.addEventListener('pointerenter', () => { chipHover = +b.dataset.i; }); b.addEventListener('pointerleave', () => { chipHover = -1; }); });

  /* the card that opens on click */
  function card(i) {
    if (i < 0) { cardEl.classList.remove('on'); return; }
    const s = S[i];
    const fill = () => {
      cardEl.style.setProperty('--c', s.color);
      cardEl.innerHTML = `<button type="button" class="cd-x" aria-label="Close">✕</button><span class="cd-n">${pad(i + 1)}</span><small>${esc(s.sub)}</small><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p><div class="cd-nav"><a class="btn btn--sun btn--sm" href="${s.href}">${esc(s.cta)} →</a><button type="button" class="rbtn" data-d="-1" aria-label="Previous service">←</button><button type="button" class="rbtn" data-d="1" aria-label="Next service">→</button></div>`;
      cardEl.querySelector('.cd-x').addEventListener('click', () => select(-1));
      cardEl.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => select((sel + (+b.dataset.d) + N) % N)));
      cardEl.classList.add('on');
      if (!reduce && window.gsap) window.gsap.fromTo([...cardEl.children], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .04 });
    };
    if (cardEl.classList.contains('on') && !reduce && window.gsap) window.gsap.to([...cardEl.children], { y: -10, opacity: 0, duration: .2, stagger: .015, onComplete: fill }); else fill();
  }

  /* the info box that pops up on a hovered pillar */
  function tip(i) {
    if (i === tipFor) return; tipFor = i;
    if (i < 0) { tipEl.classList.remove('on'); return; }
    const s = S[i];
    tipEl.style.setProperty('--c', s.color);
    tipEl.innerHTML = `<span class="tp-n">${pad(i + 1)} / ${pad(N)}</span><b>${esc(s.title)}</b><small>${esc(s.sub)}</small><p>${esc(s.text)}</p><span class="tp-go">Click to open →</span>`;
    tipEl.classList.remove('on'); void tipEl.offsetWidth; tipEl.classList.add('on');
  }

  root.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (!stageEl.contains(e.target) && !chipEl.contains(e.target) && !cardEl.contains(e.target)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); select(((sel < 0 ? -1 : sel) + 1) % N); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); select(((sel < 0 ? 0 : sel) - 1 + N) % N); }
    if (e.key === 'Escape') select(-1);
  });

  let onSelect = () => {};
  function select(i) {
    if (i > -1 && !S[i]) return;
    const prev = sel; sel = i;
    chipBs.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    card(i); root.classList.toggle('picked', i > -1);
    onSelect(i, prev);
  }

  if (!glOK) { root.classList.add('mo-nogl'); select(0); return; }
  build();

  async function build() {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(window.TCPerf ? window.TCPerf.dpr(1.5) : Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    const camera = new THREE.PerspectiveCamera(24, 1, .1, 120), scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
    const aniso = renderer.capabilities.getMaxAnisotropy();
    const fit = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); };
    fit(); new ResizeObserver(fit).observe(canvas);

    const ptr = { nx: -9, ny: -9, inside: false };
    const setPtr = (e) => { const r = canvas.getBoundingClientRect(); ptr.nx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.ny = -((e.clientY - r.top) / r.height) * 2 + 1; };
    canvas.addEventListener('pointermove', (e) => { setPtr(e); if (e.pointerType !== 'touch') ptr.inside = true; });
    canvas.addEventListener('pointerenter', (e) => { ptr.inside = e.pointerType !== 'touch'; });
    canvas.addEventListener('pointerleave', () => { ptr.inside = false; ptr.nx = ptr.ny = -9; });

    await fontsReady;
    scene.add(new THREE.AmbientLight(0xffffff, .3));
    const key = new THREE.DirectionalLight(0xFFE2B8, 1.4); key.position.set(-4, 9, 6); scene.add(key);

    // rounded glass slab
    const W = 1.6, H = 4.4, Dp = .5, r = .2, sh = new THREE.Shape();
    sh.moveTo(-W / 2 + r, 0); sh.lineTo(W / 2 - r, 0); sh.quadraticCurveTo(W / 2, 0, W / 2, r); sh.lineTo(W / 2, H - r); sh.quadraticCurveTo(W / 2, H, W / 2 - r, H); sh.lineTo(-W / 2 + r, H); sh.quadraticCurveTo(-W / 2, H, -W / 2, H - r); sh.lineTo(-W / 2, r); sh.quadraticCurveTo(-W / 2, 0, -W / 2 + r, 0);
    const slab = new THREE.ExtrudeGeometry(sh, { depth: Dp, bevelEnabled: true, bevelThickness: .07, bevelSize: .07, bevelSegments: 5, curveSegments: 12 }); slab.translate(0, 0, -Dp / 2);
    // see-through glass instead of a refraction pass: the panel inside stays pin sharp
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x2A0E16, metalness: 0, roughness: .04, transparent: true, opacity: .16, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 3, depthWrite: false });
    const IW = W - .16, IH = H - .16, TW = 1024, TH = Math.round(TW * IH / IW), k = TW / 600; // panel texture in a 600-wide layout, drawn at 1024 px
    const shadowTex = radial([[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]), poolTex = radial([[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    const reflV = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
    const reflF = `uniform sampler2D tMap; uniform float uA; varying vec2 vUv; void main(){ vec4 c = texture2D(tMap, vUv); float f = 1. - smoothstep(0., .3, vUv.y); gl_FragColor = vec4(c.rgb, c.a * f * uA); }`;
    const R = 14, SPAN = .165;
    const built = await Promise.all(S.map(async (s, i) => {
      const c = document.createElement('canvas'); c.width = TW; c.height = TH; const x = c.getContext('2d'); x.scale(k, k);
      const LW = 600, LH = TH / k;
      const [im, ic] = await Promise.all([loadImg(P + s.img + '.jpg'), iconImg(s)]);
      // perf: each pillar's panel is drawn in its own idle slot rather than all nine in one long task
      if (window.TCPerf) for (let w = 0; w <= i; w++) await window.TCPerf.idle();
      x.save(); rrect(x, 0, 0, LW, LH, 40); x.clip();
      x.fillStyle = '#1C0409'; x.fillRect(0, 0, LW, LH);
      cover(x, im, 0, 0, LW, 1000);
      const g = x.createLinearGradient(0, 640, 0, 1010); g.addColorStop(0, 'rgba(28,4,9,0)'); g.addColorStop(1, 'rgba(28,4,9,1)'); x.fillStyle = g; x.fillRect(0, 620, LW, 400);
      x.fillStyle = s.color; x.fillRect(0, 1000, LW, 8);
      rrect(x, 48, 1062, 112, 112, 30); x.fill(); if (ic) x.drawImage(ic, 66, 1080, 76, 76);
      x.fillStyle = '#E9B949'; x.font = '300 140px Fraunces'; x.textAlign = 'right'; x.fillText(pad(i + 1), 552, 1170);
      x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = '400 76px Fraunces';
      const tl = wrap(x, s.title, 504).slice(0, 3); tl.forEach((l, j) => x.fillText(l, 48, 1290 + j * 82));
      let y = 1290 + tl.length * 82 + 18;
      x.fillStyle = '#E9B949'; x.font = '800 27px Manrope'; wrap(x, s.sub.toUpperCase(), 504).slice(0, 3).forEach((l) => { x.fillText(l, 48, y); y += 38; });
      x.fillStyle = 'rgba(255,255,255,.55)'; x.font = '800 22px Manrope'; x.fillText(matchMedia('(hover: hover)').matches ? 'HOVER FOR DETAILS' : 'TAP FOR DETAILS', 48, LH - 52);
      x.restore();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: true, alphaTest: .5 }));
      inner.position.set(0, H / 2, 0); inner.renderOrder = 1;
      const body = new THREE.Mesh(slab, glass); body.renderOrder = 2; body.userData.i = i;
      const g0 = new THREE.Group(); g0.add(inner, body);
      // a soft reflection and contact shadow in place of a floor, so the page background shows through
      const refl = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), new THREE.ShaderMaterial({ uniforms: { tMap: { value: t }, uA: { value: .22 } }, vertexShader: reflV, fragmentShader: reflF, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      refl.scale.y = -1; refl.position.y = -H / 2 - .02;
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .005;
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.2), new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(s.color), transparent: true, opacity: .2, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, .01, .7);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.1, .1, 48), new THREE.MeshStandardMaterial({ color: 0xD9B25A, metalness: 1, roughness: .3 })); base.position.y = .05; base.scale.set(1, 1, .5);
      const floorG = new THREE.Group(); floorG.add(shadow, pool, base);
      scene.add(g0, floorG, refl);
      return { g: g0, floorG, inner, refl, pool, body, ang: (i - (N - 1) / 2) * SPAN, h: 0, act: 0, y: 0, spin: 0 };
    }));
    items = built;

    // vertical span the camera must always show: reflection tip to a lifted pillar top
    const Y0 = -1.1, Y1 = H + .5, CY = (Y0 + Y1) / 2, HALF = (Y1 - Y0) / 2;
    const pillarHalfAng = Math.atan((W / 2 + .14) / R);
    const lastAng = ((N - 1) / 2) * SPAN;
    let look = 0, lookT = 0, lookV = 0, hfov = .5, maxLook = 0, intro = reduce ? 1 : 0;
    const frame = () => {
      const a = camera.aspect, mob = a < 1;
      // fit the pillars' height; on narrow screens make sure at least one and a half pillars fit across
      const tv = Math.max(HALF * 1.04 / R, (SPAN * R * .78) / (R * a));
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(tv)); camera.updateProjectionMatrix();
      hfov = Math.atan(tv * a);
      // stop when the end pillar sits just inside the faded edge of the stage
      maxLook = Math.max(0, lastAng + pillarHalfAng + hfov * .12 - hfov);
      return mob;
    };
    const ray = new THREE.Raycaster(), V2 = new THREE.Vector2();
    const pick = () => { if (ptr.nx < -5) return -1; V2.set(ptr.nx, ptr.ny); ray.setFromCamera(V2, camera); const h = ray.intersectObjects(items.map((p) => p.body), false)[0]; return h ? h.object.userData.i : -1; };

    // drag along the gallery; it ends at the first and last pillar
    let drag = null;
    canvas.addEventListener('pointerdown', (e) => { if (e.button > 0) return; drag = { x: e.clientX, y: e.clientY, lx: e.clientX, t: performance.now(), v: 0, moved: false, axis: null }; });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.axis && Math.hypot(dx, dy) > 7) drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis !== 'x') return;
      if (!drag.moved) { drag.moved = true; canvas.classList.add('grab'); }
      const now = performance.now(), step = e.clientX - drag.lx; drag.v = step / Math.max(8, now - drag.t) * 1000; drag.lx = e.clientX; drag.t = now;
      const perPx = (2 * hfov) / canvas.clientWidth;
      lookT = clamp(lookT - step * perPx, -maxLook, maxLook); lookV = 0;
    });
    const up = (e) => {
      if (!drag) return; const was = drag; drag = null; canvas.classList.remove('grab');
      if (was.moved) { lookV = -was.v * (2 * hfov) / canvas.clientWidth; return; }
      if (was.axis !== 'y') { setPtr(e); const i = pick(); select(i === sel ? -1 : i); }
    };
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', () => { drag = null; canvas.classList.remove('grab'); });

    const cardShift = () => (camera.aspect < 1 ? 0 : hfov * .38);
    onSelect = (i, prev) => {
      if (i > -1 && i !== prev && window.gsap && !reduce) window.gsap.fromTo(items[i], { spin: 0 }, { spin: TAU, duration: 1.6, ease: 'expo.inOut' });
      // bring the chosen pillar into view, a little left of centre when the card is open beside it
      if (i > -1) lookT = clamp(items[i].ang + cardShift(), -maxLook, maxLook + cardShift());
      else lookT = clamp(lookT, -maxLook, maxLook);
      lookV = 0;
    };

    if (window.ScrollTrigger && window.gsap && !reduce) window.ScrollTrigger.create({ trigger: stageEl, start: 'top 80%', once: true, onEnter: () => window.gsap.to({ v: 0 }, { v: 1, duration: 2.2, ease: 'expo.out', onUpdate() { intro = this.targets()[0].v; } }) });
    else intro = 1;

    const V3 = new THREE.Vector3();
    let visible = false, raf = 0, last = performance.now();
    const tick = (time, dt) => {
      const mob = frame();
      hover = ptr.inside && !drag ? pick() : -1;
      // resting the mouse near the far left or right of the stage walks the gallery that way, faster the closer to the
      // edge, and previews whichever pillar is nearest the pointer as the row slides past
      const EDGE = .56, edge = ptr.inside && !drag && Math.abs(ptr.nx) > EDGE && Math.abs(ptr.nx) <= 1 ? Math.sign(ptr.nx) * Math.pow((Math.abs(ptr.nx) - EDGE) / (1 - EDGE), 1.5) : 0;
      if (edge && intro > .9) {
        lookT = clamp(lookT + edge * hfov * 1.15 * dt, -maxLook, maxLook); lookV = 0;
        if (hover < 0) {
          let best = -1, bd = .34;
          items.forEach((it, k) => { V3.set(0, 0, 0).applyMatrix4(it.g.matrixWorld).project(camera); const d = Math.abs(V3.x - ptr.nx); if (V3.z < 1 && Math.abs(V3.x) < 1.02 && d < bd) { bd = d; best = k; } });
          hover = best;
        }
      }
      canvas.classList.toggle('edge-l', edge < 0 && lookT > -maxLook + .001); canvas.classList.toggle('edge-r', edge > 0 && lookT < maxLook - .001);
      const lit = hover > -1 ? hover : chipHover;
      canvas.classList.toggle('pt', hover > -1);
      if (Math.abs(lookV) > .0005) { lookT += lookV * dt; lookV *= Math.exp(-dt * 3.2); }
      const hi = sel > -1 ? maxLook + cardShift() : maxLook;
      if (lookT < -maxLook || lookT > hi) { lookT = clamp(lookT, -maxLook, hi); lookV = 0; }
      const par = ptr.nx > -5 && sel < 0 && !drag ? ptr.nx * .03 : 0;
      look = damp(look, clamp(lookT + par, -maxLook, hi), drag ? 14 : 4, dt);
      const camY = CY + .55 + (ptr.ny > -5 ? ptr.ny * .12 : 0);
      camera.position.set(0, camY, 0);
      camera.lookAt(Math.sin(look) * R, CY, -Math.cos(look) * R);
      items.forEach((it, k) => {
        const en = clamp(intro * 1.6 - k * .07, 0, 1), e = 1 - Math.pow(1 - en, 3);
        it.h = damp(it.h, k === lit ? 1 : 0, 8, dt); it.act = damp(it.act, k === sel ? 1 : 0, 3.5, dt);
        // the chosen pillar steps forward; its neighbours part a little and sink
        const part = sel > -1 && k !== sel ? Math.sign(k - sel) * .05 : 0;
        it.y = damp(it.y, (k === lit && k !== sel ? .3 : 0) + (sel > -1 && k !== sel ? -.2 : 0), 6, dt);
        const ang = it.ang + part * (1 - it.act), dist = R - it.act * (mob ? 2.2 : 1.5);
        const px = Math.sin(ang) * dist, pz = -Math.cos(ang) * dist, rise = (1 - e) * -1.2;
        it.g.position.set(px, it.y + rise, pz); it.floorG.position.set(px, 0, pz); it.refl.position.set(px, -H / 2 - it.y - .02 - rise, pz);
        const ry = -ang + it.spin + (k === sel ? (ptr.nx > -5 ? ptr.nx * .2 : 0) : Math.sin(time * .4 + k) * .035);
        it.g.rotation.y = ry; it.floorG.rotation.y = -ang; it.refl.rotation.y = ry;
        const glow = Math.max(it.h, it.act), dim = sel > -1 && k !== sel ? .5 : 1;
        it.inner.material.color.setScalar((.88 + glow * .12) * dim * (.3 + .7 * e));
        it.refl.material.uniforms.uA.value = (.16 + glow * .1) * dim * e;
        it.pool.material.opacity = (.12 + glow * .4) * dim * e;
      });
      // pin the info box to the hovered pillar
      const showTip = hover > -1 && hover !== sel ? hover : -1;
      tip(showTip);
      if (showTip > -1) {
        const it = items[showTip];
        V3.set(0, H * .58, Dp / 2 + .1).applyMatrix4(it.g.matrixWorld).project(camera);
        const cw = canvas.clientWidth, ch = canvas.clientHeight, tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
        const sx = clamp((V3.x * .5 + .5) * cw, tw / 2 + 8, cw - tw / 2 - 8), sy = clamp((-V3.y * .5 + .5) * ch, th / 2 + 8, ch - th / 2 - 8);
        tipEl.style.left = sx + 'px'; tipEl.style.top = sy + 'px';
      }
    };
    // perf: shaders compile and textures upload in the background before the first draw; pixel density adapts to the frame rate
    const gov = window.TCPerf ? window.TCPerf.governor(renderer, fit, 1.5) : () => {};
    const warmP = window.TCPerf ? window.TCPerf.warm(renderer, scene, camera) : Promise.resolve();
    const loop = () => { raf = 0; if (!visible) return; const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; tick(now / 1000, dt); gov(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) warmP.then(() => { if (visible && !raf) { last = performance.now(); loop(); } }); }, { rootMargin: '100px' }).observe(canvas);
  }
}
