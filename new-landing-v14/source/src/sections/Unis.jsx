import { useEffect, useRef, useState } from 'react'
import Stage from '../three/Stage.jsx'
import UniArc from '../three/UniArc.jsx'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, emit, pad, P } from '../lib/motion.js'

const TYPE = { 'Research University': 'Public research university', 'Public University': 'Public university', 'Private University': 'Private university', 'Foreign Branch Campus': 'Foreign branch campus', 'University College': 'University college' }

export default function Unis({ unis }) {
  const [active, setActive] = useState(0)
  const dragRef = useRef(0); const wrap = useRef(); const card = useRef()
  const STEP = Math.PI * 2 / unis.length
  const scope = useGsap((el) => { splitReveal(el.querySelector('.un-h')) })
  useEffect(() => {
    const w = wrap.current; if (!w) return
    let d = null
    const down = (e) => { d = { x: e.clientX, moved: false } }
    const move = (e) => { if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 5) d.moved = true; dragRef.current = -dx / 260 }
    const up = () => {
      if (!d) return
      if (d.moved) { const shift = Math.round(dragRef.current / STEP); setActive((a) => ((a + shift) % unis.length + unis.length) % unis.length) }
      dragRef.current = 0; d = null
    }
    w.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up)
    return () => { w.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up) }
  }, [])
  useEffect(() => {
    if (!card.current || reduce) return
    gsap.fromTo(card.current.querySelectorAll('[data-ua]'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'expo.out', stagger: .05 })
  }, [active])
  const u = unis[active]
  const fields = (u.programs || '').split(',').map((s) => s.trim()).filter(Boolean)
  const ask = () => { emit('destination', u.name); emit('go', 'begin') }
  return (
    <section className="sec unis" id="unis" ref={scope} aria-labelledby="un-title">
      <div className="wrap">
        <div className="sec-head row">
          <div><p className="kick"><i />04 · Top 12 in Malaysia · QS 2027</p><h2 className="h2 un-h" id="un-title">The twelve <em>we know by heart.</em></h2></div>
          <p className="lead">Drag the arc or tap a card. Photos show Malaysia, not the specific campus.</p>
        </div>
      </div>
      <div className="un-stage" ref={wrap} data-cur="Drag">
        <Stage className="un-gl" camera={{ position: [0, .3, 12.3], fov: 42 }}
          fallback={<div className="un-fb">{unis.map((x, i) => <img key={i} src={P + 'u-' + (i + 1) + '.jpg'} alt="" loading="lazy" />)}</div>}>
          <UniArc unis={unis} active={active} onPick={setActive} dragRef={dragRef} />
        </Stage>
        <div className="un-rank" aria-hidden="true"><small>QS rank in Malaysia</small><b key={active}>#{u.rank}</b></div>
      </div>
      <div className="wrap">
        <div className="un-card" ref={card} aria-live="polite">
          <div className="un-main">
            <span className="un-type" data-ua>{TYPE[u.type] || u.type}</span>
            <h3 data-ua>{u.name}</h3>
            <p className="un-loc" data-ua>{u.location}</p>
          </div>
          <div className="un-meta" data-ua><b>{u.accredited}</b><span>MQA-accredited<br />programmes</span></div>
          <div className="un-fields" data-ua><small>Largest fields</small><div>{fields.map((f) => <span key={f}>{f}</span>)}</div></div>
          <div className="un-acts" data-ua>
            <button type="button" className="btn btn-sun btn-sm" onClick={ask}>Ask about this</button>
            <button type="button" className="btn btn-glass btn-sm" onClick={() => emit('dir', { q: u.name.replace(/\s*\(.*\)/, '') })}>Directory</button>
          </div>
        </div>
        <div className="un-list" role="tablist" aria-label="Top 12 universities">
          {unis.map((x, i) => <button key={x.id} type="button" role="tab" aria-selected={i === active} className={i === active ? 'on' : ''} onClick={() => setActive(i)}><b>{pad(x.rank)}</b>{x.name.replace(/\s*\(.*\)/, '')}</button>)}
        </div>
      </div>
    </section>
  )
}
