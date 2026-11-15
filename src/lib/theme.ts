/**
 * The approved themes — both use only two colours (+ warning red for overdue/errors).
 * Ledger: paper + ink navy (default). Blue fog: misty blue + slate blue.
 */
export const THEMES = ['ledger', 'fog'] as const
export type Theme = (typeof THEMES)[number]

const KEY = 'theme'

export function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    return THEMES.includes(saved as Theme) ? (saved as Theme) : 'ledger'
  } catch {
    return 'ledger'
  }
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage blocked — the choice lasts for this visit */
  }
}

/** Blue fog is the base stylesheet; Ledger overrides it through data-theme. */
export function applyTheme(theme: Theme) {
  if (theme === 'fog') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}
