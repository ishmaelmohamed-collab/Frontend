import { describe, expect, it } from 'vitest'
import { accounts, customers, dashboard, invoices, recordPayment, toCents, ValidationError } from './db'

/** The demo data must obey the same accounting rules the real API will. */
describe('demo data', () => {
  it('every invoice adds up: lines → total, total − paid → due', () => {
    for (const inv of invoices) {
      expect(inv.lines.reduce((s, l) => s + toCents(l.amount), 0)).toBe(toCents(inv.total))
      expect(toCents(inv.total) - toCents(inv.paid)).toBe(toCents(inv.due))
      expect(inv.payments.reduce((s, p) => s + toCents(p.amount), 0)).toBe(toCents(inv.paid))
    }
  })

  it('aging buckets add up to receivables', () => {
    const d = dashboard()
    expect(d.aging.reduce((s, b) => s + toCents(b.amount), 0)).toBe(toCents(d.receivables))
  })

  it('customer balances equal their unpaid invoices', () => {
    for (const c of customers()) {
      const own = invoices.filter((x) => x.customerId === c.id && x.status !== 'draft')
      expect(own.reduce((s, x) => s + toCents(x.due), 0)).toBe(toCents(c.balance))
    }
  })
})

describe('recording a payment', () => {
  const open = () => invoices.find((x) => x.status === 'sent' || x.status === 'overdue')!

  it('requires a transaction ID for bank and mobile money', () => {
    const inv = open()
    expect(() =>
      recordPayment(inv.id, {
        amount: '1',
        date: '2026-11-14',
        method: 'mobile',
        accountId: 'mobile-1',
        reference: ' ',
      }),
    ).toThrow(ValidationError)
  })

  it('pays the invoice in full and moves the money into the account', () => {
    const inv = open()
    const acct = accounts.find((a) => a.id === 'bank-main')!
    const before = toCents(acct.balance)
    const due = toCents(inv.due)
    const after = recordPayment(inv.id, {
      amount: inv.due,
      date: '2026-11-14',
      method: 'bank',
      accountId: 'bank-main',
      reference: 'BT-555001',
    })
    expect(after.status).toBe('paid')
    expect(toCents(after.due)).toBe(0)
    expect(toCents(acct.balance)).toBe(before + due)
  })
})
