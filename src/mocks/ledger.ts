/**
 * Batch 4: the books. Every journal entry is built from the real documents (invoices, payments,
 * bills, transfers, fees) plus manual entries, so debits always equal credits — the trial balance
 * is a real check, not a decoration. Also the month-end close and the period lock.
 *
 * Stock uses the periodic method (common for small wholesalers): goods bought go to Purchases;
 * the stock value is corrected by the month-end count.
 */
import type {
  AccountId,
  CloseCheck,
  JournalEntry,
  JournalInput,
  JournalLine,
  JournalSource,
  LedgerAccount,
  LedgerType,
  MonthClose,
  PeriodEvent,
  Role,
} from '@/types/domain'
import { openingCents, statements } from './banking'
import { accounts, assertOpen, cashMoves, invoices, period, toCents, toMoney, ValidationError } from './db'
import { bills } from './purchases'

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const now = new Date()
const day = (offset: number) => iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset))

// ── chart of accounts ──────────────────────────────────
export const CHART: { code: string; type: LedgerType; system: boolean }[] = [
  { code: '1000', type: 'asset', system: true }, // Bank · Main
  { code: '1010', type: 'asset', system: true }, // Mobile money 1
  { code: '1020', type: 'asset', system: true }, // Mobile money 2
  { code: '1100', type: 'asset', system: true }, // Accounts receivable
  { code: '1200', type: 'asset', system: false }, // Stock (inventory)
  { code: '2000', type: 'liability', system: true }, // Accounts payable
  { code: '2100', type: 'liability', system: false }, // Unapplied receipts
  { code: '2200', type: 'liability', system: false }, // Customer credits
  { code: '3000', type: 'equity', system: false }, // Owner's capital
  { code: '3100', type: 'equity', system: false }, // Owner's drawings
  { code: '4000', type: 'income', system: false }, // Sales
  { code: '4100', type: 'income', system: false }, // Other income
  { code: '5000', type: 'expense', system: false }, // Purchases (goods)
  { code: '5100', type: 'expense', system: false }, // Rent
  { code: '5200', type: 'expense', system: false }, // Electricity & utilities
  { code: '5300', type: 'expense', system: false }, // Delivery & transport
  { code: '5400', type: 'expense', system: false }, // Bank & wallet fees
  { code: '5500', type: 'expense', system: false }, // Packing materials
  { code: '5600', type: 'expense', system: false }, // Stock adjustments
]
const CASH: Record<AccountId, string> = { 'bank-main': '1000', 'mobile-1': '1010', 'mobile-2': '1020' }
const VENDOR_EXPENSE: Record<string, string> = { v2: '5500', v3: '5200', v4: '5100', v5: '5300' }
const OPENING_STOCK_CENTS = 38_640_00

// ── journal ────────────────────────────────────────────
const manual: JournalEntry[] = []

/** cents > 0 = debit, < 0 = credit */
const ln = (accountCode: string, cents: number): JournalLine => ({
  accountCode,
  debit: toMoney(Math.max(cents, 0)),
  credit: toMoney(Math.max(-cents, 0)),
})
function entry(
  id: string,
  date: string,
  source: JournalSource,
  reference: string,
  party: string,
  lines: JournalLine[],
  by: Role = 'accountant',
  memo = '',
): JournalEntry {
  const live = lines.filter((l) => toCents(l.debit) || toCents(l.credit))
  return {
    id,
    date,
    source,
    reference,
    party,
    memo,
    lines: live,
    total: toMoney(live.reduce((s, l) => s + toCents(l.debit), 0)),
    by,
  }
}

