import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { gsap, reduce } from '../lib/motion.js'

const vert = /* glsl */`
uniform float uBend; varying vec2 vUv; varying float vZ;
void main() { vUv = uv; vec3 p = position; p.z -= (p.x * p.x) * uBend; vec4 w = modelMatrix * vec4(p, 1.); vZ = w.z; gl_Position = projectionMatrix * viewMatrix * w; }`
const frag = /* glsl */`
uniform sampler2D tMap; uniform vec2 uRes; uniform vec2 uSize; uniform float uActive; uniform float uHover; uniform float uZoom;
varying vec2 vUv; varying float vZ; uniform float uR;
vec2 cover(vec2 uv) { float ri = uRes.x / uRes.y, rp = uSize.x / uSize.y; vec2 s = rp > ri ? vec2(1., ri / rp) : vec2(rp / ri, 1.); return (uv - .5) * s / uZoom + .5; }
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
void main() {
  vec3 c = texture2D(tMap, cover(vUv)).rgb;
  float g = dot(c, vec3(.299, .587, .114));
  float on = max(uActive, uHover * .7);
  c = mix(vec3(g) * vec3(.8, .9, .95), c, .45 + on * .55);
  c *= (.72 + on * .28) * 1.12;
  c = mix(c, c * vec3(.4, .5, .3) + vec3(.0, .06, .02), (1. - vUv.y) * .5);
  c *= mix(.18, 1., smoothstep(-uR * .2, uR * .95, vZ));
  float d = rbox((vUv - .5) * uSize, uSize * .5, .14);
  if (d > 0.) discard;
  float border = smoothstep(-.035, -.015, d) * uActive;
  c = mix(c, vec3(1., .8, 0.), border);
  gl_FragColor = vec4(c, 1.);
}`

function Card({ tex, i, n, angle, active, onPick, w, h, R }) {
  const mat = useRef(); const mesh = useRef(); const hov = useRef(0)
  const uniforms = useMemo(() => ({ tMap: { value: tex }, uRes: { value: new THREE.Vector2(tex.image?.width || 1, tex.image?.height || 1) }, uSize: { value: new THREE.Vector2(w, h) },
    uActive: { value: 0 }, uHover: { value: 0 }, uZoom: { value: 1 }, uBend: { value: .03 }, uR: { value: R } }), [tex, w, h, R])
  useEffect(() => { gsap.to(uniforms.uActive, { value: active ? 1 : 0, duration: .6 }); if (mesh.current) gsap.to(mesh.current.scale, { x: active ? 1.12 : 1, y: active ? 1.12 : 1, duration: .8, ease: 'expo.out' }) }, [active])
  useFrame(() => { uniforms.uHover.value += (hov.current - uniforms.uHover.value) * .12; uniforms.uZoom.value += ((1 + hov.current * .08 + (active ? .05 : 0)) - uniforms.uZoom.value) * .08 })
  return (
    <mesh ref={mesh} position={[Math.sin(angle) * R, 0, Math.cos(angle) * R]} rotation={[0, angle, 0]}
      onPointerOver={(e) => { e.stopPropagation(); hov.current = 1; document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { hov.current = 0; document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); onPick(i) }}>
      <planeGeometry args={[w, h, 24, 1]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </mesh>
  )
}

export default function UniArc({ unis, active, onPick, dragRef }) {
  const texs = useTexture(unis.map((u, i) => './img/u-' + (i + 1) + '.jpg'))
  texs.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace })
  const group = useRef(); const { viewport } = useThree()
  const n = unis.length, STEP = Math.PI * 2 / n
  const rot = useRef({ y: 0 }); const prev = useRef(active); const virt = useRef(active)
  useEffect(() => {
    let d = ((active - prev.current) % n + n) % n; if (d > n / 2) d -= n
    virt.current += d; prev.current = active
    gsap.to(rot.current, { y: virt.current * STEP, duration: reduce ? 0 : 1.3, ease: 'expo.out' })
  }, [active])
  useFrame((s) => {
    if (!group.current) return
    const drag = dragRef.current || 0
    group.current.rotation.y += (-(rot.current.y + drag) - group.current.rotation.y) * .12
    group.current.rotation.x = s.pointer.y * .03
    group.current.position.y = Math.sin(s.clock.elapsedTime * .6) * .05
  })
  const mob = viewport.aspect < 1
  const w = mob ? 2.4 : 2.5, h = w * 1.3, R = mob ? 5 : 5.6
  return (
    <group ref={group}>
      {texs.map((t, i) => <Card key={i} tex={t} i={i} n={n} angle={i * STEP} active={i === active} onPick={onPick} w={w} h={h} R={R} />)}
    </group>
  )
}
