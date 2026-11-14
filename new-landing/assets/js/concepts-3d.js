/* Concept lab · Universities: Glass skyline (U1) and Floating crests (U2), built with three.js. */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const D = window.CX, U = window.CXU;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => (n < 10 ? '0' : '') + n;
const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();

/* a renderer that only draws while its section is on screen */
function stage(canvas, { alpha = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 500);
  const fit = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); };
  fit(); new ResizeObserver(fit).observe(canvas);
  let visible = false, tick = null, raf = 0; const clock = new THREE.Clock();
  const loop = () => { raf = 0; if (!visible) return; tick && tick(clock.getElapsedTime(), Math.min(clock.getDelta(), .05)); if (!reduce) raf = requestAnimationFrame(loop); };
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) loop(); }, { rootMargin: '120px' }).observe(canvas);
  const pointer = new THREE.Vector2(-9, -9), smooth = new THREE.Vector2();
  canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); });
  canvas.addEventListener('pointerleave', () => pointer.set(-9, -9));
  return { renderer, camera, pointer, smooth, onTick: (f) => { tick = f; }, redraw: () => { if (!raf) loop(); } };
}
const ease = (a, b, k) => a + (b - a) * k;

/* =================== U1 · GLASS SKYLINE =================== */
function skyline() {
  const root = document.querySelector('[data-sk]'); if (!root) return;
  const canvas = root.querySelector('[data-sk-gl]'), labels = root.querySelector('[data-sk-labels]'), card = root.querySelector('[data-ucard="sk"]');
  let cur = 0, hover = -1;
  const mark = U.chips(root.querySelector('[data-uchips="sk"]'), (i) => select(i));
  U.setCard(card, 0);
  if (!hasGL) { canvas.style.background = 'url(./assets/img/photos/hx-petronas.jpg) center/cover'; return; }
  const { renderer, camera, pointer, smooth, onTick, redraw } = stage(canvas);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0B241B, 34, 110);

  /* dusk sky */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `varying vec3 vP;
      void main(){
        float h = vP.y;
        vec3 hor = vec3(.86, .5, .29), mid = vec3(.07, .24, .18), top = vec3(.01, .05, .04);
        vec3 c = mix(hor, mid, smoothstep(-.02, .2, h));
        c = mix(c, top, smoothstep(.2, .65, h));
        float sun = pow(max(dot(normalize(vec3(.35, .02, -1.)), vP), 0.), 24.);
        c += vec3(1., .62, .32) * sun * .8;
        c = mix(c, vec3(.02, .05, .04), smoothstep(0., -.08, h));
        gl_FragColor = vec4(c, 1.);
      }`,
  }));
  scene.add(sky);

  /* glass tower material: lit windows, fresnel sky reflection, a crown line in the section accent */
  const accent = new THREE.Color('#9FE2BF'), gold = new THREE.Color('#FFCC00');
  const towerMat = (seed, H, refl) => new THREE.ShaderMaterial({
    transparent: !!refl, depthWrite: !refl, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uH: { value: H }, uSeed: { value: seed }, uHover: { value: 0 }, uActive: { value: 0 }, uTime: { value: 0 }, uRefl: { value: refl ? 1 : 0 }, uAcc: { value: accent }, uGold: { value: gold } }]),
    vertexShader: `varying vec3 vL; varying vec3 vN; varying vec3 vV; varying float vWy;
      #include <fog_pars_vertex>
      void main(){ vL = position; vN = normal; vec4 w = modelMatrix * vec4(position, 1.); vWy = w.y; vV = cameraPosition - w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `uniform float uH, uSeed, uHover, uActive, uTime, uRefl; uniform vec3 uAcc, uGold;
      varying vec3 vL; varying vec3 vN; varying vec3 vV; varying float vWy;
      #include <fog_pars_fragment>
      float hs(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)) + uSeed * 7.13) * 43758.5); }
      void main(){
        float y = vL.y; vec3 n = normalize(vN);
        vec3 col = mix(vec3(.015, .05, .045), vec3(.05, .15, .13), clamp(y / uH, 0., 1.));
        if (n.y > .5) { col = vec3(.02, .06, .05) + uAcc * .25 * (uActive + uHover * .5); }
        else {
          vec2 f = abs(n.x) > .5 ? vec2(vL.z, y) : vec2(vL.x, y);
          vec2 g = f * vec2(5.5, 3.4); vec2 c = floor(g), fr = fract(g);
          float win = step(.14, fr.x) * step(fr.x, .86) * step(.22, fr.y) * step(fr.y, .78);
          float on = step(.7 - uActive * .45 - uHover * .25, hs(c));
          float flick = .85 + .15 * sin(uTime * 1.3 + hs(c + 9.) * 40.);
          vec3 wc = mix(vec3(1., .8, .52), vec3(.78, .96, .88), step(.6, hs(c + 3.)));
          wc = mix(wc, uGold, uActive * .55);
          col += win * on * wc * (.42 + uActive * .75 + uHover * .35) * flick;
          col += (1. - win) * .012;
          float fres = pow(1. - abs(dot(normalize(vV), n)), 3.);
          col += fres * vec3(.95, .58, .33) * .45;
          col += smoothstep(uH - .18, uH, y) * uAcc * (.55 + uActive * 1.2 + uHover * .6);
          col += uAcc * uActive * .06;
        }
        if (uRefl > .5) { float k = clamp(1. + vWy / 6., 0., 1.); col *= .32 * k; }
        gl_FragColor = vec4(col, uRefl > .5 ? .9 : 1.);
        #include <fog_fragment>
      }`,
  });

  const unis = D.unis, maxA = U.maxA;
  const order = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6];
  const city = new THREE.Group(), mirror = new THREE.Group(); mirror.scale.y = -1;
  scene.add(city, mirror);
  const towers = [], picks = [];
  const box = (w, h, d, y) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, y + h / 2, 0); return g; };
  unis.forEach((u, i) => {
    const slot = order[i], x = slot * 2.75, z = -Math.abs(slot) * 1.1 - slot * slot * .06;
    const H = 4.2 + (+u.accredited / maxA) * 12.5, w = 1.55 + ((i * 37) % 5) * .09, d = 1.5 + ((i * 53) % 4) * .1;
    const kind = i % 3, parts = [box(w, H * (kind === 1 ? .78 : 1), d, 0)];
    if (kind === 1) parts.push(box(w * .66, H * .22, d * .66, H * .78));
    const total = H;
    const mats = [towerMat(i + 1, total, false), towerMat(i + 1, total, true)];
    const g = new THREE.Group(), gm = new THREE.Group(); g.position.set(x, 0, z); gm.position.set(x, 0, z);
    parts.forEach((geo) => { const m = new THREE.Mesh(geo, mats[0]); m.userData.i = i; g.add(m); picks.push(m); gm.add(new THREE.Mesh(geo, mats[1])); });
    let top = total;
    if (kind === 2) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(.03, .09, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0x9FE2BF })); sp.position.y = total + 1.1; g.add(sp); top += 2.2;
    }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.08, .55, 40, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFCC00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = top + 20; g.add(beam);
    city.add(g); mirror.add(gm);
    const lab = document.createElement('div'); lab.className = 'sk-lab'; lab.innerHTML = '<b>#' + u.rank + '</b>' + U.short(u); labels.appendChild(lab);
    towers.push({ g, mats, top, x, z, lab, beam, h: 0, a: 0 });
  });

  /* the rest of the city: dark silhouettes fading into the haze */
  const fillerMat = new THREE.MeshBasicMaterial({ color: 0x06140F });
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), fillerMat, 90), m4 = new THREE.Matrix4();
  for (let k = 0; k < 90; k++) {
    const h = 2 + ((k * 7919) % 100) / 100 * 9, x = -75 + (k / 90) * 150 + (((k * 131) % 10) - 5), z = -16 - ((k * 61) % 40);
    m4.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(1.5 + (k % 3) * .6, h, 1.5 + (k % 4) * .5)); inst.setMatrixAt(k, m4);
  }
  scene.add(inst);

  /* wet stone ground: lets the reflections show through, faint grid */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uAcc: { value: accent } }]),
    vertexShader: 'varying vec2 vW; \n#include <fog_pars_vertex>\n void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition; \n#include <fog_vertex>\n }',
    fragmentShader: `uniform vec3 uAcc; varying vec2 vW;
      #include <fog_pars_fragment>
      void main(){ vec2 g = abs(fract(vW / 3.) - .5); float line = smoothstep(.49, .5, max(g.x, g.y)); float r = length(vW) / 40.;
        vec3 c = vec3(.012, .03, .025) + uAcc * line * .05 * (1. - clamp(r, 0., 1.));
        gl_FragColor = vec4(c, .78);
        #include <fog_fragment>
      }`,
  }));
  ground.rotation.x = -Math.PI / 2; ground.renderOrder = 1; scene.add(ground);

  /* drifting fireflies */
  const N = 220, pos = new Float32Array(N * 3), sd = new Float32Array(N);
  for (let k = 0; k < N; k++) { pos[k * 3] = (Math.random() - .5) * 46; pos[k * 3 + 1] = Math.random() * 16 + .3; pos[k * 3 + 2] = (Math.random() - .3) * 22; sd[k] = Math.random() * 10; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
  const flies = new THREE.Points(pg, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
    vertexShader: 'attribute float aSeed; uniform float uTime, uPx; varying float vA; void main(){ vec3 p = position; p.x += sin(uTime * .2 + aSeed) * .6; p.y += sin(uTime * .3 + aSeed * 2.) * .4; vA = .4 + .6 * sin(uTime * 1.4 + aSeed * 5.); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = 5. * uPx * (20. / -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(.75, 1., .82), smoothstep(.5, 0., d) * vA * .7); }',
  }));
  scene.add(flies);

  /* picking */
  const ray = new THREE.Raycaster();
  canvas.addEventListener('click', () => { if (hover > -1) select(hover); });
  function select(i) {
    if (i === cur) return; cur = i; mark(i); U.setCard(card, i); redraw();
  }
  const look = new THREE.Vector3(0, 6, 0), v = new THREE.Vector3();
  const isMob = () => camera.aspect < 1;
  onTick((t) => {
    smooth.lerp(pointer.x < -5 ? new THREE.Vector2() : pointer, .05);
    // hover test
    if (pointer.x > -5) { ray.setFromCamera(pointer, camera); const hit = ray.intersectObjects(picks, false)[0]; hover = hit ? hit.object.userData.i : -1; } else hover = -1;
    canvas.style.cursor = hover > -1 ? 'pointer' : '';
    // camera: slow drift, follows the chosen tower a little
    const T = towers[cur], mob = isMob();
    const az = (reduce ? 0 : Math.sin(t * .05) * .1) + smooth.x * .12 + T.x * .012;
    const R = mob ? 58 : 46, cx = (mob ? 0 : 4) + T.x * .3;
    camera.position.set(cx + Math.sin(az) * R * .35, 7.5 + smooth.y * 1.2, Math.cos(az) * R);
    look.set(ease(look.x, cx * .92, .04), ease(look.y, mob ? 9 : 10.5, .04), ease(look.z, T.z * .3, .04));
    camera.lookAt(look);
    towers.forEach((tw, k) => {
      tw.h = ease(tw.h, k === hover ? 1 : 0, .12); tw.a = ease(tw.a, k === cur ? 1 : 0, .07);
      tw.mats.forEach((m) => { m.uniforms.uHover.value = tw.h; m.uniforms.uActive.value = tw.a; m.uniforms.uTime.value = t; });
      tw.beam.material.opacity = tw.a * (.16 + .04 * Math.sin(t * 2));
      v.set(tw.x, tw.top + .5, tw.z).project(camera);
      const r = canvas.getBoundingClientRect();
      tw.lab.style.transform = `translate(${(v.x * .5 + .5) * r.width}px, ${(-v.y * .5 + .5) * r.height}px) translate(-50%, -100%)`;
      tw.lab.classList.toggle('on', k === cur); tw.lab.classList.toggle('dim', hover > -1 && k !== hover && k !== cur);
    });
    flies.material.uniforms.uTime.value = t;
    renderer.render(scene, camera);
  });
}

/* =================== U2 · FLOATING CRESTS =================== */
function crests() {
  const root = document.querySelector('[data-cr]'); if (!root) return;
  const canvas = root.querySelector('[data-cr-gl]'), card = root.querySelector('[data-ucard="cr"]');
  let cur = 0, hover = -1;
  const mark = U.chips(root.querySelector('[data-uchips="cr"]'), (i) => select(i));
  U.setCard(card, 0);
  if (!hasGL) return;
  const { renderer, camera, pointer, smooth, onTick, redraw } = stage(canvas, { alpha: true });
  camera.fov = 30; camera.updateProjectionMatrix();
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xFFF1D6, 2.2); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9FE2BF, 1.6); rim.position.set(-6, 2, -4); scene.add(rim);

  const ENAMEL = { 'Research University': '#0E5A43', 'Private University': '#132A6E', 'Public University': '#7A1230' };
  function face(u, metal) {
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); const C = S / 2;
    x.translate(C, C);
    // ring
    if (metal) { x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, C, 0, 7); x.fill(); x.fillStyle = '#000'; x.beginPath(); x.arc(0, 0, 352, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '600 300px Fraunces, serif'; }
    else {
      const g = x.createRadialGradient(-160, -200, 40, 0, 0, C); g.addColorStop(0, '#FBE7A6'); g.addColorStop(.5, '#D9B25A'); g.addColorStop(1, '#8F6A22');
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, C, 0, 7); x.fill();
      x.strokeStyle = 'rgba(80,55,10,.55)'; x.lineWidth = 4; [496, 452, 360].forEach((r) => { x.beginPath(); x.arc(0, 0, r, 0, 7); x.stroke(); });
      const e = x.createRadialGradient(-80, -120, 20, 0, 0, 352); const col = ENAMEL[u.type] || '#0E5A43';
      e.addColorStop(0, shade(col, 1.45)); e.addColorStop(1, shade(col, .7)); x.fillStyle = e; x.beginPath(); x.arc(0, 0, 350, 0, 7); x.fill();
      // ring text
      const txt = ('QS WORLD UNIVERSITY RANKINGS 2027  ·  MALAYSIA  ·  NO. ' + pad(u.rank) + '  ·  ').split('');
      x.fillStyle = '#4A3408'; x.font = '700 34px Manrope, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const step = (Math.PI * 2) / txt.length; txt.forEach((ch, k) => { x.save(); x.rotate(-Math.PI / 2 + k * step); x.translate(0, -404); x.fillText(ch, 0, 0); x.restore(); });
      x.fillStyle = '#F3D88A';
    }
    // star
    x.save(); x.translate(0, -215); x.beginPath(); for (let k = 0; k < 28; k++) { const a = -Math.PI / 2 + k * Math.PI / 14, r = k % 2 ? 18 : 44; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.restore();
    // acronym
    const s = U.short(u); let fs = 230; x.font = `600 ${fs}px Fraunces, serif`; while (x.measureText(s).width > 560 && fs > 90) { fs -= 8; x.font = `600 ${fs}px Fraunces, serif`; }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 0, 10);
    x.font = '800 54px Manrope, sans-serif'; x.fillText('#' + u.rank, 0, 205);
    const t = new THREE.CanvasTexture(c); if (!metal) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.center.set(.5, .5); t.rotation = 0; return t;
  }
  function back() {
    const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    const g = x.createRadialGradient(180, 160, 20, 256, 256, 256); g.addColorStop(0, '#F6DF97'); g.addColorStop(1, '#9C7529'); x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.translate(256, 256); x.fillStyle = '#7A5A18'; x.beginPath(); for (let k = 0; k < 28; k++) { const a = -Math.PI / 2 + k * Math.PI / 14, r = k % 2 ? 50 : 120; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function shade(hex, k) { const c = new THREE.Color(hex).multiplyScalar(k); return '#' + c.getHexString(); }

  const geo = new THREE.CylinderGeometry(1, 1, .16, 96, 1); geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2);
  const side = new THREE.MeshStandardMaterial({ color: 0xD8B35E, metalness: 1, roughness: .28 });
  const backMat = new THREE.MeshStandardMaterial({ map: back(), metalness: .9, roughness: .3 });
  const coins = [];
  const ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('600 100px Fraunces'), document.fonts.load('800 50px Manrope')]).catch(() => {}) : Promise.resolve();
  ready.then(() => {
    D.unis.forEach((u, i) => {
      const fm = new THREE.MeshStandardMaterial({ map: face(u, false), metalnessMap: face(u, true), metalness: 1, roughness: .34 });
      const m = new THREE.Mesh(geo, [side, fm, backMat]); m.userData.i = i;
      const col = i % 6, row = Math.floor(i / 6);
      const home = new THREE.Vector3(-8.6 + col * 2.75 + (row ? 1.35 : 0), row ? -2.4 : 1.2, -2.5 - ((i * 7) % 3) * .9);
      m.position.copy(home); scene.add(m);
      coins.push({ m, fm, home, pos: home.clone(), h: 0, focus: 0, spin: 0, phase: i * 1.7 });
    });
    focusOn(0, true); redraw();
  });
  const TMP = new THREE.Vector3();
  function focusOn(i, instant) {
    const c = coins[i]; if (!c) return;
    c.spin = 0;
    if (window.gsap && !reduce && !instant) window.gsap.fromTo(c, { spin: 0 }, { spin: Math.PI * 2, duration: 1.6, ease: 'expo.out' });
  }
  function select(i) { if (i === cur) return; cur = i; mark(i); U.setCard(card, i); focusOn(i); redraw(); }
  const ray = new THREE.Raycaster();
  canvas.addEventListener('click', () => { if (hover > -1) select(hover); });
  camera.position.set(0, 0, 22);
  onTick((t) => {
    smooth.lerp(pointer.x < -5 ? new THREE.Vector2() : pointer, .05);
    if (pointer.x > -5 && coins.length) { ray.setFromCamera(pointer, camera); const hit = ray.intersectObjects(coins.map((c) => c.m), false)[0]; hover = hit ? hit.object.userData.i : -1; } else hover = -1;
    canvas.style.cursor = hover > -1 ? 'pointer' : '';
    const mob = camera.aspect < 1;
    const C = mob ? new THREE.Vector3(-1, 1.6, 2) : new THREE.Vector3(-3.4, -.7, 3.5);
    const rx = mob ? 4 : 7.6, rz = mob ? 2.6 : 3.4;
    camera.position.set(smooth.x * .8 - 1, smooth.y * .5, mob ? 30 : 22); camera.lookAt(-1, 0, 0);
    let s = 0;
    coins.forEach((c, k) => {
      const on = k === cur; c.focus = ease(c.focus, on ? 1 : 0, .06); c.h = ease(c.h, k === hover ? 1 : 0, .12);
      const bob = reduce ? 0 : Math.sin(t * .8 + c.phase) * .14;
      if (on) TMP.set(C.x, C.y + bob, C.z);
      else {
        const a = (reduce ? 0 : t * .07) + (Math.PI * 2 * s++) / (coins.length - 1);
        TMP.set(C.x + Math.cos(a) * rx, C.y + .2 - Math.sin(a) * 1.5 + bob, C.z - 5 + Math.sin(a) * rz);
      }
      c.pos.lerp(TMP, .05); c.m.position.copy(c.pos);
      const depth = THREE.MathUtils.smoothstep(c.pos.z, C.z - 5 - rz, C.z - 5 + rz);
      const sc = (1 + c.h * .14) * ease(.82, mob ? 1.45 : 1.9, c.focus); c.m.scale.setScalar(sc);
      const idle = reduce ? 0 : Math.sin(t * .35 + c.phase) * .5;
      c.m.rotation.y = ease(idle + c.h * -.3, smooth.x * .25, c.focus) + c.spin;
      c.m.rotation.x = ease(Math.sin(t * .27 + c.phase) * .16, -smooth.y * .15, c.focus);
      c.fm.color.setScalar(on ? 1 : ease(.4 + .5 * depth, 1, c.h));
    });
    renderer.render(scene, camera);
  });
}

skyline();
crests();
