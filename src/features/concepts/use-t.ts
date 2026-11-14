import { formatDate, formatDayMonth, formatMonth } from '@/lib/dates'
import { useLocale } from '@/lib/i18n-context'
import { text } from './data'

/** Concept text and date helpers in the current language. */
export function useT() {
  const { locale } = useLocale()
  return {
    t: text(locale),
    locale,
    date: (iso: string) => formatDate(iso, locale),
    day: (iso: string) => formatDayMonth(iso, locale),
    month: (ym: string) => formatMonth(ym, locale),
    /** Designer notes on the frames: English / Arabic. */
    L: (en: string, ar: string) => (locale === 'ar' ? ar : en),
  }
}
