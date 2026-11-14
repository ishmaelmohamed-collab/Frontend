import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'

/**
 * Wireframe kit — deliberately plain. Grey boxes show WHAT is on a screen and the ORDER
 * of steps; only the next action is slate so the click path is obvious. Real styling
 * comes from the approved Blue fog design in later phases.
 */

const NAV = [
  'Dashboard',
  'Invoices',
  'Quotes',
  'Customers',
  'Payments received',
  'Bills',
  'Purchase orders',
  'Vendors',
  'Items & stock',
  'Bank & wallets',
  'Reconciliation',
  'Accounts & journal',
  'Reports',
  'Settings',
]

export function Marker({ n }: { n: number }) {
  return (
    <span
      aria-label={`Rule ${n}`}
      className="bg-ink inline-grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
    >
      {n}
    </span>
  )
}

export function WireFrame({
  code,
  active,
  crumb,
  title,
  meta,
  actions,
  rules,
  next,
  children,
}: {
  code: string
  active: string
  crumb?: { label: string; to: string }
  title: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  rules: string[]
  next?: string
  children: ReactNode
}) {
  return (
    <div className="bg-canvas min-h-dvh">
      <div className="border-line bg-panel flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-sm">
        <Link to="/wireframes" className="text-slate font-semibold">
          ← All wireframes
        </Link>
        <span className="text-ink-muted">
          Wireframe <strong className="text-ink">{code}</strong> · grey on purpose — judge content and order
        </span>
      </div>
      <div className="flex">
        <aside className="border-line hidden w-52 shrink-0 border-e bg-[#eef0f3] p-3 lg:block">
          <div className="mb-3 flex items-center gap-2 px-2">
            <span className="border-line-input size-6 rounded border border-dashed" aria-hidden />
            <span className="text-sm font-bold">[Company]</span>
          </div>
          <nav aria-label="Main (wireframe)" className="flex flex-col gap-0.5">
            {NAV.map((n) => (
              <span
                key={n}
                className={cn(
                  'rounded px-2 py-1.5 text-[13px]',
                  n === active ? 'bg-[#d5d9df] font-bold' : 'text-ink-muted',
                )}
              >
                {n}
              </span>
            ))}
          </nav>
        </aside>

        {/* Screen + rules: side by side on wide screens, rules below the screen otherwise */}
        <div className="flex min-w-0 flex-1 flex-col 2xl:flex-row">
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                {crumb && (
                  <Link to={crumb.to} className="text-ink-muted text-sm">
                    ← {crumb.label}
                  </Link>
                )}
                <h1 className="text-2xl font-bold">{title}</h1>
                {meta && <div className="text-ink-muted mt-0.5 text-sm">{meta}</div>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
          </main>

          <aside className="border-line w-full shrink-0 border-t bg-[#fdfbea] p-5 2xl:w-80 2xl:border-s 2xl:border-t-0">
            <h2 className="mb-3 text-sm font-bold">Rules on this screen</h2>
            <ol className="flex flex-col gap-3 text-[13px] leading-5">
              {rules.map((r, i) => (
                <li key={i} className="flex gap-2.5">
                  <Marker n={i + 1} />
                  <span>{r}</span>
                </li>
              ))}
            </ol>
            {next && (
              <p className="border-line text-ink-muted mt-5 border-t pt-3 text-[13px]">
                Next → <strong className="text-ink">{next}</strong>
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

/** Wireframe button. `primary` = the next step (slate). `to` makes it a link in the prototype. */
export function WButton({
  children,
  primary = false,
  to,
  marker,
}: {
  children: ReactNode
  primary?: boolean
  to?: string
  marker?: number
}) {
  const cls = cn(
    'inline-flex min-h-9 items-center gap-2 rounded-md px-3.5 text-sm font-semibold',
    primary ? 'bg-slate text-white hover:bg-slate-hover' : 'border border-line-input bg-panel text-ink',
  )
  const body = (
    <>
      {children}
      {marker && <Marker n={marker} />}
    </>
  )
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <span className={cls}>{body}</span>
  )
}

export function WField({
  label,
  value,
  strong = false,
  muted = false,
  marker,
  hint,
  numeric = false,
}: {
  label: string
  value: ReactNode
  strong?: boolean
  muted?: boolean
  marker?: number
  hint?: string
  numeric?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
        {label}
        {marker && <Marker n={marker} />}
      </span>
      <span
        className={cn(
          'flex min-h-9 items-center rounded-md px-3 text-sm',
          strong ? 'border-ink border-2' : 'border-line-input border',
          muted ? 'bg-canvas text-ink-muted border-line' : 'bg-panel',
          numeric && 'justify-end tabular-nums',
        )}
      >
        {value}
      </span>
      {hint && <span className="text-ink-muted text-xs">{hint}</span>}
    </div>
  )
}

export function WBox({
  title,
  marker,
  dashed = false,
  className,
  children,
}: {
  title?: string
  marker?: number
  dashed?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'bg-panel rounded-lg p-4',
        dashed ? 'border-line-input border border-dashed bg-[#fafbfc]' : 'border-line border',
        className,
      )}
    >
      {title && (
        <h2 className="text-ink-muted mb-3 flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
          {title}
          {marker && <Marker n={marker} />}
        </h2>
      )}
      {children}
    </section>
  )
}

export function WTable({
  cols,
  rows,
  numericCols = [],
  highlight = [],
  wrap = false,
}: {
  cols: string[]
  rows: ReactNode[][]
  numericCols?: number[]
  highlight?: number[]
  /** Let long text wrap (keeps action buttons in view) instead of scrolling sideways. */
  wrap?: boolean
}) {
  return (
    <div className="border-line overflow-x-auto rounded-lg border">
      <table className={cn('w-full min-w-[560px] text-sm', !wrap && 'whitespace-nowrap')}>
        <thead className="text-ink-muted bg-[#eef0f3] text-xs">
          <tr>
            {cols.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={cn('px-3 py-2 font-semibold', numericCols.includes(i) ? 'text-end' : 'text-start')}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className={cn('border-line border-t', highlight.includes(ri) && 'bg-[#f1f3f6]')}>
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={cn(
                    'px-3 py-2.5',
                    numericCols.includes(ci) && 'text-end font-semibold tabular-nums',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Status in wireframes: outlined word; overdue gets the strongest outline. */
export function WStatus({ s }: { s: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
        s === 'Overdue' ? 'border-ink border-2' : 'border-line-input border',
      )}
    >
      {s}
    </span>
  )
}

export function Row({ label, value, bold = false }: { label: ReactNode; value: ReactNode; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-4 text-sm', bold && 'border-line border-t pt-2 font-bold')}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
