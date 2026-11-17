// sprayStrokes.js — как рука пишет знак «Ультра» баллончиком (`/live`, UL-22, UD-166; слово Михаила 15.10, 12:01:
// «анимацию ультры переделай чтобы реально писалось как баллончиком краски на стене как будто рукой. можешь даже
// имитировать курсор в виде баллончика с краской который двигается по экрану»).
//
// Знак `mark/ultra-mark.svg` — залитый контур без линий, по которым его писали. Штрихи проведены вручную по сетке
// поверх знака в единицах его viewBox (679 × 347), в порядке письма слева направо: У, Л, Ь, Т, Р, А, потом два коротких
// штриха под верхней перекладиной. Потёки — отдельно, они стекают вниз в конце. Кисть шириной `BRUSH` по этим штрихам
// закрывает 98,5 % знака (замер 15.10 растром ×3), остаток по краям проявляется в конце (`settle`).
//
// Чистый модуль: длины, расписание и точка баллончика считаются здесь и проверяются `tests/live.test.mjs`.

export const VIEW = { w: 679, h: 347 }
export const BRUSH = 26
export const DRIP_BRUSH = 10

export const STROKES = [
  [[18, 108], [45, 68], [120, 205]],
  [[196, 18], [120, 205], [62, 318]],
  [[131, 244], [186, 113], [209, 290]],
  [[240, 82], [234, 232]],
  [[205, 182], [328, 193], [213, 290]],
  [[265, 105], [490, 57]],
  [[348, 112], [303, 322]],
  [[315, 122], [522, 172]],
  [[393, 100], [414, 308]],
  [[370, 242], [522, 172]],
  [[462, 298], [489, 24], [656, 320]],
  [[447, 288], [622, 150]],
  [[361, 80], [363, 138]],
  [[432, 78], [433, 140]],
]

export const DRIPS = [
  [[288, 200], [289, 222]], [[298, 200], [299, 220]], [[436, 222], [437, 233]], [[486, 203], [487, 216]],
  [[541, 223], [542, 235]], [[509, 248], [510, 268]], [[466, 292], [467, 304]], [[432, 150], [432, 164]],
]

// Темп руки: единиц знака в секунду, пауза на отрыв и перенос, скорость потёков, сколько проявляется остаток.
export const PACE = { speed: 1550, lift: 80, liftMin: 60, dripSpeed: 40, dripGap: 60, settle: 450 }

export function polyLength(p) {
  let L = 0
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])
  return L
}

export function polyD(p) {
  return p.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
}

/** Точка и направление на ломаной на расстоянии `d` от начала. */
export function pointAt(p, d) {
  let left = Math.max(0, d)
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1]
    const [x1, y1] = p[i]
    const seg = Math.hypot(x1 - x0, y1 - y0)
    if (left <= seg || i === p.length - 1) {
      const k = seg ? Math.min(1, left / seg) : 0
      return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, dx: (x1 - x0) / (seg || 1), dy: (y1 - y0) / (seg || 1) }
    }
    left -= seg
  }
  const [x, y] = p[p.length - 1]
  return { x, y, dx: 0, dy: 1 }
}

/**
 * Расписание: штрих за штрихом с паузой на перенос руки, потом потёки один за другим, потом проявление остатка.
 * Время — миллисекунды от начала. `end` — когда знак готов целиком.
 */
export function timeline(strokes = STROKES, drips = DRIPS, pace = PACE) {
  const items = []
  let t = 0
  strokes.forEach((p, i) => {
    const len = polyLength(p)
    const dur = (len / pace.speed) * 1000
    if (i > 0) {
      const prev = strokes[i - 1]
      const a = prev[prev.length - 1]
      const gap = Math.hypot(p[0][0] - a[0], p[0][1] - a[1])
      t += Math.max(pace.liftMin, pace.lift * Math.min(1.6, gap / 120))
    }
    items.push({ kind: 'stroke', i, start: t, dur, len })
    t += dur
  })
  let dt = t + 80
  drips.forEach((p, i) => {
    const len = polyLength(p)
    const dur = (len / pace.dripSpeed) * 1000
    items.push({ kind: 'drip', i, start: dt, dur, len })
    dt += pace.dripGap
  })
  const dripsEnd = Math.max(t, ...items.filter((x) => x.kind === 'drip').map((x) => x.start + x.dur))
  return { items, strokesEnd: t, settleStart: t + 120, end: Math.max(dripsEnd, t + 120 + pace.settle) }
}

