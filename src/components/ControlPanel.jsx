import { useRef } from 'react'

const btn = 'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer'
const slider = 'w-full accent-cyan-400 cursor-pointer'

const fitModes = [
  { key: 'cover', label: '⬛ Crop' },
  { key: 'contain', label: '⬜ Fit' },
  { key: 'stretch', label: '🔲 Fill' },
]

export default function ControlPanel({
  audioFile, setAudioFile,
  bgFile, setBgFile,
  albumFile, setAlbumFile,
  playing, onPlay, onStop,
  onHide,
  bgBrightness, setBgBrightness,
  bgFit, setBgFit,
  eqColor, setEqColor,
  eqIntensity, setEqIntensity,
  albumBrightness, setAlbumBrightness,
  volume, setVolume,
  onPiP, inPiP, pipSupported,

  playlistFiles, setPlaylistFiles,
  playlistMode, setPlaylistMode,
  currentIndex, playTrack,
  trackNames,
}) {
  const audioRef = useRef()
  const bgRef = useRef()
  const albumRef = useRef()
  const folderRef = useRef()

  const hasPlaylist = playlistFiles && playlistFiles.length > 0

  return (
    <div className="flex flex-col gap-3 max-w-xs max-h-screen overflow-y-auto pb-16">
      {/* Uploads */}
      <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <label className="flex items-center gap-2 text-xs text-white/70">
          <span className="shrink-0">🎵 Audio</span>
          <input ref={audioRef} type="file" accept="audio/mp3,audio/wav,audio/mpeg" className="hidden"
            onChange={(e) => setAudioFile(e.target.files[0])} />
          <button className={`${btn} bg-white/10 hover:bg-white/20 text-white/80 flex-1 text-left truncate`}
            onClick={() => audioRef.current?.click()}>
            {audioFile?.name || 'Choose file'}
          </button>
        </label>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <span className="shrink-0">🖼️ Bg</span>
          <input ref={bgRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => setBgFile(e.target.files[0])} />
          <button className={`${btn} bg-white/10 hover:bg-white/20 text-white/80 flex-1 text-left truncate`}
            onClick={() => bgRef.current?.click()}>
            {bgFile?.name || 'Choose file'}
          </button>
        </label>
        <label className="flex items-center gap-2 text-xs text-white/70">
          <span className="shrink-0">💿 Album</span>
          <input ref={albumRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => setAlbumFile(e.target.files[0])} />
          <button className={`${btn} bg-white/10 hover:bg-white/20 text-white/80 flex-1 text-left truncate`}
            onClick={() => albumRef.current?.click()}>
            {albumFile?.name || 'Choose file'}
          </button>
        </label>
      </div>

      {/* Playlist */}
      <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70">📋 Playlist</span>
          <div className="flex gap-1">
            <input ref={folderRef} type="file"
              webkitdirectory="" directory=""
              className="hidden"
              onChange={(e) => {
                setPlaylistFiles(Array.from(e.target.files).filter(f => /\.(mp3|wav|m4a|flac|ogg)$/i.test(f.name)))
                setPlaylistMode(true)
              }} />
            <button className={`${btn} text-xs py-1 px-2 bg-white/10 hover:bg-white/20 text-white/80`}
              onClick={() => folderRef.current?.click()}>
              📁 Folder
            </button>
          </div>
        </div>
        {hasPlaylist && (
          <>
            <button className={`${btn} text-xs py-1 ${playlistMode ? 'bg-cyan-500/40 text-cyan-200 border border-cyan-400/30' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              onClick={() => setPlaylistMode(!playlistMode)}>
              {playlistMode ? '▶ Playlist mode' : '⏹ Single track'}
            </button>
            <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
              {trackNames.map((name, i) => (
                <button key={i}
                  className={`text-left px-2 py-1 rounded text-xs transition-all cursor-pointer
                    ${i === currentIndex ? 'bg-cyan-500/30 text-cyan-200' : 'text-white/60 hover:bg-white/10'}`}
                  onClick={() => playTrack(i)}>
                  {i === currentIndex && playing ? '▶ ' : '  '}{i + 1}. {name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Background */}
      {bgFile && (
        <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <label className="text-xs text-white/70">☀️ Bg: {Math.round(bgBrightness * 100)}%</label>
          <input type="range" min="0.05" max="1" step="0.01" value={bgBrightness}
            onChange={(e) => setBgBrightness(parseFloat(e.target.value))}
            className={slider} />
          <div className="flex gap-1">
            {fitModes.map(({ key, label }) => (
              <button key={key}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex-1
                  ${bgFit === key ? 'bg-cyan-500/40 text-cyan-200 border border-cyan-400/30' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                onClick={() => setBgFit(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Album */}
      {albumFile && (
        <div className="bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
          <label className="text-xs text-white/70">💿 Album: {Math.round(albumBrightness * 100)}%</label>
          <input type="range" min="0.05" max="1.5" step="0.01" value={albumBrightness}
            onChange={(e) => setAlbumBrightness(parseFloat(e.target.value))}
            className={slider} />
        </div>
      )}

      {/* EQ */}
      <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <label className="text-xs text-white/70">🎨 EQ color</label>
        <div className="flex items-center gap-3">
          <input type="color" value={eqColor}
            onChange={(e) => setEqColor(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0" />
          <span className="text-xs text-white/50 font-mono">{eqColor.toUpperCase()}</span>
        </div>
        <label className="text-xs text-white/70">✨ Glow: {Math.round(eqIntensity * 100)}%</label>
        <input type="range" min="0.1" max="2.5" step="0.01" value={eqIntensity}
          onChange={(e) => setEqIntensity(parseFloat(e.target.value))}
          className={slider} />
      </div>

      {/* Playback */}
      <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/10">
        <div className="flex gap-2 items-center">
          <button
            className={`${btn} ${playing ? 'bg-red-500/80 hover:bg-red-500' : 'bg-green-500/80 hover:bg-green-500'} text-white flex-1`}
            onClick={() => { if (playing) onStop(); else onPlay() }}>
            {playing ? '■ Stop' : '▶ Play'}
          </button>
          <button className={`${btn} bg-white/10 hover:bg-white/20 text-white/80`}
            onClick={onHide}>
            ⊞ Hide
          </button>
          <button className={`${btn} ${inPiP ? 'bg-cyan-500/40 text-cyan-200' : pipSupported ? 'bg-white/10 hover:bg-white/20 text-white/80' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
            onClick={onPiP}
            disabled={!pipSupported}
            title={pipSupported ? 'Picture-in-Picture' : 'Not supported'}>
            {inPiP ? '◉ PiP' : '⊟ PiP'}
          </button>
        </div>
        <label className="text-xs text-white/70">🔊 Volume: {Math.round(volume * 100)}%</label>
        <input type="range" min="0" max="1" step="0.01" value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className={slider} />
      </div>
    </div>
  )
}
