/**
 * Batch 4 demo data & rules: bank & wallet transactions, transfers, statement reconciliation.
 * Rules enforced here (as the real API must):
 *  - an account can't be overdrawn by a transfer;
 *  - nothing is matched silently: a person confirms every statement line;
 *  - every fix creates a real record (payment, fee, unapplied receipt) — never a plain adjustment;
 *  - nothing dated inside a locked month can be added.
 */
import type {
  AccountId,
  BankTxn,
  Invoice,
  Payment,
  Reconciliation,
  ResolveAction,
  StatementLine,
  TransferInput,
} from '@/types/domain'
import {
  accounts,
  assertOpen,
  cashMoves,
  invoices,
  recordPayment,
  toCents,
  toMoney,
  ValidationError,
} from './db'
import './purchases' // earlier bill payments must be in the books before statements are built

const pad = (n: number) => String(n).padStart(2, '0')
const now = new Date()
const day = (offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ── transactions (the books' view of each account) ─────
interface RawTxn extends Omit<BankTxn, 'amount' | 'balanceAfter'> {
  cents: number
}

function rawTxns(): RawTxn[] {
  const receipts: RawTxn[] = invoices.flatMap((inv) =>
    inv.payments
      .filter((p) => p.accountId)
      .map((p) => ({
        id: p.id,
        accountId: p.accountId as AccountId,
        date: p.date,
        kind: 'receipt' as const,
        party: inv.customerName,
        reference: p.reference,
        cents: toCents(p.amount),
        matched: p.matched,
        link: { kind: 'invoice' as const, id: inv.id },
      })),
  )
  const moves: RawTxn[] = cashMoves.map((m) => ({
    id: m.id,
    accountId: m.accountId,
    date: m.date,
    kind: m.kind,
    party: m.party,
    reference: m.reference,
    cents: m.cents,
    matched: m.matched,
    link: m.link,
  }))
  return [...receipts, ...moves].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

/** Newest first, with the running balance after each movement (worked back from today's balance). */
export function transactions(accountId?: AccountId): BankTxn[] {
  const running: Record<string, number> = Object.fromEntries(accounts.map((a) => [a.id, toCents(a.balance)]))
  return rawTxns()
    .map((r) => {
      const after = running[r.accountId]
      running[r.accountId] -= r.cents
      const { cents, ...rest } = r
      return { ...rest, amount: toMoney(cents), balanceAfter: toMoney(after) }
    })
    .filter((r) => !accountId || r.accountId === accountId)
}

/** What each account held before the first recorded movement (used for the opening journal entry). */
export function openingCents(accountId: AccountId) {
  const acct = accounts.find((a) => a.id === accountId)!
  return toCents(acct.balance) - rawTxns().reduce((s, r) => s + (r.accountId === accountId ? r.cents : 0), 0)
}

export function transfer(input: TransferInput): BankTxn[] {
  const from = accounts.find((a) => a.id === input.fromId)
  const to = accounts.find((a) => a.id === input.toId)
  if (!from || !to) throw new ValidationError('accountRequired')
  if (from.id === to.id) throw new ValidationError('sameAccount')
  assertOpen(input.date)
  const cents = toCents(input.amount)
  if (!(cents > 0)) throw new ValidationError('amountPositive')
  if (!input.reference.trim()) throw new ValidationError('referenceRequired')
  if (cents > toCents(from.balance)) throw new ValidationError('insufficientFunds')
  const group = `tr-${Date.now()}`
  const base = { date: input.date, reference: input.reference.trim(), link: null, matched: false, group }
  cashMoves.push(
    { ...base, id: `${group}-out`, accountId: from.id, kind: 'transferOut', party: to.id, cents: -cents },
    { ...base, id: `${group}-in`, accountId: to.id, kind: 'transferIn', party: from.id, cents },
  )
  from.balance = toMoney(toCents(from.balance) - cents)
  to.balance = toMoney(toCents(to.balance) + cents)
  syncCounts()
  return transactions()
}

// Earlier sweeps from the wallets to the bank (already on past statements).
for (const [from, offset, cents, ref] of [
  ['mobile-1', -45, 6_000_00, 'SW-0912'],
  ['mobile-2', -30, 5_000_00, 'SW-0927'],
  ['mobile-1', -21, 4_000_00, 'SW-1006'],
] as const) {
  const group = `sweep-${ref}`
  const base = { date: day(offset), reference: ref, link: null, matched: true, group }
  cashMoves.push(
    { ...base, id: `${group}-out`, accountId: from, kind: 'transferOut', party: 'bank-main', cents: -cents },
    { ...base, id: `${group}-in`, accountId: 'bank-main', kind: 'transferIn', party: from, cents },
  )
}

// ── statements & reconciliation ─────────────────────────
interface Statement {
  accountId: AccountId
  date: string
  balanceCents: number
  lines: StatementLine[]
  matchedBefore: number
}

const findPayment = (id: string): { inv: Invoice; p: Payment } | null => {
  for (const inv of invoices) {
    const p = inv.payments.find((x) => x.id === id)
    if (p) return { inv, p }
  }
  return null
}

let seq = 0
const line = (
  l: Omit<StatementLine, 'id' | 'resolution' | 'why' | 'bookTxnId' | 'invoiceId'> & Partial<StatementLine>,
) =>
  ({
    id: `sl-${++seq}`,
    why: null,
    bookTxnId: null,
    invoiceId: null,
    resolution: null,
    ...l,
  }) as StatementLine

function buildStatements(): Statement[] {
  const used = new Set<string>()
  /** The newest receipt into this account; becomes the one the books haven't matched yet. */
  const receiptFor = (accountId: AccountId) => {
    const r = invoices
      .flatMap((inv) => inv.payments.filter((p) => p.accountId === accountId).map((p) => ({ inv, p })))
      .filter(({ p }) => !used.has(p.id))
      .sort((a, b) => b.p.date.localeCompare(a.p.date))[0]
    if (r) used.add(r.p.id)
    return r
  }
  const suggested = (accountId: AccountId, why: 'exact' | 'amountCustomer', text: (c: string) => string) => {
    const r = receiptFor(accountId)
    if (!r) return []
    return [
      line({
        accountId,
        date: r.p.date,
        text: text(r.inv.customerName),
        reference: why === 'exact' ? r.p.reference : '',
        amount: r.p.amount,
        state: 'suggested',
        why,
        bookTxnId: r.p.id,
      }),
    ]
  }
  const open = invoices
    .filter((x) => (x.status === 'sent' || x.status === 'overdue') && toCents(x.paid) === 0)
    .sort((a, b) => toCents(a.due) - toCents(b.due))[0]

  const list: Statement[] = [
    {
      accountId: 'bank-main',
      date: day(0),
      balanceCents: 0,
      matchedBefore: 0,
      lines: [
        ...suggested('bank-main', 'exact', (c) => `Incoming transfer · ${c}`),
        line({
          accountId: 'bank-main',
          date: day(-1),
          text: 'Monthly account charge',
          reference: 'CHG-1126',
          amount: '-12.50',
          state: 'fee',
        }),
      ],
    },
    {
      accountId: 'mobile-1',
      date: day(0),
      balanceCents: 0,
      matchedBefore: 0,
      lines: [
        ...suggested('mobile-1', 'exact', (c) => `Received from ${c}`),
        ...(open
          ? [
              line({
                accountId: 'mobile-1',
                date: day(-2),
                text: `Received from ${open.customerName}`,
                reference: 'MP-7720-1934',
                amount: open.due,
                state: 'missing',
                invoiceId: open.id,
              }),
            ]
          : []),
        line({
          accountId: 'mobile-1',
          date: day(-2),
          text: 'Wallet service fee',
          reference: 'FEE-2211',
          amount: '-15.00',
          state: 'fee',
        }),
      ],
    },
    {
      accountId: 'mobile-2',
      date: day(0),
      balanceCents: 0,
      matchedBefore: 0,
      lines: [
        ...suggested('mobile-2', 'amountCustomer', (c) => `Received · ${c.split(' ')[0].toUpperCase()}`),
        line({
          accountId: 'mobile-2',
          date: day(-3),
          text: 'Received · no name',
          reference: 'MP-4410-0072',
          amount: '500.00',
          state: 'unknown',
        }),
      ],
    },
  ]
  // Everything else in the books was matched on earlier statements.
  for (const inv of invoices) for (const p of inv.payments) if (!used.has(p.id)) p.matched = true
  for (const p of invoices.flatMap((i) => i.payments)) if (used.has(p.id)) p.matched = false
  for (const s of list) {
    const a = accounts.find((x) => x.id === s.accountId)!
    const notInBooks = s.lines
      .filter((l) => l.state === 'missing' || l.state === 'fee' || l.state === 'unknown')
      .reduce((sum, l) => sum + toCents(l.amount), 0)
    s.balanceCents = toCents(a.balance) + notInBooks
    s.matchedBefore = rawTxns().filter((r) => r.accountId === s.accountId && r.matched).length
  }
  return list
}

export const statements: Statement[] = buildStatements()

const statementOf = (accountId: string) => {
  const s = statements.find((x) => x.accountId === accountId)
  if (!s) throw new ValidationError('notFound')
  return s
}

/** In the books but not on the statement yet (recent entries) — they explain part of the difference. */
const bookOnly = (s: Statement) => {
  const onStatement = new Set(s.lines.map((l) => l.bookTxnId).filter(Boolean))
  return transactions(s.accountId).filter((t) => !t.matched && !onStatement.has(t.id) && t.date <= s.date)
}

/** "Items to match" per account: unresolved statement lines + book entries not on the statement. */
export function syncCounts() {
  for (const s of statements) {
    const a = accounts.find((x) => x.id === s.accountId)!
    a.unmatched = s.lines.filter((l) => l.state !== 'matched').length + bookOnly(s).length
  }
}

export function reconciliation(accountId: string): Reconciliation & { bookOnly: BankTxn[] } {
  const s = statementOf(accountId)
  const a = accounts.find((x) => x.id === accountId)!
  const pending = bookOnly(s)
  // Unexplained difference = statement + entries not on it yet − books. Must reach 0.00.
  const diff = s.balanceCents + pending.reduce((sum, t) => sum + toCents(t.amount), 0) - toCents(a.balance)
  return {
    accountId: s.accountId,
    statementDate: s.date,
    statementBalance: toMoney(s.balanceCents),
    bookBalance: a.balance,
    difference: toMoney(diff),
    lines: s.lines,
    matchedBefore: s.matchedBefore,
    bookOnly: pending,
  }
}

const ALLOWED: Record<ResolveAction, StatementLine['state'][]> = {
  match: ['suggested'],
  record: ['missing'],
  fee: ['fee'],
  hold: ['unknown'],
}

/** A person resolves one statement line; each action leaves a proper record behind. */
export function resolveLine(accountId: string, lineId: string, action: ResolveAction) {
  const s = statementOf(accountId)
  const l = s.lines.find((x) => x.id === lineId)
  if (!l) throw new ValidationError('notFound')
  if (!ALLOWED[action]?.includes(l.state)) throw new ValidationError('wrongAction')
  assertOpen(l.date)
  const a = accounts.find((x) => x.id === accountId)!

  if (action === 'match') {
    const found = l.bookTxnId ? findPayment(l.bookTxnId) : null
    if (found) found.p.matched = true
    const move = cashMoves.find((m) => m.id === l.bookTxnId)
    if (move) move.matched = true
    l.resolution = 'matched'
  } else if (action === 'record') {
    const inv = invoices.find((x) => x.id === l.invoiceId)
    if (!inv || toCents(inv.due) < toCents(l.amount)) throw new ValidationError('alreadyPaid')
    recordPayment(inv.id, {
      amount: l.amount,
      date: l.date,
      method: a.kind,
      accountId,
      reference: l.reference,
    })
    inv.payments[0].matched = true
    l.bookTxnId = inv.payments[0].id
    l.resolution = 'recorded'
  } else {
    const cents = toCents(l.amount)
    cashMoves.push({
      id: `${action}-${l.id}`,
      accountId: a.id,
      date: l.date,
      kind: action === 'fee' ? 'fee' : 'unapplied',
      party: l.text,
      reference: l.reference,
      cents,
      link: null,
      matched: true,
    })
    a.balance = toMoney(toCents(a.balance) + cents)
    l.bookTxnId = `${action}-${l.id}`
    l.resolution = action === 'fee' ? 'fee' : 'held'
  }
  l.state = 'matched'
  syncCounts()
  return reconciliation(accountId)
}

syncCounts()
