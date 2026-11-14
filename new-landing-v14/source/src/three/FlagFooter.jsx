import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { reduce } from '../lib/motion.js'

/* Jalur Gemilang drawn on a canvas: 14 red and white stripes, a blue canton with a yellow crescent and 14-point star */
function flagTexture() {
  const W = 1400, H = 700, c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d'), sh = H / 14
  for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#FFFFFF' : '#CC0001'; g.fillRect(0, i * sh, W, sh + 1) }
  const cw = W / 2, ch = sh * 8
  g.fillStyle = '#010066'; g.fillRect(0, 0, cw, ch)
  const cy = ch / 2, R = ch * .4
  g.fillStyle = '#FFCC00'; g.beginPath(); g.arc(cw * .38, cy, R, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#010066'; g.beginPath(); g.arc(cw * .38 + R * .26, cy, R * .82, 0, Math.PI * 2); g.fill()
  const sx = cw * .72, so = ch * .36, si = so * .48
  g.fillStyle = '#FFCC00'; g.beginPath()
  for (let k = 0; k < 28; k++) { const a = -Math.PI / 2 + k * Math.PI / 14, r = k % 2 ? si : so; const x = sx + Math.cos(a) * r, y = cy + Math.sin(a) * r; k ? g.lineTo(x, y) : g.moveTo(x, y) }
  g.closePath(); g.fill()
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
  return t
}

const vert = /* glsl */`
uniform float uTime; uniform float uWind; varying vec2 vUv; varying float vShade;
void main() {
  vUv = uv; vec3 p = position;
  float k = uv.x;
  float w = sin(uv.x * 9. - uTime * 3.2) * .22 * k + sin(uv.x * 4. + uv.y * 3. - uTime * 2.1) * .14 * k;
  w *= uWind;
  p.z += w; p.y += sin(uv.x * 6. - uTime * 2.4) * .06 * k * uWind;
  vShade = cos(uv.x * 9. - uTime * 3.2) * k * uWind;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`
const frag = /* glsl */`
uniform sampler2D tMap; varying vec2 vUv; varying float vShade;
void main() { vec3 c = texture2D(tMap, vUv).rgb; c *= .82 + vShade * .22; gl_FragColor = vec4(c, 1.); }`

export default function FlagFooter() {
  const tex = useMemo(flagTexture, [])
  const u = useMemo(() => ({ tMap: { value: tex }, uTime: { value: 0 }, uWind: { value: 1 } }), [tex])
  const g = useRef(); const { viewport, pointer } = useThree()
  useFrame((s, dt) => {
    u.uTime.value += reduce ? 0 : dt
    u.uWind.value += ((1 + Math.abs(pointer.x) * .8) - u.uWind.value) * .03
    if (g.current) g.current.rotation.y = -.35 + pointer.x * .12
  })
  const mob = viewport.aspect < 1
  const fw = mob ? Math.min(4, viewport.width * .78) : 4.4, fh = fw / 2
  const top = .3 + fh / 2 + .2, bot = .3 - fh / 2 - (mob ? .5 : .9)
  return (
    <group ref={g} position={[mob ? .2 : viewport.width * .3, mob ? viewport.height * .5 - fh / 2 - .9 : 1.0, 0]}>
      <mesh position={[-fw / 2 - .06, (top + bot) / 2, 0]}>
        <cylinderGeometry args={[.05, .06, top - bot, 16]} />
        <meshStandardMaterial color="#C9CED8" metalness={.85} roughness={.25} />
      </mesh>
      <mesh position={[-fw / 2 - .06, top + .1, 0]}><sphereGeometry args={[.12, 20, 20]} /><meshStandardMaterial color="#FFCC00" metalness={.9} roughness={.2} /></mesh>
      <mesh position={[0, .3, 0]}>
        <planeGeometry args={[fw, fh, 80, 40]} />
        <shaderMaterial uniforms={u} vertexShader={vert} fragmentShader={frag} side={THREE.DoubleSide} />
      </mesh>
      <ambientLight intensity={.8} />
      <directionalLight position={[3, 5, 5]} intensity={1.4} />
    </group>
  )
}
