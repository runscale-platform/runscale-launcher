// Знак «Ультра» пишется баллончиком, под ним плашка «Ранскеил | В эфире».
// Тот же ход, что у двери Ультры: SprayMark.vue и AirPlate.vue.
import {
  VIEW, BRUSH, DRIP_BRUSH, STROKES, DRIPS, polyD, timeline, drawn,
  canAt, fallAt, canRest, puddleAt, FALL_TOTAL, CAN_HOLD, canPaths,
  puddlePixels, pixelPath, RUNS, RUN_TIME, RUN_BRUSH, runAt,
} from './sprayStrokes.js'
import { airPlate, dotsPath, splitX } from './airPlate.js'

const NS = 'http://www.w3.org/2000/svg'
// Встроенный браузер Instagram не перерисовывает SVG-маску и часто включает «уменьшить движение»,
// поэтому знак там не пишется. Штрихи рисуются сами, кадры идут по таймеру.
const IN_APP = /Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent)
const CAN = canPaths()
const PUDDLE = puddlePixels()
const TL = timeline()

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
  return node
}

// Цвет в атрибуте проигрывает таблице стилей. Старая таблица из кэша Instagram
// красит фигуры через переменные, которые там не работают, и рисунок серый.
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
  const bed = el('rect', { class: 'ap-bed', x: 0, y: 0, width: plate.w, height: plate.h, rx: 1, fill: '#0b0b0d' })
  paint(bed, '#0b0b0d')
  svg.appendChild(bed)
  const fills = {
    'ap-off': ['#f2f2f4', '0.28'],
    'ap-hole': ['#0b0b0d', '1'],
    'ap-field': ['url(#ap-metal)', '1'],
    'ap-on': ['#f2f2f4', '1'],
    'ap-frame': ['#b8b9c0', '1'],
  }
  ;[['ap-off', layers.off], ['ap-hole', layers.hole], ['ap-field', layers.field], ['ap-on', layers.on], ['ap-frame', layers.frame]].forEach(([cls, d]) => {
    const [fill, opacity] = fills[cls]
    const path = el('path', { class: cls, d, fill, opacity })
    paint(path, fill, opacity)
    svg.appendChild(path)
  })
  return svg
}

export async function mountTour(host) {
  const spray = host.querySelector('.tour-spray')
  const air = host.querySelector('.tour-air')
  if (!spray || !air) return
  // Точечная плашка в Instagram остаётся серой: стили SVG там не доходят.
  // В обычном браузере она как на двери Ультры, во встроенном — та же надпись вёрсткой.
  if (IN_APP) air.querySelector('.ap')?.remove()
  else air.replaceChildren(airSvg())
  const raw = await fetch(new URL('../brand/ultra-mark.svg', import.meta.url)).then((r) => r.text())
  const markD = (raw.match(/ d="([^"]+)"/) || ['', ''])[1]
  spray.appendChild(spraySvg(markD, IN_APP))
  play(spray.querySelector('.sm-svg'))
}

