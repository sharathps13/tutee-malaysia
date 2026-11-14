/* Hero slideshow in WebGL: a liquid, noise-driven wipe between HD photographs, with a slow
   Ken Burns drift and a little mouse parallax. app.js owns the timing and dispatches
   "tc:hero-go"; if WebGL is unavailable, app.js falls back to a CSS crossfade. */
import * as THREE from '../vendor/three.module.min.js';

const canvas = document.querySelector('[data-hero-gl]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const imgs = Array.from(document.querySelectorAll('[data-hs]'));

function boot() {
  if (!canvas || reduce || !imgs.length) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) { return; }
  if (!renderer.getContext()) return;
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const small = window.innerWidth < 900;
  const srcs = imgs.map((im) => (small ? im.getAttribute('data-src-m') : im.getAttribute('data-src')));
  const loader = new THREE.TextureLoader();
  const tex = [];
  const load = (i) => tex[i] || (tex[i] = new Promise((res) => {
    loader.load(srcs[i], (t) => {
      t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.userData.aspect = t.image.width / t.image.height;
      res(t);
    }, undefined, () => res(null));
  }));

  const uniforms = {
    uT0: { value: null }, uT1: { value: null }, uA0: { value: 1.5 }, uA1: { value: 1.5 },
    uScr: { value: 1.5 }, uP: { value: 0 }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() },
    uZ0: { value: 1 }, uZ1: { value: 1.15 }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uT0, uT1; uniform float uA0, uA1, uScr, uP, uTime, uZ0, uZ1; uniform vec2 uMouse;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= .5; } return v; }
      vec2 cover(vec2 uv, float ia, float z){
        vec2 s = uScr > ia ? vec2(1., ia / uScr) : vec2(uScr / ia, 1.);
        return (uv - .5) * s / z + .5;
      }
      void main(){
        vec2 p = vUv * vec2(uScr, 1.);
        float n = fbm(p * 1.8 + vec2(uTime * .02, -uTime * .015));
        n = n * .85 + (1. - vUv.y) * .15;
        float T = uP * 1.35 - .2;
        float m = 1. - smoothstep(T - .09, T + .09, n);
        vec2 d = vec2(n - .5) * .18;
        vec2 par = uMouse * .012;
        vec2 uv0 = cover(vUv + par, uA0, uZ0) + d * uP * .7;
        vec2 uv1 = cover(vUv + par * 1.4, uA1, uZ1) - d * (1. - uP) * .7;
        vec3 c0 = texture2D(uT0, clamp(uv0, .001, .999)).rgb;
        vec3 c1 = texture2D(uT1, clamp(uv1, .001, .999)).rgb;
        float live = step(.001, uP) * step(uP, .999);
        float rim = (1. - smoothstep(0., .035, abs(n - T))) * live;
        vec3 col = mix(c0, c1, m) + vec3(1., .78, .3) * rim * .45;
        gl_FragColor = vec4(col, 1.);
      }`
  });
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  function size() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); uniforms.uScr.value = w / h;
  }
  size(); window.addEventListener('resize', size);

  let cur = 0, busy = false, queued = null, visible = true, running = true, t0 = performance.now(), zStart = performance.now();
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => { mouse.x = (e.clientX / window.innerWidth - .5) * 2; mouse.y = (e.clientY / window.innerHeight - .5) * -2; }, { passive: true });

  function frame(now) {
    if (running && visible) {
      uniforms.uTime.value = (now - t0) / 1000;
      uniforms.uMouse.value.x += (mouse.x - uniforms.uMouse.value.x) * .05;
      uniforms.uMouse.value.y += (mouse.y - uniforms.uMouse.value.y) * .05;
      if (!busy) uniforms.uZ0.value = 1 + Math.min((now - zStart) / 9000, 1) * .07;
      renderer.render(scene, cam);
    }
    requestAnimationFrame(frame);
  }

  function go(i) {
    if (i === cur) return;
    if (busy) { queued = i; return; }
    busy = true;
    load(i).then((t) => {
      if (!t) { busy = false; return; }
      uniforms.uT1.value = t; uniforms.uA1.value = t.userData.aspect; uniforms.uP.value = 0; uniforms.uZ1.value = 1.16;
      const start = performance.now(), dur = 1700, z0 = uniforms.uZ0.value;
      const ease = (x) => 1 - Math.pow(1 - x, 3);
      (function step(now) {
        const k = Math.min((now - start) / dur, 1), e = ease(k);
        uniforms.uP.value = e; uniforms.uZ1.value = 1.16 - .16 * e; uniforms.uZ0.value = z0 + .05 * e;
        if (k < 1) requestAnimationFrame(step);
        else {
          uniforms.uT0.value = t; uniforms.uA0.value = t.userData.aspect; uniforms.uP.value = 0; uniforms.uZ0.value = 1; zStart = performance.now();
          cur = i; busy = false;
          if (queued !== null && queued !== cur) { const q = queued; queued = null; go(q); } else queued = null;
        }
      })(start);
    });
  }

  load(0).then((t) => {
    if (!t) return;
    uniforms.uT0.value = t; uniforms.uA0.value = t.userData.aspect; uniforms.uT1.value = t; uniforms.uA1.value = t.userData.aspect;
    renderer.render(scene, cam);
    document.documentElement.classList.add('gl');
    window.dispatchEvent(new CustomEvent('tc:hero-ready'));
    requestAnimationFrame(frame);
    setTimeout(() => { for (let k = 1; k < srcs.length; k++) load(k); }, 1200);
  });

  window.addEventListener('tc:hero-go', (e) => go(e.detail));
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(canvas);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
}
boot();
