/**
 * Items & stock, customers summary, and creating invoices — the batch 2 part of the mock API.
 * Same rules the real backend must enforce: prices come from the item list, stock can't go
 * below zero, and stock only changes when an invoice is SENT (never for drafts).
 */
import { can } from '@/lib/permissions'
import type { CreateInvoiceInput, CustomerSummary, Invoice, Item, Role } from '@/types/domain'
import { assertOpen, customers, invoices, ITEMS, toCents, toMoney, ValidationError } from './db'

const STOCK: Record<string, number> = { i1: 140, i2: 36, i3: 6, i4: 80, i5: 220, i6: 45, i7: 12, i8: 18 }
const REORDER: Record<string, number> = { i1: 20, i2: 10, i3: 10, i4: 15, i5: 40, i6: 10, i7: 15, i8: 5 }

/** Goods received from a vendor (batch 3). */
export function addStock(itemId: string, quantity: number) {
  if (itemId in STOCK) STOCK[itemId] += quantity
}

export function items(): Item[] {
  return ITEMS.map(([id, name, price]) => ({
    id,
    name,
    unitPrice: toMoney(price),
    stock: STOCK[id],
    reorderLevel: REORDER[id],
  }))
}

export function customerSummaries(): CustomerSummary[] {
  return customers().map((c) => ({
    ...c,
    openInvoices: invoices.filter(
      (x) =>
        x.customerId === c.id && (x.status === 'sent' || x.status === 'partial' || x.status === 'overdue'),
    ).length,
  }))
}

export function createInvoice(input: CreateInvoiceInput, role: Role = 'owner'): Invoice {
  const customer = customers().find((c) => c.id === input.customerId)
  if (!customer) throw new ValidationError('customerRequired')
  if (!input.lines.length) throw new ValidationError('linesRequired')
  assertOpen(input.issueDate)
  const catalog = items()
  const lines = input.lines.map((l) => {
    const item = catalog.find((i) => i.id === l.itemId)
    if (!item) throw new ValidationError('itemRequired')
    if (!Number.isInteger(l.quantity) || l.quantity < 1) throw new ValidationError('quantityPositive')
    const amount = toCents(item.unitPrice) * l.quantity
    return {
      itemId: item.id,
      description: item.name,
      quantity: l.quantity,
      unitPrice: item.unitPrice,
      amount: toMoney(amount),
    }
  })
  if (input.send) {
    // Rule 2: going over the customer's credit limit needs the Owner (others can save a draft).
    const after = toCents(customer.balance) + lines.reduce((s, l) => s + toCents(l.amount), 0)
    if (after > toCents(customer.creditLimit) && !can(role, 'sales.overLimit'))
      throw new ValidationError('overCreditLimit')
    // Check every line against stock first, so nothing is half-applied.
    const need: Record<string, number> = {}
    lines.forEach((l) => (need[l.itemId] = (need[l.itemId] ?? 0) + l.quantity))
    for (const [id, q] of Object.entries(need)) if (q > STOCK[id]) throw new ValidationError('notEnoughStock')
    for (const [id, q] of Object.entries(need)) STOCK[id] -= q
  }
  const total = lines.reduce((s, l) => s + toCents(l.amount), 0)
  const last = invoices.reduce((m, x) => Math.max(m, Number(x.number.replace(/\D/g, ''))), 3000)
  const number = `INV-${last + 1}`
  const now = new Date().toISOString()
  const inv: Invoice = {
    id: number,
    number,
    customerId: customer.id,
    customerName: customer.name,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    lines,
    total: toMoney(total),
    paid: '0.00',
    due: toMoney(total),
    status: input.send ? 'sent' : 'draft',
    payments: [],
    activity: input.send
      ? [
          { at: now, kind: 'sent', by: 'owner' },
          { at: now, kind: 'created', by: 'owner' },
        ]
      : [{ at: now, kind: 'created', by: 'owner' }],
  }
  invoices.unshift(inv)
  return inv
}