/** Сколько штриха написано к моменту `ms`: 0…len. */
export function drawn(item, ms) {
  if (ms <= item.start) return 0
  if (ms >= item.start + item.dur) return item.len
  const k = (ms - item.start) / item.dur
  // Рука разгоняется и тормозит к концу штриха.
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
  return item.len * (0.15 * k + 0.85 * e)
}

/** Где баллончик в момент `ms`: на штрихе — в точке письма, между штрихами — летит к началу следующего. */
export function canAt(ms, tl = timeline(), strokes = STROKES) {
  const st = tl.items.filter((x) => x.kind === 'stroke')
  for (let k = 0; k < st.length; k++) {
    const it = st[k]
    if (ms < it.start) {
      const prev = st[k - 1]
      const from = prev ? strokes[prev.i][strokes[prev.i].length - 1] : [strokes[0][0][0] - 60, strokes[0][0][1] + 80]
      const to = strokes[it.i][0]
      const t0 = prev ? prev.start + prev.dur : it.start - 300
      const k2 = Math.min(1, Math.max(0, (ms - t0) / (it.start - t0 || 1)))
      return { x: from[0] + (to[0] - from[0]) * k2, y: from[1] + (to[1] - from[1]) * k2, spraying: false, dx: to[0] - from[0], dy: to[1] - from[1] }
    }
    if (ms <= it.start + it.dur) {
      const pt = pointAt(strokes[it.i], drawn(it, ms))
      return { ...pt, spraying: true }
    }
  }
  const last = strokes[strokes.length - 1]
  const [x, y] = last[last.length - 1]
  return { x, y, dx: 1, dy: 0.4, spraying: false }
}

// ── Баллончик падает на землю (слово Михаила 15.10, 15:11, п. 19, `ЗАДАНИЕ.md` §9): «когда анимация с баллончиком
// закончена то бросай баллончик на землю под ультру пусть там дальше валяется и лужу краски небольшую тоже сделай
// например под буквой А есть место». Земля — нижний край букв (`GROUND`); место — между ногами «А», под её
// перекладиной: при x 500…600 знак свободен ниже y ≈ 250 до самого низа (замер по сетке знака 15.10).
//
// Геометрия баллончика — из разметки `SprayMark.vue`: группа `translate(x y) rotate(a) scale(s)`, внутри сдвиг
// `translate(12 -50) rotate(18)`. Ось банки идёт от дна (1,4; 5,4) к соплу (18,7; −47,8), то есть стоит под −72°;
// поворот группы на +72° кладёт её на бок соплом вправо: ось на y = 3, дно на x = −4,7, сопло на x = 51,3, корпус
// по высоте от −8 до +14 единиц. Поэтому низ корпуса касается земли при y = GROUND − 14·s.
export const GROUND = 322
// С версии 7 банка пиксельная и шире (`CAN_SPRITE`: 7 пикселей по 4 единицы, корпус ±14 от оси вместо ±11), поэтому
// низ лежащей банки — 3 + 14 = 17 единиц ниже точки группы.
export const REST = { cx: 548, angle: 72, bottom: 17, mid: 23, nozzle: 51, left: -5 }
export const FALL = { delay: 140, dur: 560, bounce: 320, puddleDelay: 120, puddle: 900 }

/** Где баллончик лежит после падения при масштабе `s`. */
export function canRest(s = 1) {
  return { x: REST.cx - REST.mid * s, y: GROUND - REST.bottom * s, angle: REST.angle }
}

