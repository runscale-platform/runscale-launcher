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
