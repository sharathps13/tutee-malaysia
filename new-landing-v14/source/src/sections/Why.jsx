import { useGsap, splitReveal } from '../lib/hooks.js'
import { gsap, reduce, P } from '../lib/motion.js'

export default function Why({ items }) {
  const scope = useGsap((el) => {
    splitReveal(el.querySelector('.why-h'))
    if (reduce) return
    gsap.from(el.querySelectorAll('.bt'), { clipPath: 'inset(30% 20% 30% 20% round 40px)', opacity: 0, duration: 1.4, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: el.querySelector('.bento'), start: 'top 80%', once: true } })
    el.querySelectorAll('.bt img').forEach((im) => gsap.fromTo(im, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: im.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }))
    el.querySelectorAll('[data-count]').forEach((n) => {
      const end = +n.getAttribute('data-count'); const o = { v: 0 }
      gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 85%', once: true }, onUpdate: () => { n.textContent = Math.round(o.v) } })
    })
  })
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', (e.clientX - r.left) + 'px'); e.currentTarget.style.setProperty('--my', (e.clientY - r.top) + 'px') }
  const areas = ['a', 'b', 'c', 'd', 'e', 'f']
  return (
    <section className="sec why" id="why" ref={scope} aria-labelledby="why-title">
      <div className="wrap">
        <div className="sec-head">
          <p className="kick"><i />01 · Why Malaysia</p>
          <h2 className="h2 why-h" id="why-title">Six reasons the answer <em>keeps being Malaysia.</em></h2>
        </div>
        <div className="bento">
          {items.map((it, i) => {
            const num = /^\d+$/.test(it.big) ? +it.big : null
            return (
              <article key={i} className={'bt bt-' + areas[i]} tabIndex={0} onPointerMove={move}>
                <img src={P + it.img + '.jpg'} alt="" loading="lazy" />
                <span className="bt-n">0{i + 1}</span>
                <div className="bt-b">
                  <b className="bt-big">{num != null ? <span data-count={num}>{num}</span> : it.big}{it.unit && <small>{it.unit}</small>}</b>
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
