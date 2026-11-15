import { AlertTriangle } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('bg-panel border-line rounded-card shadow-card border transition-shadow duration-200', className)}
      {...props}
    />
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
    <header className="flex flex-wrap items-start justify-between gap-2 px-5 pt-5">
      <div>
        <h2 className="font-serif text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="text-ink-muted mt-0.5 text-sm">{description}</p>}
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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <div className="text-ink-muted mt-1 text-sm">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/**
 * Headline figure. `featured` = soft fog background (the one figure that matters most);
 * `overdue` = warning red outline, icon and figure.
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
        'rounded-card shadow-card p-5 transition-transform duration-200 hover:-translate-y-0.5',
        variant === 'featured' && 'fog-soft border-line border',
        variant === 'default' && 'bg-panel border-line border',
        variant === 'overdue' && 'bg-panel border-alert border-2',
      )}
    >
      <h2
        className={cn(
          'flex items-center gap-1.5 text-sm',
          variant === 'overdue' ? 'text-alert font-bold' : 'text-ink-muted',
        )}
      >
        {variant === 'overdue' && <AlertTriangle aria-hidden className="size-4" />}
        {label}
      </h2>
      <p className={cn('mt-1 text-3xl font-semibold tracking-tight', variant === 'overdue' && 'text-alert')}>{value}</p>
      {footnote && <div className="text-ink-muted mt-1 text-sm">{footnote}</div>}
    </section>
  )
}
