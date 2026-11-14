/* Tutee Connect — "dye on cloth" fluid.
 * A compact WebGL2 stable-fluids solver (advection, vorticity confinement, Jacobi pressure)
 * written for this page; the approach follows Pavel Dobryakov's MIT-licensed WebGL Fluid Simulation.
 * Usage: TCDye(canvas, { interactive: true, bg: [r,g,b] }) -> controller or null.
 */
(function () {
  'use strict';
  var PALETTE = [[0.84, 0.15, 0.24], [0.96, 0.63, 0.10], [0.06, 0.48, 0.37], [0.16, 0.36, 0.84], [0.91, 0.36, 0.56], [0.48, 0.31, 0.82]];

  function TCDye(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl2', { alpha: false, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    if (!gl.getExtension('EXT_color_buffer_float')) return null;
    gl.getExtension('OES_texture_float_linear');

    var SIM = opts.sim || 128, DYE = opts.dye || 720;
    var CFG = { velDiss: 0.25, dyeDiss: opts.dyeDiss || 0.6, pressure: 0.8, iters: 18, curl: 22, radius: opts.radius || 0.22, force: 5200 };
    var BG = opts.bg || [0.078, 0.125, 0.29];

    var VS = '#version 300 es\nprecision highp float;in vec2 aP;uniform vec2 tx;out vec2 vUv,vL,vR,vT,vB;void main(){vUv=aP*.5+.5;vL=vUv-vec2(tx.x,0.);vR=vUv+vec2(tx.x,0.);vT=vUv+vec2(0.,tx.y);vB=vUv-vec2(0.,tx.y);gl_Position=vec4(aP,0.,1.);}';
    var HEAD = '#version 300 es\nprecision highp float;precision highp sampler2D;in vec2 vUv,vL,vR,vT,vB;out vec4 o;';
    var FS = {
      splat: HEAD + 'uniform sampler2D uT;uniform float ar,rad;uniform vec3 col;uniform vec2 pt;void main(){vec2 p=vUv-pt;p.x*=ar;vec3 s=exp(-dot(p,p)/rad)*col;o=vec4(texture(uT,vUv).xyz+s,1.);}',
      adv: HEAD + 'uniform sampler2D uV,uS;uniform vec2 tx;uniform float dt,diss;void main(){vec2 c=vUv-dt*texture(uV,vUv).xy*tx;o=texture(uS,c)/(1.+diss*dt);o.a=1.;}',
      div: HEAD + 'uniform sampler2D uV;void main(){float L=texture(uV,vL).x,R=texture(uV,vR).x,T=texture(uV,vT).y,B=texture(uV,vB).y;vec2 C=texture(uV,vUv).xy;if(vL.x<0.)L=-C.x;if(vR.x>1.)R=-C.x;if(vT.y>1.)T=-C.y;if(vB.y<0.)B=-C.y;o=vec4(.5*(R-L+T-B),0.,0.,1.);}',
      curl: HEAD + 'uniform sampler2D uV;void main(){float L=texture(uV,vL).y,R=texture(uV,vR).y,T=texture(uV,vT).x,B=texture(uV,vB).x;o=vec4(.5*(R-L-T+B),0.,0.,1.);}',
      vort: HEAD + 'uniform sampler2D uV,uC;uniform float curl,dt;void main(){float L=texture(uC,vL).x,R=texture(uC,vR).x,T=texture(uC,vT).x,B=texture(uC,vB).x,C=texture(uC,vUv).x;vec2 f=.5*vec2(abs(T)-abs(B),abs(R)-abs(L));f/=length(f)+.0001;f*=curl*C;f.y*=-1.;vec2 v=texture(uV,vUv).xy+f*dt;o=vec4(clamp(v,-1000.,1000.),0.,1.);}',
      pres: HEAD + 'uniform sampler2D uP,uD;void main(){float L=texture(uP,vL).x,R=texture(uP,vR).x,T=texture(uP,vT).x,B=texture(uP,vB).x,d=texture(uD,vUv).x;o=vec4((L+R+B+T-d)*.25,0.,0.,1.);}',
      grad: HEAD + 'uniform sampler2D uP,uV;void main(){float L=texture(uP,vL).x,R=texture(uP,vR).x,T=texture(uP,vT).x,B=texture(uP,vB).x;vec2 v=texture(uV,vUv).xy-vec2(R-L,T-B);o=vec4(v,0.,1.);}',
      clear: HEAD + 'uniform sampler2D uT;uniform float val;void main(){o=val*texture(uT,vUv);}',
      show: HEAD + 'uniform sampler2D uT;uniform vec3 bg;uniform float t;' +
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
        'void main(){vec3 c=texture(uT,vUv).rgb;float a=clamp(max(c.r,max(c.g,c.b)),0.,1.);' +
        'vec3 col=mix(bg,c/max(a,.001),smoothstep(0.,.9,a))+c*.15;' +
        'float weave=.035*(sin(gl_FragCoord.x*1.3)*sin(gl_FragCoord.y*1.3));' +
        'float crack=smoothstep(.985,1.,sin((vUv.x*3.+vUv.y*5.+a*6.)*14.))*a*.25;' +
        'col+=weave+crack;col+=(h(gl_FragCoord.xy+t)-.5)*.03;o=vec4(col,1.);}'
    };
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
    var vs = sh(gl.VERTEX_SHADER, VS); if (!vs) return null;
    function prog(src) {
      var f = sh(gl.FRAGMENT_SHADER, src); if (!f) return null;
      var p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
      var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
      return { p: p, u: u };
    }
    var P = {}; for (var k in FS) { P[k] = prog(FS[k]); if (!P[k]) return null; }

    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.enableVertexAttribArray(0);

    function fbo(w, h, ifmt, fmt, type, filter) {
      gl.activeTexture(gl.TEXTURE0);
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
      var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      return { t: t, f: f, w: w, h: h, tx: [1 / w, 1 / h], attach: function (id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, t); return id; } };
    }
    function dbl(w, h, ifmt, fmt, type, filter) {
      var a = fbo(w, h, ifmt, fmt, type, filter), b = fbo(w, h, ifmt, fmt, type, filter);
      return { w: w, h: h, tx: a.tx, get read() { return a; }, get write() { return b; }, swap: function () { var t = a; a = b; b = t; } };
    }
    var HF = gl.HALF_FLOAT, LIN = gl.LINEAR, NEAR = gl.NEAREST;
    function res(r) { var ar = gl.drawingBufferWidth / gl.drawingBufferHeight; if (ar < 1) ar = 1 / ar; var mn = Math.round(r), mx = Math.round(r * ar); return gl.drawingBufferWidth > gl.drawingBufferHeight ? [mx, mn] : [mn, mx]; }
    var dye, vel, divg, curl, pres;
    function init() {
      var s = res(SIM), d = res(DYE);
      dye = dbl(d[0], d[1], gl.RGBA16F, gl.RGBA, HF, LIN);
      vel = dbl(s[0], s[1], gl.RG16F, gl.RG, HF, LIN);
      divg = fbo(s[0], s[1], gl.R16F, gl.RED, HF, NEAR);
      curl = fbo(s[0], s[1], gl.R16F, gl.RED, HF, NEAR);
      pres = dbl(s[0], s[1], gl.R16F, gl.RED, HF, NEAR);
    }
    function blit(target) {
      if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.f); }
      else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
    function use(pr, tx) { gl.useProgram(pr.p); if (pr.u.tx) gl.uniform2f(pr.u.tx, tx[0], tx[1]); }

    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    function resize() {
      var w = Math.max(2, Math.floor(canvas.clientWidth * DPR * .6)), h = Math.max(2, Math.floor(canvas.clientHeight * DPR * .6));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; init(); return true; }
      return false;
    }
    resize(); if (!dye) init();

    function splat(x, y, dx, dy, c) {
      use(P.splat, vel.tx);
      gl.uniform1i(P.splat.u.uT, vel.read.attach(0)); gl.uniform1f(P.splat.u.ar, canvas.width / canvas.height);
      gl.uniform2f(P.splat.u.pt, x, y); gl.uniform3f(P.splat.u.col, dx, dy, 0);
      gl.uniform1f(P.splat.u.rad, CFG.radius / 100 * (canvas.width > canvas.height ? canvas.width / canvas.height : 1));
      blit(vel.write); vel.swap();
      gl.uniform1i(P.splat.u.uT, dye.read.attach(0)); gl.uniform3f(P.splat.u.col, c[0], c[1], c[2]);
      blit(dye.write); dye.swap();
    }
    function step(dt) {
      gl.disable(gl.BLEND);
      use(P.curl, vel.tx); gl.uniform1i(P.curl.u.uV, vel.read.attach(0)); blit(curl);
      use(P.vort, vel.tx); gl.uniform1i(P.vort.u.uV, vel.read.attach(0)); gl.uniform1i(P.vort.u.uC, curl.attach(1)); gl.uniform1f(P.vort.u.curl, CFG.curl); gl.uniform1f(P.vort.u.dt, dt); blit(vel.write); vel.swap();
      use(P.div, vel.tx); gl.uniform1i(P.div.u.uV, vel.read.attach(0)); blit(divg);
      use(P.clear, vel.tx); gl.uniform1i(P.clear.u.uT, pres.read.attach(0)); gl.uniform1f(P.clear.u.val, CFG.pressure); blit(pres.write); pres.swap();
      use(P.pres, vel.tx); gl.uniform1i(P.pres.u.uD, divg.attach(0));
      for (var i = 0; i < CFG.iters; i++) { gl.uniform1i(P.pres.u.uP, pres.read.attach(1)); blit(pres.write); pres.swap(); }
      use(P.grad, vel.tx); gl.uniform1i(P.grad.u.uP, pres.read.attach(0)); gl.uniform1i(P.grad.u.uV, vel.read.attach(1)); blit(vel.write); vel.swap();
      use(P.adv, vel.tx); var vid = vel.read.attach(0); gl.uniform1i(P.adv.u.uV, vid); gl.uniform1i(P.adv.u.uS, vid); gl.uniform1f(P.adv.u.dt, dt); gl.uniform1f(P.adv.u.diss, CFG.velDiss); blit(vel.write); vel.swap();
      use(P.adv, dye.tx); gl.uniform1i(P.adv.u.uV, vel.read.attach(0)); gl.uniform1i(P.adv.u.uS, dye.read.attach(1)); gl.uniform1f(P.adv.u.diss, CFG.dyeDiss); blit(dye.write); dye.swap();
    }
    var t0 = performance.now();
    function render() {
      use(P.show, dye.tx); gl.uniform1i(P.show.u.uT, dye.read.attach(0)); gl.uniform3f(P.show.u.bg, BG[0], BG[1], BG[2]); gl.uniform1f(P.show.u.t, (performance.now() - t0) % 1000);
      blit(null);
    }
    function color(i) { var c = PALETTE[(i == null ? Math.floor(Math.random() * PALETTE.length) : i) % PALETTE.length], k = opts.intensity || .55; return [c[0] * k, c[1] * k, c[2] * k]; }
    function randomSplats(n) {
      for (var i = 0; i < n; i++) {
        var x = opts.biasX != null ? opts.biasX + (Math.random() - .5) * .5 : Math.random(), y = .2 + Math.random() * .7;
        var a = Math.random() * Math.PI * 2, f = 600 + Math.random() * 900;
        splat(x, y, Math.cos(a) * f, Math.sin(a) * f, color());
      }
    }

    // pointer
    var ptr = { x: 0, y: 0, px: 0, py: 0, moved: false, c: 0, active: false };
    if (opts.interactive !== false) {
      var target = opts.target || canvas;
      target.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect(); if (!r.width) return;
        var x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
        if (!ptr.active) { ptr.px = x; ptr.py = y; ptr.active = true; }
        ptr.x = x; ptr.y = y; ptr.moved = true;
      }, { passive: true });
      target.addEventListener('pointerleave', function () { ptr.active = false; });
      target.addEventListener('pointerdown', function (e) {
        var r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
        for (var i = 0; i < 3; i++) { var a = Math.random() * Math.PI * 2; splat(x, y, Math.cos(a) * 1200, Math.sin(a) * 1200, color()); }
      }, { passive: true });
    }

    var autoT = 0, autoP = null;
    var visible = true, last = performance.now(), idle = 0, colorT = 0, raf = 0, running = false;
    function frame() {
      raf = 0; if (!visible) { running = false; return; }
      var now = performance.now(), dt = Math.min((now - last) / 1000, .016666); last = now;
      if (resize()) randomSplats(5);
      colorT += dt; if (colorT > .9) { colorT = 0; ptr.c++; }
      if (ptr.moved) {
        var dx = (ptr.x - ptr.px) * CFG.force, dy = (ptr.y - ptr.py) * CFG.force;
        if (Math.abs(dx) + Math.abs(dy) > .2) splat(ptr.x, ptr.y, dx, dy, color(ptr.c));
        ptr.px = ptr.x; ptr.py = ptr.y; ptr.moved = false; idle = 0;
      } else {
        idle += dt; autoT += dt;
        if (opts.autopilot && idle > 1.2) {
          var ax = (opts.biasX || .7) + Math.sin(autoT * .9) * .22 + Math.sin(autoT * 2.3) * .05, ay = .5 + Math.sin(autoT * 1.3 + 1) * .3;
          if (autoP) splat(ax, ay, (ax - autoP[0]) * CFG.force * .8, (ay - autoP[1]) * CFG.force * .8, color(Math.floor(autoT / 1.6)));
          autoP = [ax, ay];
        } else autoP = null;
        if (idle > (opts.idleEvery || 1.4) && !opts.autopilot) { idle = 0; randomSplats(1); }
        if (opts.autopilot && idle > 4 && Math.random() < .01) randomSplats(1);
      }
      step(dt); render();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }).observe(canvas);
    randomSplats(opts.initial || 7); start();
    return { splat: splat, burst: function (x, y, n) { for (var i = 0; i < (n || 6); i++) { var a = Math.random() * Math.PI * 2; splat(x, y, Math.cos(a) * 1500, Math.sin(a) * 1500, color()); } } };
  }
  window.TCDye = TCDye;
})();
