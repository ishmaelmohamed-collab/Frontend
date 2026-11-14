/**
 * In-memory demo data (every company and number is invented). Seeded, so it is the same
 * on every reload; dates are relative to today so "this month" is always filled.
 * All arithmetic is in integer cents, then stored as decimal strings — the API contract.
 */
import type {
  ActivityEntry,
  Customer,
  DashboardSummary,
  Invoice,
  InvoiceLine,
  InvoiceStatus,
  MoneyAccount,
  Payment,
  PaymentMethod,
  RecordPaymentInput,
} from '@/types/domain'

// ── helpers ─────────────────────────────────────────────
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = seeded(3107)
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
export const toMoney = (cents: number) => (cents / 100).toFixed(2)
export const toCents = (m: string) => Math.round(Number(m) * 100)
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
const daysBetween = (a: string, b: Date) =>
  Math.round((b.getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000)

// ── reference data ──────────────────────────────────────
const CUSTOMERS = [
  ['c1', 'Al-Noor Trading', 10_000_00],
  ['c2', 'Crescent Foods Ltd.', 15_000_00],
  ['c3', 'Horizon Mini Market', 6_000_00],
  ['c4', 'Green Valley Grocers', 8_000_00],
  ['c5', 'Sahel Wholesale', 12_000_00],
  ['c6', 'Riverside Retail', 5_000_00],
  ['c7', 'Blue Coast Supplies', 9_000_00],
  ['c8', 'Delta Corner Shop', 3_000_00],
] as const

export const ITEMS = [
  ['i1', 'Rice · 25 kg bag', 6200],
  ['i2', 'Cooking oil · 20 L', 8450],
  ['i3', 'Sugar · 50 kg bag', 7900],
  ['i4', 'Wheat flour · 50 kg', 5500],
  ['i5', 'Pasta · carton of 20', 1850],
  ['i6', 'Tea · carton of 24', 4600],
  ['i7', 'Tomato paste · carton', 2775],
  ['i8', 'Powdered milk · 25 kg', 11200],
] as const

export const accounts: MoneyAccount[] = [
  { id: 'bank-main', kind: 'bank', balance: '52410.75', unmatched: 2 },
  { id: 'mobile-1', kind: 'mobile', balance: '15920.30', unmatched: 3 },
  { id: 'mobile-2', kind: 'mobile', balance: '7444.85', unmatched: 2 },
]

// ── invoices ────────────────────────────────────────────
const at = (d: string, hh: number, mm: number) => `${d}T${pad(hh)}:${pad(mm)}:00`

function statusOf(inv: Pick<Invoice, 'due' | 'paid' | 'dueDate' | 'status'>): InvoiceStatus {
  if (inv.status === 'draft' || inv.status === 'void') return inv.status
  if (toCents(inv.due) === 0) return 'paid'
  if (daysBetween(inv.dueDate, today) > 0) return 'overdue'
  return toCents(inv.paid) > 0 ? 'partial' : 'sent'
}

function build(): Invoice[] {
  const list: Invoice[] = []
  for (let i = 0; i < 52; i++) {
    const age = Math.floor(rand() * 80)
    const issue = addDays(today, -age)
    const [customerId, customerName] = pick(CUSTOMERS)
    const lines: InvoiceLine[] = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => {
      const [itemId, description, price] = pick(ITEMS)
      const quantity = pick([2, 5, 5, 10, 10, 15, 20, 30])
      return { itemId, description, quantity, unitPrice: toMoney(price), amount: toMoney(price * quantity) }
    })
    const total = lines.reduce((s, l) => s + toCents(l.amount), 0)
    const draft = age < 2 && rand() < 0.5
    const r = rand()
    let paid = 0
    if (!draft) {
      if (age > 30 && r < 0.82) paid = total
      else if (age > 12 && r < 0.5) paid = total
      else if (r < 0.7) paid = Math.round(total * (0.3 + rand() * 0.4))
    }
    const payments: Payment[] = []
    if (paid > 0) {
      const method: PaymentMethod = rand() < 0.55 ? 'mobile' : 'bank'
      const payDay = iso(addDays(issue, Math.min(age, 2 + Math.floor(rand() * 12))))
      payments.push({
        id: `p${i}`,
        date: payDay,
        method,
        accountId: method === 'bank' ? 'bank-main' : rand() < 0.6 ? 'mobile-1' : 'mobile-2',
        reference:
          method === 'bank'
            ? `BT-${100000 + Math.floor(rand() * 899999)}`
            : `MP-${1000 + Math.floor(rand() * 8999)}-${1000 + Math.floor(rand() * 8999)}`,
        amount: toMoney(paid),
        recordedBy: pick(['cashier', 'accountant'] as const),
        matched: age > 10,
      })
    }
    const issueISO = iso(issue)
    const activity: ActivityEntry[] = [{ at: at(issueISO, 10, 42), kind: 'created', by: 'owner' }]
    if (!draft) {
      activity.push({ at: at(issueISO, 10, 43), kind: 'sent', by: 'owner' })
      activity.push({ at: at(issueISO, 11, 5), kind: 'viewed', by: 'customer' })
    }
    payments.forEach((p) =>
      activity.push({ at: at(p.date, 15, 20), kind: 'payment', by: p.recordedBy, amount: p.amount }),
    )

    const inv: Invoice = {
      id: '',
      number: '',
      customerId,
      customerName,
      issueDate: issueISO,
      dueDate: iso(addDays(issue, 14)),
      lines,
      total: toMoney(total),
      paid: toMoney(paid),
      due: toMoney(total - paid),
      status: draft ? 'draft' : 'sent',
      payments,
      activity: activity.reverse(),
    }
    inv.status = statusOf(inv)
    list.push(inv)
  }
  list.sort((a, b) => a.issueDate.localeCompare(b.issueDate))
  list.forEach((inv, i) => {
    inv.number = `INV-${3057 + i}`
    inv.id = inv.number
  })
  return list.reverse()
}