function spraySvg(markD, plain) {
  const root = document.createElement('div')
  root.className = 'sm' + (plain ? ' is-plain' : '')
  root.setAttribute('role', 'img')
  root.setAttribute('aria-label', 'Ультра')
  const svg = el('svg', { class: 'sm-svg', viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, 'aria-hidden': 'true' })
  const defs = el('defs')
  const rough = el('filter', { id: 'sm-rough', filterUnits: 'userSpaceOnUse', x: -30, y: -30, width: VIEW.w + 60, height: VIEW.h + 60 })
  rough.appendChild(el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.85', numOctaves: 2, seed: 7, result: 'n' }))
  rough.appendChild(el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 7, xChannelSelector: 'R', yChannelSelector: 'G' }))
  defs.appendChild(rough)
  RUNS.forEach((r, i) => {
    const f = el('filter', { id: `sm-run-f${i}`, filterUnits: 'userSpaceOnUse', x: r.x - 12, y: r.y - 12, width: 24, height: r.len + 24 })
    f.appendChild(el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.7', numOctaves: 2, seed: 11, result: 'n' }))
    f.appendChild(el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: '2.2', xChannelSelector: 'R', yChannelSelector: 'G' }))
    defs.appendChild(f)
  })
  const mist = el('radialGradient', { id: 'sm-mist-g' })
  mist.appendChild(el('stop', { offset: '0', class: 'sm-mist-0' }))
  mist.appendChild(el('stop', { offset: '1', class: 'sm-mist-1' }))
  defs.appendChild(mist)
  const mask = el('mask', { id: 'sm-mask', maskUnits: 'userSpaceOnUse', x: -30, y: -30, width: VIEW.w + 60, height: VIEW.h + 60 })
  const ink = el('g', { class: 'sm-ink' })
  if (!plain) ink.setAttribute('filter', 'url(#sm-rough)')
  const strokes = STROKES.map((p) => el('path', { d: polyD(p), 'stroke-width': BRUSH }))
  const drips = DRIPS.map((p) => el('path', { d: polyD(p), 'stroke-width': DRIP_BRUSH }))
  strokes.forEach((p) => ink.appendChild(p))
  drips.forEach((p) => ink.appendChild(p))
  if (plain) for (const path of [...strokes, ...drips]) path.style.setProperty('stroke', '#6aa5ff', 'important')
  const settle = el('rect', { class: 'sm-settle', x: -30, y: -30, width: VIEW.w + 60, height: VIEW.h + 60 })
  if (!plain) {
    mask.appendChild(ink)
    mask.appendChild(settle)
    defs.appendChild(mask)
  }
  svg.appendChild(defs)
  if (plain) svg.appendChild(ink)
  else svg.appendChild(el('path', { class: 'sm-fill', d: markD, 'fill-rule': 'evenodd', mask: 'url(#sm-mask)' }))
  const runs = el('g', { class: 'sm-runs' })
  const runPaths = []
  const runTips = []
  RUNS.forEach((r, i) => {
    const g = el('g', plain ? {} : { filter: `url(#sm-run-f${i})` })
    const path = el('path', { class: 'sm-run', d: `M${r.x} ${r.y}V${r.y}`, 'stroke-width': RUN_BRUSH })
    const tip = el('circle', { class: 'sm-run-tip', cx: r.x, cy: r.y, r: RUN_BRUSH * 0.82 })
    g.appendChild(path)
    g.appendChild(tip)
    runs.appendChild(g)
    runPaths.push(path)
    runTips.push(tip)
  })
  svg.appendChild(runs)
  const dots = el('g', { class: 'sm-dots' })
  svg.appendChild(dots)
  const puddle = el('g', { class: 'sm-puddle', transform: 'translate(-200 -200)', 'shape-rendering': 'crispEdges' })
  const puddlePaint = el('path', { class: 'sm-puddle-paint', d: '' })
  const puddleWet = el('path', { class: 'sm-puddle-wet', d: '' })
  puddle.appendChild(puddlePaint)
  puddle.appendChild(puddleWet)
  svg.appendChild(puddle)
  const can = el('g', { class: 'sm-can', transform: 'translate(-80 400)' })
  const mistEl = el('circle', { class: 'sm-mist', r: 28 })
  const hold = el('g', { transform: `translate(${CAN_HOLD.dx} ${CAN_HOLD.dy}) rotate(${CAN_HOLD.rot})`, 'shape-rendering': 'crispEdges' })
  const pxFill = { sil: '#8d9098', c: '#8d9098', o: '#8d9098', n: '#f2f2f4', h: '#f2f2f4', C: '#b8b9c0', B: '#b8b9c0', b: '#2563eb', L: '#6aa5ff' }
  const sil = el('path', { class: 'px-sil', d: CAN.silhouette, fill: pxFill.sil })
  paint(sil, pxFill.sil)
  hold.appendChild(sil)
  CAN.paints.forEach((p) => {
    const path = el('path', { class: `px-${p.k}`, d: p.d, fill: pxFill[p.k] || '#f2f2f4' })
    paint(path, pxFill[p.k] || '#f2f2f4')
    hold.appendChild(path)
  })
  can.appendChild(mistEl)
  can.appendChild(hold)
  svg.appendChild(can)
  root.appendChild(svg)
  svg._spray = { strokes, drips, settle, can, dots, mistEl, puddle, puddlePaint, puddleWet, runPaths, runTips, plain }
  return root
}

