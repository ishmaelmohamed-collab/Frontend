import type { Locale } from './i18n-context'

/** Arabic month names with Western digits (business convention), English otherwise. */
const tag = (locale: Locale) => (locale === 'ar' ? 'ar-u-nu-latn' : 'en-GB')

const parse = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "2026-11-14" → "14 Nov 2026" / "14 نوفمبر 2026" */
export const formatDate = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(tag(locale), { day: 'numeric', month: 'short', year: 'numeric' }).format(parse(iso))

/** "2026-11-14" → "14 Nov" */
export const formatDayMonth = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(tag(locale), { day: 'numeric', month: 'short' }).format(parse(iso))

/** "2026-11" → "Nov" / "نوفمبر" */
export const formatMonth = (yearMonth: string, locale: Locale) =>
  new Intl.DateTimeFormat(tag(locale), { month: 'short' }).format(parse(`${yearMonth}-01`))

/** Full weekday + date for greetings. */
export const formatLongDate = (d: Date, locale: Locale) =>
  new Intl.DateTimeFormat(tag(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)

/** Time of day: "10:43" */
export const formatTime = (isoDateTime: string, locale: Locale) =>
  new Intl.DateTimeFormat(tag(locale), { hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date(isoDateTime),
  )

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
