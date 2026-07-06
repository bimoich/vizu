import { useRef, useState, useCallback } from 'react'

export default function useAudioAnalyzer() {
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const gainRef = useRef(null)
  const audioRef = useRef(null)
  const freqDataRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback((url, loop = true) => {
    const audio = new Audio(url)
    audio.crossOrigin = 'anonymous'
    audio.loop = loop

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    const gain = ctx.createGain()
    gain.gain.value = 0.8

    const source = ctx.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(gain)
    gain.connect(ctx.destination)

    const data = new Uint8Array(analyser.frequencyBinCount)

    audio.play()

    audioCtxRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source
    gainRef.current = gain
    audioRef.current = audio
    freqDataRef.current = data
    setIsPlaying(true)

    audio.onended = () => {
      audioCtxRef.current?.close()
      setIsPlaying(false)
    }
  }, [])

  const stop = useCallback(() => {
    audioRef.current?.pause()
    audioRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
    sourceRef.current = null
    gainRef.current = null
    setIsPlaying(false)
  }, [])

  const setVolume = useCallback((val) => {
    if (gainRef.current) gainRef.current.gain.value = val
  }, [])

  return { analyserRef, freqDataRef, audioRef, isPlaying, play, stop, setVolume }
}