function play(svg) {
  const s = svg._spray
  let canScale = 1
  let puddleShown = -1
  let t0 = 0
  let lastDot = 0
  let angle = 0
  let lastPos = { x: 0, y: 0 }
  let fallFrom = null
  let raf = 0
  let tick = null

  function setPuddle(k) {
    const n = k >= 1 ? PUDDLE.length : PUDDLE.findIndex((q) => q.d > k)
    const count = n < 0 ? PUDDLE.length : n
    if (count === puddleShown) return
    puddleShown = count
    const on = PUDDLE.slice(0, count)
    s.puddlePaint.setAttribute('d', pixelPath(on))
    s.puddleWet.setAttribute('d', pixelPath(on.filter((q) => q.k === 'w')))
  }
  function setRuns(t) {
    RUNS.forEach((r, i) => {
      const L = runAt(r, t)
      const on = L > 0 ? 'visible' : 'hidden'
      s.runPaths[i].setAttribute('d', `M${r.x} ${r.y}V${(r.y + L).toFixed(2)}`)
      s.runPaths[i].style.visibility = on
      s.runTips[i].setAttribute('cy', (r.y + L).toFixed(2))
      s.runTips[i].style.visibility = on
    })
  }
  function canTransform(x, y, a) {
    return `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${canScale.toFixed(2)})`
  }
  function sprayDots(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const r = BRUSH * 0.5 + Math.pow(Math.random(), 1.5) * BRUSH * 1.8
      const c = el('circle', {
        cx: x + Math.cos(a) * r,
        cy: y + Math.sin(a) * r,
        r: 0.45 + Math.random() * 1.15,
        class: Math.random() < 0.33 ? 'sm-dot sm-dot--stay' : 'sm-dot',
      })
      s.dots.appendChild(c)
      if (!c.classList.contains('sm-dot--stay')) window.setTimeout(() => c.remove(), 1400)
    }
  }
  TL.items.forEach((it) => {
    const node = it.kind === 'stroke' ? s.strokes[it.i] : s.drips[it.i]
    node.style.strokeDasharray = String(it.len + 0.02)
    node.style.strokeDashoffset = String(it.len)
    if (s.plain) node.style.opacity = '0'
    else node.style.visibility = 'hidden'
  })
  const w = svg.getBoundingClientRect().width || VIEW.w
  canScale = Math.min(1.8, Math.max(1, 0.8 / (w / VIEW.w)))
  const end = canAt(TL.strokesEnd, TL)
  lastPos = { x: end.x, y: end.y - 6 }
  const rest = puddleAt(canScale)
  s.puddle.setAttribute('transform', `translate(${rest.x.toFixed(3)} ${rest.y.toFixed(3)}) scale(${canScale.toFixed(3)})`)
  setPuddle(0)
  setRuns(0)

  const reduce = !s.plain && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    s.strokes.forEach((node) => { node.style.strokeDashoffset = '0'; node.style.visibility = 'visible' })
    s.drips.forEach((node) => { node.style.strokeDashoffset = '0'; node.style.visibility = 'visible' })
    s.settle.style.opacity = '1'
    const r = canRest(canScale)
    s.can.setAttribute('transform', canTransform(r.x, r.y, r.angle))
    s.mistEl.style.opacity = '0'
    setPuddle(1)
    setRuns(RUN_TIME)
    return
  }

  function frame(now) {
    if (!t0) t0 = now
    const ms = now - t0
    TL.items.forEach((it) => {
      const node = it.kind === 'stroke' ? s.strokes[it.i] : s.drips[it.i]
      const d = drawn(it, ms)
      if (s.plain) node.style.opacity = d > 0.5 ? '1' : '0'
      else node.style.visibility = d > 0.5 ? 'visible' : 'hidden'
      node.style.strokeDashoffset = String(it.len - d + 0.01)
    })
    s.settle.style.opacity = String(Math.min(1, Math.max(0, (ms - TL.settleStart) / 450)))
    if (ms > TL.strokesEnd) {
      if (!fallFrom) fallFrom = { x: lastPos.x, y: lastPos.y, angle }
      const f = fallAt(ms - TL.strokesEnd, fallFrom, canScale)
      s.can.setAttribute('transform', canTransform(f.x, f.y, f.angle))
      s.mistEl.style.opacity = '0'
      setPuddle(f.puddle)
    } else {
      const p = canAt(ms, TL)
      const target = Math.max(-28, Math.min(28, Math.atan2(p.dy, p.dx) * 12))
      angle += (target - angle) * 0.12
      const lift = p.spraying ? 0 : -6
      lastPos = { x: p.x, y: p.y + lift }
      s.can.setAttribute('transform', canTransform(p.x, p.y + lift, angle))
      s.mistEl.style.opacity = p.spraying ? '1' : '0'
      if (p.spraying) {
        if (lastDot) sprayDots(p.x, p.y, Math.min(60, Math.round((now - lastDot) * 0.26)))
        lastDot = now
      } else lastDot = 0
    }
    if (ms >= TL.end) setRuns(ms - TL.end)
    const busy = Math.max(TL.end + 650, TL.strokesEnd + FALL_TOTAL)
    if (ms < busy) schedule()
    else if (ms < TL.end + RUN_TIME) tick = setTimeout(() => schedule(), 90)
    else setRuns(RUN_TIME)
  }
  function schedule() {
    if (s.plain) tick = setTimeout(() => frame(performance.now()), 32)
    else raf = requestAnimationFrame(frame)
  }
  window.setTimeout(schedule, 380)
  window.addEventListener('pagehide', () => { if (raf) cancelAnimationFrame(raf); if (tick) clearTimeout(tick) }, { once: true })
}
