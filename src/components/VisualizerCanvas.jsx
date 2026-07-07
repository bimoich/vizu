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

function Ring({ analyserRef, freqDataRef, playing, color, intensity, colorMode, colorMap, pulse }) {
  const ref = useRef()
  const curH = useRef(new Float32Array(N))
  const m4 = useMemo(() => new THREE.Matrix4(), [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const s = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const zAxis = useMemo(() => new THREE.Vector3(0, 0, 1), [])
  const tmpC = useMemo(() => new THREE.Color(), [])

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
      tmpC.set(color)
      m.setColorAt(i, tmpC)
    }
    m.instanceMatrix.needsUpdate = true
    m.instanceColor.needsUpdate = true
  }, [])

  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const data = freqDataRef.current
    const anal = analyserRef.current

    if (playing && anal && data) anal.getByteFrequencyData(data)

    const lerp = playing ? 0.3 : 0.06
    const time = state.clock.elapsedTime

    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const target = playing
        ? (data[Math.min(Math.floor(Math.pow(i / N, 0.7) * data.length * 0.6), data.length - 1)] / 255) * MAX_BAR
        : 0.005
      curH.current[i] += (target - curH.current[i]) * lerp
      const h = Math.max(0.005, curH.current[i])

      const cr = RING_R + h / 2
      p.set(cr * Math.cos(a), cr * Math.sin(a), 0)
      q.setFromAxisAngle(zAxis, a)
      s.set(h, TW, TD)
      m4.compose(p, q, s)
      m.setMatrixAt(i, m4)

      if (colorMode === 'rainbow') {
        const hue = pulse ? ((i / N) + time * 0.04) % 1 : (i / N) % 1
        tmpC.setHSL(hue, 0.9, 0.5 + (h / MAX_BAR) * 0.3)
      } else if (colorMode === 'auto' && colorMap?.length === N) {
        const idx = pulse ? (i + Math.floor(time * 25)) % N : i
        tmpC.set(colorMap[idx])
      } else {
        tmpC.set(color)
      }
      tmpC.r *= intensity
      tmpC.g *= intensity
      tmpC.b *= intensity
      m.setColorAt(i, tmpC)
    }
    m.instanceMatrix.needsUpdate = true
    m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[null, null, N]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

function GlowRing({ color, intensity, colorMode, colorMap, pulse }) {
  const ref = useRef()
  const tmpC = useMemo(() => new THREE.Color(), [])

  useLayoutEffect(() => {
    if (!ref.current) return
    if (colorMode === 'rainbow') {
      tmpC.setHSL(0, 0.9, 0.5)
    } else if (colorMode === 'auto' && colorMap?.length) {
      tmpC.set(colorMap[0])
    } else {
      tmpC.set(color)
    }
    tmpC.r *= intensity
    tmpC.g *= intensity
    tmpC.b *= intensity
    ref.current.material.color.copy(tmpC)
  }, [color, intensity, colorMode, colorMap])

  return (
    <mesh ref={ref} position={[0, 0, 0.1]}>
      <ringGeometry args={[RING_R - 0.04, RING_R + 0.04, 64]} />
      <meshBasicMaterial color="#00ccff" transparent opacity={0.12} toneMapped={false} />
    </mesh>
  )
}

function Scene({ bgUrl, albumUrl, analyserRef, freqDataRef, playing, bgBrightness, bgFit, eqColor, eqIntensity, albumBrightness, colorMode, colorMap, pulse }) {
  return (
    <>
      {bgUrl && <Bg url={bgUrl} brightness={bgBrightness} fit={bgFit} />}
      <GlowRing color={eqColor} intensity={eqIntensity} colorMode={colorMode} colorMap={colorMap} pulse={pulse} />
      {albumUrl && <Album url={albumUrl} playing={playing} brightness={albumBrightness} />}
      <Ring analyserRef={analyserRef} freqDataRef={freqDataRef} playing={playing} color={eqColor} intensity={eqIntensity} colorMode={colorMode} colorMap={colorMap} pulse={pulse} />
      <EffectComposer>
        <Bloom intensity={2.0} luminanceThreshold={0} luminanceSmoothing={0.1} mipmapBlur />
      </EffectComposer>
    </>
  )
}

export default function VisualizerCanvas({ bgUrl, albumUrl, analyserRef, freqDataRef, playing, bgBrightness, bgFit, eqColor, eqIntensity, albumBrightness, colorMode, colorMap, palette, pulse, onCanvasReady }) {
  return (
    <Canvas
      onCreated={(state) => onCanvasReady?.(state.gl.domElement)}
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}
    >
      <Suspense fallback={null}>
        <Scene bgUrl={bgUrl} albumUrl={albumUrl} analyserRef={analyserRef} freqDataRef={freqDataRef} playing={playing} bgBrightness={bgBrightness} bgFit={bgFit} eqColor={eqColor} eqIntensity={eqIntensity} albumBrightness={albumBrightness} colorMode={colorMode} colorMap={colorMap} pulse={pulse} />
      </Suspense>
    </Canvas>
  )
}
