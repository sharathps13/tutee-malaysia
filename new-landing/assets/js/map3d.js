/* Tutee Connect — 3D state map: every state extruded by its number of EMGS institutions (three.js r169). */
import * as THREE from '../vendor/three.module.min.js';

const root = document.documentElement;
const canvas = document.querySelector('[data-map3d]');
const stage = canvas && canvas.parentElement;
const GEO = window.MY_GEO, DATA = window.MY_STATES;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;

function ok() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

(function () {
  if (!canvas || !GEO || !DATA) return;
  if (!ok()) { root.classList.add('no-gl'); return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { root.classList.add('no-gl'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  const pivot = new THREE.Group(); scene.add(pivot);
  const map = new THREE.Group(); map.rotation.x = -Math.PI / 2; pivot.add(map);

  scene.add(new THREE.HemisphereLight(0xfff6e6, 0x8a7a66, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-4, 9, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 5, bottom: -5, near: 1, far: 30 }); sun.shadow.bias = -.0008; sun.shadow.radius = 4;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.ShadowMaterial({ opacity: .16 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.001; ground.receiveShadow = true; pivot.add(ground);

  const CX = 510, CY = 237, S = 1 / 100;
  const COLS = { red: 0xD7263D, gold: 0xF4A11A, pink: 0xE85D8E, green: 0x0F7B5F, blue: 0x2A5BD7, ink: 0x14204A };
  const tier = (n) => n >= 60 ? 'red' : n >= 20 ? 'gold' : n >= 10 ? 'pink' : n >= 5 ? 'green' : 'blue';
  const height = (n) => .08 + Math.log1p(n) * .3;
  const meshes = [], byName = {};

  Object.entries(GEO.shapes).forEach(([name, polys]) => {
    const n = (DATA[name] && DATA[name].count) || 0;
    const shapes = polys.map((pts) => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => { const X = (x - CX) * S, Y = -(y - CY) * S; i ? s.lineTo(X, Y) : s.moveTo(X, Y); }); return s; });
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: height(n), bevelEnabled: true, bevelThickness: .015, bevelSize: .012, bevelSegments: 2, curveSegments: 4 });
    const mat = new THREE.MeshStandardMaterial({ color: COLS[tier(n)], roughness: .55, metalness: .05, emissive: 0x000000 });
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
    m.userData = { name, n, base: COLS[tier(n)] };
    map.add(m); meshes.push(m); (byName[name] = byName[name] || []).push(m);
  });
  // pillars for the tiny federal territories so they can be seen and tapped
  ['Kuala Lumpur', 'Putrajaya', 'Labuan'].forEach((name) => {
    const d = GEO.dots[name]; if (!d) return;
    const n = (DATA[name] && DATA[name].count) || 0, h = height(n) + .05;
    const geo = new THREE.CylinderGeometry(.075, .075, h, 28); geo.rotateX(Math.PI / 2); geo.translate(0, 0, h / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: COLS[tier(n)], roughness: .4, emissive: 0x000000 }));
    m.position.set((d[0] - CX) * S, -(d[1] - CY) * S, 0); m.castShadow = true;
    m.userData = { name, n, base: COLS[tier(n)] }; map.add(m); meshes.push(m); (byName[name] = byName[name] || []).push(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.11, .14, 40), new THREE.MeshBasicMaterial({ color: COLS[tier(n)], transparent: true, opacity: .6 }));
    ring.position.set(m.position.x, m.position.y, .005); map.add(ring); m.userData.ring = ring;
  });

  // floating labels for the busiest states
  scene.updateMatrixWorld(true);
  const labels = [];
  Object.entries(DATA).filter(([, d]) => d.count >= 15).forEach(([name, d]) => {
    const ms = byName[name]; if (!ms) return;
    const box = new THREE.Box3(); ms.forEach((m) => box.expandByObject(m));
    let c = box.getCenter(new THREE.Vector3());
    if (GEO.dots[name]) { const p = GEO.dots[name]; c = new THREE.Vector3((p[0] - CX) * S, 0, (p[1] - CY) * S); }
    const el = document.createElement('div'); el.className = 'm-lab'; el.innerHTML = '<b>' + d.count + '</b>' + name;
    stage.appendChild(el); labels.push({ el, pos: new THREE.Vector3(c.x, height(d.count) + .25, c.z) });
  });
  const css = document.createElement('style');
  css.textContent = '.m-lab{position:absolute;left:0;top:0;z-index:2;pointer-events:none;transform:translate(-50%,-100%);font:700 .7rem "Inter Tight",sans-serif;color:#14204A;white-space:nowrap;background:rgba(255,255,255,.88);padding:.2rem .45rem;border-radius:6px;box-shadow:0 6px 14px -8px rgba(20,32,74,.6);transition:opacity .3s}.m-lab b{font:800 .8rem Syne,sans-serif;color:#D7263D;margin-right:.3rem}@media(max-width:640px){.m-lab{font-size:.58rem}.m-lab b{font-size:.66rem}}';
  document.head.appendChild(css);

  // camera framing
  const look = new THREE.Vector3(0, 0, .15);
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const tf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(6.3 / (tf * camera.aspect), 3.9 / tf);
    camera.position.set(0, dist * .8, dist * .6); camera.lookAt(look); camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  // grow-in
  meshes.forEach((m) => m.scale.set(1, 1, .02));
  let grown = false;
  function grow() {
    if (grown) return; grown = true;
    meshes.forEach((m, i) => { if (gsap && !reduce) gsap.to(m.scale, { z: 1, duration: 1.4, ease: 'elastic.out(1,.6)', delay: .1 + i * .05 }); else m.scale.z = 1; });
  }
  new IntersectionObserver(([e]) => { if (e.isIntersecting) grow(); }, { threshold: .3 }).observe(canvas);

  // interaction
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), tip = document.querySelector('[data-map-tip]');
  let hover = null, selected = 'Selangor', rotY = 0, velY = 0, dragging = false, lastX = 0, downX = 0, downT = 0;
  function paint() {
    meshes.forEach((m) => {
      const on = m.userData.name === selected, hv = m.userData.name === hover;
      m.material.color.setHex(on ? COLS.ink : m.userData.base);
      m.material.emissive.setHex(hv && !on ? 0x332211 : 0x000000);
      const target = on ? .12 : 0;
      if (gsap && !reduce) gsap.to(m.position, { z: target + (m.userData.ring ? 0 : 0), duration: .5, ease: 'expo.out', overwrite: 'auto' }); else m.position.z = target;
    });
  }
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? hit.object.userData.name : null;
  }
  canvas.addEventListener('pointermove', (e) => {
    if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; velY = dx * .006; rotY += velY; return; }
    const n = pick(e);
    if (n !== hover) { hover = n; paint(); canvas.style.cursor = n ? 'pointer' : 'grab'; }
    if (n) { const r = stage.getBoundingClientRect(); tip.innerHTML = n + ' · <b>' + DATA[n].count + '</b> institutions'; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.style.opacity = 1; }
    else tip.style.opacity = 0;
  });
  canvas.addEventListener('pointerleave', () => { hover = null; paint(); tip.style.opacity = 0; });
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = downX = e.clientX; downT = performance.now(); });
  window.addEventListener('pointerup', (e) => {
    if (!dragging) return; dragging = false;
    if (Math.abs(e.clientX - downX) < 6 && performance.now() - downT < 400) {
      const n = pick(e); if (n) { selected = n; paint(); window.dispatchEvent(new CustomEvent('tc:state-pick', { detail: n })); }
    }
  });
  window.addEventListener('tc:state-set', (e) => { selected = e.detail; paint(); });
  paint();

  // render loop
  let visible = false, raf = 0; const v = new THREE.Vector3(), t0 = performance.now();
  function frame() {
    raf = 0; if (!visible) return;
    if (!dragging) { velY *= .94; rotY += velY; }
    const t = (performance.now() - t0) / 1000;
    pivot.rotation.y = rotY + (reduce ? 0 : Math.sin(t * .25) * .06);
    meshes.forEach((m) => { if (m.userData.ring) { const s = 1 + (t * .8 % 1) * 1.6; m.userData.ring.scale.set(s, s, 1); m.userData.ring.material.opacity = .6 * (1 - (t * .8 % 1)); } });
    renderer.render(scene, camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    labels.forEach((l) => { v.copy(l.pos).applyMatrix4(pivot.matrixWorld).project(camera); l.el.style.left = ((v.x + 1) / 2 * w) + 'px'; l.el.style.top = ((1 - v.y) / 2 * h) + 'px'; l.el.style.opacity = grown ? 1 : 0; });
    raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(canvas);
})();
