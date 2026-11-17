// Знак «Ультра» стоит целиком, без баллончика. Под ним точечная плашка «Ранскеил | В эфире».
import { airPlate, dotsPath, splitX } from './airPlate.js'

const NS = 'http://www.w3.org/2000/svg'

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}

function paint(node, fill, opacity) {
  node.setAttribute('fill', fill)
  node.style.setProperty('fill', fill, 'important')
  if (opacity == null) return
  node.setAttribute('opacity', opacity)
  node.style.setProperty('opacity', opacity, 'important')
}

function airSvg() {
  const plate = airPlate('Ранскеил', 'В эфире')
  const layers = {
    frame: dotsPath(plate.layers.frame),
    on: dotsPath(plate.layers.on),
    field: dotsPath(plate.layers.field),
    off: dotsPath(plate.layers.off),
    hole: dotsPath(plate.layers.hole),
  }
  const x0 = splitX(plate)
  const svg = el('svg', { class: 'ap', viewBox: `0 0 ${plate.w} ${plate.h}`, 'aria-hidden': 'true', focusable: 'false' })
  svg.style.aspectRatio = `${plate.w} / ${plate.h}`
  const defs = el('defs')
  const grad = el('linearGradient', { id: 'ap-metal', gradientUnits: 'userSpaceOnUse', x1: x0, y1: 0, x2: plate.w, y2: 0 })
  const stops = [['0', 'ap-m0', '#b8b9c0'], ['0.32', 'ap-m1', '#f2f2f4'], ['0.6', 'ap-m2', '#d7d8dc'], ['1', 'ap-m3', '#8d9098']]
  stops.forEach(([offset, cls, color]) => {
    const stop = el('stop', { offset, class: cls, 'stop-color': color })
    stop.style.setProperty('stop-color', color, 'important')
    grad.appendChild(stop)
  })
  defs.appendChild(grad)
  svg.appendChild(defs)
  const bed = el('rect', { class: 'ap-bed', x: 0, y: 0, width: plate.w, height: plate.h, rx: 1 })
  paint(bed, '#0b0b0d')
  svg.appendChild(bed)
  const fills = {
    'ap-off': ['#f2f2f4', '0.13'],
    'ap-hole': ['#f2f2f4', '0.07'],
    'ap-field': ['url(#ap-metal)', '1'],
    'ap-on': ['#f2f2f4', '1'],
    'ap-frame': ['#b8b9c0', '1'],
  }
  ;[['ap-off', layers.off], ['ap-hole', layers.hole], ['ap-field', layers.field], ['ap-on', layers.on], ['ap-frame', layers.frame]].forEach(([cls, d]) => {
    const [fill, opacity] = fills[cls]
    const path = el('path', { class: cls, d })
    paint(path, fill, opacity)
    svg.appendChild(path)
  })
  return svg
}

function markSvg(d) {
  const svg = el('svg', { class: 'um', viewBox: '0 0 679 347', 'aria-hidden': 'true', focusable: 'false' })
  const path = el('path', { d, 'fill-rule': 'evenodd' })
  paint(path, '#6aa5ff')
  svg.appendChild(path)
  return svg
}

export async function mountTour(host) {
  const spray = host.querySelector('.tour-spray')
  const air = host.querySelector('.tour-air')
  if (!spray || !air) return
  air.replaceChildren(airSvg())
  const raw = await fetch(new URL('../brand/ultra-mark.svg', import.meta.url)).then((r) => r.text())
  const markD = (raw.match(/ d="([^"]+)"/) || ['', ''])[1]
  if (!markD) return
  spray.replaceChildren(markSvg(markD))
}
