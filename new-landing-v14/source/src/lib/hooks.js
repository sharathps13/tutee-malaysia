import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, reduce, SplitText } from './motion.js'

export const useIso = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/* visible: is the element on screen; near: has it ever come within 300px (mount 3D lazily) */
export function useInView(ref, margin = '300px') {
  const [state, set] = useState({ visible: false, near: false })
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => set((s) => ({ visible: e.isIntersecting, near: s.near || e.isIntersecting })), { rootMargin: margin })
    io.observe(el); return () => io.disconnect()
  }, [ref, margin])
  return state
}

/* scoped gsap context for a section */
export function useGsap(fn, deps = []) {
  const scope = useRef(null)
  useIso(() => {
    if (!scope.current) return
    const ctx = gsap.context(() => fn(scope.current), scope)
    return () => ctx.revert()
  }, deps)
  return scope
}

/* heading reveal: lines slide up out of a mask */
export function splitReveal(el, opts = {}) {
  if (!el || reduce) return
  return SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: el, start: 'top 85%', once: true }, ...opts }) })
}
