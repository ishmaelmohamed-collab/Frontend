import { query } from '../db';
import { money } from '../money';

function mapRole(r: string): string {
  if (r === 'admin') return 'owner';
  if (r === 'accountant') return 'accountant';
  return 'cashier';
}

export async function getSettings(): Promise<any> {
  return {
    companyName: 'My Company',
    address: '',
    phone: '',
    email: '',
    provider1: 'M-Pesa',
    provider2: 'Airtel Money',
    approvalLimit: '0.00',
    reminderDay: 3,
  };
}

export async function listUsers(): Promise<any[]> {
  const r = await query(`SELECT id, username, role FROM users ORDER BY username`);
  return r.rows.map((u) => ({
    id: String(u.id),
    name: u.username,
    email: `${u.username}@accounting.local`,
    role: mapRole(u.role),
    active: true,
  }));
}

/** Best-effort mapping of our reports to the frontend's Report shape. */
export async function getReport(kind: string, from: string | null, to: string): Promise<any> {
  const start = from ?? '1900-01-01';
  if (kind === 'aging') {
    const today = new Date().toISOString().slice(0, 10);
    const inv = await query(
      `SELECT i.due_date::text AS due_date, i.total,
              COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip WHERE ip.invoice_id = i.id),0) AS paid
       FROM invoices i
       WHERE i.invoice_type = 'sale' AND i.status NOT IN ('void','paid')`,
    );
    const buckets = [0, 0, 0, 0, 0];
    for (const i of inv.rows) {
      const due = Number(i.total) - Number(i.paid);
      if (due <= 0) continue;
      const days = Math.floor((new Date(today).getTime() - new Date(i.due_date).getTime()) / 86400000);
      const idx = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
      buckets[idx] += due;
    }
    return {
      kind,
      from: null,
      to: today,
      lines: [
        { label: 'aging.current', labelIsKey: true, amount: '0.00', buckets: buckets.map((b) => b.toFixed(2)), kind: 'row' },
        { label: 'report.total', labelIsKey: true, amount: buckets.reduce((s, b) => s + b, 0).toFixed(2), kind: 'total' },
      ],
    };
  }

  const typeFilter =
    kind === 'profit'
      ? `a.type IN ('revenue','expense')`
      : kind === 'balance'
        ? `a.type IN ('asset','liability','equity')`
        : `a.type = 'revenue'`;

  const r = await query(
    `SELECT a.code, a.name, a.type,
            COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='debit'),0) AS debit,
            COALESCE(SUM(l.amount) FILTER (WHERE l.line_type='credit'),0) AS credit
     FROM accounts a
     LEFT JOIN journal_entry_lines l ON l.account_id = a.id
     LEFT JOIN journal_entries je ON je.id = l.journal_entry_id AND je.status = 'posted' AND je.entry_date >= $1::date AND je.entry_date <= $2::date
     WHERE a.is_active = true AND ${typeFilter}
     GROUP BY a.id, a.code, a.name, a.type
     ORDER BY a.code`,
    [start, to],
  );

  const lines: any[] = r.rows.map((a) => {
    const naturalDebit = a.type === 'asset' || a.type === 'expense';
    const debit = money(a.debit);
    const credit = money(a.credit);
    const amount = (naturalDebit ? debit.minus(credit) : credit.minus(debit)).toFixed(2);
    return { label: a.name, labelIsKey: false, amount, kind: 'row', code: a.code };
  });

  const total = lines.reduce((s, l) => s.plus(money(l.amount)), money(0));
  lines.push({ label: 'report.total', labelIsKey: true, amount: total.toFixed(2), kind: 'total' });

  return { kind, from, to, lines };
}
