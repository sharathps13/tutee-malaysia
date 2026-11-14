import { useMemo, useRef, useState } from 'react'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, pad } from '../lib/motion.js'

export default function Faq({ items }) {
  const [open, setOpen] = useState(0)
  const [q, setQ] = useState('')
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.fq-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.fq'), { y: 40, opacity: 0, duration: .9, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: el.querySelector('.fqs'), start: 'top 85%', once: true } })
  })
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase(); if (t.length < 2) return items.map((x, k) => [x, k])
    return items.map((x, k) => [x, k]).filter(([x]) => (x.q + ' ' + x.a).toLowerCase().includes(t) || x.k.some((w) => t.includes(w) || w.includes(t)))
  }, [q])
  const toggle = (k, el) => {
    setOpen(open === k ? -1 : k)
  }
  return (
    <section className="sec faq" id="faq" ref={scope} aria-labelledby="fq-title">
      <div className="wrap fq-grid">
        <div className="fq-side">
          <p className="kick"><i />12 · Questions</p>
          <h2 className="h2 fq-h" id="fq-title">Ask us <em>anything.</em></h2>
          <p className="fq-my">Tanya apa sahaja</p>
          <label className="fq-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a question, e.g. can I work?" aria-label="Search the questions" /></label>
          <div className="fq-help"><b>Still unsure?</b><p>A Malaysia counsellor answers on WhatsApp, usually within the hour.</p><a className="btn btn-red btn-sm" href="https://wa.me/917010902329" target="_blank" rel="noopener">Ask on WhatsApp ↗</a></div>
        </div>
        <div className="fqs">
          {shown.map(([x, k]) => (
            <div key={k} className={'fq' + (open === k ? ' on' : '')}>
              <button type="button" aria-expanded={open === k} onClick={() => toggle(k)}><span className="fq-n">{pad(k + 1)}</span><span className="fq-q">{x.q}</span><i aria-hidden="true" /></button>
              <div className="fq-a" role="region"><div><p>{x.a}</p></div></div>
            </div>
          ))}
          {!shown.length && <p className="fq-none">Nothing matches that yet. Ask us on WhatsApp and we will add it here.</p>}
        </div>
      </div>
    </section>
  )
}
