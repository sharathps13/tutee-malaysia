/* Bringing your family: while the section is pinned, cards two to four slide up into the row one after
   another, each over one screen of scrolling, straight with the scroll (Lenis smooths it). */
(() => {
  const root = document.querySelector('[data-fh]'); if (!root) return;
  const cards = [...root.querySelectorAll('.fh-card')];
  const mq = matchMedia('(min-width: 1000px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let raf = 0, live = null;
  function update() {
    raf = 0;
    if (!mq.matches) { if (live !== false) { cards.forEach((c) => { c.style.transform = ''; }); live = false; } return; }
    live = true;
    const r = root.getBoundingClientRect(), vh = window.innerHeight || 1;
    const s = clamp(-r.top / vh, 0, Math.max(0, r.height / vh - 1));
    const off = .8 * vh; // each card starts 80% of a screen below its place
    cards.forEach((c, i) => {
      if (!i) return;
      const t = clamp(s - (i - 1), 0, 1);
      c.style.transform = t >= 1 ? 'none' : 'translate3d(0,' + ((1 - t) * off).toFixed(1) + 'px,0)';
    });
  }
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  if (mq.addEventListener) mq.addEventListener('change', req);
  if (window.TClenis && window.TClenis.on) window.TClenis.on('scroll', req);
  update();
})();
