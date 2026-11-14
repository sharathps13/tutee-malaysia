import { useEffect, useRef, useState } from 'react'
import Stage from '../three/Stage.jsx'
import HeroSilk, { SLIDES } from '../three/HeroSilk.jsx'
import { gsap, ScrollTrigger, SplitText, reduce, pad, P } from '../lib/motion.js'

export default function Hero() {
  const [idx, setIdx] = useState(0)
  const scrollRef = useRef(0)
  const root = useRef(); const title = useRef(); const timer = useRef()
  const HOLD = 6500
  const next = (i) => { setIdx((c) => (i == null ? (c + 1) % SLIDES.length : i)) }
  useEffect(() => {
    clearTimeout(timer.current)
    if (!reduce) timer.current = setTimeout(() => next(), HOLD)
    return () => clearTimeout(timer.current)
  }, [idx])
  useEffect(() => {
    const el = root.current
    const st = ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => { scrollRef.current = s.progress } })
    let split
    const run = () => {
      if (reduce) return
      split = SplitText.create(title.current, { type: 'chars,lines', mask: 'lines' })
      const tl = gsap.timeline()
      tl.from(split.chars, { yPercent: 120, rotate: 8, duration: 1.4, ease: 'expo.out', stagger: .035 })
        .from(el.querySelectorAll('[data-hf]'), { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1 }, .3)
      gsap.to(el.querySelector('.hero-copy'), { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: '70% top', scrub: true } })
    }
    window.addEventListener('tc:ready', run, { once: true })
    return () => { st.kill(); window.removeEventListener('tc:ready', run); split && split.revert() }
  }, [])
  const s = SLIDES[idx]
  return (
    <section className="sec hero" id="home" ref={root} aria-labelledby="hero-title">
      <Stage className="hero-gl" camera={{ position: [0, 0, 5], fov: 45 }} fallback={<img className="hero-fb" src={P + s[0] + '.jpg'} alt="" />}>
        <HeroSilk index={idx} scrollRef={scrollRef} />
      </Stage>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-copy wrap">
        <p className="eyebrow" data-hf><i className="flag" aria-hidden="true" />Tutee Connect · Study in Malaysia</p>
        <h1 className="hero-h" id="hero-title" ref={title}>Study in <em>Malaysia.</em></h1>
        <div className="hero-row">
          <p className="hero-sub" data-hf>World-ranked degrees, UK and Australian branch campuses and a twelve-month Graduate Pass, about four hours from Chennai.</p>
          <div className="hero-cta" data-hf><a className="btn btn-sun" href="#begin">Get a free evaluation <span aria-hidden="true">→</span></a><a className="btn btn-glass" href="#why">Explore Malaysia</a></div>
        </div>
      </div>
      <div className="hero-dots wrap" data-hf role="tablist" aria-label="Places in Malaysia">
        {SLIDES.map((sl, i) => (
          <button key={sl[0]} type="button" role="tab" aria-selected={i === idx} className={'hd' + (i === idx ? ' on' : '')} onClick={() => next(i)}>
            <span className="hd-n">{pad(i + 1)}</span><span className="hd-t"><b>{sl[1]}</b><small>{sl[2]}</small></span>
            <i className="hd-bar"><b key={idx + '-' + i} style={{ animationDuration: HOLD + 'ms' }} /></i>
          </button>
        ))}
      </div>
      <div className="hero-scroll" aria-hidden="true"><span>Scroll</span><i /></div>
    </section>
  )
}
