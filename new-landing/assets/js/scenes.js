/* Tutee Connect — Study in Malaysia · WebGL scenes (three.js r169)
 * 1. Hero globe: land drawn as glowing points, an animated flight arc from Chennai to Kuala Lumpur.
 * 2. City viewer: noise-dissolve / displacement transition between city photographs.
 */
import * as THREE from '../vendor/three.module.min.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;
const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
const root = document.documentElement;

function glOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}
if (!glOK()) root.classList.add('no-gl');

/* shared: run a render loop only while the canvas is on screen */
function loop(canvas, fn) {
  let visible = false, raf = 0;
  const tick = (t) => { raf = 0; if (!visible) return; fn(t / 1000); raf = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); }, { rootMargin: '100px' }).observe(canvas);
}

/* lat/lng -> unit vector */
function ll(lat, lng, r = 1) {
  const phi = (90 - lat) * Math.PI / 180, th = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

/* ========================= 1. GLOBE ========================= */
(function globe() {
  const canvas = document.querySelector('[data-globe]');
  if (!canvas || root.classList.contains('no-gl') || !window.TC_LAND) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch (e) { root.classList.add('no-gl'); return; }
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.set(0, 0, 4.3);
  const world = new THREE.Group(); scene.add(world);
  const globe = new THREE.Group(); world.add(globe);

  // occluding core
  const core = new THREE.Mesh(new THREE.SphereGeometry(.985, 64, 64), new THREE.MeshBasicMaterial({ color: 0x070c22 })); core.renderOrder = -1; globe.add(core);

  // land points
  const L = window.TC_LAND, n = L.length / 2;
  const pos = new Float32Array(n * 3), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) { const v = ll(L[i * 2], L[i * 2 + 1], 1.0); pos.set([v.x, v.y, v.z], i * 3); seed[i] = Math.random(); }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const MY = ll(3.139, 101.6869), MAA = ll(13.0827, 80.2707);
  const pm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: 5.2 * DPR }, uMY: { value: MY } },
    vertexShader: `
      attribute float seed; uniform float uTime; uniform float uSize; uniform vec3 uMY;
      varying float vA; varying vec3 vC;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        float d = distance(position, uMY);
        float near = smoothstep(.55, 0.0, d);
        float tw = .55 + .45 * sin(uTime * 1.6 + seed * 40.0);
        vec3 teal = vec3(0.0,.9,.83), vio = vec3(.48,.36,1.0), pink = vec3(1.0,.18,.53);
        vC = mix(mix(vio, teal, smoothstep(-.6,.6,position.y)), pink, near);
        vA = (.35 + .65 * tw) * (.55 + .45 * near);
        gl_PointSize = uSize * (1.0 + near * .9) * (3.2 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA; varying vec3 vC;
      void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if(d > .5) discard; float a = smoothstep(.5, .0, d); gl_FragColor = vec4(vC, a * vA); }`
  });
  globe.add(new THREE.Points(pg, pm));

  // faint lat/long graticule
  const gm = new THREE.LineBasicMaterial({ color: 0x3b5bff, transparent: true, opacity: .1 });
  for (let la = -60; la <= 60; la += 30) { const pts = []; for (let lo = -180; lo <= 180; lo += 4) pts.push(ll(la, lo, 1.002)); globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm)); }
  for (let lo = -180; lo < 180; lo += 30) { const pts = []; for (let la = -90; la <= 90; la += 4) pts.push(ll(la, lo, 1.002)); globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gm)); }

  // atmosphere
  const atm = new THREE.Mesh(new THREE.SphereGeometry(1.0, 64, 64), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vN; void main(){ float i = pow(max(.0, .68 - dot(vN, vec3(0,0,1.0))), 3.2); gl_FragColor = vec4(mix(vec3(0.0,.9,.83), vec3(.48,.36,1.0), .45) * i * 1.3, i * .8); }`
  }));
  atm.scale.setScalar(1.14); world.add(atm);

  // flight arc Chennai -> KL
  const mid = MAA.clone().add(MY).multiplyScalar(.5).normalize().multiplyScalar(1.42);
  const curve = new THREE.QuadraticBezierCurve3(MAA.clone().multiplyScalar(1.005), mid, MY.clone().multiplyScalar(1.005));
  const tube = new THREE.TubeGeometry(curve, 120, .006, 8, false);
  const am = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uDraw: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uDraw; varying vec2 vUv;
      void main(){ if (vUv.x > uDraw) discard;
        float dash = step(.5, fract(vUv.x * 26.0 - uTime * 1.6));
        float head = smoothstep(.12, 0.0, abs(vUv.x - fract(uTime * .28)));
        vec3 c = mix(vec3(0.0,.9,.83), vec3(1.0,.18,.53), vUv.x);
        gl_FragColor = vec4(c + head * 1.2, .35 + dash * .45 + head); }`
  });
  globe.add(new THREE.Mesh(tube, am));
  const comet = new THREE.Mesh(new THREE.SphereGeometry(.018, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  globe.add(comet);

  // city markers with pulsing rings
  function marker(v, color) {
    const g = new THREE.Group(); g.position.copy(v.clone().multiplyScalar(1.01)); g.lookAt(v.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(new THREE.CircleGeometry(.018, 24), new THREE.MeshBasicMaterial({ color, transparent: true }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(.03, .036, 40), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    g.add(dot, ring); globe.add(g); return ring;
  }
  const r1 = marker(MAA, 0x00e5d4), r2 = marker(MY, 0xff2e88);

  // orientation: face the route
  const target = MAA.clone().add(MY).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(target, new THREE.Vector3(0, 0, 1));
  globe.quaternion.copy(q);
  world.rotation.x = .18; world.rotation.z = -.12;

  // pointer + scroll influence
  const look = { x: 0, y: 0, tx: 0, ty: 0, drag: 0 };
  window.addEventListener('pointermove', (e) => { look.tx = (e.clientX / innerWidth - .5) * .5; look.ty = (e.clientY / innerHeight - .5) * .3; }, { passive: true });
  const scrollP = { v: 0 };
  if (gsap && window.ScrollTrigger) gsap.to(scrollP, { v: 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  let down = false, lx = 0;
  canvas.style.pointerEvents = 'auto'; canvas.style.cursor = 'grab'; canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => { down = true; lx = e.clientX; canvas.style.cursor = 'grabbing'; });
  window.addEventListener('pointerup', () => { down = false; canvas.style.cursor = 'grab'; });
  window.addEventListener('pointermove', (e) => { if (!down) return; look.drag += (e.clientX - lx) * .006; lx = e.clientX; });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  const t0 = performance.now() / 1000;
  if (gsap) gsap.to(am.uniforms.uDraw, { value: 1, duration: 2.6, delay: 2.6, ease: 'power2.inOut' }); else am.uniforms.uDraw.value = 1;
  loop(canvas, (t) => {
    const tt = t - t0;
    look.x += (look.tx - look.x) * .05; look.y += (look.ty - look.y) * .05;
    look.drag *= .96;
    world.rotation.y = (reduce ? 0 : Math.sin(tt * .15) * .25) + look.x + look.drag + scrollP.v * 1.4;
    world.rotation.x = .18 + look.y + scrollP.v * .35;
    camera.position.z = 4.3 + scrollP.v * 1.6;
    pm.uniforms.uTime.value = tt; am.uniforms.uTime.value = tt;
    comet.position.copy(curve.getPoint((tt * .28) % 1));
    const s = 1 + ((tt * .8) % 1) * 2.2; r1.scale.setScalar(s); r2.scale.setScalar(1 + (((tt * .8) + .5) % 1) * 2.2);
    r1.material.opacity = 1 - ((tt * .8) % 1); r2.material.opacity = 1 - (((tt * .8) + .5) % 1);
    renderer.render(scene, camera);
  });
})();

/* ========================= 2. CITY VIEWER ========================= */
(function viewer() {
  const canvas = document.querySelector('[data-viewer-gl]'), box = document.querySelector('[data-viewer]');
  if (!canvas || !box || root.classList.contains('no-gl')) return;
  const srcs = window.TC_CITIES || [];
  if (!srcs.length) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(DPR, 1.5));
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const loader = new THREE.TextureLoader(), tex = [];
  const blank = new THREE.DataTexture(new Uint8Array([7, 11, 26, 255]), 1, 1); blank.needsUpdate = true;
  const U = {
    t1: { value: blank }, t2: { value: blank }, r1: { value: new THREE.Vector2(1, 1) }, r2: { value: new THREE.Vector2(1, 1) },
    res: { value: new THREE.Vector2(1, 1) }, prog: { value: 0 }, time: { value: 0 }, mouse: { value: new THREE.Vector2(0, 0) }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D t1; uniform sampler2D t2; uniform vec2 r1; uniform vec2 r2; uniform vec2 res; uniform float prog; uniform float time; uniform vec2 mouse;
      varying vec2 vUv;
      vec2 cover(vec2 uv, vec2 ir){ float s = max(res.x / ir.x, res.y / ir.y); vec2 sz = ir * s; vec2 off = (res - sz) * .5; return (uv * res - off) / sz; }
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 4; i++){ v += a * n(p); p *= 2.1; a *= .5; } return v; }
      void main(){
        vec2 uv = vUv + mouse * .012;
        float nz = fbm(uv * 3.5 + time * .05);
        float e = prog * 1.5 - .25;
        float k = smoothstep(e - .18, e + .18, nz + uv.x * .25);
        float wob = (1.0 - abs(prog * 2. - 1.)) * .06;
        vec2 d = vec2(nz - .5) * wob;
        vec2 u1 = cover(uv + d, r1), u2 = cover(uv - d, r2);
        float ca = .004 + wob * .15;
        vec3 a = vec3(texture2D(t1, u1 + vec2(ca,0)).r, texture2D(t1, u1).g, texture2D(t1, u1 - vec2(ca,0)).b);
        vec3 b = vec3(texture2D(t2, u2 + vec2(ca,0)).r, texture2D(t2, u2).g, texture2D(t2, u2 - vec2(ca,0)).b);
        vec3 col = mix(b, a, k);
        float edge = smoothstep(.1, 0.0, abs(nz + uv.x * .25 - e)) * step(.001, prog) * step(prog, .999);
        col += vec3(0.0, .9, .83) * edge * 1.2 + vec3(1.0,.18,.53) * edge * .5 * nz;
        col *= .92 + .08 * sin(vUv.y * res.y * 1.4);
        col = mix(col, col * vec3(.85,.95,1.15), .25);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  function size(t) { return new THREE.Vector2(t.image.width || 1, t.image.height || 1); }
  function load(i) { return new Promise((res) => { if (tex[i]) return res(tex[i]); loader.load(srcs[i], (t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; tex[i] = t; res(t); }, undefined, () => res(null)); }); }
  function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); U.res.value.set(w, h); }
  new ResizeObserver(resize).observe(canvas); resize();
  load(0).then((t) => { if (!t) return; U.t1.value = t; U.r1.value = size(t); box.classList.add('gl-on'); srcs.forEach((_, i) => load(i)); });
  let busy = null;
  window.addEventListener('tc:city', async (e) => {
    const t = await load(e.detail.i); if (!t) return;
    if (busy) { busy.kill(); U.t1.value = U.t2.value; U.r1.value = U.r2.value.clone(); }
    U.t2.value = t; U.r2.value = size(t); U.prog.value = 0;
    const done = () => { U.t1.value = t; U.r1.value = size(t); U.prog.value = 0; busy = null; };
    if (gsap && !reduce) busy = gsap.to(U.prog, { value: 1, duration: 1.6, ease: 'power2.inOut', onComplete: done }); else done();
  });
  box.addEventListener('pointermove', (e) => { const r = box.getBoundingClientRect(); U.mouse.value.set((e.clientX - r.left) / r.width - .5, .5 - (e.clientY - r.top) / r.height); });
  loop(canvas, (t) => { U.time.value = t; renderer.render(scene, cam); });
})();
