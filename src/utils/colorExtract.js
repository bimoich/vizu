import * as THREE from 'three'

const tmpA = new THREE.Color()
const tmpB = new THREE.Color()

function lerpColor(a, b, t) {
  tmpA.set(a)
  tmpB.set(b)
  tmpA.lerp(tmpB, t)
  return '#' + tmpA.getHexString()
}

export function extractPalette(imgUrl, count = 6) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const SIZE = 64
      const c = document.createElement('canvas')
      c.width = SIZE
      c.height = SIZE
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0, SIZE, SIZE)
      const data = ctx.getImageData(0, 0, SIZE, SIZE).data

      const bins = {}
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] & 0xE0
        const g = data[i + 1] & 0xE0
        const b = data[i + 2] & 0xE0
        const k = ((r << 16) | (g << 8) | b).toString(16)
        bins[k] = (bins[k] || 0) + 1
      }

      const sorted = Object.entries(bins).sort((a, b) => b[1] - a[1]).slice(0, count)
      const total = sorted.reduce((s, [, cnt]) => s + cnt, 0)

      resolve(sorted.map(([key, cnt]) => {
        const n = parseInt(key, 16)
        const r = (n >> 16) & 0xFF
        const g = (n >> 8) & 0xFF
        const b = n & 0xFF
        return {
          color: `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`,
          weight: cnt / total,
        }
      }))
    }
    img.crossOrigin = 'anonymous'
    img.src = imgUrl
  })
}

export function buildColorMap(palette, n) {
  if (!palette.length) return []
  if (palette.length === 1) return Array(n).fill(palette[0].color)

  const totalW = palette.reduce((s, p) => s + p.weight, 0)

  let cumW = 0
  const segEnds = palette.map((p) => {
    cumW += p.weight
    return cumW / totalW
  })

  const map = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / n
    let seg = 0
    while (seg < palette.length - 1 && segEnds[seg] <= t) seg++

    const segStart = seg > 0 ? segEnds[seg - 1] : 0
    const segLen = segEnds[seg] - segStart
    const localT = segLen > 0 ? (t - segStart) / segLen : 0

    map[i] = lerpColor(palette[seg].color, palette[(seg + 1) % palette.length].color, localT)
  }
  return map
}
