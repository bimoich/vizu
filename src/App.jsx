import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import VisualizerCanvas from './components/VisualizerCanvas'
import ControlPanel from './components/ControlPanel'
import useAudioAnalyzer from './hooks/useAudioAnalyzer'

export default function App() {
  const [audioFile, setAudioFile] = useState(null)
  const [bgFile, setBgFile] = useState(null)
  const [albumFile, setAlbumFile] = useState(null)
  const [uiPhase, setUiPhase] = useState('visible')
  const [bgBrightness, setBgBrightness] = useState(0.6)
  const [bgFit, setBgFit] = useState('cover')
  const [eqColor, setEqColor] = useState('#00ccff')
  const [eqIntensity, setEqIntensity] = useState(1.2)
  const [albumBrightness, setAlbumBrightness] = useState(1.0)
  const [volume, setVolume] = useState(0.8)

  // playlist
  const [playlistFiles, setPlaylistFiles] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playlistMode, setPlaylistMode] = useState(false)
  const [inPiP, setInPiP] = useState(false)
  const userStoppedRef = useRef(false)
  const indexRef = useRef(0)
  const lastUrlRef = useRef(null)
  const advancingRef = useRef(false)

  const { analyserRef, freqDataRef, isPlaying, play, stop, setVolume: setGain } = useAudioAnalyzer()
  const canvasRef = useRef(null)

  const bgUrl = useMemo(() => bgFile ? URL.createObjectURL(bgFile) : null, [bgFile])
  const albumUrl = useMemo(() => albumFile ? URL.createObjectURL(albumFile) : null, [albumFile])
  const audioUrl = useMemo(() => audioFile ? URL.createObjectURL(audioFile) : null, [audioFile])
  const playlistUrls = useMemo(() =>
    playlistFiles ? playlistFiles.map(f => URL.createObjectURL(f)) : []
  , [playlistFiles])
  const trackNames = useMemo(() =>
    playlistFiles ? playlistFiles.map(f => f.name.replace(/\.[^/.]+$/, '')) : []
  , [playlistFiles])
  const pipSupported = useMemo(() => 'requestPictureInPicture' in HTMLVideoElement.prototype, [])

  const handleHide = useCallback(() => {
    setUiPhase('hiding')
    setTimeout(() => setUiPhase('hidden'), 3000)
  }, [])

  const playTrack = useCallback((idx) => {
    if (!playlistUrls.length) return
    userStoppedRef.current = false
    const url = playlistUrls[idx]
    lastUrlRef.current = url
    indexRef.current = idx
    setCurrentIndex(idx)
    play(url, false)
  }, [playlistUrls, play])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      userStoppedRef.current = true
      stop()
      return
    }
    if (playlistMode && playlistUrls.length > 0) {
      playTrack(indexRef.current)
    } else if (audioUrl) {
      userStoppedRef.current = false
      lastUrlRef.current = audioUrl
      indexRef.current = 0
      setCurrentIndex(0)
      play(audioUrl, true)
    }
  }, [isPlaying, stop, playlistMode, playlistUrls, audioUrl, playTrack, play])

  // auto-advance on track end in playlist mode
  useEffect(() => {
    if (!isPlaying && !userStoppedRef.current && playlistMode && playlistUrls.length > 0) {
      const next = indexRef.current + 1
      if (next < playlistUrls.length && !advancingRef.current) {
        advancingRef.current = true
        playTrack(next)
      }
    }
    if (isPlaying) advancingRef.current = false
  }, [isPlaying, playlistMode, playlistUrls, playTrack])

  const handleVolume = useCallback((v) => {
    setVolume(v)
    setGain(v)
  }, [setGain])

  const pipToggle = useCallback(() => {
    if (isPlaying) {
      userStoppedRef.current = true
      stop()
    } else if (lastUrlRef.current) {
      userStoppedRef.current = false
      const loop = playlistMode ? false : true
      play(lastUrlRef.current, loop)
    }
  }, [isPlaying, stop, play, playlistMode])

  const handlePiP = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const stream = canvas.captureStream(30)
      const video = document.createElement('video')
      video.srcObject = stream
      video.muted = true
      video.style.display = 'none'
      document.body.appendChild(video)

      await video.play()
      await video.requestPictureInPicture()
      setInPiP(true)

      requestAnimationFrame(() => {
        video.addEventListener('play', () => pipToggle())
        video.addEventListener('pause', () => pipToggle())
      })

      const onLeave = () => {
        setInPiP(false)
        video.pause()
        video.srcObject = null
        document.body.removeChild(video)
        video.removeEventListener('leavepictureinpicture', onLeave)
      }
      video.addEventListener('leavepictureinpicture', onLeave)
    } catch (e) {
      console.warn('PiP failed:', e)
    }
  }, [pipToggle])

  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        togglePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay])

  return (
    <>
      <VisualizerCanvas
        bgUrl={bgUrl}
        albumUrl={albumUrl}
        analyserRef={analyserRef}
        freqDataRef={freqDataRef}
        playing={isPlaying}
        bgBrightness={bgBrightness}
        bgFit={bgFit}
        eqColor={eqColor}
        eqIntensity={eqIntensity}
        albumBrightness={albumBrightness}
        onCanvasReady={(c) => { canvasRef.current = c }}
      />

      <div
        style={{
          opacity: uiPhase === 'visible' ? 1 : 0,
          transition: `opacity ${uiPhase === 'hiding' ? '3000ms' : '300ms'} ease`,
          pointerEvents: uiPhase === 'visible' ? 'auto' : 'none',
        }}
      >
        <div className="fixed top-0 left-0 z-10 p-4">
          <ControlPanel
            audioFile={audioFile} setAudioFile={setAudioFile}
            bgFile={bgFile} setBgFile={setBgFile}
            albumFile={albumFile} setAlbumFile={setAlbumFile}
            playing={isPlaying}
            onPlay={togglePlay}
            onStop={() => { userStoppedRef.current = true; stop() }}
            onHide={handleHide}
            bgBrightness={bgBrightness} setBgBrightness={setBgBrightness}
            bgFit={bgFit} setBgFit={setBgFit}
            eqColor={eqColor} setEqColor={setEqColor}
            eqIntensity={eqIntensity} setEqIntensity={setEqIntensity}
            albumBrightness={albumBrightness} setAlbumBrightness={setAlbumBrightness}
            volume={volume} setVolume={handleVolume}
            onPiP={handlePiP}
            inPiP={inPiP}
            pipSupported={pipSupported}

            playlistFiles={playlistFiles}
            setPlaylistFiles={setPlaylistFiles}
            playlistMode={playlistMode}
            setPlaylistMode={setPlaylistMode}
            currentIndex={currentIndex}
            playTrack={playTrack}
            trackNames={trackNames}
          />
        </div>
      </div>

      {uiPhase === 'hidden' && (
        <div
          className="fixed top-0 left-0 w-16 h-full z-10 cursor-default"
          onMouseEnter={() => setUiPhase('visible')}
        />
      )}
    </>
  )
}
