import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/money'

/** Money in a concept: its own number font, always left-to-right. */
export function M({ v, className }: { v: string | number; className?: string }) {
  return <span className={cn('c-num', className)}>{formatCurrency(v)}</span>
}

/** A labelled frame around one screen of a concept, so the client knows what they are looking at. */
export function Screen({
  label,
  note,
  phone = false,
  children,
}: {
  label: string
  note?: string
  phone?: boolean
  children: ReactNode
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex flex-wrap items-baseline gap-x-3 font-sans text-sm">
        <span className="font-bold text-[#111111]">{label}</span>
        {note && <span className="text-[#555555]">{note}</span>}
      </figcaption>
      <div
        className={cn(
          'overflow-hidden border border-[#cccccc] shadow-[0_8px_30px_rgba(0,0,0,0.10)]',
          phone ? 'mx-auto w-full max-w-[390px] rounded-[32px] border-[6px] border-[#111111]' : 'rounded-xl',
        )}
      >
        {children}
      </div>
    </figure>
  )
}

/** Accessible data table behind a chart (screen readers, and anyone who prefers numbers). */
export function ChartTable({
  caption,
  head,
  rows,
}: {
  caption: string
  head: string[]
  rows: ReactNode[][]
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
