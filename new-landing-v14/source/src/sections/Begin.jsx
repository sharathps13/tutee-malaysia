import { useEffect, useRef, useState } from 'react'
import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, on, pad } from '../lib/motion.js'
import { Star } from './Chrome.jsx'

const LEVELS = ['Undergraduate degree', "Master's / MBA", 'PhD', 'Foundation / Diploma', 'Not sure yet']
const INTAKES = ['February / March 2027', 'September / October 2027', '2028', 'Not sure yet']
const STEPS = ['name', 'email', 'phone', 'study_level', 'intake', 'message']

/* free evaluation: six questions, one at a time, posted to /api/enquiry with the original field names */
export default function Begin({ codes }) {
  const [k, setK] = useState(0)
  const [v, setV] = useState({ name: '', email: '', country_code: '+91', phone_number: '', study_level: LEVELS[0], intake: INTAKES[0], message: '', destination: 'General Malaysia Inquiry', botcheck: false })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false)
  const stepRef = useRef(); const card = useRef()
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.bg-h'))
    if (reduce) return
    gsap.from(card.current, { y: 100, opacity: 0, rotateX: 12, transformPerspective: 1400, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: card.current, start: 'top 85%', once: true } })
    el.querySelectorAll('.bg-star').forEach((s, i) => gsap.to(s, { rotate: i % 2 ? -360 : 360, duration: 60 + i * 20, repeat: -1, ease: 'none' }))
  })
  useEffect(() => on('destination', (name) => setV((x) => ({ ...x, destination: name }))), [])
  useEffect(() => {
    if (!stepRef.current || reduce) return
    gsap.fromTo(stepRef.current, { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: .55, ease: 'expo.out' })
    const inp = stepRef.current.querySelector('input, textarea'); if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 60)
  }, [k])
  const set = (n) => (e) => setV((x) => ({ ...x, [n]: e.target.value }))
  const check = (i) => {
    const s = STEPS[i]
    if (s === 'name' && !v.name.trim()) return 'Please tell us your name.'
    if (s === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) return 'Please enter a valid email address, like name@example.com.'
    if (s === 'phone' && !/^[0-9]{7,15}$/.test(v.phone_number.replace(/\D/g, ''))) return 'Please enter a phone number of 7 to 15 digits.'
    return ''
  }
  const next = () => { const m = check(k); setErr(m); if (!m) setK(Math.min(k + 1, STEPS.length - 1)) }
  const submit = async (e) => {
    e.preventDefault()
    for (let i = 0; i < STEPS.length; i++) { const m = check(i); if (m) { setK(i); setErr(m); return } }
    setErr(''); setBusy(true)
    const d = { subject: 'New Lead from Tutee Connect Landing Page!', from_name: 'Tutee Connect Notification System', destination: v.destination, name: v.name.trim(), email: v.email.trim(),
      phone: v.country_code + ' ' + v.phone_number, study_level: v.study_level, intake: v.intake, message: v.message.trim(), botcheck: v.botcheck }
    if (!d.message) delete d.message
    if (!d.botcheck) delete d.botcheck
    try { d.page = location.host + location.pathname } catch (x) { d.page = '' }
    try {
      const r = await fetch('/api/enquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) })
      const res = await r.json().catch(() => ({ success: false }))
      if (res && res.success) setDone(true); else setErr((res && res.message) || 'We could not send that. Please try again, or message us on WhatsApp.')
    } catch (x) { setErr('No connection. Check your internet and try again, or message us on WhatsApp.') }
    setBusy(false)
  }
  useEffect(() => { if (done && !reduce) gsap.from('.bg-done > *', { y: 30, opacity: 0, scale: .9, duration: .9, ease: 'expo.out', stagger: .1 }) }, [done])
  const first = v.name.trim().split(' ')[0] || 'friend'
  const opts = (name, list) => <div className="opts" role="group">{list.map((o) => <button key={o} type="button" className={v[name] === o ? 'on' : ''} aria-pressed={v[name] === o} onClick={() => setV((x) => ({ ...x, [name]: o }))}>{o}</button>)}</div>
  return (
    <section className="sec begin" id="begin" ref={scope} aria-labelledby="bg-title">
      <Star className="bg-star s1" /><Star className="bg-star s2" />
      <div className="wrap bg">
        <div className="bg-copy">
          <p className="kick"><i />13 · Free profile evaluation</p>
          <h2 className="h2 bg-h" id="bg-title">Let's plan <em>your Malaysia.</em></h2>
          <p className="lead">Six quick questions. A Malaysia counsellor then calls you with a shortlist, a budget and a Student Pass plan, usually within one working day.</p>
          <ul className="bg-list"><li>Free, with no obligation</li><li>Shortlist from 391 institutions</li><li>Budget, loans and scholarships</li><li>Student Pass and Graduate Pass plan</li></ul>
          <div className="offices">
            <div><h4>India office</h4><p>1st Floor, ALA Corner Complex,<br />Virugambakkam, Chennai 600092</p></div>
            <div><h4>UAE office</h4><p>Tutee Connect LLC FZ,<br />Meydan Grandstand, Dubai</p></div>
            <div><h4>Call</h4><p><a href="tel:+917010902329">+91 701-090-2329</a><br /><a href="tel:+971553799068">+971 55-379 9068</a></p></div>
            <div><h4>Email</h4><p><a href="mailto:info@tuteeconnect.com">info@tuteeconnect.com</a></p></div>
          </div>
        </div>
        <div className="bg-card" ref={card}>
          {done ? (
            <div className="bg-done" role="status"><Star className="bg-done-star" /><h3>Terima kasih, {first}!</h3><p>Your details are with a Malaysia counsellor. Expect a call within one working day.</p></div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="bg-prog"><span>Question {k + 1} of {STEPS.length}</span><i><b style={{ transform: `scaleX(${(k + 1) / STEPS.length})` }} /></i></div>
              {v.destination !== 'General Malaysia Inquiry' && <p className="bg-dest">Asking about <b>{v.destination}</b> <button type="button" onClick={() => setV((x) => ({ ...x, destination: 'General Malaysia Inquiry' }))} aria-label="Remove">×</button></p>}
              <label className="hp" aria-hidden="true">Leave empty <input type="checkbox" tabIndex={-1} checked={v.botcheck} onChange={(e) => setV((x) => ({ ...x, botcheck: e.target.checked }))} /></label>
              <div className="bg-step" ref={stepRef} key={k} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON' && k < STEPS.length - 1) { e.preventDefault(); next() } }}>
                {k === 0 && <><label htmlFor="f-name">Hi! What should we call you?</label><input id="f-name" name="name" autoComplete="name" placeholder="Your full name" value={v.name} onChange={set('name')} /></>}
                {k === 1 && <><label htmlFor="f-email">Nice to meet you, {first}. Your email?</label><input id="f-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={v.email} onChange={set('email')} /></>}
                {k === 2 && <><label htmlFor="f-phone">Best number to call you on?</label><div className="phone-row"><select name="country_code" aria-label="Country code" value={v.country_code} onChange={set('country_code')}>{codes.map((c) => { const [cc, num] = c.split(' '); return <option key={c} value={num}>{cc} ({num})</option> })}</select><input id="f-phone" name="phone_number" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" value={v.phone_number} onChange={set('phone_number')} /></div></>}
                {k === 3 && <><label>What do you want to study?</label>{opts('study_level', LEVELS)}</>}
                {k === 4 && <><label>When would you like to start?</label>{opts('intake', INTAKES)}</>}
                {k === 5 && <><label htmlFor="f-msg">Anything we should know? <small>(optional)</small></label><textarea id="f-msg" name="message" placeholder="Course, marks, budget, previous refusals…" value={v.message} onChange={set('message')} /></>}
              </div>
              {err && <p className="bg-err" role="alert">{err}</p>}
              <div className="bg-nav">
                {k > 0 ? <button type="button" className="tl" onClick={() => { setErr(''); setK(k - 1) }}>← Back</button> : <span />}
                {k < STEPS.length - 1 ? <button key="next" type="button" className="btn btn-sun" onClick={next}>Next <span aria-hidden="true">↵</span></button>
                  : <button key="send" type="submit" className="btn btn-sun" disabled={busy}>{busy ? 'Sending…' : 'Send to a counsellor'}</button>}
              </div>
              <div className="bg-dots" aria-hidden="true">{STEPS.map((s, i) => <i key={s} className={i < k ? 'done' : i === k ? 'on' : ''} />)}</div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
