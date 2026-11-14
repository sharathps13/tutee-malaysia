import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useInView } from '../lib/hooks.js'
import { hasWebGL, reduce } from '../lib/motion.js'

const GL_OK = typeof window !== 'undefined' && hasWebGL()

/* A canvas that mounts when it nears the viewport and stops rendering when it leaves.
   fallback renders instead when WebGL is unavailable. */
export default function Stage({ children, className = '', fallback = null, camera, dpr = [1, 1.75], still = false, ...rest }) {
  const ref = useRef(null)
  const { visible, near } = useInView(ref)
  const loop = !visible ? 'never' : (reduce || still ? 'demand' : 'always')
  return (
    <div ref={ref} className={'stage ' + className}>
      {GL_OK ? (near && (
        <Canvas frameloop={loop} dpr={dpr} camera={camera} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} {...rest}>
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      )) : fallback}
    </div>
  )
}
export { GL_OK }
