import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { gsap, reduce } from '../lib/motion.js'

const vert = /* glsl */`
uniform float uTime; uniform vec2 uMouse; uniform float uHover; uniform float uFold;
varying vec2 vUv; varying float vShade;
void main() {
  vUv = uv;
  vec3 p = position;
  float w = sin(p.x * 1.4 + uTime * .7) * .06 + sin(p.y * 2.1 + uTime * 1.05) * .04 + sin((p.x + p.y) * 3.2 + uTime * 1.6) * .015;
  float d = distance(uv, uMouse);
  float bulge = exp(-d * d * 22.) * .45 * uHover;
  p.z += w + bulge;
  p.z -= uFold * pow(1. - uv.y, 2.2) * 2.4;
  p.y += uFold * pow(1. - uv.y, 2.) * .8;
  vShade = (w * 5.5) + bulge * 1.6;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`

const frag = /* glsl */`
uniform sampler2D tA; uniform sampler2D tB; uniform vec2 uResA; uniform vec2 uResB; uniform vec2 uPlane;
uniform float uProg; uniform float uTime; uniform float uFold;
varying vec2 vUv; varying float vShade;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
vec2 cover(vec2 uv, vec2 img) { float ri = img.x / img.y, rp = uPlane.x / uPlane.y;
  vec2 s = rp > ri ? vec2(1., ri / rp) : vec2(rp / ri, 1.); return (uv - .5) * s + .5; }
void main() {
  vec2 uv = vUv + vec2(vShade * .006, vShade * .004);
  float n = noise(vUv * 3.5 + uTime * .04) * .65 + noise(vUv * 11.) * .35;
  float v = n * .55 + (1. - vUv.y) * .25 + vUv.x * .2;
  float t = uProg * 1.35 - .18;
  float a = smoothstep(t - .06, t + .06, v);
  vec3 ca = texture2D(tA, cover(uv, uResA)).rgb;
  vec3 cb = texture2D(tB, cover(uv, uResB)).rgb;
  vec3 col = mix(cb, ca, a);
  float edge = 1. - abs(a - .5) * 2.; edge = pow(edge, 3.);
  col += vec3(.91, .73, .29) * edge * .9;
  col *= .88 + vShade * .35;
  /* faint songket threads */
  vec2 g = vUv * vec2(uPlane.x / uPlane.y, 1.) * 26.;
  float dia = abs(fract(g.x + g.y) - .5) * abs(fract(g.x - g.y) - .5);
  col += vec3(.91, .73, .29) * smoothstep(.012, .0, dia) * .06;
  float vig = smoothstep(1.15, .35, distance(vUv, vec2(.5, .55)));
  col *= mix(.55, 1., vig);
  col = mix(col, col * vec3(.55, .6, .85), uFold * .6);
  gl_FragColor = vec4(col, 1.);
}`

export const SLIDES = [
  ['hx-m118', 'Kuala Lumpur', 'Merdeka 118 and the city skyline'],
  ['hx-perhentian', 'Perhentian Islands', 'Terengganu'],
  ['hx-keklok', 'Penang', 'Kek Lok Si temple'],
  ['hx-putra', 'Putrajaya', 'Putra Mosque on the lake'],
  ['hx-skybridge', 'Langkawi', 'The Sky Bridge'],
  ['hx-petronas', 'Kuala Lumpur', 'Petronas Twin Towers at night'],
]

export default function HeroSilk({ index, scrollRef }) {
  const texs = useTexture(SLIDES.map((s) => './img/' + s[0] + '.jpg'))
  texs.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4 })
  const { viewport, size } = useThree()
  const mat = useRef(); const mesh = useRef()
  const mouse = useRef(new THREE.Vector2(.5, .5)); const hover = useRef(0)
  const cur = useRef(index)
  const uniforms = useMemo(() => ({
    tA: { value: texs[0] }, tB: { value: texs[0] }, uResA: { value: new THREE.Vector2(1, 1) }, uResB: { value: new THREE.Vector2(1, 1) },
    uPlane: { value: new THREE.Vector2(1, 1) }, uProg: { value: 0 }, uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(.5, .5) }, uHover: { value: 0 }, uFold: { value: 0 },
  }), [])
  const res = (t) => new THREE.Vector2(t.image?.width || 1, t.image?.height || 1)
  useEffect(() => { uniforms.tA.value = texs[0]; uniforms.uResA.value = res(texs[0]) }, [texs])
  /* change slide: B becomes the new photo, dissolve A away */
  useEffect(() => {
    if (index === cur.current) return
    const u = uniforms
    u.tB.value = texs[index]; u.uResB.value = res(texs[index]); u.uProg.value = 0
    gsap.to(u.uProg, { value: 1, duration: reduce ? .01 : 1.8, ease: 'power2.inOut', overwrite: true,
      onComplete: () => { u.tA.value = texs[index]; u.uResA.value = res(texs[index]); u.uProg.value = 0 } })
    cur.current = index
  }, [index])
  useEffect(() => {
    const mv = (e) => { const r = document.querySelector('.hero')?.getBoundingClientRect(); if (!r) return; mouse.current.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height); hover.current = 1 }
    const lv = () => { hover.current = 0 }
    window.addEventListener('pointermove', mv, { passive: true }); document.addEventListener('pointerleave', lv)
    return () => { window.removeEventListener('pointermove', mv); document.removeEventListener('pointerleave', lv) }
  }, [])
  const w = viewport.width * 1.08, h = viewport.height * 1.08
  uniforms.uPlane.value.set(w, h)
  useFrame((state, dt) => {
    const u = uniforms
    u.uTime.value += reduce ? 0 : dt
    u.uMouse.value.lerp(mouse.current, .08)
    u.uHover.value += ((reduce ? 0 : hover.current) - u.uHover.value) * .05
    const sp = scrollRef.current || 0
    u.uFold.value = sp
    if (mesh.current) {
      mesh.current.rotation.x = -sp * .55 + (u.uMouse.value.y - .5) * .05
      mesh.current.rotation.y = (u.uMouse.value.x - .5) * .08
      mesh.current.position.z = -sp * 2.2
    }
  })
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[w, h, 160, 100]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </mesh>
  )
}
