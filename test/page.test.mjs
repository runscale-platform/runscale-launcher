import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../launch/index.html', import.meta.url), 'utf8')

test('на двери блок «Всё прозрачно» и окно cookies, короткой плашки нет', () => {
  assert.match(html, /Всё прозрачно\./)
  assert.match(html, /Cookies на этом сайте/)
  assert.match(html, /Принять все/)
  assert.match(html, /Только необходимые/)
  assert.match(html, /Cookies и Метрика/)
  assert.doesNotMatch(html, /Счётчик включится/)
})
