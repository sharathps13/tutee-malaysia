import { useRef } from 'react'
import Stage from '../three/Stage.jsx'
import FlagFooter from '../three/FlagFooter.jsx'
import { useGsap } from '../lib/hooks.js'
import { gsap, SplitText, reduce, emit } from '../lib/motion.js'

export default function Footer() {
  const word = useRef()
  const scope = useGsap((el) => {
    if (reduce) return
    const s = SplitText.create(word.current, { type: 'chars' })
    gsap.from(s.chars, { yPercent: 110, rotate: 6, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .04, scrollTrigger: { trigger: el, start: 'top 70%', once: true } })
    /* hover: letters swell and glow under the pointer */
    const chars = s.chars
    const mv = (e) => chars.forEach((c) => { const r = c.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)), f = Math.max(0, 1 - d / 240); gsap.to(c, { y: -f * 16, fontWeight: 380 + f * 520, color: f > .05 ? `rgb(255,${Math.round(255 - f * 51)},${Math.round(255 - f * 255)})` : 'rgb(255,255,255)', duration: .4, overwrite: 'auto' }) })
    const lv = () => chars.forEach((c) => gsap.to(c, { y: 0, fontWeight: 380, color: 'rgb(255,255,255)', duration: .8, ease: 'elastic.out(1,.5)', overwrite: 'auto' }))
    word.current.addEventListener('pointermove', mv); word.current.addEventListener('pointerleave', lv)
  })
  return (
    <footer className="foot" ref={scope}>
      <div className="foot-hero">
        <Stage className="foot-gl" camera={{ position: [0, 0, 7], fov: 40 }}><FlagFooter /></Stage>
        <div className="wrap foot-in">
          <p className="kick"><i />Selamat jalan · until we meet again</p>
          <p className="foot-word" ref={word} aria-label="Jumpa lagi">Jumpa lagi.</p>
          <a className="btn btn-sun" href="#begin">Start your Malaysia plan →</a>
        </div>
      </div>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a className="nav-logo" href="#home"><img src="./logo/icon.png" alt="" width="38" height="38" /><span><b>Tutee Connect</b><small>Study · Immigration</small></span></a>
            <p className="about">Our vision is a society where talented people everywhere are connected and support each other to grow.</p>
          </div>
          <div><h4>Malaysia</h4><ul><li><a href="#why">Why Malaysia</a></li><li><a href="#places">Destinations</a></li><li><a href="#unis">Top universities</a></li><li><button type="button" className="tl" onClick={() => emit('dir', {})}>All 391 institutions</button></li><li><a href="#courses">Course finder</a></li></ul></div>
          <div><h4>Company</h4><ul><li><a href="https://tuteeconnect.com/">Home</a></li><li><a href="https://tuteeconnect.com/about.html">About us</a></li><li><a href="https://tuteeconnect.com/profile-registration.html">Profile registration</a></li><li><a href="https://tuteeconnect.com/contact.html">Contact</a></li></ul></div>
          <div><h4>Legal</h4><ul><li><a href="https://tuteeconnect.com/terms-and-conditions.html">Terms and conditions</a></li><li><a href="https://tuteeconnect.com/privacy-policy.html">Privacy policy</a></li></ul></div>
        </div>
        <div className="foot-base"><p>© 2026 Tutee Connect. All rights reserved.</p><p>Photography via Unsplash (Unsplash License). Rankings: QS World University Rankings 2027. Institution data: EMGS and the Malaysian Qualifications Register.</p></div>
      </div>
    </footer>
  )
}
