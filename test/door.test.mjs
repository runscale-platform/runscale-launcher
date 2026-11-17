import test from 'node:test'
import assert from 'node:assert/strict'
import { doors, escapeHref, launchMark } from '../launch/door.js'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 421.0.0.0.0'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 Instagram 421.0.0.0.0'
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'

test('метка из адреса, иначе launch', () => {
  assert.equal(launchMark('?from=instagram-runscale'), 'instagram-runscale')
  assert.equal(launchMark('?from=%20Instagram-Izumov%20'), 'instagram-izumov')
  assert.equal(launchMark('?from=telegram-pavel'), 'telegram-pavel')
  assert.equal(launchMark(''), 'launch')
  assert.equal(launchMark('?from=<script>'), 'launch')
})

test('двери ведут на боевые, Трек без метки профиля', () => {
  const href = doors('instagram-runscale')
  assert.equal(href.focus, 'https://ultra.runscale.ru/?from=instagram-runscale&product=focus')
  assert.equal(href.ultra, 'https://ultra.runscale.ru/?from=instagram-runscale&product=ultra')
  assert.equal(href.track, 'https://gderost.ru/?from=launch')
  assert.equal(href.live, 'https://ultra.runscale.ru/live?from=instagram-runscale')
  assert.equal(href.trends, 'https://gderost.ru/#t=online')
})

test('Instagram уходит во внешний браузер, обычный браузер адрес не меняет', () => {
  const focus = 'https://ultra.runscale.ru/?from=instagram-runscale&product=focus'
  const trends = 'https://gderost.ru/#t=online'
  assert.equal(escapeHref(focus, IPHONE), 'instagram://extbrowser/?url=' + encodeURIComponent(focus))
  assert.equal(escapeHref(trends, IPHONE), 'instagram://extbrowser/?url=' + encodeURIComponent(trends))
  assert.equal(
    escapeHref(focus, ANDROID),
    'intent://ultra.runscale.ru/?from=instagram-runscale&product=focus#Intent;scheme=https;S.browser_fallback_url=' + encodeURIComponent(focus) + ';end',
  )
  assert.equal(escapeHref(trends, ANDROID), 'instagram://extbrowser/?url=' + encodeURIComponent(trends))
  assert.equal(escapeHref(focus, DESKTOP), focus)
  assert.equal(escapeHref('mailto:info@runscale.ru', IPHONE), 'mailto:info@runscale.ru')
})
