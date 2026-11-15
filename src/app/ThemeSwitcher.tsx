import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n-context'
import { applyTheme, readTheme, saveTheme, THEMES, type Theme } from '@/lib/theme'

const LABELS: Record<Theme, string> = { ledger: 'Ledger', fog: 'Blue fog' }

/** Switches between the two approved two-colour themes and remembers the choice. */
export function ThemeSwitcher() {
  const { t } = useLocale()
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`${t('theme.switch')}: ${LABELS[next]}`}
      title={`${t('theme.switch')}: ${LABELS[next]}`}
      className="border-line-input hover:bg-mist-soft rounded-control inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-semibold pointer-coarse:min-h-11"
    >
      <Palette aria-hidden className="size-4" />
      {LABELS[theme]}
    </button>
  )
}
