import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocaleContext, messages, type Locale, type LocaleContextValue } from './i18n-context'

const STORAGE_KEY = 'accounting.locale'

function readSaved(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'
  } catch {
    return 'en'
  }
}

/** Holds the language and sets <html lang dir>, so the whole layout mirrors for Arabic. */
export function LocaleProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => initial ?? readSaved())
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir,
      setLocale: (next) => {
        setLocaleState(next)
        try {
          localStorage.setItem(STORAGE_KEY, next)
        } catch {
          /* storage blocked — choice lasts for this visit */
        }
      },
      t: (key) => messages[locale][key],
    }),
    [locale, dir],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