export function journal(): JournalEntry[] {
  const list: JournalEntry[] = []
  const first = [...invoices.map((i) => i.issueDate), ...bills.map((b) => b.billDate)].sort()[0] ?? day(-90)
  const openDate = iso(new Date(Number(first.slice(0, 4)), Number(first.slice(5, 7)) - 1, 1))
  const cash = accounts.map((a) => ln(CASH[a.id], openingCents(a.id)))
  const openTotal = accounts.reduce((s, a) => s + openingCents(a.id), 0) + OPENING_STOCK_CENTS
  list.push(
    entry('je-opening', openDate, 'opening', '', '', [
      ...cash,
      ln('1200', OPENING_STOCK_CENTS),
      ln('3000', -openTotal),
    ]),
  )

  for (const inv of invoices) {
    if (inv.status === 'draft' || inv.status === 'void') continue
    const t = toCents(inv.total)
    list.push(
      entry(`je-${inv.id}`, inv.issueDate, 'invoice', inv.number, inv.customerName, [
        ln('1100', t),
        ln('4000', -t),
      ]),
    )
    for (const p of inv.payments) {
      const c = toCents(p.amount)
      list.push(
        entry(
          `je-${p.id}`,
          p.date,
          'payment',
          inv.number,
          inv.customerName,
          [ln(p.accountId ? CASH[p.accountId as AccountId] : '2200', c), ln('1100', -c)],
          p.recordedBy,
        ),
      )
    }
  }

  for (const b of bills) {
    const lines = b.lines.map((l) =>
      ln(l.itemId ? '5000' : (VENDOR_EXPENSE[b.vendorId] ?? '5000'), toCents(l.amount)),
    )
    list.push(
      entry(`je-${b.id}`, b.billDate, 'bill', b.id, b.vendorName, [...lines, ln('2000', -toCents(b.total))]),
    )
  }

  for (const m of cashMoves) {
    const code = CASH[m.accountId]
    if (m.kind === 'billPayment')
      list.push(
        entry(`je-${m.id}`, m.date, 'billPayment', m.reference, m.party, [
          ln('2000', -m.cents),
          ln(code, m.cents),
        ]),
      )
    else if (m.kind === 'fee')
      list.push(
        entry(`je-${m.id}`, m.date, 'fee', m.reference, m.party, [ln('5400', -m.cents), ln(code, m.cents)]),
      )
    else if (m.kind === 'unapplied')
      list.push(
        entry(`je-${m.id}`, m.date, 'unapplied', m.reference, m.party, [
          ln(code, m.cents),
          ln('2100', -m.cents),
        ]),
      )
    else if (m.kind === 'transferOut') {
      const other = cashMoves.find((x) => x.group === m.group && x.kind === 'transferIn')!
      list.push(
        entry(`je-${m.group}`, m.date, 'transfer', m.reference, '', [
          ln(CASH[other.accountId], other.cents),
          ln(code, m.cents),
        ]),
      )
    }
  }

  list.push(...manual)
  return list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

/** Balances per account, from the journal. `upTo` limits to entries dated on or before it. */
export function ledger(upTo?: string): LedgerAccount[] {
  const totals: Record<string, { d: number; c: number }> = {}
  for (const e of journal())
    if (!upTo || e.date <= upTo)
      for (const l of e.lines) {
        const t = (totals[l.accountCode] ??= { d: 0, c: 0 })
        t.d += toCents(l.debit)
        t.c += toCents(l.credit)
      }
  return CHART.map(({ code, type, system }) => {
    const { d, c } = totals[code] ?? { d: 0, c: 0 }
    const natural = type === 'asset' || type === 'expense' ? d - c : c - d
    return { code, type, system, balance: toMoney(natural), debit: toMoney(d), credit: toMoney(c) }
  })
}

const canPost = (by: Role) => by === 'owner' || by === 'accountant'

export function createJournal(input: JournalInput, by: Role = 'owner'): JournalEntry {
  if (!canPost(by)) throw new ValidationError('notAllowed')
  if (!input.date) throw new ValidationError('dateRequired')
  assertOpen(input.date)
  if (!input.memo.trim()) throw new ValidationError('memoRequired')
  if (input.lines.length < 2) throw new ValidationError('twoLines')
  let d = 0
  let c = 0
  for (const l of input.lines) {
    const acct = CHART.find((x) => x.code === l.accountCode)
    if (!acct) throw new ValidationError('accountRequired')
    if (acct.system) throw new ValidationError('systemAccount')
    const dc = toCents(l.debit || '0')
    const cc = toCents(l.credit || '0')
    if (dc < 0 || cc < 0 || dc > 0 === cc > 0) throw new ValidationError('oneSide')
    d += dc
    c += cc
  }
  if (d !== c) throw new ValidationError('unbalanced')
  const ref = `JV-${String(manual.length + 1).padStart(4, '0')}`
  const e = entry(
    `je-${ref}`,
    input.date,
    'manual',
    ref,
    '',
    input.lines.map((l) => ({
      accountCode: l.accountCode,
      debit: toMoney(toCents(l.debit || '0')),
      credit: toMoney(toCents(l.credit || '0')),
    })),
    by,
    input.memo.trim(),
  )
  manual.push(e)
  return e
}

// ── month-end close ────────────────────────────────────
const monthEnd = (y: number, m: number) => iso(new Date(y, m + 1, 0)) // m is 0-based
const lastMonth = () => {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, end: monthEnd(d.getFullYear(), d.getMonth()) }
}
const before = new Date(now.getFullYear(), now.getMonth() - 2, 1)
const earlierEnd = monthEnd(before.getFullYear(), before.getMonth())

