import { query } from '../db'
import { money } from '../money'

/** Debit − credit balance for a ledger account code. */
export async function accountBalance(code: string): Promise<any> {
  const r = await query(
    `SELECT COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='debit'),0) - COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='credit'),0) AS v
     FROM journal_entry_lines l
     JOIN journal_entries je ON je.id = l.journal_entry_id
     WHERE l.account_id = (SELECT id FROM accounts WHERE code = $1) AND je.status = 'posted'`,
    [code],
  )
  return money(r.rows[0]?.v ?? 0)
}

/** The three money accounts (bank / mobile / cash) in the frontend's MoneyAccount shape. */
export async function listMoneyAccounts(): Promise<any[]> {
  const bank = await accountBalance('1005')
  const mobile = await accountBalance('1010')
  const cash = await accountBalance('1000')
  return [
    { id: 'bank-main', kind: 'bank', balance: bank.toFixed(2), unmatched: 0 },
    { id: 'mobile-1', kind: 'mobile', balance: mobile.toFixed(2), unmatched: 0 },
    { id: 'mobile-2', kind: 'mobile', balance: cash.toFixed(2), unmatched: 0 },
  ]
}
