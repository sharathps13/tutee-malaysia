import { useEffect, useRef, useState } from 'react'
import Stage from '../three/Stage.jsx'
import LifeDome from '../three/LifeDome.jsx'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, P } from '../lib/motion.js'

export default function Life({ items, phrases, fest }) {
  const [cap, setCap] = useState(items[0])
  const [ph, setPh] = useState(0)
  const look = useRef({ yaw: 0, pitch: 0, dragging: false })
  const dome = useRef(); const capRef = useRef()
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.lf-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.fest'), { y: 80, opacity: 0, rotate: (i) => (i % 2 ? 4 : -4), duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: el.querySelector('.fests'), start: 'top 85%', once: true } })
  })
  useEffect(() => {
    const w = dome.current; if (!w) return
    let d = null
    const down = (e) => { d = { x: e.clientX, y: e.clientY, yaw: look.current.yaw, pitch: look.current.pitch }; look.current.dragging = true }
    const move = (e) => { if (!d) return; look.current.yaw = d.yaw + (e.clientX - d.x) * .005; look.current.pitch = Math.max(-.35, Math.min(.35, d.pitch + (e.clientY - d.y) * .003)) }
    const up = () => { d = null; look.current.dragging = false }
    w.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { w.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])
  const pick = (it, click) => { setCap(it) }
  useEffect(() => { if (capRef.current && !reduce) gsap.fromTo(capRef.current.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5, ease: 'expo.out', stagger: .05 }) }, [cap])
  const p = phrases[ph]
  return (
    <section className="sec life" id="life" ref={scope} aria-labelledby="lf-title">
      <div className="lf-dome" ref={dome} data-cur="Look">
        <Stage className="lf-gl" camera={{ position: [0, 0, 0], fov: 62 }}
          fallback={<div className="lf-fb">{items.slice(0, 8).map((it) => <img key={it.img} src={P + it.img + '.jpg'} alt={it.title} loading="lazy" />)}</div>}>
          <LifeDome items={items} onPick={pick} look={look} />
        </Stage>
        <div className="lf-over wrap">
          <div>
            <p className="kick"><i />07 · Life in Malaysia</p>
            <h2 className="h2 lf-h" id="lf-title">Jom makan. <em>Then celebrate.</em></h2>
            <p className="lf-lead">You are standing in a ring of Malaysian life. Drag to look around; point at a photo to read it.</p>
          </div>
          <div className="lf-cap" ref={capRef} aria-live="polite"><small>Now looking at</small><b>{cap.title}</b><span>{cap.sub}</span></div>
        </div>
      </div>
      <div className="wrap">
        <div className="lf-speak">
          <div className="lf-speak-h"><p className="kick"><i />Speak like a local</p><h3>Eight words that open doors.</h3></div>
          <div className="lf-phrases" role="group" aria-label="Malay phrases">
            {phrases.map((x, k) => <button key={x.my} type="button" className={k === ph ? 'on' : ''} aria-pressed={k === ph} onClick={() => setPh(k)}>{x.my}</button>)}
          </div>
          <div className="lf-card" key={ph}>
            <b>{p.my}</b><span className="lf-pr">/{p.pr}/</span><span className="lf-en">{p.en}</span><p>{p.tip}</p>
          </div>
        </div>
        <div className="fests">
          {fest.map((f) => (
            <article key={f.title} className="fest" tabIndex={0}>
              <img src={P + f.img + '.jpg'} alt="" loading="lazy" />
              <div><span>{f.when}</span><h4>{f.title}</h4><p>{f.text}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
