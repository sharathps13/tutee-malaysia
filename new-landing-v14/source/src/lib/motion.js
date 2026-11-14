import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'
import { CustomEase } from 'gsap/CustomEase'
gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin, CustomEase)
CustomEase.create('silk', 'M0,0 C0.16,1 0.3,1 1,1')
export const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
export const fine = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
export { gsap, ScrollTrigger, SplitText, Draggable }
export const P = './img/'
export const pad = (n) => String(n).padStart(2, '0')
export const clamp = (a, b, v) => Math.max(a, Math.min(b, v))
export function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch (e) { return false }
}
/* a tiny event bus so sections can talk (open the directory, fill the destination, jump to a section) */
const bus = new EventTarget()
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }))
export const on = (type, fn) => { const h = (e) => fn(e.detail); bus.addEventListener(type, h); return () => bus.removeEventListener(type, h) }
