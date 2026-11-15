import { Palette } from 'lucide-react'
import { useEffect, useState } from 'react'

const THEMES = ['ledger', 'notion', 'fog'] as const
const LABELS: Record<(typeof THEMES)[number], string> = {
  ledger: 'Ledger',
  notion: 'Notion',
  fog: 'Blue Fog',
}

/** Cycles Ledger → Notion → Blue Fog, remembers the choice. */
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'ledger')

  useEffect(() => {
    if (theme === 'fog') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const cycle = () => {
    const i = THEMES.indexOf(theme as (typeof THEMES)[number])
    setTheme(THEMES[(i + 1) % THEMES.length])
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="Switch theme"
      className="border-line-input hover:bg-mist-soft rounded-control inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-semibold pointer-coarse:min-h-11"
    >
      <Palette aria-hidden className="size-4" />
      {LABELS[theme as (typeof THEMES)[number]]}
    </button>
  )
}
