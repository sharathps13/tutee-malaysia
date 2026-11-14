import { useEffect, useRef, useState } from 'react'
import Stage from '../three/Stage.jsx'
import Map3D from '../three/Map3D.jsx'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, emit, pad, P } from '../lib/motion.js'

export default function Places({ places }) {
  const [active, setActive] = useState(-1)
  const [hover, setHover] = useState(null)
  const panel = useRef(); const touched = useRef(false)
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.pl-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.pl-tab'), { y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: el, start: 'top 60%', once: true } })
  })
  /* a short guided tour the first time the map is reached */
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !touched.current) { setTimeout(() => { if (!touched.current) setActive(0) }, 1800); io.disconnect() } }, { threshold: .5 })
    io.observe(scope.current); return () => io.disconnect()
  }, [])
  const pick = (i, user = true) => { if (user) touched.current = true; setActive(i) }
  useEffect(() => {
    if (!panel.current || reduce) return
    gsap.fromTo(panel.current.querySelectorAll('[data-pa]'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'expo.out', stagger: .05 })
  }, [active])
  const p = active >= 0 ? places[active] : null
  return (
    <section className="sec places" id="places" ref={scope} aria-labelledby="pl-title">
      <Stage className="pl-gl" camera={{ position: [0, 13, 11], fov: 42 }}
        fallback={<div className="pl-fb">{places.map((pl) => <img key={pl.img} src={P + pl.img + '.jpg'} alt={pl.name} loading="lazy" />)}</div>}>
        <Map3D places={places} active={active} onPick={(i) => pick(i)} onHoverState={setHover} />
      </Stage>
      <div className="pl-ui">
        <div className="pl-top wrap">
          <div>
            <p className="kick"><i />02 · Where you could live</p>
            <h2 className="h2 pl-h" id="pl-title">Pick a region, <em>then a campus.</em></h2>
            <p className="pl-lead">391 institutions take international students. Most sit in five regions. Tap a beacon, or pick a region below, and the map flies you there.</p>
          </div>
          <p className="pl-hover" aria-live="polite">{hover ? <><i />{hover}</> : <span>Hover the map to read the states</span>}</p>
        </div>
        <aside className={'pl-panel' + (p ? ' on' : '')} ref={panel} aria-live="polite">
          {p ? (
            <>
              <div className="pl-ph" data-pa><img src={P + p.img + '.jpg'} alt={p.name} /><span className="pl-code">{p.code}</span><span className="pl-idx">{pad(active + 1)} / {pad(places.length)}</span></div>
              <span className="pl-tag" data-pa>{p.tag}</span>
              <h3 data-pa>{p.name}</h3>
              <p data-pa>{p.text}</p>
              <div className="pl-stat" data-pa><b>{p.count}</b><span>EMGS-registered<br />institutions</span></div>
              <div className="pl-chips" data-pa>{p.chips.map((c) => <span key={c}>{c}</span>)}</div>
              <div className="pl-acts" data-pa>
                <button type="button" className="btn btn-sun btn-sm" onClick={() => emit('dir', { state: p.states[0] })}>See these campuses</button>
                <button type="button" className="btn btn-glass btn-sm" onClick={() => pick(-1)}>Whole map</button>
              </div>
            </>
          ) : (
            <>
              <span className="pl-tag" data-pa>Five regions</span>
              <h3 data-pa>All of Malaysia</h3>
              <p data-pa>Peninsular Malaysia holds most campuses, from Penang in the north to Johor in the south. Malaysian Borneo adds Australian branch campuses, rainforest and reef.</p>
              <div className="pl-stat" data-pa><b>391</b><span>EMGS-registered<br />institutions</span></div>
            </>
          )}
        </aside>
        <div className="pl-tabs wrap" role="tablist" aria-label="Regions">
          {places.map((pl, i) => (
            <button key={pl.name} type="button" role="tab" aria-selected={i === active} className={'pl-tab' + (i === active ? ' on' : '')} onClick={() => pick(i)}>
              <img src={P + pl.img + '.jpg'} alt="" loading="lazy" /><span><b>{pl.name}</b><small>{pl.count} institutions</small></span><i>{i + 1}</i>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
