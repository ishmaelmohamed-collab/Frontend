import { query } from '../db';
import { money } from '../money';
import { listSaleInvoices } from './invoice-list';

/** One account balance (debit - credit for assets) for a given code. */
async function accountBalance(code: string): Promise<any> {
  const r = await query(
    `SELECT COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='debit'),0) - COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='credit'),0) AS v
     FROM journal_entry_lines l
     JOIN journal_entries je ON je.id = l.journal_entry_id
     WHERE l.account_id = (SELECT id FROM accounts WHERE code = $1) AND je.status = 'posted'`,
    [code],
  );
  return money(r.rows[0]?.v ?? 0);
}

async function revenueBetween(start: string, end: string): Promise<any> {
  const r = await query(
    `SELECT COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='credit'),0) - COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='debit'),0) AS v
     FROM journal_entry_lines l
     JOIN journal_entries je ON je.id = l.journal_entry_id
     WHERE l.account_id = (SELECT id FROM accounts WHERE code = '4000')
       AND je.status = 'posted' AND je.entry_date >= $1::date AND je.entry_date <= $2::date`,
    [start, end],
  );
  return money(r.rows[0]?.v ?? 0);
}

export async function dashboardSummary(): Promise<any> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().slice(0, 10);

  const revenueThisMonth = await revenueBetween(monthStart, today);
  const revenueSameDaysLastMonth = await revenueBetween(lastMonthStart, lastMonthEnd);
  const receivables = await accountBalance('1100');
  const cash = (await accountBalance('1000')).plus(await accountBalance('1005')).plus(await accountBalance('1010'));

  // Sale invoices, already mapped to the frontend's Invoice shape.
  const invoices = await listSaleInvoices();

  const open = invoices.filter((i) => i.status !== 'paid');
  const overdueList = open.filter((i) => i.dueDate < today);
  const overdue = overdueList.reduce((s, i) => s.plus(money(i.due)), money(0));

  // Aging buckets: current (<= 0 days late), d30 (1-30), d60 (31-60), d90 (61-90), d90plus (91+).
  const buckets = { current: money(0), d30: money(0), d60: money(0), d90: money(0), d90plus: money(0) };
  for (const i of open) {
    const due = money(i.due);
    if (!due.greaterThan(0)) continue;
    const days = Math.floor((new Date(today).getTime() - new Date(i.dueDate).getTime()) / 86400000);
    if (days <= 0) buckets.current = buckets.current.plus(due);
    else if (days <= 30) buckets.d30 = buckets.d30.plus(due);
    else if (days <= 60) buckets.d60 = buckets.d60.plus(due);
    else if (days <= 90) buckets.d90 = buckets.d90.plus(due);
    else buckets.d90plus = buckets.d90plus.plus(due);
  }

  // Monthly income vs expenses (last 12 months).
  const incomeVsExpenses: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString().slice(0, 10);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString().slice(0, 10);
    const r = await query(
      `SELECT
         COALESCE(SUM(l.amount) FILTER (WHERE a.type='revenue' AND l.line_type='credit'),0) - COALESCE(SUM(l.amount) FILTER (WHERE a.type='revenue' AND l.line_type='debit'),0) AS income,
         COALESCE(SUM(l.amount) FILTER (WHERE a.type='expense' AND l.line_type='debit'),0) - COALESCE(SUM(l.amount) FILTER (WHERE a.type='expense' AND l.line_type='credit'),0) AS expenses
       FROM journal_entry_lines l
       JOIN journal_entries je ON je.id = l.journal_entry_id
       JOIN accounts a ON a.id = l.account_id
       WHERE je.status = 'posted' AND je.entry_date >= $1::date AND je.entry_date <= $2::date`,
      [mStart, mEnd],
    );
    incomeVsExpenses.push({
      month: mStart.slice(0, 7),
      income: money(r.rows[0]?.income ?? 0).toFixed(2),
      expenses: money(r.rows[0]?.expenses ?? 0).toFixed(2),
    });
  }

  const recentInvoices = invoices.slice(0, 5);

  const accounts = [
    { id: 'bank-main', kind: 'bank', balance: (await accountBalance('1005')).toFixed(2), unmatched: 0 },
    { id: 'mobile-1', kind: 'mobile', balance: (await accountBalance('1010')).toFixed(2), unmatched: 0 },
    { id: 'mobile-2', kind: 'mobile', balance: (await accountBalance('1000')).toFixed(2), unmatched: 0 },
  ];

  return {
    revenueThisMonth: revenueThisMonth.toFixed(2),
    revenueSameDaysLastMonth: revenueSameDaysLastMonth.toFixed(2),
    receivables: receivables.toFixed(2),
    openInvoices: open.length,
    overdue: overdue.toFixed(2),
    overdueCount: overdueList.length,
    cash: cash.toFixed(2),
    incomeVsExpenses,
    aging: [
      { bucket: 'current', amount: buckets.current.toFixed(2) },
      { bucket: 'd30', amount: buckets.d30.toFixed(2) },
      { bucket: 'd60', amount: buckets.d60.toFixed(2) },
      { bucket: 'd90', amount: buckets.d90.toFixed(2) },
      { bucket: 'd90plus', amount: buckets.d90plus.toFixed(2) },
    ],
    recentInvoices,
    accounts,
  };
}
