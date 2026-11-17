// airPlate.js — плашка «РАНСКЕИЛ | В ЭФИРЕ» на первом экране `/live` точками (UL-22, UD-186).
//
// Слово Михаила 16.10, 08:57 (`tasks/UL-22-дверь-live/ЗАДАНИЕ.md` §15): «замени ранскеил с шевронов на раскеил
// из шторки gderost.ru точками и также напиши в эфире и рамку сделай тоже точками а блок который закрашен для
// в эфире тоже точками и получается что в эфире это пустые точки».
//
// Плашка — одна точечная матрица на сетке витрины gderost (`ultra/composables/dotGrid.js`, копия; буквы — `LETTERS`
// там же, одним рисунком с подписью «Ранскеил» в шторке «Где Рост»). Форма — образца Tesla LIVE (версия 9, UD-184):
// две половины в одну строку, левая чуть шире (≈ 54 : 46), высота — шестая часть ширины. Слои матрицы:
//   frame — рамка: внешний ряд точек по всему периметру;
//   on    — «РАНСКЕИЛ» горящими точками на тёмной левой половине;
//   field — правая половина: поле горящих точек вместо залитого металла;
//   off   — незажжённые точки левой половины вокруг слова;
//   hole  — буквы «В ЭФИРЕ» в поле пустыми точками: слово читается тем, что его точки не горят.
// Буквы стоят по середине своих половин, по пять рядов, как в шторке; поля — по три пустых колонки и ряда.
//
// Чистый модуль: клетки и пути считаются здесь и проверяются `tests/live.test.mjs`.
import { DOT_R, DOT_STEP, wordShape } from './dotGrid.js'

export const AIR_ROWS = 13
export const AIR_PAD = 3
const LETTER_ROWS = 5

/** Клетки слова: столбец и ряд каждой горящей точки и ширина слова в колонках. */
export function wordCells(word) {
  const s = wordShape(word)
  const cols = Math.round((s.w - 2 * DOT_R) / DOT_STEP) + 1
  const cells = s.dots.map(([x, y]) => [Math.round((x - DOT_R) / DOT_STEP), Math.round((y - DOT_R) / DOT_STEP)])
  return { cols, cells }
}

/**
 * Матрица плашки: размер в клетках, граница половин `split` (первая колонка правой) и четыре слоя клеток.
 * `w`, `h` — габарит в единицах сетки витрины (шаг `DOT_STEP`, радиус точки `DOT_R`).
 */
export function airPlate(left, right) {
  const L = wordCells(left)
  const R = wordCells(right)
  const rows = AIR_ROWS
  const top = (rows - LETTER_ROWS) / 2
  const leftW = AIR_PAD + L.cols + AIR_PAD
  const rightW = AIR_PAD + R.cols + AIR_PAD
  const cols = 1 + leftW + rightW + 1
  const split = 1 + leftW
  const key = (c, r) => `${c},${r}`
  const on = new Set(L.cells.map(([c, r]) => key(1 + AIR_PAD + c, top + r)))
  const holes = new Set(R.cells.map(([c, r]) => key(split + AIR_PAD + c, top + r)))
  const layers = { frame: [], on: [], field: [], off: [], hole: [] }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = key(c, r)
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) layers.frame.push([c, r])
      else if (c < split) (on.has(k) ? layers.on : layers.off).push([c, r])
      else (holes.has(k) ? layers.hole : layers.field).push([c, r])
    }
  }
  return { cols, rows, split, layers, w: (cols - 1) * DOT_STEP + 2 * DOT_R, h: (rows - 1) * DOT_STEP + 2 * DOT_R }
}

/** Один путь на слой: каждая точка — круг двумя дугами. */
export function dotsPath(cells) {
  const r = DOT_R
  return cells.map(([c, row]) => `M${c * DOT_STEP} ${row * DOT_STEP + r}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join('')
}

/** Левый край правой половины в единицах сетки — от него идёт перелив металла поля. */
export function splitX(plate) {
  return plate.split * DOT_STEP
}
