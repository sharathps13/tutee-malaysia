import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap, reduce, emit } from '../lib/motion.js'

const TYPE_LABEL = { 'Research University': 'Public research university', 'Public University': 'Public university', 'Private University': 'Private university', 'University College': 'University college', 'Private College': 'Private college', 'Foreign Branch Campus': 'Foreign branch campus', 'Polytechnic & Community College': 'Polytechnic or community college' }
const TYPE_COL = { 'Research University': '#0F7B5F', 'Public University': '#0E5C5A', 'Private University': '#0A1A5C', 'University College': '#7B4FD1', 'Private College': '#B0225E', 'Foreign Branch Campus': '#C8102E', 'Polytechnic & Community College': '#C77700' }
let loading = null
function loadData() {
  if (window.MY_UNIVERSITIES) return Promise.resolve(window.MY_UNIVERSITIES)
  if (!loading) loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = './data/universities-data.js'; s.onload = () => res(window.MY_UNIVERSITIES || []); s.onerror = rej; document.head.appendChild(s) })
  return loading
}

/* all 391 institutions in an overlay (works inside previews that block new tabs, and on the live site) */
export default function Directory({ query }) {
  const [U, setU] = useState([])
  const [q, setQ] = useState(query.q || ''); const [st, setSt] = useState(query.state || ''); const [ty, setTy] = useState(''); const [fd, setFd] = useState(query.field || ''); const [sort, setSort] = useState('rank')
  const [shown, setShown] = useState(24)
  const root = useRef()
  useEffect(() => { loadData().then((d) => setU(d.map((u) => { const parts = u.location.split(','); const acc = parseInt(u.accredited, 10); return { ...u, st: parts[parts.length - 1].trim(), f: u.programs ? u.programs.split(',').map((x) => x.trim()).filter(Boolean) : [], a: isNaN(acc) ? 0 : acc, r: u.ranked ? u.rank : 0 } }))) }, [])
  useEffect(() => {
    document.documentElement.classList.add('dir-open')
    if (!reduce) gsap.fromTo(root.current, { clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)', duration: .9, ease: 'expo.inOut' })
    const k = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', k)
    return () => { document.documentElement.classList.remove('dir-open'); window.removeEventListener('keydown', k) }
  }, [])
  const close = (then) => {
    const fin = () => { emit('dir-close'); then && then() }
    if (reduce) fin(); else gsap.to(root.current, { clipPath: 'circle(0% at 50% 100%)', duration: .6, ease: 'expo.inOut', onComplete: fin })
  }
  const count = (fn) => { const o = {}; U.forEach((u) => [].concat(fn(u)).forEach((k) => { if (k) o[k] = (o[k] || 0) + 1 })); return o }
  const byS = useMemo(() => count((u) => u.st), [U]), byT = useMemo(() => count((u) => u.t || u.type), [U]), byF = useMemo(() => count((u) => u.f), [U])
  const list = useMemo(() => {
    const t = q.trim().toLowerCase().replace(/[’']/g, '')
    const out = U.filter((u) => (!t || (u.name + ' ' + (u.alt || '') + ' ' + u.location).toLowerCase().replace(/[’']/g, '').includes(t)) && (!st || u.st === st) && (!ty || u.type === ty) && (!fd || u.f.includes(fd)))
    out.sort((a, b) => sort === 'az' ? a.name.localeCompare(b.name) : sort === 'acc' ? b.a - a.a || a.name.localeCompare(b.name) : (a.r || 999) - (b.r || 999) || b.a - a.a || a.name.localeCompare(b.name))
    return out
  }, [U, q, st, ty, fd, sort])
  useEffect(() => setShown(24), [q, st, ty, fd, sort])
  const pick = (name) => { emit('destination', name); close(() => emit('go', 'begin')) }
  const keys = (o) => Object.keys(o).sort((a, b) => o[b] - o[a])
  const maxA = Math.max(1, ...U.map((u) => u.a))
  return (
    <div className="dir" ref={root} role="dialog" aria-modal="true" aria-label="All institutions in Malaysia" data-lenis-prevent>
      <header className="dir-nav"><b>All {U.length || 391} institutions</b><span>EMGS register · QS 2027 · Malaysian Qualifications Register</span><button type="button" className="btn btn-glass btn-sm" onClick={() => close()}>← Back to the page</button></header>
      <div className="dir-in">
        <div className="dir-tools">
          <label className="dir-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, city or acronym" aria-label="Search" autoFocus /></label>
          <label className="sel"><span>State</span><select value={st} onChange={(e) => setSt(e.target.value)}><option value="">All states</option>{Object.keys(byS).sort().map((s) => <option key={s} value={s}>{s} ({byS[s]})</option>)}</select></label>
          <label className="sel"><span>Type</span><select value={ty} onChange={(e) => setTy(e.target.value)}><option value="">All types</option>{keys(byT).map((s) => <option key={s} value={s}>{TYPE_LABEL[s] || s} ({byT[s]})</option>)}</select></label>
          <label className="sel"><span>Field</span><select value={fd} onChange={(e) => setFd(e.target.value)}><option value="">All fields</option>{keys(byF).map((s) => <option key={s} value={s}>{s} ({byF[s]})</option>)}</select></label>
          <label className="sel"><span>Sort</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="rank">QS ranking</option><option value="acc">Most programmes</option><option value="az">A to Z</option></select></label>
        </div>
        <p className="dir-count"><b>{list.length}</b> {list.length === 1 ? 'institution' : 'institutions'} {(q || st || ty || fd) && <button type="button" className="tl" onClick={() => { setQ(''); setSt(''); setTy(''); setFd('') }}>Clear filters ×</button>}</p>
        <ol className="dir-grid">
          {list.slice(0, shown).map((u) => (
            <li key={u.id || u.name} className="dc" style={{ '--c': TYPE_COL[u.type] || '#0A1A5C' }}>
              <div className="dc-top">{u.r ? <span className="dc-rank"><small>QS</small>#{u.r}</span> : <span className="dc-rank none">Not ranked</span>}<span className="dc-type">{TYPE_LABEL[u.type] || u.type}</span></div>
              <h3>{u.name}</h3><p className="dc-loc">{u.location}</p>
              <div className="dc-f">{u.f.length ? u.f.map((f) => <span key={f} className={f === fd ? 'hit' : ''}>{f}</span>) : <span className="none">Fields not yet listed in MQR</span>}</div>
              {u.a ? <div className="dc-acc"><span>MQA-accredited programmes</span><b>{u.a}</b><i style={{ width: Math.max(3, u.a / maxA * 100) + '%' }} /></div> : <div className="dc-acc none"><span>Programme count not matched to MQR</span></div>}
              <button type="button" className="btn btn-sun btn-sm" onClick={() => pick(u.name)}>Ask about this →</button>
            </li>
          ))}
        </ol>
        {list.length > shown && <div className="dir-more"><button type="button" className="btn btn-red" onClick={() => setShown(shown + 24)}>Show {Math.min(24, list.length - shown)} more</button></div>}
        {!list.length && U.length > 0 && <p className="dir-empty">No institution matches those filters. Try fewer filters, or ask a counsellor on WhatsApp.</p>}
        <p className="dir-note">QS ranks show an institution's position among Malaysian universities in the QS World University Rankings 2027. Fields are the three largest areas of each institution's accredited programmes in the Malaysian Qualifications Register. Always confirm a programme's accreditation with the institution before applying.</p>
      </div>
    </div>
  )
}
