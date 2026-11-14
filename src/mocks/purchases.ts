/**
 * Batch 3 demo data & rules: vendors, purchase orders, bills, quotes, payments received.
 * Approved business rules enforced here (as the real API must):
 *  - bills over $10,000 need Owner approval before they can be paid;
 *  - an account can't be overdrawn by paying bills;
 *  - receiving goods adds to stock and updates the purchase order.
 */
import type {
  Bill,
  BillLine,
  BillStatus,
  CreateBillInput,
  Invoice,
  PayBillsInput,
  PurchaseOrder,
  Quote,
  ReceivedPayment,
  Vendor,
} from '@/types/domain'
import { addStock, createInvoice, items } from './catalog'
import { accounts, customers, invoices, toCents, toMoney, ValidationError } from './db'

export const APPROVAL_LIMIT_CENTS = 10_000_00

const pad = (n: number) => String(n).padStart(2, '0')
const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
const day = (offset: number) => {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const isPast = (iso: string) => iso < day(0)

const VENDORS = [
  ['v1', 'Gulf Grain Importers', '+252 61 700 1101'],
  ['v2', 'Packwell Supplies', '+252 61 700 1102'],
  ['v3', 'City Electric', '+252 61 700 1103'],
  ['v4', 'Harbour Properties', '+252 61 700 1104'],
  ['v5', 'Coastline Transport', '+252 61 700 1105'],
  ['v6', 'Sunrise Oils Trading', '+252 61 700 1106'],
] as const
const vendorName = (id: string) => VENDORS.find((v) => v[0] === id)?.[1] ?? ''

// ── purchase orders ─────────────────────────────────────
const itemName = (id: string) => items().find((i) => i.id === id)!.name
const poLine = (itemId: string, ordered: number, received: number, cost: number) => ({
  itemId,
  description: itemName(itemId),
  ordered,
  received,
  unitCost: toMoney(cost),
})
function po(
  id: string,
  vendorId: string,
  orderOffset: number,
  expectedOffset: number,
  lines: PurchaseOrder['lines'],
) {
  const o: PurchaseOrder = {
    id,
    vendorId,
    vendorName: vendorName(vendorId),
    orderDate: day(orderOffset),
    expectedDate: day(expectedOffset),
    lines,
    total: toMoney(lines.reduce((s, l) => s + toCents(l.unitCost) * l.ordered, 0)),
    status: 'open',
  }
  return refreshOrder(o)
}
function refreshOrder(o: PurchaseOrder) {
  const all = o.lines.every((l) => l.received >= l.ordered)
  const some = o.lines.some((l) => l.received > 0)
  o.status = all ? 'received' : some ? 'partial' : 'open'
  return o
}
export const orders: PurchaseOrder[] = [
  po('PO-0418', 'v1', -2, 5, [poLine('i4', 100, 0, 4100)]),
  po('PO-0415', 'v6', -6, 1, [poLine('i2', 60, 0, 6100)]),
  po('PO-0412', 'v1', -16, -12, [poLine('i1', 200, 200, 4800), poLine('i3', 80, 60, 6150)]),
  po('PO-0409', 'v1', -40, -34, [poLine('i1', 100, 100, 4800)]),
]

// ── bills ───────────────────────────────────────────────
function statusOf(b: Bill): BillStatus {
  if (toCents(b.due) === 0) return 'paid'
  if (b.needsApproval && !b.approved) return 'approval'
  if (isPast(b.dueDate)) return 'overdue'
  return toCents(b.paid) > 0 ? 'partial' : 'unpaid'
}
function bill(
  id: string,
  vendorId: string,
  vendorRef: string,
  billOffset: number,
  dueOffset: number,
  lines: Omit<BillLine, 'amount'>[],
  paidCents = 0,
  poId: string | null = null,
): Bill {
  const full = lines.map((l) => ({ ...l, amount: toMoney(toCents(l.unitCost) * l.quantity) }))
  const total = full.reduce((s, l) => s + toCents(l.amount), 0)
  const b: Bill = {
    id,
    vendorId,
    vendorName: vendorName(vendorId),
    vendorRef,
    billDate: day(billOffset),
    dueDate: day(dueOffset),
    poId,
    lines: full,
    total: toMoney(total),
    paid: toMoney(paidCents),
    due: toMoney(total - paidCents),
    needsApproval: total > APPROVAL_LIMIT_CENTS,
    approved: false,
    status: 'unpaid',
  }
  b.status = statusOf(b)
  return b
}
const exp = (description: string, cents: number) => ({
  itemId: null,
  description,
  quantity: 1,
  unitCost: toMoney(cents),
})
const goods = (itemId: string, quantity: number, cents: number) => ({
  itemId,
  description: itemName(itemId),
  quantity,
  unitCost: toMoney(cents),
})

export const bills: Bill[] = [
  bill('BILL-0231', 'v1', 'GGI-61840', -2, 28, [goods('i1', 200, 4800), goods('i3', 60, 6150)], 0, 'PO-0412'),
  bill('BILL-0230', 'v6', 'SO-2231', -35, -5, [goods('i2', 40, 6100)]),
  bill('BILL-0229', 'v2', 'PW-5531', -10, 4, [exp('Packing materials', 124000)]),
  bill('BILL-0228', 'v3', 'CE-11/26', -8, 6, [exp('Electricity — last month', 38640)]),
  bill('BILL-0227', 'v4', 'RENT-NOV', -14, 16, [exp('Warehouse rent', 250000)]),
  bill('BILL-0226', 'v5', 'CT-9047', -9, 21, [exp('Delivery charges', 91000)]),
  bill('BILL-0225', 'v2', 'PW-5488', -24, 6, [exp('Shrink wrap & cartons', 98000)], 50000),
  bill('BILL-0224', 'v1', 'GGI-61702', -40, -10, [goods('i1', 100, 4800)], 480000, 'PO-0409'),
  bill('BILL-0223', 'v3', 'CE-10/26', -38, -24, [exp('Electricity — previous month', 40125)], 40125),
]

export function vendors(): Vendor[] {
  return VENDORS.map(([id, name, phone]) => {
    const own = bills.filter((b) => b.vendorId === id && b.status !== 'paid')
    return {
      id,
      name,
      phone,
      owed: toMoney(own.reduce((s, b) => s + toCents(b.due), 0)),
      overdue: toMoney(own.filter((b) => b.status === 'overdue').reduce((s, b) => s + toCents(b.due), 0)),
      openBills: own.length,
    }
  })
}

export function approveBill(id: string): Bill {
  const b = bills.find((x) => x.id === id)
  if (!b) throw new ValidationError('notFound')
  b.approved = true
  b.status = statusOf(b)
  return b
}

export function createBill(input: CreateBillInput): Bill {
  if (!VENDORS.some((v) => v[0] === input.vendorId)) throw new ValidationError('vendorRequired')
  if (!input.vendorRef.trim()) throw new ValidationError('vendorRefRequired')
  if (!input.lines.length) throw new ValidationError('linesRequired')
  for (const l of input.lines) {
    if (!Number.isInteger(l.quantity) || l.quantity < 1) throw new ValidationError('quantityPositive')
    if (!(toCents(l.unitCost) > 0)) throw new ValidationError('costPositive')
    if (!l.itemId && !l.description.trim()) throw new ValidationError('descriptionRequired')
  }
  const last = bills.reduce((m, b) => Math.max(m, Number(b.id.replace(/\D/g, ''))), 0)
  const id = `BILL-${String(last + 1).padStart(4, '0')}`
  const lines = input.lines.map((l) => ({
    itemId: l.itemId,
    description: l.itemId ? itemName(l.itemId) : l.description.trim(),
    quantity: l.quantity,
    unitCost: toMoney(toCents(l.unitCost)),
  }))
  const b = bill(id, input.vendorId, input.vendorRef.trim(), 0, 0, lines, 0, input.poId)
  b.billDate = input.billDate
  b.dueDate = input.dueDate
  b.status = statusOf(b)
  if (input.receiveIntoStock) {
    const order = orders.find((o) => o.id === input.poId)
    for (const l of b.lines) {
      if (!l.itemId) continue
      addStock(l.itemId, l.quantity)
      const ol = order?.lines.find((x) => x.itemId === l.itemId)
      if (ol) ol.received = Math.min(ol.ordered, ol.received + l.quantity)
    }
    if (order) refreshOrder(order)
  }
  bills.unshift(b)
  return b
}

export function payBills(input: PayBillsInput): Bill[] {
  const acct = accounts.find((a) => a.id === input.accountId)
  if (!acct) throw new ValidationError('accountRequired')
  const chosen = input.billIds.map((id) => bills.find((b) => b.id === id))
  if (!chosen.length || chosen.some((b) => !b)) throw new ValidationError('billsRequired')
  if (chosen.some((b) => b!.status === 'approval')) throw new ValidationError('needsApproval')
  if (chosen.some((b) => b!.status === 'paid')) throw new ValidationError('alreadyPaid')
  const totalCents = chosen.reduce((s, b) => s + toCents(b!.due), 0)
  if (totalCents > toCents(acct.balance)) throw new ValidationError('insufficientFunds')
  acct.balance = toMoney(toCents(acct.balance) - totalCents)
  for (const b of chosen) {
    b!.paid = b!.total
    b!.due = '0.00'
    b!.status = 'paid'
  }
  return chosen as Bill[]
}

// ── quotes ──────────────────────────────────────────────
const qline = (itemId: string, quantity: number) => {
  const it = items().find((i) => i.id === itemId)!
  return {
    itemId,
    description: it.name,
    quantity,
    unitPrice: it.unitPrice,
    amount: toMoney(toCents(it.unitPrice) * quantity),
  }
}
function quote(
  id: string,
  customerId: string,
  offset: number,
  status: Quote['status'],
  lines: Quote['lines'],
): Quote {
  return {
    id,
    customerId,
    customerName: customers().find((c) => c.id === customerId)!.name,
    issueDate: day(offset),
    validUntil: day(offset + 14),
    lines,
    total: toMoney(lines.reduce((s, l) => s + toCents(l.amount), 0)),
    status,
    invoiceId: null,
  }
}
export const quotes: Quote[] = [
  quote('Q-1046', 'c5', -1, 'draft', [qline('i5', 40), qline('i7', 20)]),
  quote('Q-1045', 'c2', -3, 'sent', [qline('i1', 50), qline('i4', 30)]),
  quote('Q-1044', 'c6', -5, 'accepted', [qline('i6', 10), qline('i2', 5)]),
  quote('Q-1043', 'c8', -9, 'sent', [qline('i3', 4)]),
  quote('Q-1042', 'c3', -22, 'expired', [qline('i8', 6)]),
]

/** Accepted or sent quote → draft invoice with the same lines (prices re-read from the item list). */
export function convertQuote(id: string): Invoice {
  const q = quotes.find((x) => x.id === id)
  if (!q) throw new ValidationError('notFound')
  if (q.status !== 'sent' && q.status !== 'accepted') throw new ValidationError('notConvertible')
  const inv = createInvoice({
    customerId: q.customerId,
    issueDate: day(0),
    dueDate: day(14),
    lines: q.lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
    note: `From quote ${q.id}`,
    send: false,
  })
  q.status = 'converted'
  q.invoiceId = inv.id
  return inv
}

// ── payments received ──────────────────────────────────
export function receivedPayments(): ReceivedPayment[] {
  return invoices
    .flatMap((inv) =>
      inv.payments.map((p) => ({
        ...p,
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        customerName: inv.customerName,
      })),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
}
