import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { reduce } from '../lib/motion.js'

const frag = /* glsl */`
uniform sampler2D tMap; uniform vec2 uRes; uniform float uHover; varying vec2 vUv;
vec2 cover(vec2 uv) { float ri = uRes.x / uRes.y, rp = 3. / 4.; vec2 s = rp > ri ? vec2(1., ri / rp) : vec2(rp / ri, 1.); return (uv - .5) * s / (1. + uHover * .1) + .5; }
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
void main() {
  vec3 c = texture2D(tMap, cover(vUv)).rgb;
  c *= .78 + uHover * .3;
  float d = rbox(vUv - .5, vec2(.5), .06);
  if (d > 0.) discard;
  c = mix(c, vec3(1., .8, .0), smoothstep(-.025, -.008, d) * uHover);
  gl_FragColor = vec4(c, 1.);
}`
const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }'

function Panel({ tex, pos, item, onPick }) {
  const ref = useRef(); const hov = useRef(0)
  const u = useMemo(() => ({ tMap: { value: tex }, uRes: { value: new THREE.Vector2(tex.image?.width || 3, tex.image?.height || 4) }, uHover: { value: 0 } }), [tex])
  useEffect(() => { if (ref.current) ref.current.lookAt(0, 0, 0) }, [])
  useFrame(() => { u.uHover.value += (hov.current - u.uHover.value) * .12; if (ref.current) ref.current.scale.setScalar(1 + u.uHover.value * .12) })
  return (
    <mesh ref={ref} position={pos}
      onPointerOver={(e) => { e.stopPropagation(); hov.current = 1; onPick(item, false) }} onPointerOut={() => { hov.current = 0 }}
      onClick={(e) => { e.stopPropagation(); onPick(item, true) }}>
      <planeGeometry args={[2.4, 3.2]} />
      <shaderMaterial uniforms={u} vertexShader={vert} fragmentShader={frag} side={THREE.DoubleSide} />
    </mesh>
  )
}

/* the camera sits inside a ring of photographs; drag to look around */
export default function LifeDome({ items, onPick, look }) {
  const texs = useTexture(items.map((it) => './img/' + it.img + '.jpg'))
  texs.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace })
  const { camera } = useThree()
  const all = useMemo(() => {
    const out = []; const R = 9.5; const rows = [-1, 0, 1]; const per = 10
    rows.forEach((r, ri) => {
      for (let k = 0; k < per; k++) {
        const idx = (ri * per + k * 3 + ri) % items.length
        const a = (k / per) * Math.PI * 2 + ri * .31
        const y = r * 3.6
        const rr = R * Math.cos(r * .32)
        out.push({ idx, pos: [Math.sin(a) * rr, y, -Math.cos(a) * rr] })
      }
    })
    return out
  }, [items])
  const yaw = useRef(0), pitch = useRef(0)
  useFrame((s, dt) => {
    const L = look.current
    if (!L.dragging && !reduce) L.yaw += dt * .05
    yaw.current += (L.yaw - yaw.current) * .08; pitch.current += (L.pitch - pitch.current) * .08
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current; camera.rotation.x = pitch.current
  })
  return (
    <>
      <color attach="background" args={['#120814']} />
      <fog attach="fog" args={['#120814', 8, 16]} />
      {all.map((p, i) => <Panel key={i} tex={texs[p.idx]} pos={p.pos} item={items[p.idx]} onPick={onPick} />)}
    </>
  )
}
