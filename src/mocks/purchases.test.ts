import { describe, expect, it } from 'vitest'
import { items } from './catalog'
import { accounts, toCents, ValidationError } from './db'
import { approveBill, bills, convertQuote, createBill, orders, payBills, quotes, vendors } from './purchases'

describe('bills', () => {
  it('a bill over $10,000 waits for Owner approval and cannot be paid until approved', () => {
    const big = bills.find((b) => b.status === 'approval')!
    expect(toCents(big.total)).toBeGreaterThan(10_000_00)
    expect(() => payBills({ billIds: [big.id], accountId: 'bank-main', date: '2026-11-14' })).toThrow(
      ValidationError,
    )
    expect(approveBill(big.id).status).not.toBe('approval')
  })

  it('paying bills takes the money from the chosen account and marks them paid', () => {
    const open = bills.filter((b) => b.status === 'unpaid').slice(0, 2)
    const acct = accounts.find((a) => a.id === 'bank-main')!
    const before = toCents(acct.balance)
    const total = open.reduce((s, b) => s + toCents(b.due), 0)
    const paid = payBills({ billIds: open.map((b) => b.id), accountId: 'bank-main', date: '2026-11-14' })
    expect(paid.every((b) => b.status === 'paid')).toBe(true)
    expect(toCents(acct.balance)).toBe(before - total)
  })

  it('refuses to overdraw an account, and changes nothing', () => {
    const acct = accounts.find((a) => a.id === 'mobile-2')!
    const before = acct.balance
    const big = bills.filter((b) => b.status !== 'paid' && b.status !== 'approval')
    const tooMuch = big.filter((b) => toCents(b.due) > 0)
    if (tooMuch.reduce((s, b) => s + toCents(b.due), 0) > toCents(acct.balance)) {
      expect(() =>
        payBills({ billIds: tooMuch.map((b) => b.id), accountId: 'mobile-2', date: '2026-11-14' }),
      ).toThrow(ValidationError)
      expect(acct.balance).toBe(before)
    }
  })

  it('receiving goods adds stock and updates the purchase order', () => {
    const o = orders.find((x) => x.id === 'PO-0415')!
    const stockBefore = items().find((i) => i.id === 'i2')!.stock
    createBill({
      vendorId: 'v6',
      vendorRef: 'SO-2300',
      billDate: '2026-11-14',
      dueDate: '2026-12-14',
      poId: 'PO-0415',
      lines: [{ itemId: 'i2', description: '', quantity: 60, unitCost: '61.00' }],
      receiveIntoStock: true,
    })
    expect(items().find((i) => i.id === 'i2')!.stock).toBe(stockBefore + 60)
    expect(o.status).toBe('received')
  })

  it('vendor balances equal their unpaid bills', () => {
    for (const v of vendors()) {
      const own = bills.filter((b) => b.vendorId === v.id && b.status !== 'paid')
      expect(own.reduce((s, b) => s + toCents(b.due), 0)).toBe(toCents(v.owed))
    }
  })
})

describe('quotes', () => {
  it('converts an accepted quote into a draft invoice with the same lines, once', () => {
    const q = quotes.find((x) => x.status === 'accepted')!
    const inv = convertQuote(q.id)
    expect(inv.status).toBe('draft')
    expect(inv.total).toBe(q.total)
    expect(q.status).toBe('converted')
    expect(() => convertQuote(q.id)).toThrow(ValidationError)
  })
})
