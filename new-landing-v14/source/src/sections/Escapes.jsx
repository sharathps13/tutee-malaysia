import { useEffect, useRef, useState } from 'react'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, pad, P } from '../lib/motion.js'

/* weekend escapes: a cinematic slider; each photo slides inside its frame as you move */
export default function Escapes({ items }) {
  const rail = useRef(); const [cur, setCur] = useState(0)
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.es-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.es'), { y: 120, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: rail.current, start: 'top 85%', once: true } })
  })
  useEffect(() => {
    const r = rail.current; if (!r) return
    const cards = Array.from(r.querySelectorAll('.es'))
    let raf = 0
    const upd = () => {
      raf = 0; const mid = r.getBoundingClientRect().left + r.clientWidth / 2; let best = 0, bd = 1e9
      cards.forEach((c, k) => { const b = c.getBoundingClientRect(), cx = b.left + b.width / 2, off = (cx - mid) / r.clientWidth; const img = c.firstChild; if (!reduce) img.style.transform = `translateX(${(-off * 18).toFixed(2)}%) scale(1.25)`; c.style.setProperty('--f', Math.max(0, 1 - Math.abs(off) * 1.6).toFixed(3)); if (Math.abs(cx - mid) < bd) { bd = Math.abs(cx - mid); best = k } })
      setCur(best)
    }
    const onS = () => { if (!raf) raf = requestAnimationFrame(upd) }
    r.addEventListener('scroll', onS, { passive: true }); window.addEventListener('resize', onS); upd()
    let d = null
    const down = (e) => { if (e.pointerType !== 'mouse') return; d = { x: e.clientX, s: r.scrollLeft }; r.classList.add('dragging') }
    const move = (e) => { if (d) r.scrollLeft = d.s - (e.clientX - d.x) }
    const up = () => { if (d) { r.classList.remove('dragging'); d = null } }
    r.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { r.removeEventListener('scroll', onS); window.removeEventListener('resize', onS); r.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])
  const go = (k) => { const r = rail.current, c = r.querySelectorAll('.es')[Math.max(0, Math.min(items.length - 1, k))]; r.scrollTo({ left: c.offsetLeft - (r.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' }) }
  return (
    <section className="sec escapes" id="escapes" ref={scope} aria-labelledby="es-title">
      <div className="wrap">
        <div className="sec-head row">
          <div><p className="kick"><i />08 · Semester breaks</p><h2 className="h2 es-h" id="es-title">Islands, rainforest <em>and tea hills.</em></h2></div>
          <div className="es-ctrl"><p>Budget airlines fly from KL to almost everywhere in Malaysia. Here is what your classmates do with a long weekend.</p>
            <div className="sv-btns"><button type="button" className="rb" aria-label="Previous" onClick={() => go(cur - 1)}>←</button><span className="sv-pos"><b>{pad(cur + 1)}</b> / {pad(items.length)}</span><button type="button" className="rb" aria-label="Next" onClick={() => go(cur + 1)}>→</button></div>
          </div>
        </div>
      </div>
      <div className="es-rail" ref={rail} data-cur="Drag" tabIndex={0} aria-label="Weekend escapes, scroll sideways">
        {items.map((e, k) => (
          <figure key={e.img} className={'es' + (k === cur ? ' on' : '')}>
            <img src={P + e.img + '.jpg'} alt={e.title} loading="lazy" draggable="false" />
            <figcaption><span>{pad(k + 1)}</span><b>{e.title}</b><small>{e.sub}</small></figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