export const invoices: Invoice[] = build()

export function customers(): Customer[] {
  return CUSTOMERS.map(([id, name, limit], i) => {
    const own = invoices.filter((x) => x.customerId === id && x.status !== 'draft' && x.status !== 'void')
    return {
      id,
      name,
      phone: `+252 61 500 ${pad(10 + i)}${pad(i * 7)}`,
      email: `accounts@${name.toLowerCase().replace(/[^a-z]+/g, '')}.example`,
      creditLimit: toMoney(limit),
      balance: toMoney(own.reduce((s, x) => s + toCents(x.due), 0)),
      overdue: toMoney(own.filter((x) => x.status === 'overdue').reduce((s, x) => s + toCents(x.due), 0)),
    }
  })
}

// ── dashboard ───────────────────────────────────────────
export function dashboard(): DashboardSummary {
  const live = invoices.filter((x) => x.status !== 'draft' && x.status !== 'void')
  const monthStart = iso(new Date(today.getFullYear(), today.getMonth(), 1))
  const lastStart = iso(new Date(today.getFullYear(), today.getMonth() - 1, 1))
  const sameDayLast = iso(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()))
  const sum = (xs: Invoice[], f: 'total' | 'due') => xs.reduce((s, x) => s + toCents(x[f]), 0)
  const open = live.filter((x) => toCents(x.due) > 0)
  const overdue = live.filter((x) => x.status === 'overdue')

  const exp = seeded(77)
  const incomeVsExpenses = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 5 + k, 1)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    // Older months extend before the generated invoices; give them a believable base.
    const fromInvoices = sum(
      live.filter((x) => x.issueDate.startsWith(key)),
      'total',
    )
    const income = fromInvoices > 0 ? fromInvoices : 3_400_000 + Math.round(exp() * 1_200_000)
    return {
      month: key,
      income: toMoney(income),
      expenses: toMoney(Math.round(income * (0.58 + exp() * 0.17))),
    }
  })

  const bucketOf = (x: Invoice) => {
    const late = daysBetween(x.dueDate, today)
    return late <= 0 ? 'current' : late <= 30 ? 'd30' : late <= 60 ? 'd60' : late <= 90 ? 'd90' : 'd90plus'
  }
  const aging = (['current', 'd30', 'd60', 'd90', 'd90plus'] as const).map((bucket) => ({
    bucket,
    amount: toMoney(
      sum(
        open.filter((x) => bucketOf(x) === bucket),
        'due',
      ),
    ),
  }))

  return {
    revenueThisMonth: toMoney(
      sum(
        live.filter((x) => x.issueDate >= monthStart),
        'total',
      ),
    ),
    revenueSameDaysLastMonth: toMoney(
      sum(
        live.filter((x) => x.issueDate >= lastStart && x.issueDate <= sameDayLast),
        'total',
      ),
    ),
    receivables: toMoney(sum(open, 'due')),
    openInvoices: open.length,
    overdue: toMoney(sum(overdue, 'due')),
    overdueCount: overdue.length,
    cash: toMoney(accounts.reduce((s, a) => s + toCents(a.balance), 0)),
    incomeVsExpenses,
    aging,
    recentInvoices: invoices.slice(0, 6),
    accounts,
  }
}

// ── mutations ───────────────────────────────────────────
export class ValidationError extends Error {
  code: string
  constructor(code: string) {
    super(code)
    this.code = code
  }
}

/** Server-side rules for recording a payment (the UI checks the same, but the API is the authority). */
export function recordPayment(invoiceId: string, input: RecordPaymentInput): Invoice {
  const inv = invoices.find((x) => x.id === invoiceId)
  if (!inv) throw new ValidationError('notFound')
  if (inv.status === 'draft' || inv.status === 'void' || inv.status === 'paid')
    throw new ValidationError('notPayable')
  const cents = toCents(input.amount)
  if (!(cents > 0)) throw new ValidationError('amountPositive')
  if (input.method !== 'credit' && !input.reference.trim()) throw new ValidationError('referenceRequired')
  if (input.method !== 'credit' && !accounts.some((a) => a.id === input.accountId))
    throw new ValidationError('accountRequired')

  const applied = Math.min(cents, toCents(inv.due)) // any extra becomes customer credit (not modelled yet)
  const payment: Payment = {
    id: `p-${Date.now()}`,
    date: input.date,
    method: input.method,
    accountId: input.method === 'credit' ? null : input.accountId,
    reference: input.reference.trim(),
    amount: toMoney(applied),
    recordedBy: 'cashier',
    matched: false,
  }
  inv.payments = [payment, ...inv.payments]
  inv.paid = toMoney(toCents(inv.paid) + applied)
  inv.due = toMoney(toCents(inv.total) - toCents(inv.paid))
  inv.status = statusOf(inv)
  inv.activity = [
    { at: new Date().toISOString(), kind: 'payment', by: 'cashier', amount: payment.amount },
    ...inv.activity,
  ]
  const acct = accounts.find((a) => a.id === payment.accountId)
  if (acct) {
    acct.balance = toMoney(toCents(acct.balance) + applied)
    acct.unmatched += 1
  }
  return inv
}
