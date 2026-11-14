import { useState } from 'react'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, P } from '../lib/motion.js'

/* three tall panels; the one you choose opens wide */
export default function Funding({ items, partners }) {
  const [open, setOpen] = useState(0)
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.fu-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.fp'), { yPercent: 30, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: el.querySelector('.fps'), start: 'top 80%', once: true } })
  })
  return (
    <section className="sec money" id="money" ref={scope} aria-labelledby="fu-title">
      <div className="wrap">
        <div className="sec-head row">
          <div><p className="kick"><i />09 · Scholarships, loans and work</p><h2 className="h2 fu-h" id="fu-title">Fund it smart, <em>work the breaks.</em></h2></div>
          <p className="lead">Three ways to pay for your degree, all arranged before you fly. Choose a panel to open it.</p>
        </div>
        <div className="fps" role="tablist" aria-label="Ways to fund your degree">
          {items.map((f, k) => (
            <article key={f.title} className={'fp' + (k === open ? ' on' : '')} onMouseEnter={() => setOpen(k)} onFocus={() => setOpen(k)} onClick={() => setOpen(k)} tabIndex={0} role="tab" aria-selected={k === open}>
              <img src={P + f.img + '.jpg'} alt="" loading="lazy" />
              <span className="fp-n">0{k + 1}</span>
              <span className="fp-v" aria-hidden="true">{f.title}</span>
              <div className="fp-b">
                <span className="fp-k">{f.sub}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
                <ul>{f.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
        <p className="fu-pk">Our education-loan partners</p>
      </div>
      <div className="marq" aria-label="Loan partners"><div className="marq-in">{[...partners, ...partners].map((p, k) => <span key={k} aria-hidden={k >= partners.length}><img src={P + 'partners/' + p.file} alt={k >= partners.length ? '' : p.name} loading="lazy" /></span>)}</div></div>
    </section>
  )
}
