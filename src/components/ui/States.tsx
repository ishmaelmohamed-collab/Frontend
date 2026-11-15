import { FileText, OctagonAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

/** Placeholder blocks shaped like the content, so nothing jumps when data arrives. */
export function Skeleton({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2.5">
      <span className="sr-only">{label}</span>
      <div className="bg-mist rounded-control h-3.5 w-2/5 animate-pulse" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-mist-soft rounded-control h-9 animate-pulse" />
      ))}
    </div>
  )
}

/** Never a blank area: explain what goes here and offer the first step. */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span aria-hidden className="fog-soft text-slate mb-1 grid size-14 place-items-center rounded-full">
        <FileText className="size-6" />
      </span>
      <p className="text-base font-bold">{title}</p>
      {hint && <p className="text-ink-muted max-w-sm text-sm">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title,
  hint,
  onRetry,
  retryLabel,
}: {
  title: string
  hint?: string
  onRetry?: () => void
  retryLabel: string
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span
        aria-hidden
        className="bg-alert-soft text-alert mb-1 grid size-14 place-items-center rounded-full"
      >
        <OctagonAlert className="size-6" />
      </span>
      <p className="text-alert text-base font-bold">{title}</p>
      {hint && <p className="text-ink-muted max-w-sm text-sm">{hint}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