/** Сколько всего идёт падение с отскоком и растекающейся лужей, от конца последнего штриха. */
export const FALL_TOTAL = FALL.delay + FALL.dur + FALL.bounce + FALL.puddle

/**
 * Баллончик через `t` мс после конца последнего штриха: держится `delay`, падает дугой с подбросом (тяжесть —
 * квадрат времени), поворачивается на бок, раз подпрыгивает и ложится. `puddle` — доля растёкшейся лужи 0…1.
 */
export function fallAt(t, from, s = 1) {
  const rest = canRest(s)
  if (t <= FALL.delay) return { x: from.x, y: from.y, angle: from.angle, puddle: 0, landed: false }
  const tf = t - FALL.delay
  if (tf < FALL.dur) {
    const k = tf / FALL.dur
    const ease = 1 - Math.pow(1 - k, 2)
    return {
      x: from.x + (rest.x - from.x) * ease,
      y: from.y + (rest.y - from.y) * k * k - 34 * s * k * (1 - k),
      angle: from.angle + (rest.angle - from.angle) * ease,
      puddle: 0,
      landed: false,
    }
  }
  const tb = tf - FALL.dur
  const u = Math.min(1, tb / FALL.bounce)
  const hop = Math.sin(Math.PI * u) * (1 - u)
  const tp = tf - FALL.dur - FALL.puddleDelay
  const p = Math.max(0, Math.min(1, tp / FALL.puddle))
  return {
    x: rest.x,
    y: rest.y - 12 * s * hop,
    angle: rest.angle + 8 * Math.sin(2 * Math.PI * u) * (1 - u),
    puddle: 1 - Math.pow(1 - p, 3),
    landed: true,
  }
}

// ── Баллончик пикселями (слово Михаила 15.10, 18:52, `ЗАДАНИЕ.md` §11): «сделай баллончик с краской пикселями, а то он
// слишком аккуратный на фоне того, что получилось, а так будет полный ретро-футуризм, как в играх». Буквы карты — краски
// спрайта, их цвета — токены в `SprayMark.vue`: n — сопло, c — колпачок, C — блик колпачка, o — край и тень корпуса,
// B — корпус, h — блик корпуса, b — синяя полоса, L — её блик. Точка — пусто.
//
// Версия 9 (слово Михаила 16.10, 08:03, п. 4, `ЗАДАНИЕ.md` §14): «у баллончика между пикселями видны чёрные зазоры, надо
// убрать и также пиксели тоже сделать меньше и лужу под ним тоже сделать пиксельно чтобы и там и там было одно зерно».
// Пиксель вдвое мельче: 14 × 28 по 2 единицы вместо 7 × 14 по 4 — банка та же, 28 × 56, ось та же, x = 7, поэтому место
// в руке, сопло и падение не сдвигаются. Мельче пиксель — и рисунок тоньше: колпачок скруглён ступенями, плечо
// скошено, блик и блик полосы в один пиксель, справа корпус уходит в тень тремя колонками. Зазоры были оттого, что
// каждый пиксель стоял отдельным квадратом и браузер округлял края каждого по-своему: теперь на каждую краску один
// контур (`pixelPath`), а под ними подложка всего силуэта — щели между красками, если и откроются, покажут корпус,
// а не тёмный фон.
export const CAN_SPRITE = {
  px: 2,
  x0: -7,
  rows: [
    '......nn......',
    '.....nnnn.....',
    '.....cccc.....',
    '....cCcccc....',
    '...cCcccccc...',
    '..cCcccccccc..',
    '..oooooooooo..',
    '.oooooooooooo.',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'obLbbbbbbbbbbo',
    'obLbbbbbbbbbbo',
    'obLbbbbbbbbbbo',
    'obLbbbbbbbbbbo',
    'obLbbbbbbbbbbo',
    'obLbbbbbbbbbbo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oBhBBBBBBBBooo',
    'oooooooooooooo',
    '.oooooooooooo.',
  ],
}

