import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, reduce, on, emit } from './lib/motion.js'
import C from './content.json'
import Chrome from './sections/Chrome.jsx'
import Hero from './sections/Hero.jsx'
import Why from './sections/Why.jsx'
import Places from './sections/Places.jsx'
import Services from './sections/Services.jsx'
import Unis from './sections/Unis.jsx'
import Journey from './sections/Journey.jsx'
import Finder from './sections/Finder.jsx'
import Life from './sections/Life.jsx'
import Escapes from './sections/Escapes.jsx'
import Funding from './sections/Funding.jsx'
import Family from './sections/Family.jsx'
import Voices from './sections/Voices.jsx'
import Faq from './sections/Faq.jsx'
import Begin from './sections/Begin.jsx'
import Footer from './sections/Footer.jsx'
import Directory from './sections/Directory.jsx'

export const SECTIONS = [
  ['home', 'Selamat datang', '#070B22'], ['why', 'Why Malaysia', '#0A1A5C'], ['places', 'Destinations', '#050A1C'], ['services', 'What we do', '#4A0E1F'],
  ['unis', 'Universities', '#06231B'], ['journey', 'Student Pass', '#00424B'], ['courses', 'Course finder', '#FBF3E4'], ['life', 'Life & food', '#120814'],
  ['escapes', 'Weekend escapes', '#B8374F'], ['money', 'Funding', '#0E3524'], ['family', 'Family', '#F6DCE2'], ['voices', 'Stories', '#2B1438'],
  ['faq', 'Questions', '#F3EEE4'], ['begin', 'Free evaluation', '#0A1A5C'],
]

export default function App() {
  const lenisRef = useRef(null)
  const [dir, setDir] = useState(null)
  useEffect(() => {
    document.documentElement.classList.add('js')
    let lenis = null
    if (!reduce) {
      lenis = new Lenis({ lerp: .1, smoothWheel: true })
      lenis.on('scroll', ScrollTrigger.update)
      gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)
      lenisRef.current = lenis
    }
    const offGo = on('go', (id) => {
      const el = document.getElementById(id); if (!el) return
      if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) }); else el.scrollIntoView()
    })
    const offDir = on('dir', (q) => { setDir(q || {}); lenis && lenis.stop() })
    const offDirClose = on('dir-close', () => { setDir(null); lenis && lenis.start() })
    const ro = new ResizeObserver(() => ScrollTrigger.refresh()); ro.observe(document.body)
    document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh())
    return () => { offGo(); offDir(); offDirClose(); ro.disconnect(); lenis && lenis.destroy() }
  }, [])
  /* in-page anchors go through Lenis */
  useEffect(() => {
    const h = (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return
      const id = a.getAttribute('href').slice(1); if (!id) return
      e.preventDefault(); emit('menu', false); emit('go', id)
    }
    document.addEventListener('click', h); return () => document.removeEventListener('click', h)
  }, [])
  return (
    <>
      <Chrome sections={SECTIONS} />
      <main>
        <Hero />
        <Why items={C.reasons} />
        <Places places={C.places} />
        <Services items={C.services} imgs={C.svcImgs} tags={C.tags} />
        <Unis unis={C.unis} />
        <Journey steps={C.steps} />
        <Finder />
        <Life items={C.life} phrases={C.phrases} fest={C.fest} />
        <Escapes items={C.escapes} />
        <Funding items={C.fund} partners={C.partners} />
        <Family />
        <Voices items={C.voices} />
        <Faq items={C.faq} />
        <Begin codes={C.codes} />
      </main>
      <Footer />
      {dir && <Directory query={dir} />}
    </>
  )
}
