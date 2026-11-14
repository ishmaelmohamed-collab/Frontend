import { AlertTriangle, CheckCircle2, Info, OctagonAlert, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Messages inside a page. Within the two-colour palette:
 * info = misty blue · success = soft mist + check · attention = slate outline + warning icon.
 * Only `error` uses warning red, and it is announced to screen readers immediately.
 */
export type AlertTone = 'info' | 'success' | 'attention' | 'error'

const tones: Record<AlertTone, { box: string; icon: string; title: string; Icon: typeof Info }> = {
  info: { box: 'bg-mist border-mist-strong', icon: 'text-slate', title: 'text-ink', Icon: Info },
  success: { box: 'bg-mist-soft border-mist', icon: 'text-slate', title: 'text-ink', Icon: CheckCircle2 },
  attention: {
    box: 'bg-panel border-slate border-2',
    icon: 'text-slate',
    title: 'text-ink',
    Icon: AlertTriangle,
  },
  error: {
    box: 'bg-alert-soft border-[#f9c9c4]',
    icon: 'text-alert',
    title: 'text-alert',
    Icon: OctagonAlert,
  },
}

export function Alert({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: AlertTone
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const s = tones[tone]
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-card flex items-start gap-3 border px-4 py-3', s.box)}
    >
      <s.Icon aria-hidden className={cn('mt-0.5 size-5 shrink-0', s.icon)} />
      <div className="min-w-0 flex-1 text-sm">
        <p className={cn('font-bold', s.title)}>{title}</p>
        {children && <div className="text-ink-muted mt-0.5">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Short confirmation after an action (bottom of the screen, disappears after 6 s). */
export function Toast({
  children,
  action,
  onClose,
  closeLabel = 'Close',
}: {
  children: ReactNode
  action?: ReactNode
  onClose?: () => void
  closeLabel?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-ink shadow-overlay rounded-card flex w-full max-w-md items-center gap-3 px-4 py-3 text-sm text-white"
    >
      <CheckCircle2 aria-hidden className="text-mist size-5 shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      {action}
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="grid size-8 place-items-center rounded-md text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  )
}
