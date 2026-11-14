import { describe, expect, it } from 'vitest'
import { createInvoice, items } from './catalog'
import { ValidationError } from './db'

const stockOf = (id: string) => items().find((i) => i.id === id)!.stock

describe('creating invoices', () => {
  it('prices come from the item list and totals are calculated', () => {
    const inv = createInvoice({
      customerId: 'c1',
      issueDate: '2026-11-14',
      dueDate: '2026-11-28',
      lines: [
        { itemId: 'i1', quantity: 20 },
        { itemId: 'i2', quantity: 10 },
      ],
      note: '',
      send: false,
    })
    expect(inv.lines[0].unitPrice).toBe('62.00')
    expect(inv.total).toBe('2085.00') // 20 × 62.00 + 10 × 84.50
    expect(inv.status).toBe('draft')
  })

  it('drafts leave stock alone; sending reduces it', () => {
    const before = stockOf('i4')
    createInvoice({
      customerId: 'c2',
      issueDate: '2026-11-14',
      dueDate: '2026-11-28',
      lines: [{ itemId: 'i4', quantity: 5 }],
      note: '',
      send: false,
    })
    expect(stockOf('i4')).toBe(before)
    const sent = createInvoice({
      customerId: 'c2',
      issueDate: '2026-11-14',
      dueDate: '2026-11-28',
      lines: [{ itemId: 'i4', quantity: 5 }],
      note: '',
      send: true,
    })
    expect(sent.status).toBe('sent')
    expect(stockOf('i4')).toBe(before - 5)
  })

  it('refuses to send more than is in stock, and changes nothing', () => {
    const before = stockOf('i3')
    expect(() =>
      createInvoice({
        customerId: 'c3',
        issueDate: '2026-11-14',
        dueDate: '2026-11-28',
        lines: [{ itemId: 'i3', quantity: before + 1 }],
        note: '',
        send: true,
      }),
    ).toThrow(ValidationError)
    expect(stockOf('i3')).toBe(before)
  })
})
