# Vizu

3D audio visualizer. Bars go up, album art spins, colors change. You know the drill.

Built with React, Three.js (R3F), Web Audio API, and Tailwind. Runs in a browser. Records OK on a potato.

## What it does

- Drop an audio file, a background image, and an album art
- Bars form a ring around the album art and react to the music
- You can change bar colors, glow intensity, background brightness, album brightness
- Import a whole folder of songs and it'll auto-advance like a playlist
- PiP mode so you can put it in a tiny window and pretend to work
- Hide the UI with a 3-second fade for clean screen recording
- Spacebar toggles play/pause because reaching for the mouse is too much effort

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Stack

- Vite + React
- @react-three/fiber + @react-three/drei for the 3D stuff
- @react-three/postprocessing for the glow (bloom)
- Web Audio API (AnalyserNode) for frequency data
- Tailwind CSS for the UI panel

## Why

Wanted a Trap Nation style visualizer. Found a bunch of tutorials (not really) that either cost money (also, not really) or looked like they were made in 2012. Made this instead.

## License

MIT
