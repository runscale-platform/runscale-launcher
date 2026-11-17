import test from 'node:test'
import assert from 'node:assert/strict'
import { doors, launchMark } from '../launch/door.js'

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