/** Пиксели спрайта банки: `x`, `y` левого верхнего угла в единицах знака и буква краски `k`. */
export function canPixels(s = CAN_SPRITE) {
  const out = []
  s.rows.forEach((row, r) => [...row].forEach((k, c) => { if (k !== '.') out.push({ x: s.x0 + c * s.px, y: r * s.px, k }) }))
  return out
}

const n3 = (v) => String(Math.round(v * 1000) / 1000)

/**
 * Один контур на набор пикселей: соседние в строке сливаются в полосу, полосы идут подпутями одного пути. Внутри
 * одного пути общий край закрашивается целиком — швов между пикселями нет (п. 4 §14).
 */
export function pixelPath(pixels, px = CAN_SPRITE.px) {
  const rows = new Map()
  for (const q of pixels) {
    const key = n3(q.y)
    if (!rows.has(key)) rows.set(key, [])
    rows.get(key).push(q.x)
  }
  let d = ''
  for (const [y, xs] of rows) {
    xs.sort((a, b) => a - b)
    let from = xs[0]
    let to = xs[0] + px
    for (let i = 1; i <= xs.length; i++) {
      if (i < xs.length && Math.abs(xs[i] - to) < 1e-6) { to = xs[i] + px; continue }
      d += `M${n3(from)} ${y}h${n3(to - from)}v${px}h${n3(from - to)}z`
      if (i < xs.length) { from = xs[i]; to = xs[i] + px }
    }
  }
  return d
}

/** Контуры банки по краскам и силуэт-подложка — для разметки `SprayMark.vue`. */
export function canPaths(s = CAN_SPRITE) {
  const px = canPixels(s)
  const by = {}
  for (const q of px) (by[q.k] ||= []).push(q)
  return { silhouette: pixelPath(px, s.px), paints: Object.entries(by).map(([k, list]) => ({ k, d: pixelPath(list, s.px) })) }
}

// Как спрайт держится в руке: сдвиг и поворот внутри группы баллончика (`SprayMark.vue`). Лежащая банка повёрнута
// на `REST.angle` + `CAN_HOLD.rot` = 90°, и её пиксели встают ровной сеткой по осям экрана.
export const CAN_HOLD = { dx: 12, dy: -50, rot: 18 }

/**
 * Сетка пикселей лежащей банки в единицах группы баллончика (до масштаба): линия сопла `nozzleX` (вертикальная
 * линия сетки, на ней кончик сопла) и линия земли `groundY` (горизонтальная, по ней дно корпуса). Пиксель спрайта
 * (столбец c, строка r) ложится в квадрат x ∈ [nozzleX − px·(r + 1); nozzleX − px·r], y ∈ [groundY − px·(колонок − c); …].
 */
export function restLattice(s = CAN_SPRITE) {
  const a = (REST.angle * Math.PI) / 180
  const ox = CAN_HOLD.dx * Math.cos(a) - CAN_HOLD.dy * Math.sin(a)
  const oy = CAN_HOLD.dx * Math.sin(a) + CAN_HOLD.dy * Math.cos(a)
  const cols = s.rows[0].length
  return { nozzleX: ox, groundY: oy + s.x0 + cols * s.px }
}

// ── Лужа пикселями (п. 4 §14): то же зерно, что у банки, и та же сетка — пиксели лужи продолжают пиксели лежащей
// банки. `ax` — столбец, с левого края которого начинается сопло; `ground` — первая строка ниже земли: строки выше
// земли — дальний край лужи (у корпуса их закрывает банка), ниже — ближний. p — краска, w — мокрый блик поверх неё.
// Растекается лужа по пикселю, от сопла к краям, капли в стороне встают последними (`puddlePixels`, порог `d`).
export const PUDDLE_SPRITE = {
  ax: 12,
  ground: 3,
  rows: [
    '............pppppppp..........',
    '.......ppppppwwwwwppppp.......',
    '...pppppppppppppppppppppppp.p.',
    'p..pppppppppppppppppppppppp...',
    '.....ppppppppppppppppppp......',
  ],
}

