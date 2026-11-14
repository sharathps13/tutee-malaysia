import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, reduce, on, emit, pad, P } from '../lib/motion.js'

const LIGHT = ['courses', 'family', 'faq']
const MENU = [['why', 'Why Malaysia', 'why-towers'], ['places', 'Destinations', 'pl-penang'], ['services', 'What we do', 'sv-visa'], ['unis', 'Universities', 'u-3'],
  ['journey', 'Student Pass', 'jp-4'], ['courses', 'Course finder', 'sv-lang'], ['life', 'Life & food', 'l-nasi'], ['escapes', 'Weekend escapes', 'e-redang'],
  ['money', 'Funding', 'fund-1'], ['family', 'Family', 'fam-airport'], ['voices', 'Stories', 'l-art'], ['faq', 'Questions', 'faq-side'], ['begin', 'Free evaluation', 'begin-bg']]

function Star({ className }) {
  const pts = []; for (let k = 0; k < 28; k++) { const a = -Math.PI / 2 + k * Math.PI / 14, r = k % 2 ? 19 : 46; pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1)) }
  return <svg className={className} viewBox="-50 -50 100 100" aria-hidden="true"><polygon points={pts.join(' ')} /></svg>
}
export { Star }

export default function Chrome({ sections }) {
  const [cur, setCur] = useState(0)
  const [theme, setTheme] = useState('dark')
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState('')
  const [hide, setHide] = useState(false)
  const loader = useRef(); const bar = useRef(); const menu = useRef(); const nameRef = useRef(); const cursor = useRef()
  /* loader: the 14-point star draws, the count runs, then the panels split */
  useEffect(() => {
    const L = loader.current; if (!L) return
    if (reduce) { L.style.display = 'none'; window.dispatchEvent(new Event('tc:ready')); return }
    const o = { v: 0 }; const n = L.querySelector('.ld-n')
    const tl = gsap.timeline({ onComplete: () => { L.style.display = 'none' } })
    tl.fromTo(L.querySelector('.ld-star polygon'), { strokeDashoffset: 900 }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
      .to(o, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => { n.textContent = Math.round(o.v) } }, 0)
      .to(L.querySelector('.ld-star polygon'), { fill: '#FFCC00', duration: .4 }, '-=.3')
      .to(L.querySelector('.ld-in'), { scale: .8, opacity: 0, duration: .5, ease: 'power2.in' }, '+=.1')
      .add(() => window.dispatchEvent(new Event('tc:ready')))
      .to(L.querySelectorAll('.ld-p'), { yPercent: (i) => i ? 101 : -101, duration: 1.1, ease: 'expo.inOut' }, '-=.1')
    return () => tl.kill()
  }, [])
  /* which section are we in */
  useEffect(() => {
    const trs = sections.map(([id], i) => {
      const el = document.getElementById(id); if (!el) return null
      return ScrollTrigger.create({ trigger: el, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => { if (s.isActive) { setCur(i); setTheme(LIGHT.includes(id) ? 'light' : 'dark') } } })
    })
    const prog = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { if (bar.current) bar.current.style.transform = 'scaleX(' + s.progress.toFixed(4) + ')'; setHide(s.direction > 0 && s.scroll() > 700) } })
    return () => { trs.forEach((t) => t && t.kill()); prog.kill() }
  }, [])
  useEffect(() => {
    if (!nameRef.current || reduce) return
    gsap.fromTo(nameRef.current.children, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .04 })
  }, [cur])
  useEffect(() => {
    const tick = () => { try { setTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' })) } catch (e) { } }
    tick(); const t = setInterval(tick, 20000); return () => clearInterval(t)
  }, [])
  /* menu */
  useEffect(() => on('menu', (v) => setOpen(v)), [])
  useEffect(() => { if (!open) return; const k = (e) => { if (e.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [open])
  useEffect(() => {
    const m = menu.current; if (!m) return
    document.documentElement.classList.toggle('menu-open', open)
    if (reduce) { m.style.visibility = open ? 'visible' : 'hidden'; return }
    if (open) {
      gsap.set(m, { visibility: 'visible' })
      gsap.fromTo(m, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: .9, ease: 'expo.inOut' })
      gsap.fromTo(m.querySelectorAll('.mn-item'), { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'expo.out', stagger: .035, delay: .3 })
    } else gsap.to(m, { clipPath: 'circle(0% at 100% 0%)', duration: .6, ease: 'expo.inOut', onComplete: () => gsap.set(m, { visibility: 'hidden' }) })
  }, [open])
  /* cursor: a gold ring that grows on links */
  useEffect(() => {
    const c = cursor.current; if (!c || reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const x = gsap.quickTo(c, 'x', { duration: .35, ease: 'power3' }), y = gsap.quickTo(c, 'y', { duration: .35, ease: 'power3' })
    const mv = (e) => { x(e.clientX); y(e.clientY); const t = e.target.closest && e.target.closest('a, button, [data-cur]'); c.classList.toggle('big', !!t); c.dataset.label = t && t.getAttribute('data-cur') || '' }
    window.addEventListener('pointermove', mv, { passive: true }); c.style.opacity = 1
    return () => window.removeEventListener('pointermove', mv)
  }, [])
  const [id, name] = sections[cur]
  return (
    <>
      <div className="loader" ref={loader} aria-hidden="true">
        <i className="ld-p" /><i className="ld-p" />
        <div className="ld-in"><Star className="ld-star" /><p><span className="ld-n">0</span><small>Tutee Connect · Malaysia</small></p></div>
      </div>
      <header className={'nav' + (hide && !open ? ' hide' : '') + ' t-' + (open ? 'dark' : theme)}>
        <a className="nav-logo" href="#home" aria-label="Tutee Connect, back to top"><img src="./logo/icon.png" alt="" width="38" height="38" /><span><b>Tutee Connect</b><small>Study in Malaysia</small></span></a>
        <div className="nav-now" aria-live="polite"><span className="nav-i">{pad(cur)}<i>/</i>{pad(sections.length - 1)}</span><span className="nav-name" ref={nameRef}>{name.split(' ').map((w, i) => <span key={i + w}>{w}&nbsp;</span>)}</span></div>
        <div className="nav-act">
          <span className="nav-kl" title="Local time in Kuala Lumpur"><i className="flag" aria-hidden="true" />KL <b>{time}</b></span>
          <a className="btn btn-sun btn-sm hide-sm" href="#begin">Free evaluation</a>
          <button type="button" className={'nav-menu' + (open ? ' on' : '')} aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}><span>{open ? 'Close' : 'Menu'}</span><i><b /><b /></i></button>
        </div>
        <span className="nav-bar" aria-hidden="true"><i ref={bar} /></span>
      </header>
      <nav id="menu" className="mn" ref={menu} aria-label="Sections" hidden={false} aria-hidden={!open}>
        <div className="mn-grid">
          {MENU.map(([mid, label, img], i) => (
            <a key={mid} href={'#' + mid} className={'mn-item' + (mid === id ? ' on' : '')} tabIndex={open ? 0 : -1} data-cur="Go">
              <img src={P + img + '.jpg'} alt="" loading="lazy" /><span className="mn-n">{pad(i + 1)}</span><b>{label}</b>
            </a>
          ))}
        </div>
        <div className="mn-foot"><a href="tel:+917010902329" tabIndex={open ? 0 : -1}>+91 701-090-2329</a><a href="mailto:info@tuteeconnect.com" tabIndex={open ? 0 : -1}>info@tuteeconnect.com</a><a href="https://wa.me/917010902329" target="_blank" rel="noopener" tabIndex={open ? 0 : -1}>WhatsApp ↗</a></div>
      </nav>
      <a className="wa" href="https://wa.me/917010902329" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" /></svg></a>
      <div className="cursor" ref={cursor} aria-hidden="true" />
    </>
  )
}
