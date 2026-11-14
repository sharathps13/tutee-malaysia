import { useEffect, useRef, useState } from 'react'
import { useGsap, splitReveal, useInView } from '../lib/hooks.js'
import { gsap, SplitText, reduce, pad, P } from '../lib/motion.js'
import { Star } from './Chrome.jsx'

const CARDS = ['hx-keklok', 'hx-melaka', 'hx-putra', 'hx-perhentian', 'hx-batu', 'hx-mural', 'hx-samad', 'hx-skybridge', 'hx-petronas']

/* one big voice at a time; the words light up as it arrives */
export default function Voices({ items }) {
  const [i, setI] = useState(0)
  const quote = useRef(); const timer = useRef(); const paused = useRef(false)
  const scope = useGsap((el) => { splitReveal(el.querySelector('.vo-h')) })
  const { visible } = useInView(scope, '0px')
  useEffect(() => {
    if (!quote.current || reduce) return
    const s = SplitText.create(quote.current, { type: 'words' })
    gsap.fromTo(s.words, { opacity: .12, y: 10 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out', stagger: .025 })
    return () => s.revert()
  }, [i])
  useEffect(() => {
    clearTimeout(timer.current)
    if (visible && !reduce) timer.current = setTimeout(() => { if (!paused.current) setI((k) => (k + 1) % items.length) }, 8000)
    return () => clearTimeout(timer.current)
  }, [i, visible])
  const v = items[i]
  const initials = v.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
  return (
    <section className="sec voices" id="voices" ref={scope} aria-labelledby="vo-title" onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      <div className="wrap">
        <div className="sec-head row">
          <div><p className="kick"><i />11 · Students and parents</p><h2 className="h2 vo-h" id="vo-title">In their <em>own words.</em></h2></div>
          <div className="sv-btns"><button type="button" className="rb" aria-label="Previous story" onClick={() => setI((i - 1 + items.length) % items.length)}>←</button><span className="sv-pos"><b>{pad(i + 1)}</b> / {pad(items.length)}</span><button type="button" className="rb" aria-label="Next story" onClick={() => setI((i + 1) % items.length)}>→</button></div>
        </div>
        <figure className="vo" aria-live="polite">
          <span className="vo-mark" aria-hidden="true">“</span>
          <div className="vo-cards" aria-hidden="true">
            {[2, 1, 0].map((o) => { const k = (i + o) % items.length; return (
              <div key={k} className={'vo-pc p' + o}>
                <img src={P + CARDS[k % CARDS.length] + '-s.jpg'} alt="" loading="lazy" />
                {o === 0 && <><span className="vo-stamp"><Star /><b>Malaysia</b></span><span className="vo-post"><i>{items[k].mark}</i><small>Tutee Connect</small></span></>}
              </div>) })}
          </div>
          <blockquote ref={quote} key={'q' + i}>{v.quote}</blockquote>
          <figcaption key={'c' + i}>
            <span className="vo-av">{initials}</span>
            <span><b>{v.name}</b><small>{v.role}</small></span>
            <span className="vo-pm">Posted from <b>{v.mark}</b></span>
            <span className="vo-stars" aria-label="5 out of 5 stars">★★★★★</span>
          </figcaption>
        </figure>
        <div className="vo-dots">{items.map((x, k) => <button key={k} type="button" aria-label={'Story ' + (k + 1) + ' from ' + x.name} className={k === i ? 'on' : ''} onClick={() => setI(k)}><span>{x.name.split(' ')[0]}</span></button>)}</div>
      </div>
    </section>
  )
}
