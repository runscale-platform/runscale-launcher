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
  assert.match(html, /class="tour"/)
  assert.match(html, /class="tour-spray"/)
  assert.match(html, /class="tour-air"/)
  assert.doesNotMatch(html, /tour-mark/)
  assert.match(html, /class="plates"/)
  assert.match(html, /Рынки/)
  assert.match(html, /Сводки/)
  assert.match(html, /defer: true/)
  assert.match(html, /ultra\.runscale\.ru\/launch\/\?from=/)
  assert.match(html, /Стартовый багфикс/)
  assert.doesNotMatch(html, /Тест-драйв/)
  assert.match(html, /target = '_blank'/)
})
