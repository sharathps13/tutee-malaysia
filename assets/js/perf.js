/* ---------- performance layer ----------
   Keeps the page at a steady frame rate on any device without changing how it looks:
   - sections off screen pause their decorative CSS animations (html .sec.is-off), and the costlier ambient effects
     (the sheen sweeps, the FAQ batik line drawing) hold still while the page is actively scrolling (html.is-scrolling);
   - weaker devices (few cores, little memory, data saver, or a slow first second of frames) get html.lite:
     lighter glass blur and fewer ambient particles;
   - the three WebGL scenes (Why Malaysia, What we do, Universities) load only when their section is near, or during
     idle time after the page has loaded, so they never compete with the first screen; TCPerf.warm() compiles their
     shaders in the background and uploads their textures one per idle slot, so nothing stalls when they first appear;
   - TCPerf.dpr() caps WebGL pixel density, and TCPerf.governor() lowers it on the fly when frames run slow. */
(function () {
  var html = document.documentElement, nav = navigator;
  var cores = nav.hardwareConcurrency || 4, mem = nav.deviceMemory || 4, save = nav.connection && nav.connection.saveData;
  var touch = matchMedia('(pointer: coarse)').matches, small = Math.min(screen.width, screen.height) < 768;
  // only clearly constrained hardware starts in lite mode; anything else is judged by the frame probe after load
  var lite = !!(save || cores <= 2 || mem <= 2 || (touch && small && cores <= 4));
  if (lite) html.classList.add('lite');

  // a one-second frame probe after load: a device that cannot hold ~50 fps on an idle first screen also goes lite
  // judged on the median frame over two seconds, so a single busy moment (images decoding, a scene loading) never counts
  function probe() {
    if (lite || document.hidden) return;
    var d = [], t0 = 0, last = 0;
    requestAnimationFrame(function f(t) {
      if (!t0) { t0 = last = t; } else { d.push(t - last); last = t; }
      if (t - t0 < 2000) return requestAnimationFrame(f);
      d.sort(function (a, b) { return a - b; });
      var med = d[Math.floor(d.length / 2)] || 16.7;
      if (med > 26) { lite = true; html.classList.add('lite'); window.TCPerf.lite = true; }
    });
  }

  // ---------- pause what is off screen ----------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('is-off', !e.isIntersecting); }); }, { rootMargin: '30% 0px' });
    var watch = function () { [].forEach.call(document.querySelectorAll('section.sec, footer'), function (s) { io.observe(s); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  }

  // ---------- hold ambient effects while the page is scrolling ----------
  var st = 0, scrolling = false;
  function onScroll() {
    if (!scrolling) { scrolling = true; html.classList.add('is-scrolling'); }
    clearTimeout(st); st = setTimeout(function () { scrolling = false; html.classList.remove('is-scrolling'); }, 180);
  }
  addEventListener('scroll', onScroll, { passive: true });

  // ---------- helpers for the WebGL scenes ----------
  var idle = window.requestIdleCallback ? function (fn) { requestIdleCallback(fn, { timeout: 300 }); } : function (fn) { setTimeout(fn, 40); };
  var TCPerf = window.TCPerf = {
    lite: lite,
    // texture resolution for the WebGL scenes: half size on phones and weaker devices (an iPhone kills a page that holds
    // dozens of full-size canvases), full size elsewhere
    texQ: function () { return (small || touch && Math.max(screen.width, screen.height) < 1100 || TCPerf.lite) ? .5 : 1; },
    // a texture drawn once on a canvas: after it is uploaded to the GPU the canvas is shrunk to 1 px, so the page does not
    // keep a second copy of every texture in memory (phones only; none of these textures is ever redrawn)
    release: function (t) {
      if (TCPerf.texQ() >= 1 || !t) return t;
      t.onUpdate = function () { t.onUpdate = null; var c = t.image; if (c && c.getContext) setTimeout(function () { c.width = c.height = 1; }, 0); };
      return t;
    },
    // a WebGL support check that does not leave a live context behind
    glCheck: function (kind) {
      try { var c = document.createElement('canvas'), g = c.getContext(kind || 'webgl2') || (!kind && c.getContext('webgl'));
        if (!g) return false; var x = g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return true; } catch (e) { return false; }
    },
    // resolves in the next idle slot: lets heavy one-off work (drawing card textures) run a piece at a time
    idle: function () { return new Promise(function (r) { idle(r); }); },
    // pixel density for a WebGL canvas: crisp enough on retina, never the full 3x of a phone
    dpr: function (max) { var d = window.devicePixelRatio || 1; return Math.min(d, TCPerf.lite ? Math.min(1.25, max) : max); },
    // compile shaders off the main thread where the GPU allows it, then upload textures one per idle slot
    warm: function (renderer, scene, camera) {
      var p = renderer.compileAsync ? renderer.compileAsync(scene, camera).catch(function () {}) : Promise.resolve();
      return p.then(function () {
        var tex = [];
        scene.traverse(function (o) {
          var m = o.material; if (!m) return;
          (Array.isArray(m) ? m : [m]).forEach(function (mm) {
            ['map', 'alphaMap', 'emissiveMap', 'normalMap', 'roughnessMap', 'envMap'].forEach(function (k) { if (mm[k] && mm[k].isTexture && tex.indexOf(mm[k]) < 0) tex.push(mm[k]); });
            if (mm.uniforms) Object.keys(mm.uniforms).forEach(function (k) { var v = mm.uniforms[k] && mm.uniforms[k].value; if (v && v.isTexture && tex.indexOf(v) < 0) tex.push(v); });
          });
        });
        return TCPerf.upload(renderer, tex);
      });
    },
    // upload a list of textures to the GPU, one per idle slot, so no single frame pays for all of them
    upload: function (renderer, tex) {
      return new Promise(function (done) {
        var i = 0; (function next() { if (i >= tex.length) return done(); try { if (tex[i]) renderer.initTexture(tex[i]); } catch (e) {} i++; idle(next); })();
      });
    },
    // watches frame times while a scene renders; steps its pixel density down (and back up) to hold the frame rate
    governor: function (renderer, refit, max) {
      var cap = TCPerf.dpr(max || 1.5), pr = Math.min(renderer.getPixelRatio(), cap), ema = 16.7, n = 0, last = 0;
      return function () {
        var now = performance.now(), dt = last ? now - last : 16.7; last = now;
        if (dt > 250) { n = 0; return; }          // a pause (tab hidden, scrolled away): ignore
        ema += (dt - ema) * .08; if (++n < 45) return;
        if (ema > 21 && pr > 1) { pr = Math.max(1, Math.round((pr - .25) * 4) / 4); renderer.setPixelRatio(pr); refit(); n = 0; }
        else if (ema < 14.5 && pr < cap) { pr = Math.min(cap, pr + .25); renderer.setPixelRatio(pr); refit(); n = 0; }
      };
    }
  };

  // ---------- the WebGL scenes load just in time ----------
  var LAZY = [['why', './assets/js/why-ring.js'], ['services', './assets/js/services-mono.js'], ['unis', './assets/js/crests.js']];
  var loaded = {};
  function load(i) { var m = LAZY[i]; if (!m || loaded[m[0]]) return; loaded[m[0]] = true; var t = performance.now();
    // import() in a classic script resolves against the script's own folder, so give it the page-relative URL in full
    import(new URL(m[1], document.baseURI).href).then(function () { if (window.__perfDebug) console.log('[perf] scene ready', m[1], Math.round(performance.now() - t) + 'ms'); }, function (e) { console.warn('scene failed to load', m[1], e); }); }
  function setup() {
    LAZY.forEach(function (m, i) {
      var el = document.getElementById(m[0]); if (!el) return;
      if ('IntersectionObserver' in window) {
        var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); load(i); } }, { rootMargin: (i === 0 ? '60%' : '150%') + ' 0px' });
        // the first scene sits right under the hero: it loads once the visitor starts down the page (or when idle),
        // so it never competes with the hero for the first second
        if (i === 0) addEventListener('scroll', function once() { if (scrollY > innerHeight * .2) { removeEventListener('scroll', once); load(0); } }, { passive: true });
        else o.observe(el);
      } else load(i);
    });
    // and in any case, one after another while the page is idle once it has loaded
    // (data-saver preloads only the first; the others still load as their section comes near). Never mid-scroll.
    // phones never preload: each scene starts only as its section comes near, so the page never holds all three at once on load
    var upto = save ? 1 : (touch && small) ? 0 : LAZY.length;
    var queue = function () { var k = 0; (function step() { if (k >= upto) return; if (scrolling) return setTimeout(step, 500); load(k++); setTimeout(function () { idle(step); }, 1800); })(); };
    var afterLoad = function () { setTimeout(function () { idle(queue); }, 600); setTimeout(probe, 7000); };
    if (document.readyState === 'complete') afterLoad(); else addEventListener('load', afterLoad);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
})();
