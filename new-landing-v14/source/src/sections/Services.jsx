import { useEffect, useRef, useState } from 'react'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, pad, P } from '../lib/motion.js'

/* a draggable rail of nine service cards */
export default function Services({ items, imgs, tags }) {
  const rail = useRef(); const bar = useRef(); const [pos, setPos] = useState(0)
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.sv-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.sv'), { x: 160, opacity: 0, rotateY: -18, duration: 1.3, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: rail.current, start: 'top 80%', once: true } })
  })
  useEffect(() => {
    const r = rail.current; if (!r) return
    const onScroll = () => { const p = r.scrollLeft / Math.max(1, r.scrollWidth - r.clientWidth); bar.current.style.transform = 'scaleX(' + Math.max(.08, p) + ')'; setPos(Math.round(p * (items.length - 1))) }
    r.addEventListener('scroll', onScroll, { passive: true }); onScroll()
    /* mouse drag to scroll */
    let d = null
    const down = (e) => { if (e.pointerType !== 'mouse') return; d = { x: e.clientX, s: r.scrollLeft, moved: false }; r.classList.add('dragging') }
    const move = (e) => { if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 4) d.moved = true; r.scrollLeft = d.s - dx }
    const up = () => { if (!d) return; r.classList.remove('dragging'); setTimeout(() => { d = null }, 0) }
    const click = (e) => { if (d && d.moved) { e.preventDefault(); e.stopPropagation() } }
    r.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); r.addEventListener('click', click, true)
    return () => { r.removeEventListener('scroll', onScroll); r.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); r.removeEventListener('click', click, true) }
  }, [])
  const go = (dir) => { const r = rail.current; const w = r.querySelector('.sv').offsetWidth + 20; r.scrollBy({ left: dir * w, behavior: 'smooth' }) }
  const tilt = (e) => { if (reduce) return; const c = e.currentTarget, b = c.getBoundingClientRect(); const x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateY(-6px)` }
  const untilt = (e) => { e.currentTarget.style.transform = '' }
  return (
    <section className="sec services" id="services" ref={scope} aria-labelledby="sv-title">
      <div className="wrap">
        <div className="sec-head row">
          <div><p className="kick"><i />03 · What we do</p><h2 className="h2 sv-h" id="sv-title">Nine services, <em>one counsellor.</em></h2></div>
          <div className="sv-ctrl">
            <p>The same person handles your file from your first question to your first week in Kuala Lumpur.</p>
            <div className="sv-btns"><button type="button" className="rb" aria-label="Previous service" onClick={() => go(-1)}>←</button><span className="sv-pos"><b>{pad(pos + 1)}</b> / {pad(items.length)}</span><button type="button" className="rb" aria-label="Next service" onClick={() => go(1)}>→</button></div>
          </div>
        </div>
      </div>
      <div className="sv-rail" ref={rail} data-cur="Drag" tabIndex={0} aria-label="Services, scroll sideways">
        {items.map((s, i) => (
          <article key={s.title} className="sv" style={{ '--c': s.color }} onPointerMove={tilt} onPointerLeave={untilt}>
            <div className="sv-ph"><img src={P + imgs[i] + '.jpg'} alt="" loading="lazy" draggable="false" /><span className="sv-tag">{tags[i]}</span></div>
            <div className="sv-b">
              <span className="sv-n">{pad(i + 1)}</span>
              <svg className="sv-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: s.icon }} />
              <h3>{s.title}</h3><small>{s.sub}</small>
              <p>{s.text}</p>
            </div>
          </article>
        ))}
        <div className="sv-end"><p>Ready when you are.</p><a className="btn btn-sun" href="#begin">Talk to a counsellor →</a></div>
      </div>
      <div className="wrap"><span className="sv-bar"><i ref={bar} /></span></div>
    </section>
  )
}
