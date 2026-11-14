/* v13.7 Why Malaysia: each of the six reasons gets its own small 3D object, drawn by one shared WebGL canvas
   (one renderer, six scissored viewports). Point at a card to turn its object; hover or tap plays its story.
   391 → a campus city rising · RM 14k → a stack of ringgit · 12 months → a dial of months and a mortarboard
   UK·AU → a globe with routes into Malaysia · 3 cultures → three rings that come together · ~4 h → a flight MAA to KUL */
import * as THREE from '../vendor/three.module.min.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const grid = document.querySelector('.reasons');
const slots = grid ? [...grid.querySelectorAll('[data-w3]')] : [];
if (grid && slots.length) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ok = false; try { const c = document.createElement('canvas'); ok = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
  if (!ok) { grid.classList.add('w3-off'); return; }

  const canvas = document.createElement('canvas'); canvas.className = 'w3-gl'; canvas.setAttribute('aria-hidden', 'true'); grid.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0); renderer.autoClear = false;
  const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
  const fit = () => renderer.setSize(grid.clientWidth, grid.clientHeight, false);
  fit(); new ResizeObserver(fit).observe(grid);

  const GOLD = 0xD9B25A, NAVY = 0x1B2A6B, RED = 0xC8102E, SUN = 0xFFCC00, IVORY = 0xF4EEDF;
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  const back = (x) => { x = Math.min(1, Math.max(0, x)); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const metal = (color, r = .3, m = .9) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m });
  function baseScene(camPos, look) {
    const scene = new THREE.Scene(); scene.environment = env;
    const key = new THREE.DirectionalLight(0xFFF1D6, 1.8); key.position.set(4, 7, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7FA7FF, .9); rim.position.set(-5, 3, -4); scene.add(rim);
    const camera = new THREE.PerspectiveCamera(32, 1.6, .1, 100); camera.position.copy(camPos); camera.lookAt(look);
    const group = new THREE.Group(); scene.add(group);
    return { scene, camera, group };
  }

  /* 1 · 391 institutions: a miniature university campus (great hall with a dome and portico, clock tower,
     faculty blocks with lit windows, trees and paths) that rises building by building */
  function windowTex(lit) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#E7DFCC'; x.fillRect(0, 0, 64, 64);
    x.fillStyle = 'rgba(0,0,0,.07)'; x.fillRect(0, 56, 64, 8);
    for (let i = 0; i < 2; i++) { const on = lit && Math.random() > .35; x.fillStyle = on ? '#FFD27A' : '#22305F'; x.fillRect(8 + i * 28, 14, 20, 30); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(8 + i * 28, 14, 20, 3); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
  }
  function city() {
    const v = baseScene(new THREE.Vector3(10.8, 7.6, 10.8), new THREE.Vector3(0, .95, 0));
    v.scene.environmentIntensity = .55;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const sun = new THREE.DirectionalLight(0xFFE2B8, 2.8); sun.position.set(-6, 8, 3); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 }); sun.shadow.bias = -.0008;
    v.scene.add(sun);
    const winA = windowTex(true), winB = windowTex(false);
    const roofM = new THREE.MeshStandardMaterial({ color: 0x3A3F52, roughness: .8 });
    const terra = new THREE.MeshStandardMaterial({ color: 0xA8452E, roughness: .7 });
    const stone = new THREE.MeshStandardMaterial({ color: 0xEDE6D6, roughness: .6 });
    const goldM = metal(GOLD, .25, 1), glass = new THREE.MeshStandardMaterial({ color: 0x24357E, roughness: .1, metalness: .8 });
    const shadowAll = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    const blds = [];
    const add = (g, x, z, d, ry = 0) => { g.position.set(x, 0, z); g.rotation.y = ry; shadowAll(g); v.group.add(g); blds.push({ g, d }); return g; };
    const facade = (w, h, dp, lit = true) => {
      const mk = (u) => { const t = (lit ? winA : winB).clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(u / .42)), Math.max(1, Math.round(h / .42))); return new THREE.MeshStandardMaterial({ map: t, roughness: .65 }); };
      const sw = mk(w), sd = mk(dp);
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), [sd, sd, roofM, roofM, sw, sw]); m.position.y = h / 2; return m;
    };
    // ground: lawn on a stone plinth, with paths
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.6, .3, 9.6), new THREE.MeshStandardMaterial({ color: 0x1A2350, roughness: .8 })); plinth.position.y = -.15; plinth.receiveShadow = true; v.group.add(plinth);
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(9.2, .06, 9.2), new THREE.MeshStandardMaterial({ color: 0x23573A, roughness: .95 })); lawn.position.y = .03; lawn.receiveShadow = true; v.group.add(lawn);
    [[0, 0, 9.2, .55], [0, 0, .55, 9.2]].forEach(([x, z, w, d]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(w, .07, d), stone); p.position.set(x, .04, z); p.receiveShadow = true; v.group.add(p); });
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .08, 48), stone); plaza.position.y = .05; plaza.receiveShadow = true; v.group.add(plaza);
    // great hall with portico and gold dome (centre-back)
    { const g = new THREE.Group(); const body = facade(3, 1.1, 1.6); g.add(body);
      const step = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, .5), stone); step.position.set(0, .06, 1.05); g.add(step);
      for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 1.05, 12), stone); c.position.set(-1.25 + i * .5, .63, 1.05); g.add(c); }
      const pedm = new THREE.Mesh(new THREE.BoxGeometry(3.1, .12, .55), stone); pedm.position.set(0, 1.16, 1.05); g.add(pedm);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(.62, .66, .38, 32), stone); drum.position.y = 1.29; g.add(drum);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), goldM); dome.position.y = 1.48; g.add(dome);
      const fin = new THREE.Mesh(new THREE.ConeGeometry(.05, .35, 8), goldM); fin.position.y = 2.25; g.add(fin);
      add(g, 0, -2.2, .2); }
    // clock tower
    { const g = new THREE.Group(); const shaft = facade(.62, 3.1, .62, false); g.add(shaft);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(.55, .75, 4), terra); cap.rotation.y = Math.PI / 4; cap.position.y = 3.48; g.add(cap);
      [[0, .32], [Math.PI / 2, .32]].forEach(([ry]) => { [-1, 1].forEach((sgn) => { const f = new THREE.Mesh(new THREE.CircleGeometry(.2, 24), new THREE.MeshStandardMaterial({ color: 0xFFF6DD, emissive: 0xFFE7A0, emissiveIntensity: .5 })); f.position.set(Math.sin(ry) * .315 * sgn, 2.75, Math.cos(ry) * .315 * sgn); f.rotation.y = ry + (sgn < 0 ? Math.PI : 0); g.add(f); }); });
      add(g, 2.75, -.9, .5); }
    // faculty blocks with terracotta roofs and lit windows
    const block = (w, h, dp, x, z, ry, pitched) => { const g = new THREE.Group(); g.add(facade(w, h, dp));
      if (pitched) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0, .5, 1, 4, 1), terra); r.rotation.y = Math.PI / 4; r.scale.set(w * 1.45, .55, dp * 1.45); r.position.y = h + .27; g.add(r); }
      else { const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + .08, .1, dp + .08), stone); parapet.position.y = h + .05; g.add(parapet); }
      return add(g, x, z, Math.hypot(x, z) * .12, ry); };
    block(2.1, 1.3, .95, -2.6, -2.7, 0, true);
    block(1.0, 2.2, 1.0, -3.2, -.4, 0, false);
    block(2.2, 1.0, .9, -2.4, 2.6, 0, true);
    block(1.7, 1.5, .9, 2.4, 2.7, 0, true);
    block(.95, 1.8, 1.6, 3.4, 1.0, 0, false);
    // a glass library tower
    { const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.6, 1.1), glass); t.position.y = 1.3; g.add(t);
      for (let i = 1; i < 6; i++) { const band = new THREE.Mesh(new THREE.BoxGeometry(1.14, .05, 1.14), stone); band.position.y = i * .44; g.add(band); }
      add(g, -.9, 2.9, .45); }
    // trees around the lawn
    const leaf = new THREE.MeshStandardMaterial({ color: 0x3E8A55, roughness: .85 }), trunk = new THREE.MeshStandardMaterial({ color: 0x5B4030, roughness: .9 });
    [[-1.3, -.9], [1.3, -.9], [-1.3, 1.1], [1.3, 1.1], [-4, -3.6], [4, -3.6], [-4, 3.9], [4, 3.9], [.9, -4], [-4.1, 1.3], [4.1, -2.3], [1.8, 4.1], [-1.9, 4.2]].forEach(([x, z], i) => {
      const g = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(.04, .06, .35, 8), trunk); tr.position.y = .17; g.add(tr);
      const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(.28 + (i % 3) * .05, 1), leaf); cr.position.y = .5; g.add(cr); add(g, x, z, .9 + i * .03);
    });
    let rise = 0;
    v.play = () => { rise = 0; };
    v.update = (t, dt, h) => {
      rise += dt * (h ? 1.3 : .85);
      blds.forEach((b) => { const k = back((rise - b.d) / .7); b.g.scale.set(1, Math.max(.001, k), 1); b.g.visible = k > .001; });
    };
    v.spin = .1; v.base = .55;
    return v;
  }

  /* 2 · RM 14k: fourteen ringgit coins dropping onto a stack */
  function coins() {
    const v = baseScene(new THREE.Vector3(0, 3.6, 8.4), new THREE.Vector3(0, 1.45, 0));
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(90, 80, 10, 128, 128, 128); g.addColorStop(0, '#FBE7A6'); g.addColorStop(.6, '#D9B25A'); g.addColorStop(1, '#8F6A22');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(80,55,10,.6)'; x.lineWidth = 6; x.beginPath(); x.arc(128, 128, 108, 0, 7); x.stroke();
    x.fillStyle = '#6E4F12'; x.font = '700 92px Fraunces, Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('RM', 128, 136);
    const face = new THREE.CanvasTexture(c); face.colorSpace = THREE.SRGBColorSpace;
    const geo = new THREE.CylinderGeometry(.95, .95, .17, 56);
    const side = metal(GOLD, .28, 1), top = new THREE.MeshStandardMaterial({ map: face, metalness: .95, roughness: .3 });
    const list = [];
    const spot = (i) => i < 14 ? [Math.sin(i * 2.1) * .05, .09 + i * .18, Math.cos(i * 1.7) * .05, (i * .37) % 1] : null;
    for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(geo, [side, top, top]); v.group.add(m); list.push(m); }
    const loose = [[-1.9, .09, .7, .2], [1.85, .09, .5, 1.1], [1.25, .35, 1.25, .5]];
    loose.forEach(([lx, ly, lz, rot], k) => { const m = new THREE.Mesh(geo, [side, top, top]); m.position.set(lx, ly, lz); m.rotation.set(k === 2 ? .45 : 0, rot, k === 2 ? .3 : 0); v.group.add(m); });
    let tl = 0;
    v.play = () => { tl = 0; };
    v.update = (t, dt, h) => {
      tl += dt * (h ? 1.5 : 1);
      list.forEach((m, i) => { const [px, py, pz, r0] = spot(i); const f = ease((tl - i * .08) / .45); m.position.set(px, py + (1 - f) * 5, pz); m.rotation.y = r0 * 6 + (1 - f) * 3; m.visible = f > 0; });
    };
    v.spin = .15; v.base = .3;
    return v;
  }

  /* 3 · 12-month Graduate Pass: a dial of twelve months lighting up round a mortarboard */
  function months() {
    const v = baseScene(new THREE.Vector3(0, 4.6, 7.6), new THREE.Vector3(0, .5, 0));
    const tiles = [], tg = new THREE.BoxGeometry(.78, .14, .5);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2, m = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: 0x24357E, roughness: .4, metalness: .5, emissive: 0x000000 }));
      m.position.set(Math.cos(a) * 2.45, 0, Math.sin(a) * 2.45); m.rotation.y = -a + Math.PI / 2; v.group.add(m); tiles.push(m);
    }
    const ink = metal(0x0E1430, .5, .3);
    const cap = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, .08, 1.9), ink); board.position.y = .78; board.rotation.y = Math.PI / 4; cap.add(board);
    const skull = new THREE.Mesh(new THREE.CylinderGeometry(.62, .72, .62, 40), ink); skull.position.y = .42; cap.add(skull);
    const btn = new THREE.Mesh(new THREE.SphereGeometry(.08, 16, 16), metal(SUN, .3, 1)); btn.position.y = .85; cap.add(btn);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .95, 8), metal(SUN, .4, 1)); cord.position.set(.62, .62, .62); cord.rotation.z = .25; cap.add(cord);
    const tass = new THREE.Mesh(new THREE.ConeGeometry(.09, .32, 12), metal(SUN, .4, 1)); tass.position.set(.66, .1, .64); cap.add(tass);
    v.group.add(cap);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, .06, 64), metal(0x0B133A, .7, .3)); disc.position.y = -.12; v.group.add(disc);
    let tl = 0, hop = 9;
    const lit = new THREE.Color(SUN), off = new THREE.Color(0x24357E);
    v.play = () => { tl = 0; hop = 0; };
    v.update = (t, dt, h) => {
      tl += dt * (h ? 9 : 2.2); hop += dt;
      const n = h ? Math.min(12, tl) : (tl % 15);
      tiles.forEach((m, i) => { const on = Math.min(1, Math.max(0, n - i)); m.material.color.copy(off).lerp(lit, on); m.material.emissive.copy(lit).multiplyScalar(on * .35); m.position.y = on * .08; });
      const k = Math.min(1, hop / .9); cap.position.y = Math.sin(k * Math.PI) * 1.1; cap.rotation.y = k * Math.PI * 2 + Math.sin(t * .8) * .15;
    };
    v.spin = .1; v.base = 0;
    return v;
  }

  /* 4 · UK and Australian branch campuses: a globe with routes landing in Malaysia */
  function globe() {
    const v = baseScene(new THREE.Vector3(0, .6, 7.4), new THREE.Vector3(0, 0, 0));
    const R = 1.75, at = (lat, lon, r = R) => { const p = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(th), r * Math.cos(p), r * Math.sin(p) * Math.sin(th)); };
    const earth = new THREE.Group(); v.group.add(earth);
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshStandardMaterial({ color: 0x14205A, roughness: .55, metalness: .35 })));
    const n = 1600, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = i * 2.39996; pos.set([Math.cos(th) * rr * (R + .005), y * (R + .005), Math.sin(th) * rr * (R + .005)], i * 3); }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    earth.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x7FA7FF, size: .035, transparent: true, opacity: .55 })));
    const MY = at(3.1, 101.7), UK = at(52.5, -1.5), AU = at(-37.8, 145);
    const pin = (p, c, s = .07) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 16), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .6 })); m.position.copy(p); earth.add(m); return m; };
    pin(UK, GOLD); pin(AU, GOLD); pin(MY, RED, .1);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.12, .16, 32), new THREE.MeshBasicMaterial({ color: RED, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.copy(MY.clone().multiplyScalar(1.004)); ring.lookAt(MY.clone().multiplyScalar(2)); earth.add(ring);
    const arcMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uH: { value: 0 } },
      vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float uT, uH; varying float vU; void main(){ float head = fract(uT); float d = head - vU; float trail = d > 0. ? exp(-d * (6. - uH * 3.)) : 0.; float dash = step(.45, fract(vU * 26. - uT * 2.)); vec3 c = mix(vec3(1., .8, .3), vec3(1.), trail); gl_FragColor = vec4(c, .22 * dash + trail * (.75 + uH * .25)); }' });
    const arcs = [UK, AU].map((p) => {
      const mid = p.clone().add(MY).multiplyScalar(.5); mid.setLength(R + p.distanceTo(MY) * .45);
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p, mid, MY), 64, .03, 8), arcMat()); earth.add(m); return m;
    });
    earth.rotation.y = Math.atan2(-MY.x, MY.z) + .5; earth.rotation.x = .32;
    const baseY = earth.rotation.y;
    v.play = () => {};
    v.update = (t, dt, h) => {
      arcs.forEach((a, i) => { a.material.uniforms.uT.value += dt * (h ? .75 : .3); a.material.uniforms.uH.value += ((h ? 1 : 0) - a.material.uniforms.uH.value) * .1; if (!i) a.material.uniforms.uT.value = a.material.uniforms.uT.value; });
      arcs[1].material.uniforms.uT.value = arcs[0].material.uniforms.uT.value + .5;
      const pulse = (t * .8) % 1; ring.scale.setScalar(1 + pulse * 2.2); ring.material.opacity = (1 - pulse) * .9;
      earth.rotation.y = baseY + (reduce ? 0 : Math.sin(t * .25) * .45);
    };
    v.spin = 0; v.base = 0;
    return v;
  }

  /* 5 · Three cultures, one campus: three rings that drift apart and lock together */
  function rings() {
    const v = baseScene(new THREE.Vector3(0, .4, 7.6), new THREE.Vector3(0, 0, 0));
    const defs = [[RED, 1.45, [-.85, .45, 0]], [SUN, 1.2, [.85, .45, 0]], [0x2D5BD3, .97, [0, -.75, 0]]];
    const rs = defs.map(([c, r, p], i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, .1, 24, 120), new THREE.MeshStandardMaterial({ color: c, roughness: .22, metalness: .75 })); m.userData.home = new THREE.Vector3(...p); m.userData.i = i; v.group.add(m); return m; });
    const core = new THREE.Mesh(new THREE.SphereGeometry(.22, 32, 32), new THREE.MeshStandardMaterial({ color: IVORY, emissive: 0xFFE7A0, emissiveIntensity: .6, roughness: .3 })); v.group.add(core);
    let mix = 0;
    v.play = () => {};
    v.update = (t, dt, h) => {
      mix += ((h ? 1 : 0) - mix) * Math.min(1, dt * 3);
      const e = ease(mix);
      rs.forEach((m, i) => {
        m.position.copy(m.userData.home).multiplyScalar(1 - e);
        const s = reduce ? 0 : t * (.35 + i * .12) * (1 + e * 2.2);
        m.rotation.set(e * (i === 0 ? s : i === 1 ? Math.PI / 2 : .6 + s * .7), e * (i === 1 ? s : i * .9), i * .3 + (1 - e) * s * .2);
      });
      core.scale.setScalar(.4 + e * .9);
    };
    v.spin = .12; v.base = 0;
    return v;
  }

  /* 6 · About four hours from Chennai: a plane flying the MAA to KUL arc */
  function flight() {
    const v = baseScene(new THREE.Vector3(0, 3.6, 10.2), new THREE.Vector3(0, 1.1, 0));
    const A = new THREE.Vector3(-2.7, .15, .3), B = new THREE.Vector3(2.7, .15, -.3);
    const curve = new THREE.QuadraticBezierCurve3(A, new THREE.Vector3(0, 3.1, 0), B);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, .06, 64), metal(0x0B133A, .7, .3)); pad.position.y = -.03; v.group.add(pad);
    const gridM = new THREE.Mesh(new THREE.RingGeometry(1.2, 3.2, 64, 4), new THREE.MeshBasicMaterial({ color: 0x3A4C9A, wireframe: true, transparent: true, opacity: .25 })); gridM.rotation.x = -Math.PI / 2; gridM.position.y = .01; v.group.add(gridM);
    const pinAt = (p, c) => { const g = new THREE.Group(); const head = new THREE.Mesh(new THREE.SphereGeometry(.17, 24, 24), metal(c, .3, .6)); head.position.y = .55; const stem = new THREE.Mesh(new THREE.ConeGeometry(.12, .45, 24), metal(c, .3, .6)); stem.rotation.x = Math.PI; stem.position.y = .25; g.add(head, stem); g.position.copy(p).setY(0); v.group.add(g); };
    pinAt(A, 0xFF9B71); pinAt(B, RED);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 96, .025, 8), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uP: { value: 0 } },
      vertexShader: 'varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'uniform float uP; varying float vU; void main(){ float dash = step(.5, fract(vU * 30.)); float done = step(vU, uP); gl_FragColor = vec4(mix(vec3(1.), vec3(1., .8, .2), done), done > .5 ? .95 : .3 * dash); }' }));
    v.group.add(tube);
    const plane = new THREE.Group(), white = metal(0xF4F6FA, .35, .5), red = metal(RED, .4, .5);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.11, .78, 8, 16), white); body.rotation.z = Math.PI / 2; plane.add(body);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(.3, .025, 1.25), white); wing.position.x = .04; plane.add(wing);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(.18, .025, .5), white); tail.position.x = -.42; plane.add(tail);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(.2, .3, .025), red); fin.position.set(-.44, .16, 0); plane.add(fin);
    plane.scale.setScalar(.95); v.group.add(plane);
    const X = new THREE.Vector3(1, 0, 0); let u = 0, wait = 0;
    v.play = () => { u = 0; wait = 0; };
    v.update = (t, dt, h) => {
      if (u >= 1) { wait += dt; if (wait > (h ? .6 : 1.6)) { u = 0; wait = 0; } }
      else u = Math.min(1, u + dt * (h ? .55 : .22));
      const f = ease(u * 1.02) * .5 + u * .5;
      plane.position.copy(curve.getPoint(Math.min(1, f))); plane.position.y += .12;
      plane.quaternion.setFromUnitVectors(X, curve.getTangent(Math.min(.999, f)).normalize());
      plane.rotateX(Math.sin(f * Math.PI) * .25);
      tube.material.uniforms.uP.value = f;
    };
    v.spin = 0; v.base = .1;
    return v;
  }

  const makers = [city, coins, months, globe, rings, flight];
  const views = slots.map((el, i) => {
    const v = (makers[+el.getAttribute('data-w3')] || city)();
    Object.assign(v, { el, card: el.closest('.rs'), hover: false, px: 0, py: 0, sx: 0, sy: 0, intro: 0, delay: i * .1 });
    v.card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch') return; v.hover = true; v.play(); });
    v.card.addEventListener('pointerleave', () => { v.hover = false; v.px = v.py = 0; });
    v.card.addEventListener('pointermove', (e) => { const r = v.card.getBoundingClientRect(); v.px = ((e.clientX - r.left) / r.width) * 2 - 1; v.py = ((e.clientY - r.top) / r.height) * 2 - 1; });
    v.card.addEventListener('focus', () => { v.hover = true; v.play(); }); v.card.addEventListener('blur', () => { v.hover = false; });
    v.card.addEventListener('click', () => { if (!v.hover) { v.hover = true; v.play(); clearTimeout(v.tm); v.tm = setTimeout(() => { v.hover = false; }, 2600); } });
    return v;
  });

  let visible = false, raf = 0, started = 0, last = 0; const clock = new THREE.Clock();
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !started) started = clock.getElapsedTime() + .25; if (visible && !raf) loop(); }, { rootMargin: '80px' }).observe(grid);
  function loop() {
    raf = 0; if (!visible) return;
    const t = clock.getElapsedTime(), dt = Math.min(.05, Math.max(.001, t - last)); last = t;
    const gr = canvas.getBoundingClientRect(), H = canvas.clientHeight;
    renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
    views.forEach((v) => {
      const r = v.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight || r.width < 4) return;
      const x = r.left - gr.left, y = r.top - gr.top;
      renderer.setViewport(x, H - y - r.height, r.width, r.height); renderer.setScissor(x, H - y - r.height, r.width, r.height);
      v.camera.aspect = r.width / r.height; v.camera.updateProjectionMatrix();
      const k = 1 - Math.exp(-dt * 4); v.sx += (v.px - v.sx) * k; v.sy += (v.py - v.sy) * k;
      v.intro = Math.min(1, Math.max(0, (t - started - v.delay) / 1.1));
      v.group.scale.setScalar(Math.max(.001, back(v.intro)));
      v.group.rotation.y = v.base + (reduce ? 0 : t * v.spin) + v.sx * .55;
      v.group.rotation.x = v.sy * .18;
      v.update(t, dt, v.hover);
      renderer.render(v.scene, v.camera);
    });
    raf = requestAnimationFrame(loop);
  }
}