// The month before last was closed on the 4th of the following month.
period.lockedThrough = earlierEnd
const close = {
  stockCounted: false,
  history: [
    {
      at: `${iso(new Date(before.getFullYear(), before.getMonth() + 1, 4))}T09:12:00`,
      action: 'lock',
      month: earlierEnd.slice(0, 7),
      by: 'owner',
      reason: 'All accounts reconciled and checked',
    },
  ] as PeriodEvent[],
}

export function monthClose(): MonthClose {
  const { key, end } = lastMonth()
  const unresolved = (id: AccountId) =>
    statements.find((s) => s.accountId === id)!.lines.filter((l) => l.state !== 'matched').length
  const drafts = invoices.filter((x) => x.status === 'draft' && x.issueDate <= end).length
  const approvals = bills.filter((b) => b.status === 'approval' && b.billDate <= end).length
  const counts: [CloseCheck['id'], number][] = [
    ...accounts.map((a): [CloseCheck['id'], number] => [`reconcile-${a.id}`, unresolved(a.id)]),
    ['drafts', drafts],
    ['approvals', approvals],
    ['stockCount', close.stockCounted ? 0 : 1],
  ]
  const checks: CloseCheck[] = counts.map(([id, count]) => ({ id, count, done: count === 0 }))

  let income = 0
  let expenses = 0
  let debits = 0
  let credits = 0
  const types = Object.fromEntries(CHART.map((a) => [a.code, a.type]))
  for (const e of journal()) {
    if (e.date > end) continue
    for (const l of e.lines) {
      debits += toCents(l.debit)
      credits += toCents(l.credit)
      if (!e.date.startsWith(key)) continue
      if (types[l.accountCode] === 'income') income += toCents(l.credit) - toCents(l.debit)
      if (types[l.accountCode] === 'expense') expenses += toCents(l.debit) - toCents(l.credit)
    }
  }
  const locked = !!period.lockedThrough && period.lockedThrough >= end
  return {
    month: key,
    checks,
    income: toMoney(income),
    expenses: toMoney(expenses),
    debits: toMoney(debits),
    credits: toMoney(credits),
    lockedThrough: period.lockedThrough,
    locked,
    reminder: !locked && now.getDate() >= 3,
    history: [...close.history].reverse(),
  }
}

export function recordStockCount(by: Role = 'owner') {
  if (!canPost(by)) throw new ValidationError('notAllowed')
  close.stockCounted = true
  return monthClose()
}

/** Owner only, with a written reason (business rule 4). Every check must be done first. */
export function lockMonth(reason: string, by: Role = 'owner'): MonthClose {
  if (by !== 'owner') throw new ValidationError('ownerOnly')
  if (reason.trim().length < 5) throw new ValidationError('reasonRequired')
  const state = monthClose()
  if (state.locked) throw new ValidationError('alreadyLocked')
  if (state.checks.some((c) => !c.done)) throw new ValidationError('checksOpen')
  const { key, end } = lastMonth()
  period.lockedThrough = end
  close.history.push({ at: new Date().toISOString(), action: 'lock', month: key, by, reason: reason.trim() })
  return monthClose()
}

export function reopenMonth(reason: string, by: Role = 'owner'): MonthClose {
  if (by !== 'owner') throw new ValidationError('ownerOnly')
  if (reason.trim().length < 5) throw new ValidationError('reasonRequired')
  const { key, end } = lastMonth()
  if (!period.lockedThrough || period.lockedThrough < end) throw new ValidationError('notLocked')
  period.lockedThrough = earlierEnd
  close.history.push({
    at: new Date().toISOString(),
    action: 'reopen',
    month: key,
    by,
    reason: reason.trim(),
  })
  return monthClose()
}
