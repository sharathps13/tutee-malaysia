import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import states from '../states.json'
import { gsap, reduce } from '../lib/motion.js'

/* map units (the 1020 x 475 SVG) -> world: x right, z towards the viewer */
const S = 42
export const toWorld = (mx, my) => [(mx - 510) / S, (my - 237) / S]

const oceanFrag = /* glsl */`
uniform float uTime; varying vec2 vUv;
void main() {
  vec2 g = vUv * 90.;
  vec2 f = abs(fract(g) - .5);
  float line = smoothstep(.48, .5, max(f.x, f.y));
  float dist = distance(vUv, vec2(.5));
  float fade = smoothstep(.55, .05, dist);
  float pulse = .5 + .5 * sin(dist * 60. - uTime * 1.6);
  vec3 base = vec3(.02, .05, .13);
  vec3 col = base + vec3(.15, .45, .8) * line * .35 * fade + vec3(.1, .3, .6) * pulse * .03 * fade;
  gl_FragColor = vec4(col, 1.);
}`
const oceanVert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }'

function State({ data, active, hovered, onHover }) {
  const ref = useRef(); const mat = useRef()
  const geo = useMemo(() => {
    const shapes = data.polys.map((poly) => {
      const sh = new THREE.Shape()
      poly.forEach(([x, y], i) => { const [wx, wz] = toWorld(x, y); i ? sh.lineTo(wx, -wz) : sh.moveTo(wx, -wz) })
      return sh
    })
    const g = new THREE.ExtrudeGeometry(shapes, { depth: .22, bevelEnabled: true, bevelThickness: .03, bevelSize: .02, bevelSegments: 1 })
    return g
  }, [data])
  const edges = useMemo(() => new THREE.EdgesGeometry(geo, 25), [geo])
  useEffect(() => {
    if (!ref.current) return
    const lift = active ? 2.2 : hovered ? 1.6 : 1
    gsap.to(ref.current.scale, { z: lift, duration: reduce ? 0 : .9, ease: 'expo.out' })
    gsap.to(mat.current.emissive, { r: active ? 1 : hovered ? .25 : .03, g: active ? .62 : hovered ? .45 : .09, b: active ? 0 : hovered ? .75 : .22, duration: .6 })
    gsap.to(mat.current.color, { r: active ? 1 : .11, g: active ? .78 : .2, b: active ? .1 : .35, duration: .6 })
  }, [active, hovered])
  return (
    <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}
      onPointerOver={(e) => { e.stopPropagation(); onHover(data.state) }} onPointerOut={() => onHover(null)}>
      <mesh geometry={geo}>
        <meshStandardMaterial ref={mat} color="#1C3359" emissive="#081838" roughness={.55} metalness={.25} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={active ? '#FFF3B0' : '#5FD4FF'} transparent opacity={active ? .9 : .55} />
      </lineSegments>
    </group>
  )
}

function Beacon({ p, i, active, onPick }) {
  const [x, z] = toWorld(p.mx, p.my)
  const beam = useRef(); const ring = useRef()
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (ring.current) { const k = (t * .7 + i * .2) % 1; ring.current.scale.setScalar(.4 + k * 1.6); ring.current.material.opacity = (1 - k) * .8 }
    if (beam.current) beam.current.material.opacity = (active ? .75 : .38) + Math.sin(t * 3 + i) * .08
  })
  const h = active ? 2.6 : 1.5
  return (
    <group position={[x, 0, z]}>
      <mesh ref={beam} position={[0, h / 2, 0]}>
        <cylinderGeometry args={[.022, .06, h, 12, 1, true]} />
        <meshBasicMaterial color={active ? '#FFCC00' : '#7FE3FF'} transparent opacity={.4} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, .3, 0]}>
        <ringGeometry args={[.22, .26, 40]} />
        <meshBasicMaterial color={active ? '#FFCC00' : '#7FE3FF'} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Html position={[0, h + .25, 0]} center zIndexRange={[20, 10]}>
        <button type="button" className={'m3-pin' + (active ? ' on' : '')} onClick={() => onPick(i)}>
          <b>{i + 1}</b><span>{p.name}<small>{p.count} institutions</small></span>
        </button>
      </Html>
    </group>
  )
}

function Rig({ focus }) {
  const { camera, pointer } = useThree()
  const look = useRef(new THREE.Vector3(0, 0, 1.2))
  const pos = useRef(new THREE.Vector3(3, 18, 16))
  useEffect(() => {
    const [tx, tz, dist] = focus
    const tgt = { x: tx, y: 0, z: tz }
    const cp = { x: tx + dist * .15, y: dist * .95, z: tz + dist * .8 }
    gsap.to(look.current, { ...tgt, duration: reduce ? 0 : 1.8, ease: 'power3.inOut' })
    gsap.to(pos.current, { ...cp, duration: reduce ? 0 : 1.8, ease: 'power3.inOut' })
  }, [focus])
  useFrame(() => {
    camera.position.set(pos.current.x + pointer.x * .6, pos.current.y + pointer.y * .3, pos.current.z)
    camera.lookAt(look.current)
  })
  return null
}

export default function Map3D({ places, active, onPick, onHoverState }) {
  const [hover, setHover] = useState(null)
  const ocean = useRef()
  const activeStates = active >= 0 ? places[active].states : []
  const aspect = useThree((s) => s.size.width / s.size.height)
  const mob = aspect < 1
  const focus = useMemo(() => {
    if (active < 0) return mob ? [-6.5, 1, 22] : [3.2, 1.4, aspect < 1.4 ? 23 : 19]
    const [x, z] = toWorld(places[active].mx, places[active].my)
    const far = places[active].states.includes('Sabah')
    return mob ? [x, z + 1.2, far ? 22 : 15] : [x + (far ? 2.4 : 1.6), z - 1.3, far ? 13 : 9]
  }, [active, mob, aspect < 1.4])
  useFrame((s, dt) => { if (ocean.current) ocean.current.uniforms.uTime.value += dt })
  const h = (st) => { setHover(st); onHoverState && onHoverState(st) }
  return (
    <>
      <color attach="background" args={['#050A1C']} />
      <fog attach="fog" args={['#050A1C', 26, 60]} />
      <ambientLight intensity={.55} />
      <directionalLight position={[6, 12, 8]} intensity={1.6} color="#DDEBFF" />
      <pointLight position={[-8, 5, -4]} intensity={30} color="#C8102E" distance={30} />
      <pointLight position={[8, 4, 6]} intensity={22} color="#FFCC00" distance={26} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, 0]}>
        <planeGeometry args={[80, 60]} />
        <shaderMaterial ref={ocean} uniforms={{ uTime: { value: 0 } }} vertexShader={oceanVert} fragmentShader={oceanFrag} />
      </mesh>
      <group>
        {states.map((d) => <State key={d.state} data={d} active={activeStates.includes(d.state)} hovered={hover === d.state} onHover={h} />)}
      </group>
      {places.map((p, i) => <Beacon key={p.name} p={p} i={i} active={i === active} onPick={onPick} />)}
      <Rig focus={focus} />
    </>
  )
}
