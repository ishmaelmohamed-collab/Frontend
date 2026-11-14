import { describe, expect, it } from 'vitest'
import { reconciliation, resolveLine, statements, transactions, transfer } from './banking'
import { accounts, invoices, period, recordPayment, toCents, ValidationError } from './db'
import {
  createJournal,
  journal,
  ledger,
  lockMonth,
  monthClose,
  recordStockCount,
  reopenMonth,
} from './ledger'

const balanced = () => {
  const d = journal().reduce((s, e) => s + e.lines.reduce((x, l) => x + toCents(l.debit), 0), 0)
  const c = journal().reduce((s, e) => s + e.lines.reduce((x, l) => x + toCents(l.credit), 0), 0)
  return d === c
}
const ledgerCash = (code: string) => toCents(ledger().find((a) => a.code === code)!.balance)

describe('books', () => {
  it('every journal entry balances, and the ledger agrees with the bank screen', () => {
    for (const e of journal()) {
      const d = e.lines.reduce((s, l) => s + toCents(l.debit), 0)
      const c = e.lines.reduce((s, l) => s + toCents(l.credit), 0)
      expect(d).toBe(c)
    }
    expect(ledgerCash('1000')).toBe(toCents(accounts[0].balance))
    expect(ledgerCash('1010')).toBe(toCents(accounts[1].balance))
    const ar = invoices
      .filter((x) => x.status !== 'draft' && x.status !== 'void')
      .reduce((s, x) => s + toCents(x.due), 0)
    expect(toCents(ledger().find((a) => a.code === '1100')!.balance)).toBe(ar)
  })

  it('running balance on the newest transaction equals the account balance', () => {
    for (const a of accounts) {
      const txns = transactions(a.id)
      if (txns.length) expect(txns[0].balanceAfter).toBe(a.balance)
    }
  })

  it('opening balances are not negative', () => {
    const opening = journal().find((e) => e.source === 'opening')!
    expect(opening.lines.every((l) => toCents(l.credit) === 0 || l.accountCode === '3000')).toBe(true)
    expect(transactions().every((t) => toCents(t.balanceAfter) >= 0)).toBe(true)
  })
})

describe('reconciliation', () => {
  it('starts with a difference that every fix explains, ending at exactly $0.00', () => {
    for (const s of statements) {
      const before = reconciliation(s.accountId)
      expect(before.lines.some((l) => l.state !== 'matched')).toBe(true)
      for (const l of before.lines) {
        const action = { suggested: 'match', missing: 'record', fee: 'fee', unknown: 'hold', matched: null }[
          l.state
        ] as 'match' | 'record' | 'fee' | 'hold'
        resolveLine(s.accountId, l.id, action)
      }
      const after = reconciliation(s.accountId)
      expect(after.lines.every((l) => l.state === 'matched')).toBe(true)
      expect(after.difference).toBe('0.00')
    }
    expect(balanced()).toBe(true)
    expect(ledgerCash('1010')).toBe(toCents(accounts[1].balance))
  })

  it('refuses the wrong action for a line', () => {
    const l = statements[0].lines[0]
    expect(() => resolveLine(statements[0].accountId, l.id, 'fee')).toThrow(ValidationError)
  })

  it('a new payment shows as "in the books, not on the statement" and keeps the difference at $0.00', () => {
    const open = invoices.find((x) => x.status === 'sent' || x.status === 'overdue')!
    recordPayment(open.id, {
      amount: '10.00',
      date: statements[2].date,
      method: 'mobile',
      accountId: 'mobile-2',
      reference: 'MP-1',
    })
    const r = reconciliation('mobile-2')
    expect(r.bookOnly).toHaveLength(1)
    expect(r.difference).toBe('0.00')
  })
})

describe('transfers', () => {
  it('moves money between accounts and refuses to overdraw', () => {
    const [bank, m1] = [accounts[0], accounts[1]]
    const b0 = toCents(bank.balance)
    const m0 = toCents(m1.balance)
    transfer({
      fromId: 'mobile-1',
      toId: 'bank-main',
      amount: '1000.00',
      date: statements[0].date,
      reference: 'TR-1',
    })
    expect(toCents(bank.balance)).toBe(b0 + 100000)
    expect(toCents(m1.balance)).toBe(m0 - 100000)
    expect(() =>
      transfer({
        fromId: 'mobile-2',
        toId: 'bank-main',
        amount: '999999.00',
        date: statements[0].date,
        reference: 'X',
      }),
    ).toThrow(ValidationError)
    expect(balanced()).toBe(true)
  })
})

describe('manual journal entries', () => {
  const lines = [
    { accountCode: '5600', debit: '184.50', credit: '' },
    { accountCode: '1200', debit: '', credit: '184.50' },
  ]
  it("must balance and can't touch bank, receivable or payable accounts", () => {
    const date = statements[0].date
    expect(() =>
      createJournal({ date, memo: 'x', lines: [lines[0], { ...lines[1], credit: '100.00' }] }),
    ).toThrow('unbalanced')
    expect(() =>
      createJournal({
        date,
        memo: 'x',
        lines: [lines[0], { accountCode: '1000', debit: '', credit: '184.50' }],
      }),
    ).toThrow('systemAccount')
    expect(() => createJournal({ date, memo: 'Shrinkage', lines }, 'sales')).toThrow('notAllowed')
    expect(createJournal({ date, memo: 'Stock count shrinkage', lines }).reference).toBe('JV-0001')
    expect(balanced()).toBe(true)
  })
})

describe('month-end close', () => {
  it('only the Owner can lock, with a reason, after every check — then the month is closed to changes', () => {
    recordStockCount()
    const state = monthClose()
    expect(state.checks.every((c) => c.done)).toBe(true) // reconciliations were finished above
    expect(state.debits).toBe(state.credits)
    expect(() => lockMonth('All checked', 'accountant')).toThrow('ownerOnly')
    expect(() => lockMonth('  ')).toThrow('reasonRequired')
    const locked = lockMonth('All checked and reconciled')
    expect(locked.locked).toBe(true)
    const inMonth = `${state.month}-15`
    expect(() =>
      createJournal({
        date: inMonth,
        memo: 'Late entry',
        lines: [
          { accountCode: '5100', debit: '1.00', credit: '' },
          { accountCode: '3000', debit: '', credit: '1.00' },
        ],
      }),
    ).toThrow('periodLocked')
    expect(reopenMonth('Supplier credit note arrived late').locked).toBe(false)
    expect(period.lockedThrough! < `${state.month}-01`).toBe(true)
    expect(monthClose().history[0].action).toBe('reopen')
  })
})
