import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  applyBrand,
  LocaleContext,
  messages,
  type Brand,
  type Locale,
  type LocaleContextValue,
} from './i18n-context'

const STORAGE_KEY = 'accounting.locale'
const NO_BRAND: Brand = { company: '', provider1: '', provider2: '' }

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
  const [brand, setBrandState] = useState<Brand>(NO_BRAND)
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  const value = useMemo<LocaleContextValue>(() => {
    const branded = brand.company || brand.provider1 || brand.provider2
    return {
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
      t: branded ? (key) => applyBrand(messages[locale][key], brand) : (key) => messages[locale][key],
      setBrand: (b) =>
        setBrandState((cur) =>
          cur.company === b.company && cur.provider1 === b.provider1 && cur.provider2 === b.provider2
            ? cur
            : b,
        ),
    }
  }, [locale, dir, brand])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
