import { useEffect, useRef, useState } from 'react'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce } from '../lib/motion.js'

const SEATS = [['you', 'You', 'Student'], ['spouse', 'Spouse', 'Husband or wife'], ['child', 'Child', 'Under 18'], ['child', 'Child', 'Under 18'], ['parent', 'Mother', 'Your parent'], ['parent', 'Father', 'Your parent'], ['inlaw', 'Mother-in-law', "Spouse's parent"], ['inlaw', 'Father-in-law', "Spouse's parent"]]
const R = {
  pg: ['on', 'Can apply', 'Everyone gets a seat', 'As a postgraduate you may apply for Dependant Passes for your spouse, children, parents and parents-in-law. We prepare every application with yours.', '#0F7B5F', 7],
  'ug-in': ['off', 'Not eligible', 'A table for one, for now', 'Undergraduate dependants are limited to citizens of 17 listed countries, and India is not currently one of them. A postgraduate route opens this up, so ask us about it.', '#C8102E', 0],
  'ug-other': ['maybe', 'Check first', 'It depends on your nationality', 'Undergraduates may bring dependants only if they are citizens of one of 17 listed countries. Tell us your nationality and we will confirm before you plan.', '#C77700', '?'],
}
const DISHES = ['Nasi lemak', 'Roti canai', 'Satay', 'Laksa', 'Char kway teow', 'Teh tarik']

/* the makan table: who can sit down with you in Malaysia */
export default function Family() {
  const [level, setLevel] = useState('pg'); const [nat, setNat] = useState('in')
  const r = R[level === 'pg' ? 'pg' : 'ug-' + nat]
  const table = useRef(); const susan = useRef(); const first = useRef(true)
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.fa-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.seat'), { scale: 0, opacity: 0, duration: .8, ease: 'back.out(1.8)', stagger: .07, scrollTrigger: { trigger: table.current, start: 'top 75%', once: true } })
    gsap.from(el.querySelector('.tbl-top'), { scale: .5, rotate: -60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: table.current, start: 'top 75%', once: true } })
  })
  useEffect(() => {
    if (first.current) { first.current = false; return }
    if (reduce) return
    gsap.to(susan.current, { rotate: '+=120', duration: 1.4, ease: 'expo.inOut' })
    gsap.fromTo(table.current.querySelectorAll('.seat:not(.you) .seat-c'), { scale: .7 }, { scale: 1, duration: .8, ease: 'elastic.out(1,.45)', stagger: .06 })
    gsap.fromTo('.fa-res > *', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .05 })
  }, [level, nat])
  return (
    <section className="sec family" id="family" ref={scope} aria-labelledby="fa-title">
      <div className="wrap fa">
        <div className="fa-copy">
          <p className="kick"><i />10 · Bringing your family</p>
          <h2 className="h2 fa-h" id="fa-title">Who sits at <em>your table?</em></h2>
          <p className="lead">Malaysia defines family unusually widely. Answer two questions and watch the makan table fill up.</p>
          <div className="ask">
            <div className="ask-q"><span>I'm studying</span><div className="seg" role="group" aria-label="Study level">{[['pg', "Master's / PhD"], ['ug', "Bachelor's"]].map(([k, l]) => <button key={k} type="button" aria-pressed={level === k} onClick={() => setLevel(k)}>{l}</button>)}</div></div>
            <div className="ask-q"><span>My nationality</span><div className="seg" role="group" aria-label="Nationality">{[['in', 'India'], ['other', 'Another country']].map(([k, l]) => <button key={k} type="button" aria-pressed={nat === k} disabled={level === 'pg'} onClick={() => setNat(k)}>{l}</button>)}</div>{level === 'pg' && <small>Nationality only matters for bachelor's students.</small>}</div>
          </div>
          <div className="fa-res" style={{ '--v': r[4] }} aria-live="polite">
            <span className="fa-tag">{r[1]}</span><h3>{r[2]}</h3><p>{r[3]}</p><b className="fa-n">{r[5]}<small>/ 7 family members can apply</small></b>
          </div>
        </div>
        <div className="tbl" ref={table} aria-label={'Family table: ' + r[2]}>
          <div className="tbl-top"><div className="susan" ref={susan}>{DISHES.map((d, k) => <span key={d} className="dish" style={{ transform: `rotate(${k * 60}deg) translateY(-118%)` }}><i />{d}</span>)}</div><span className="tbl-c">Jom<br />makan</span></div>
          {SEATS.map(([k, n, s], i) => {
            const st = k === 'you' ? 'you' : r[0]
            return (
              <div key={i} className={'seat ' + st + (k === 'you' ? ' you' : '')} style={{ '--a': (i * 45) + 'deg' }}>
                <div className="seat-c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20.5c.8-4 3.8-6.3 7.5-6.3s6.7 2.3 7.5 6.3" /></svg><i aria-hidden="true">{k === 'you' ? '★' : st === 'on' ? '✓' : st === 'maybe' ? '?' : '×'}</i></div>
                <b>{n}</b><small>{s}</small>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