/** Где лежит левый верхний угол карты лужи при масштабе `s`: на сетке лежащей банки, сопло — на столбце `ax`. */
export function puddleAt(s = 1, sp = PUDDLE_SPRITE) {
  const r = canRest(s)
  const L = restLattice()
  const px = CAN_SPRITE.px
  return { x: r.x + s * (L.nozzleX - px * sp.ax), y: r.y + s * (L.groundY - px * sp.ground) }
}

/**
 * Пиксели лужи в единицах её карты, по порядку растекания: `d` — 0 у сопла, 1 у самой дальней капли. Центр — чуть
 * правее сопла, у земли; эллипс вытянут вдоль земли. Пиксель видно, когда доля растёкшейся лужи дошла до его `d`.
 */
export function puddlePixels(sp = PUDDLE_SPRITE) {
  const px = CAN_SPRITE.px
  const cx = sp.ax + 3
  const cy = sp.ground - 0.5
  const out = []
  sp.rows.forEach((row, r) => [...row].forEach((k, c) => {
    if (k === '.') return
    out.push({ x: c * px, y: r * px, k, d: Math.hypot((c + 0.5 - cx) / 14, (r + 0.5 - cy) / 2.6) })
  }))
  const max = Math.max(...out.map((q) => q.d))
  out.forEach((q) => { q.d /= max })
  return out.sort((a, b) => a.d - b.d)
}

// ── Капли стекают (слово Михаила 16.10, 08:03, п. 5, `ЗАДАНИЕ.md` §14): «пока кнопка старт не нажата пусть капли
// с ультры медленно стекают 30 сек и далее стоп». Когда знак дописан, капли, которые уже висят на буквах, медленно
// тянутся дальше: тонкая дорожка и капля на конце. Каждая идёт со своей задержкой и своим темпом — быстро в начале,
// потом всё медленнее, рывками, как краска на стене, — и ровно через `RUN_TIME` все стоят на месте.
// Новых мест для капель не заводим: тянутся только подтёки самого знака — под «Р» и «А», включая длинный на конце
// перекладины «Т»; под «У» по-прежнему ничего (его слово 24.09 о подтёках знака, UL-04). Начало — у кончика подтёка,
// чуть выше, чтобы дорожка выходила из него; длины подобраны по растру знака 16.10 так, чтобы потёк с каплей
// не въезжал в соседний штрих и не уходил под землю. Подтёки над «Ь» упираются в его диагональ — они стоят.
export const RUN_TIME = 30000
export const RUN_BRUSH = 5
export const RUNS = [
  { x: 433.2, y: 162.5, len: 34, delay: 0, tau: 9000 },
  { x: 509.4, y: 267, len: 30, delay: 700, tau: 9500 },
  { x: 436.8, y: 230.5, len: 52, delay: 1400, tau: 11000 },
  { x: 488, y: 214, len: 24, delay: 2600, tau: 8500 },
  { x: 541.1, y: 232.5, len: 36, delay: 3800, tau: 10000 },
]

/**
 * Длина потёка через `t` мс после того, как знак дописан: 0 до задержки, дальше растёт всё медленнее, с рывками,
 * и к `RUN_TIME` ровно `len`. Рывок — ход времени то быстрее, то медленнее (`a` < 1, поэтому длина только растёт).
 */
export function runAt(run, t) {
  if (t <= run.delay) return 0
  const T = RUN_TIME - run.delay
  if (t >= RUN_TIME) return run.len
  const w = (2 * Math.PI) / 2300
  const a = 0.55
  const warp = (x) => x + (a * Math.sin(w * x)) / w
  const g = (x) => 1 - Math.exp(-warp(x) / run.tau)
  return run.len * Math.min(1, g(t - run.delay) / g(T))
}
