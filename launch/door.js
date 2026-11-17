// Дверь шапки Instagram на x.gderost.ru. Боевые ultra и gderost не трогает:
// сама страница открывается с GitHub, нажатия ведут на боевые адреса.
// Метки и цели — те же, что у ultra.runscale.ru/launch, чтобы Ротор их увидел.

export const MARK_RE = /^[a-z0-9][a-z0-9-]{0,63}$/
export const DEFAULT_MARK = 'launch'
export const METRIKA_ID = 113084253
export const METRIKA_HOST = 'x.gderost.ru'

export function launchMark(search = '') {
  let raw = ''
  try { raw = new URLSearchParams(String(search || '')).get('from') || '' } catch { raw = '' }
  const mark = raw.trim().toLowerCase()
  return MARK_RE.test(mark) ? mark : DEFAULT_MARK
}

// Встроенный браузер Instagram не отдаёт target=_blank наружу.
// На iPhone работает схема самого приложения: она показывает его диалог
// «открыть снаружи» и уходит в браузер по умолчанию. На Android — intent,
// кроме адресов с хэшем: intent хэш отрезает, поэтому Тренды идут той же схемой.
export function escapeHref(url, ua = '') {
  const href = String(url || '')
  const agent = String(ua || '')
  if (!/^https:\/\//i.test(href) || !/Instagram/i.test(agent)) return href
  if (/Android/i.test(agent)) {
    const u = new URL(href)
    if (!u.hash) {
      return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(href)};end`
    }
  }
  return `instagram://extbrowser/?url=${encodeURIComponent(href)}`
}

export function doors(mark = DEFAULT_MARK) {
  const m = MARK_RE.test(String(mark || '')) ? mark : DEFAULT_MARK
  return {
    focus: `https://ultra.runscale.ru/?from=${m}&product=focus`,
    ultra: `https://ultra.runscale.ru/?from=${m}&product=ultra`,
    track: 'https://gderost.ru/?from=launch',
    live: `https://ultra.runscale.ru/live?from=${m}`,
    trends: 'https://gderost.ru/#t=online',
  }
}
