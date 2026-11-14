import { query } from '../db';
import { money } from '../money';
import { accountBalance } from './money-accounts';

function accountType(t: string): string {
  return t === 'revenue' ? 'income' : t;
}

function moneyAccountId(code: string | null): string {
  if (code === '1005') return 'bank-main';
  if (code === '1010') return 'mobile-1';
  return 'mobile-2';
}

export async function listLedger(): Promise<any[]> {
  const r = await query(
    `SELECT a.code, a.type,
            COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='debit'),0) AS debit,
            COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='credit'),0) AS credit
     FROM accounts a
     LEFT JOIN journal_entry_lines l ON l.account_id = a.id
     LEFT JOIN journal_entries je ON je.id = l.journal_entry_id AND je.status = 'posted'
     WHERE a.is_active = true
     GROUP BY a.id, a.code, a.type
     ORDER BY a.code`,
  );
  return r.rows.map((a) => {
    const debit = money(a.debit);
    const credit = money(a.credit);
    const naturalDebit = a.type === 'asset' || a.type === 'expense';
    const sys = ['1000', '1005', '1010', '1100', '2000'].includes(a.code);
    return {
      code: a.code,
      type: accountType(a.type),
      system: sys,
      balance: (naturalDebit ? debit.minus(credit) : credit.minus(debit)).toFixed(2),
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
    };
  });
}

export async function listJournal(): Promise<any[]> {
  const entries = await query(
    `SELECT id, entry_date::text AS date, reference, description
     FROM journal_entries WHERE status = 'posted'
     ORDER BY entry_date DESC, id DESC`,
  );
  const lines = await query(
    `SELECT l.journal_entry_id, a.code AS account_code, l.line_type, l.amount
     FROM journal_entry_lines l JOIN accounts a ON a.id = l.account_id`,
  );
  const byEntry = new Map<number, any[]>();
  for (const l of lines.rows) {
    const arr = byEntry.get(Number(l.journal_entry_id)) ?? [];
    arr.push({
      accountCode: l.account_code,
      debit: l.line_type === 'debit' ? money(l.amount).toFixed(2) : '0.00',
      credit: l.line_type === 'credit' ? money(l.amount).toFixed(2) : '0.00',
    });
    byEntry.set(Number(l.journal_entry_id), arr);
  }
  return entries.rows.map((e) => {
    const ls = byEntry.get(Number(e.id)) ?? [];
    const total = ls.reduce((s, l) => s.plus(money(l.debit)), money(0));
    return {
      id: String(e.id),
      date: e.date,
      source: 'manual',
      reference: e.reference ?? '',
      party: '',
      memo: e.description ?? '',
      lines: ls,
      total: total.toFixed(2),
      by: 'owner',
    };
  });
}

export async function getMonthClose(): Promise<any> {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = last.toISOString().slice(0, 7);
  const start = last.toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  const r = await query(
    `SELECT
       COALESCE(SUM(l.amount) FILTER (WHERE a.type='revenue' AND l.line_type='credit'),0) - COALESCE(SUM(l.amount) FILTER (WHERE a.type='revenue' AND l.line_type='debit'),0) AS income,
       COALESCE(SUM(l.amount) FILTER (WHERE a.type='expense' AND l.line_type='debit'),0) - COALESCE(SUM(l.amount) FILTER (WHERE a.type='expense' AND l.line_type='credit'),0) AS expenses,
       COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='debit'),0) AS debits,
       COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='credit'),0) AS credits
     FROM journal_entry_lines l
     JOIN journal_entries je ON je.id = l.journal_entry_id
     JOIN accounts a ON a.id = l.account_id
     WHERE je.status = 'posted' AND je.entry_date >= $1::date AND je.entry_date <= $2::date`,
    [start, end],
  );
  const row = r.rows[0] ?? {};
  return {
    month,
    checks: [],
    income: money(row.income ?? 0).toFixed(2),
    expenses: money(row.expenses ?? 0).toFixed(2),
    debits: money(row.debits ?? 0).toFixed(2),
    credits: money(row.credits ?? 0).toFixed(2),
    lockedThrough: null,
    locked: false,
    reminder: false,
    history: [],
  };
}

export async function listBankTransactions(): Promise<any[]> {
  const r = await query(
    `SELECT bt.id, bt.transaction_date::text AS date, bt.account_id,
            bt.description, bt.amount, bt.reference,
            a.code AS account_code
     FROM bank_transactions bt
     LEFT JOIN accounts a ON a.id = bt.account_id
     ORDER BY bt.transaction_date DESC, bt.id DESC`,
  );
  return r.rows.map((bt) => {
    const amt = money(bt.amount);
    return {
      id: String(bt.id),
      accountId: moneyAccountId(bt.account_code),
      date: bt.date,
      kind: amt.greaterThan(0) ? 'receipt' : 'billPayment',
      party: bt.description ?? '',
      reference: bt.reference ?? '',
      amount: amt.toFixed(2),
      matched: false,
      link: null,
      balanceAfter: '0.00',
    };
  });
}

export async function getReconciliation(account: string): Promise<any> {
  const code = account === 'bank-main' ? '1005' : account === 'mobile-1' ? '1010' : '1000';
  const bal = await accountBalance(code);
  return {
    accountId: account,
    statementDate: new Date().toISOString().slice(0, 10),
    statementBalance: bal.toFixed(2),
    bookBalance: bal.toFixed(2),
    difference: '0.00',
    lines: [],
    matchedBefore: 0,
    bookOnly: [],
  };
}
