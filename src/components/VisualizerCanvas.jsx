import { useRef, useMemo, useLayoutEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

const N = 256
const RING_R = 1.5
const TW = 0.022
const TD = 0.022
const MAX_BAR = 1.5
const ALBUM_R = 1.4
const BG_Z = -10

function Bg({ url, brightness, fit }) {
  const tex = useTexture(url)
  const { camera } = useThree()
  const ref = useRef()
  const vp = useThree(s => s.viewport)

  const perspScale = useMemo(() => {
    const dCam = Math.abs(camera.position.z)
    const dBg = Math.abs(camera.position.z - BG_Z)
    return dBg / dCam
  }, [camera])

  useLayoutEffect(() => {
    const m = ref.current
    if (!m || !tex.image) return
    const iA = tex.image.width / tex.image.height
    const vW = vp.width * perspScale
    const vH = vp.height * perspScale
    const vA = vW / vH
    let sx, sy
    if (fit === 'stretch') { sx = vW; sy = vH }
    else if (fit === 'contain') {
      if (iA > vA) { sx = vW; sy = vW / iA }
      else { sx = vH * iA; sy = vH }
    } else {
      if (iA > vA) { sx = vH * iA; sy = vH }
      else { sx = vW; sy = vW / iA }
    }
    m.scale.set(sx, sy, 1)
    m.material.color.setScalar(brightness)
  }, [tex, vp, perspScale, fit, brightness])

  return (
    <mesh ref={ref} position={[0, 0, BG_Z]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} />
    </mesh>
  )
}

function Album({ url, playing, brightness }) {
  const tex = useTexture(url)
  const ref = useRef()
  useFrame((_, dt) => {
    if (playing && ref.current) ref.current.rotation.z += dt * 0.3
  })
  useLayoutEffect(() => {
    if (ref.current) ref.current.material.color.setScalar(brightness)
  }, [brightness])
  return (
    <mesh ref={ref} position={[0, 0, 0.3]}>
      <circleGeometry args={[ALBUM_R, 64]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  )
}

function Ring({ analyserRef, freqDataRef, playing, color, intensity }) {
  const ref = useRef()
  const matRef = useRef()
  const curH = useRef(new Float32Array(N))
  const m4 = useMemo(() => new THREE.Matrix4(), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const s = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const tmpC = useMemo(() => new THREE.Color(), [])

  useLayoutEffect(() => {
    if (!matRef.current) return
    tmpC.set(color)
    tmpC.r *= intensity
    tmpC.g *= intensity
    tmpC.b *= intensity
    matRef.current.color.copy(tmpC)
  }, [color, intensity])

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      p.set(RING_R * Math.cos(a), RING_R * Math.sin(a), 0)
      q.setFromAxisAngle(zAxis, a)
      s.set(0.01, TW, TD)
      m4.compose(p, q, s)
      m.setMatrixAt(i, m4)
    }
    m.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(() => {
    const m = ref.current
    if (!m) return
    const data = freqDataRef.current
    const anal = analyserRef.current

    if (playing && anal && data) anal.getByteFrequencyData(data)

    const lerp = playing ? 0.3 : 0.06

    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const target = playing
        ? (data[Math.floor((i / N) * data.length)] / 255) * MAX_BAR
        : 0.005
      curH.current[i] += (target - curH.current[i]) * lerp
      const h = Math.max(0.005, curH.current[i])

      const cr = RING_R + h / 2
      p.set(cr * Math.cos(a), cr * Math.sin(a), 0)
      q.setFromAxisAngle(zAxis, a)
      s.set(h, TW, TD)
      m4.compose(p, q, s)
      m.setMatrixAt(i, m4)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, N]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial ref={matRef} toneMapped={false} />
    </instancedMesh>
  )
}

function GlowRing({ color, intensity }) {
  const ref = useRef()
  const tmpC = useMemo(() => new THREE.Color(), [])

  useLayoutEffect(() => {
    if (!ref.current) return
    tmpC.set(color)
    tmpC.r *= intensity
    tmpC.g *= intensity
    tmpC.b *= intensity
    ref.current.material.color.copy(tmpC)
  }, [color, intensity])

  return (
    <mesh ref={ref} position={[0, 0, 0.1]}>
      <ringGeometry args={[RING_R - 0.04, RING_R + 0.04, 64]} />
      <meshBasicMaterial color="#00ccff" transparent opacity={0.12} toneMapped={false} />
    </mesh>
  )
}

function Scene({ bgUrl, albumUrl, analyserRef, freqDataRef, playing, bgBrightness, bgFit, eqColor, eqIntensity, albumBrightness }) {
  return (
    <>
      {bgUrl && <Bg url={bgUrl} brightness={bgBrightness} fit={bgFit} />}
      <GlowRing color={eqColor} intensity={eqIntensity} />
      {albumUrl && <Album url={albumUrl} playing={playing} brightness={albumBrightness} />}
      <Ring analyserRef={analyserRef} freqDataRef={freqDataRef} playing={playing} color={eqColor} intensity={eqIntensity} />
      <EffectComposer>
        <Bloom intensity={2.0} luminanceThreshold={0} luminanceSmoothing={0.1} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function VisualizerCanvas({ bgUrl, albumUrl, analyserRef, freqDataRef, playing, bgBrightness, bgFit, eqColor, eqIntensity, albumBrightness, onCanvasReady }) {
  return (
    <Canvas
      onCreated={(state) => onCanvasReady?.(state.gl.domElement)}
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}
    >
      <Suspense fallback={null}>
        <Scene bgUrl={bgUrl} albumUrl={albumUrl} analyserRef={analyserRef} freqDataRef={freqDataRef} playing={playing} bgBrightness={bgBrightness} bgFit={bgFit} eqColor={eqColor} eqIntensity={eqIntensity} albumBrightness={albumBrightness} />
      </Suspense>
    </Canvas>
  )
}
