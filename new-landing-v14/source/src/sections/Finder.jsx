import { useEffect, useMemo, useRef, useState } from 'react'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, emit } from '../lib/motion.js'

const ICON = { 'Business & Law': '⚖', 'Computing & IT': '⌨', 'Engineering & Construction': '⚙', 'Arts & Humanities': '✎', 'Services': '☕', 'Health & Welfare': '✚', 'Generic Programmes': '◎', 'Education': '✐', 'Social Sciences & Journalism': '❝', 'Natural Sciences & Mathematics': '∑', 'Agriculture & Veterinary': '❦' }
const norm = (t) => String(t).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/* a command-palette course finder */
export default function Finder() {
  const [data, setData] = useState({ F: null, I: [] })
  const [field, setField] = useState(null)
  const [q, setQ] = useState('')
  const list = useRef()
  useEffect(() => {
    const load = () => setData({ F: window.MY_FIELDS || null, I: window.MY_INDEX || [] })
    if (window.MY_FIELDS) load(); else window.addEventListener('load', load, { once: true })
  }, [])
  const fields = useMemo(() => data.F ? Object.keys(data.F).sort((a, b) => data.F[b].count - data.F[a].count) : [], [data])
  useEffect(() => { if (fields.length && !field) setField(fields[0]) }, [fields])
  const results = useMemo(() => {
    const t = norm(q)
    if (t.length > 1) return data.I.filter((u) => norm(u.n + ' ' + (u.alt || '') + ' ' + u.l).includes(t)).slice(0, 8)
    return field && data.F ? data.F[field].top.slice(0, 8) : []
  }, [q, field, data])
  useEffect(() => { if (!reduce && list.current) gsap.fromTo(list.current.children, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: .5, ease: 'expo.out', stagger: .04 }) }, [results])
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.cf-h'))
    if (reduce) return
    gsap.from(el.querySelector('.cmd'), { y: 80, opacity: 0, scale: .96, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el.querySelector('.cmd'), start: 'top 85%', once: true } })
  })
  const count = q.length > 1 ? results.length : field && data.F ? data.F[field].count : 0
  return (
    <section className="sec courses" id="courses" ref={scope} aria-labelledby="cf-title">
      <div className="wrap">
        <div className="sec-head row">
          <div><p className="kick"><i />06 · Course finder · 391 institutions</p><h2 className="h2 cf-h" id="cf-title">Find your course, <em>then your campus.</em></h2></div>
          <p className="lead">Search by name, city or acronym, or pick a field. Results come from the EMGS register and the Malaysian Qualifications Register.</p>
        </div>
        <div className="cmd">
          <label className="cmd-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a university, e.g. Taylor's, UTM, Penang" aria-label="Search institutions" />
            <kbd>{q ? count + ' found' : '391'}</kbd>
          </label>
          <div className="cmd-body">
            <div className="cmd-fields" role="group" aria-label="Fields of study">
              {fields.map((f) => <button key={f} type="button" className={f === field && !q ? 'on' : ''} aria-pressed={f === field && !q} onClick={() => { setQ(''); setField(f) }}><i aria-hidden="true">{ICON[f] || '•'}</i>{f}<small>{data.F[f].count}</small></button>)}
            </div>
            <div className="cmd-res">
              <p className="cmd-k">{q.length > 1 ? 'Matching institutions' : field ? `Top institutions for ${field}` : 'Loading…'}<b>{count} {q.length > 1 ? '' : 'institutions'}</b></p>
              <ol ref={list}>
                {results.map((u, k) => (
                  <li key={u.n + k}><button type="button" onClick={() => emit('dir', { q: u.n.replace(/\s*\(.*\)/, '') })}>
                    <span className={'cmd-r' + (u.r ? '' : ' none')}>{u.r ? '#' + u.r : 'EMGS'}</span>
                    <span className="cmd-n"><b>{u.n}</b><small>{u.l}</small></span>
                    <span className="cmd-t">{u.t}</span><span className="cmd-go" aria-hidden="true">↗</span>
                  </button></li>
                ))}
                {!results.length && q.length > 1 && <li className="cmd-empty">No institution matches that. Try a shorter word, or ask us on WhatsApp.</li>}
              </ol>
              <div className="cmd-foot"><button type="button" className="btn btn-red btn-sm" onClick={() => emit('dir', q.length > 1 ? { q } : { field })}>Open the full directory</button><a className="tl" href="#begin">Shortlist these for me →</a></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
