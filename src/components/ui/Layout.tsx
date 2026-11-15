import { AlertTriangle } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('bg-panel border-line rounded-card shadow-card border', className)} {...props} />
  )
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="border-line flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
      <div>
        <h2 className="text-ink-muted text-[13px] font-bold tracking-wide uppercase">{title}</h2>
        {description && <p className="text-ink-subtle mt-0.5 text-xs normal-case">{description}</p>}
      </div>
      {action}
    </header>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {description && <div className="text-ink-muted mt-1 text-sm">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/**
 * Headline figure, in the style of a plain "smart button" stat: a quiet bordered
 * panel with the number doing all the work. `featured` adds a thin accent-coloured
 * top edge; `overdue` = warning red, icon and figure.
 */
export function StatCard({
  label,
  value,
  footnote,
  variant = 'default',
}: {
  label: string
  value: ReactNode
  footnote?: ReactNode
  variant?: 'default' | 'featured' | 'overdue'
}) {
  return (
    <section
      className={cn(
        'rounded-card border-line bg-panel border border-t-[3px] p-4',
        variant === 'featured' && 'border-t-slate',
        variant === 'overdue' && 'border-t-alert',
      )}
    >
      <h2
        className={cn(
          'text-ink-muted flex items-center gap-1.5 text-xs font-semibold',
          variant === 'overdue' && 'text-alert',
        )}
      >
        {variant === 'overdue' && <AlertTriangle aria-hidden className="size-3.5" />}
        {label}
      </h2>
      <p className={cn('mt-1 text-2xl font-bold tracking-tight', variant === 'overdue' && 'text-alert')}>
        {value}
      </p>
      {footnote && <div className="text-ink-muted mt-1 text-xs">{footnote}</div>}
    </section>
  )
}
