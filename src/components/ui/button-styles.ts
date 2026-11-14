/**
 * Blue fog buttons. Three types only — the palette has two colours, so hierarchy
 * comes from fill strength: primary (solid slate) › secondary (outline) › quiet (text).
 * Risky actions (void, lock) use primary + a warning icon + a confirmation dialog;
 * red is reserved for overdue and errors.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet'
export type ButtonSize = 'sm' | 'md'

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-slate text-white hover:bg-slate-hover active:bg-slate-pressed disabled:bg-slate-disabled disabled:text-white',
  secondary:
    'border border-line-input bg-panel text-ink hover:bg-mist-soft active:bg-mist disabled:border-line disabled:bg-panel disabled:text-ink-subtle',
  quiet: 'text-slate hover:bg-mist-soft active:bg-mist disabled:bg-transparent disabled:text-ink-subtle',
}

/** Classes that force a state, for the design-system gallery only. */
export const buttonForced: Record<ButtonVariant, { hover: string; pressed: string }> = {
  primary: { hover: 'bg-slate-hover', pressed: 'bg-slate-pressed' },
  secondary: { hover: 'bg-mist-soft', pressed: 'bg-mist' },
  quiet: { hover: 'bg-mist-soft', pressed: 'bg-mist' },
}

export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 text-[13px] pointer-coarse:min-h-11',
  md: 'min-h-10 px-4 text-sm pointer-coarse:min-h-11',
}

export const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate disabled:cursor-not-allowed'
