/**
 * Batch 5 reports, all built from the same journal as Accounts & journal — so the numbers
 * always agree between screens. Profit to date is shown in equity until a year-end close exists.
 */
import type { Report, ReportKind, ReportLine } from '@/types/domain'
import { invoices, toCents, toMoney, ValidationError } from './db'
import { CHART, journal, ledger } from './ledger'

const pad = (n: number) => String(n).padStart(2, '0')
const now = new Date()
const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const ISO = /^\d{4}-\d{2}-\d{2}$/

const row = (code: string, cents: number): ReportLine => ({
  label: `coa.${code}`,
  labelIsKey: true,
  amount: toMoney(cents),
  kind: 'row',
  code,
})
const line = (label: string, cents: number, kind: ReportLine['kind']): ReportLine => ({
  label,
  labelIsKey: true,
  amount: toMoney(cents),
  kind,
})
const heading = (label: string): ReportLine => ({ label, labelIsKey: true, amount: '0.00', kind: 'heading' })

/** Income and expense movement per account between two dates (inclusive). */
function movement(from: string, to: string) {
  const totals: Record<string, number> = {}
  for (const e of journal())
    if (e.date >= from && e.date <= to)
      for (const l of e.lines)
        totals[l.accountCode] = (totals[l.accountCode] ?? 0) + toCents(l.debit) - toCents(l.credit)
  return totals // debit-positive
}

function profit(from: string, to: string): ReportLine[] {
  const m = movement(from, to)
  const income = CHART.filter((a) => a.type === 'income').map((a) => [a.code, -(m[a.code] ?? 0)] as const)
  const expense = CHART.filter((a) => a.type === 'expense').map((a) => [a.code, m[a.code] ?? 0] as const)
  const ti = income.reduce((s, [, c]) => s + c, 0)
  const te = expense.reduce((s, [, c]) => s + c, 0)
  return [
    heading('ltype.income'),
    ...income.filter(([, c]) => c !== 0).map(([code, c]) => row(code, c)),
    line('rep.totalIncome', ti, 'subtotal'),
    heading('ltype.expense'),
    ...expense.filter(([, c]) => c !== 0).map(([code, c]) => row(code, c)),
    line('rep.totalExpenses', te, 'subtotal'),
    line('close.net', ti - te, 'total'),
  ]
}

function balance(to: string): ReportLine[] {
  const accts = ledger(to)
  const cents = (code: string) => toCents(accts.find((a) => a.code === code)!.balance)
  const of = (type: string) =>
    CHART.filter((a) => a.type === type).map((a) => [a.code, cents(a.code)] as const)
  const sumOf = (xs: readonly (readonly [string, number])[]) => xs.reduce((s, [, c]) => s + c, 0)
  const assets = of('asset')
  const liabilities = of('liability')
  const equity = of('equity')
  const profitToDate = sumOf(of('income')) - sumOf(of('expense'))
  const ta = sumOf(assets)
  const tl = sumOf(liabilities)
  const te = sumOf(equity) + profitToDate
  return [
    heading('ltype.asset'),
    ...assets.filter(([, c]) => c !== 0).map(([code, c]) => row(code, c)),
    line('rep.totalAssets', ta, 'subtotal'),
    heading('ltype.liability'),
    ...liabilities.filter(([, c]) => c !== 0).map(([code, c]) => row(code, c)),
    line('rep.totalLiabilities', tl, 'subtotal'),
    heading('ltype.equity'),
    ...equity.filter(([, c]) => c !== 0).map(([code, c]) => row(code, c)),
    line('rep.profitToDate', profitToDate, 'row'),
    line('rep.totalEquity', te, 'subtotal'),
    line('rep.totalLE', tl + te, 'total'),
  ]
}

/** Who owes what, by days past due — as of today. */
function aging(): ReportLine[] {
  const open = invoices.filter((x) => x.status !== 'draft' && x.status !== 'void' && toCents(x.due) > 0)
  const days = (d: string) =>
    Math.round(
      (new Date(`${todayISO}T00:00:00`).getTime() - new Date(`${d}T00:00:00`).getTime()) / 86_400_000,
    )
  const bucket = (late: number) => (late <= 0 ? 0 : late <= 30 ? 1 : late <= 60 ? 2 : late <= 90 ? 3 : 4)
  const byCustomer = new Map<string, number[]>()
  for (const inv of open) {
    const b = byCustomer.get(inv.customerName) ?? [0, 0, 0, 0, 0]
    b[bucket(days(inv.dueDate))] += toCents(inv.due)
    byCustomer.set(inv.customerName, b)
  }
  const rows = [...byCustomer.entries()]
    .map(([name, b]) => ({ name, b, total: b.reduce((s, c) => s + c, 0) }))
    .sort((a, b) => b.total - a.total)
  const totals = [0, 1, 2, 3, 4].map((i) => rows.reduce((s, r) => s + r.b[i], 0))
  return [
    ...rows.map((r) => ({
      label: r.name,
      labelIsKey: false,
      amount: toMoney(r.total),
      buckets: r.b.map(toMoney),
      kind: 'row' as const,
    })),
    {
      label: 'dash.total',
      labelIsKey: true,
      amount: toMoney(totals.reduce((s, c) => s + c, 0)),
      buckets: totals.map(toMoney),
      kind: 'total',
    },
  ]
}

function sales(from: string, to: string): ReportLine[] {
  const byCustomer = new Map<string, number>()
  for (const inv of invoices)
    if (inv.status !== 'draft' && inv.status !== 'void' && inv.issueDate >= from && inv.issueDate <= to)
      byCustomer.set(inv.customerName, (byCustomer.get(inv.customerName) ?? 0) + toCents(inv.total))
  const rows = [...byCustomer.entries()].sort((a, b) => b[1] - a[1])
  return [
    ...rows.map(([name, c]) => ({
      label: name,
      labelIsKey: false,
      amount: toMoney(c),
      kind: 'row' as const,
    })),
    line(
      'dash.total',
      rows.reduce((s, [, c]) => s + c, 0),
      'total',
    ),
  ]
}

export function report(kind: ReportKind, from: string | null, to: string | null): Report {
  const end = to || todayISO
  const start = from || `${end.slice(0, 7)}-01`
  if (!ISO.test(end) || !ISO.test(start)) throw new ValidationError('dateRequired')
  if (start > end) throw new ValidationError('dateOrder')
  switch (kind) {
    case 'profit':
      return { kind, from: start, to: end, lines: profit(start, end) }
    case 'balance':
      return { kind, from: null, to: end, lines: balance(end) }
    case 'aging':
      return { kind, from: null, to: todayISO, lines: aging() }
    case 'sales':
      return { kind, from: start, to: end, lines: sales(start, end) }
    default:
      throw new ValidationError('notFound')
  }
}
