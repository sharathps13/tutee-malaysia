import { useEffect, useRef, useState } from 'react'
import { useGsap, splitReveal, useInView } from '../lib/hooks.js'
import { gsap, Draggable, reduce, pad, P } from '../lib/motion.js'

/* the Student Pass as a dial you turn: seven stages round the rim, the stage at the top opens */
export default function Journey({ steps }) {
  const N = steps.length, SEG = 360 / N
  const [i, setI] = useState(0)
  const dial = useRef(); const drag = useRef(); const body = useRef(); const timer = useRef(); const userT = useRef(0)
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.jr-h'))
    if (reduce) return
    gsap.from(el.querySelector('.jr-dial-w'), { scale: .6, rotate: -90, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el.querySelector('.jr-dial-w'), start: 'top 80%', once: true } })
  })
  const { visible } = useInView(scope, '0px')
  const toIndex = (rot) => ((Math.round(-rot / SEG) % N) + N) % N
  useEffect(() => {
    const d = Draggable.create(dial.current, {
      type: 'rotation', inertia: !reduce,
      snap: (v) => Math.round(v / SEG) * SEG,
      onPress: () => { userT.current = Date.now() },
      onDragEnd: function () { if (reduce) setI(toIndex(this.rotation)) },
      onThrowComplete: function () { setI(toIndex(this.rotation)) },
    })[0]
    drag.current = d
    /* keep rim labels readable: flip the ones that swing into the lower half */
    const labs = dial.current.querySelectorAll('.jr-lab')
    const tick = () => { const r = gsap.getProperty(dial.current, 'rotation'); labs.forEach((l, k) => { const a = (((k * SEG + r) % 360) + 360) % 360; l.classList.toggle('flip', a > 95 && a < 265) }) }
    gsap.ticker.add(tick)
    return () => { d.kill(); gsap.ticker.remove(tick) }
  }, [])
  /* turning to a stage from a button or the timer */
  const go = (k, user) => {
    k = (k + N) % N; if (user) userT.current = Date.now()
    const cur = gsap.getProperty(dial.current, 'rotation')
    let target = -k * SEG; while (target - cur > 180) target -= 360; while (cur - target > 180) target += 360
    gsap.to(dial.current, { rotation: target, duration: reduce ? 0 : 1, ease: 'expo.out', onUpdate: () => drag.current && drag.current.update() })
    setI(k)
  }
  useEffect(() => {
    clearTimeout(timer.current)
    const schedule = () => { timer.current = setTimeout(() => { if (Date.now() - userT.current > 12000) go(i + 1); else schedule() }, 6500) }
    if (visible && !reduce) schedule()
    return () => clearTimeout(timer.current)
  }, [i, visible])
  useEffect(() => {
    if (!body.current || reduce) return
    gsap.fromTo(body.current.querySelectorAll('[data-jb]'), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'expo.out', stagger: .06 })
    gsap.fromTo('.jr-ph img.on', { scale: 1.3, clipPath: 'circle(0% at 50% 50%)' }, { scale: 1, clipPath: 'circle(72% at 50% 50%)', duration: 1.1, ease: 'expo.inOut' })
  }, [i])
  const s = steps[i]
  return (
    <section className="sec journey" id="journey" ref={scope} aria-labelledby="jr-title">
      <div className="wrap">
        <div className="sec-head row">
          <div><p className="kick"><i />05 · The Student Pass, step by step</p><h2 className="h2 jr-h" id="jr-title">From offer letter <em>to arrivals hall.</em></h2></div>
          <p className="lead">Malaysia runs no credibility interview, so the decisive work is on paper. Turn the dial: each stage on the rim opens at the top.</p>
        </div>
        <div className="jr">
          <div className="jr-dial-w">
            <span className="jr-mark" aria-hidden="true" />
            <div className="jr-dial" ref={dial} data-cur="Turn" aria-hidden="true">
              <svg viewBox="-100 -100 200 200">
                {steps.map((_, k) => {
                  const a0 = (k * SEG - SEG / 2 - 90) * Math.PI / 180, a1 = (k * SEG + SEG / 2 - 90) * Math.PI / 180, R = 98, r = 74
                  const d = `M${Math.cos(a0) * R} ${Math.sin(a0) * R} A${R} ${R} 0 0 1 ${Math.cos(a1) * R} ${Math.sin(a1) * R} L${Math.cos(a1) * r} ${Math.sin(a1) * r} A${r} ${r} 0 0 0 ${Math.cos(a0) * r} ${Math.sin(a0) * r}Z`
                  return <path key={k} d={d} className={'jr-seg' + (k === i ? ' on' : k < i ? ' done' : '')} />
                })}
                {Array.from({ length: 84 }).map((_, k) => { const a = k * 360 / 84 * Math.PI / 180; return <line key={k} x1={Math.cos(a) * 70} y1={Math.sin(a) * 70} x2={Math.cos(a) * (k % 12 ? 67 : 63)} y2={Math.sin(a) * (k % 12 ? 67 : 63)} className="jr-tick" /> })}
              </svg>
              {steps.map((st, k) => <span key={k} className={'jr-lab' + (k === i ? ' on' : '')} style={{ transform: `rotate(${k * SEG}deg) translateY(calc(var(--ds) * -.43)) translate(-50%, -50%)` }}><i><b>{pad(k + 1)}</b>{st.tag}</i></span>)}
            </div>
            <div className="jr-ph">{steps.map((st, k) => <img key={k} src={P + st.img + '.jpg'} alt={k === i ? st.alt : ''} className={k === i ? 'on' : ''} loading="lazy" />)}<span className="jr-num">{pad(i + 1)}</span></div>
          </div>
          <div className="jr-body" ref={body} aria-live="polite">
            <span className="jr-tag" data-jb>Stage {pad(i + 1)} of {pad(N)} · {s.tag}</span>
            <h3 data-jb>{s.title}</h3>
            <p data-jb>{s.text}</p>
            {s.note && <p className="jr-note" data-jb>{s.note}</p>}
            <div className="jr-nav" data-jb>
              <button type="button" className="rb" aria-label="Previous stage" onClick={() => go(i - 1, true)}>←</button>
              <div className="jr-pips">{steps.map((st, k) => <button key={k} type="button" aria-label={'Stage ' + (k + 1) + ': ' + st.tag} className={k === i ? 'on' : k < i ? 'done' : ''} onClick={() => go(k, true)} />)}</div>
              <button type="button" className="rb" aria-label="Next stage" onClick={() => go(i + 1, true)}>→</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
