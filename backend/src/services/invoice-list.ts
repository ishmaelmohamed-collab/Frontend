import { query } from '../db'
import { money } from '../money'

/** Map a backend invoice row to the frontend's Invoice shape. */
function mapInvoice(i: any, today: string): any {
  const total = money(i.total)
  const paid = money(i.paid)
  const due = total.minus(paid)
  let status: string
  if (i.status === 'paid') status = 'paid'
  else if (i.status === 'void') status = 'void'
  else if (i.due_date < today) status = 'overdue'
  else if (paid.greaterThan(0)) status = 'partial'
  else status = 'sent'
  return {
    id: String(i.id),
    number: i.invoice_number,
    customerId: String(i.party_id),
    customerName: i.customer_name,
    issueDate: i.issue_date,
    dueDate: i.due_date,
    lines: [],
    total: total.toFixed(2),
    paid: paid.toFixed(2),
    due: due.toFixed(2),
    status,
    payments: [],
    activity: [],
  }
}

async function listInvoices(invoiceType: 'sale' | 'purchase'): Promise<any[]> {
  const today = new Date().toISOString().slice(0, 10)
  const inv = await query(
    `SELECT i.id, i.invoice_number, i.party_id, p.name AS customer_name,
            i.issue_date::text AS issue_date, i.due_date::text AS due_date,
            i.total, i.status,
            COALESCE(SUM(ip.amount),0) AS paid
     FROM invoices i
     JOIN parties p ON p.id = i.party_id
     LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
     WHERE i.invoice_type = $1 AND i.status <> 'void'
     GROUP BY i.id, p.name
     ORDER BY i.issue_date DESC, i.id DESC`,
    [invoiceType],
  )
  return inv.rows.map((i) => mapInvoice(i, today))
}

export const listSaleInvoices = () => listInvoices('sale')
export const listPurchaseInvoices = () => listInvoices('purchase')

export function mapPaymentMethod(m: string): string {
  if (m === 'bank') return 'bank'
  if (m === 'mobile') return 'mobile_money'
  return 'other'
}

/** One invoice with its lines + payments, in the frontend's Invoice shape. */
export async function getInvoiceDetail(id: string): Promise<any | null> {
  const today = new Date().toISOString().slice(0, 10)
  const r = await query(
    `SELECT i.id, i.invoice_number, i.party_id, p.name AS customer_name,
            i.issue_date::text AS issue_date, i.due_date::text AS due_date,
            i.total, i.status,
            COALESCE((SELECT SUM(ip.amount) FROM invoice_payments ip WHERE ip.invoice_id = i.id),0) AS paid
     FROM invoices i JOIN parties p ON p.id = i.party_id
     WHERE i.id = $1`,
    [id],
  )
  const inv = r.rows[0]
  if (!inv) return null

  const lines = await query(
    `SELECT description, quantity, unit_price, amount FROM invoice_lines WHERE invoice_id = $1 ORDER BY id`,
    [id],
  )
  const payments = await query(
    `SELECT pa.id, pa.payment_date::text AS date, pa.method, pa.reference, ip.amount
     FROM invoice_payments ip JOIN payments pa ON pa.id = ip.payment_id
     WHERE ip.invoice_id = $1 ORDER BY pa.payment_date, pa.id`,
    [id],
  )

  const total = money(inv.total)
  const paid = money(inv.paid)
  const due = total.minus(paid)
  let status: string
  if (inv.status === 'paid') status = 'paid'
  else if (inv.status === 'void') status = 'void'
  else if (inv.due_date < today) status = 'overdue'
  else if (paid.greaterThan(0)) status = 'partial'
  else status = 'sent'

  return {
    id: String(inv.id),
    number: inv.invoice_number,
    customerId: String(inv.party_id),
    customerName: inv.customer_name,
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    lines: lines.rows.map((l) => ({
      itemId: '',
      description: l.description,
      quantity: Number(l.quantity),
      unitPrice: money(l.unit_price).toFixed(2),
      amount: money(l.amount).toFixed(2),
    })),
    total: total.toFixed(2),
    paid: paid.toFixed(2),
    due: due.toFixed(2),
    status,
    payments: payments.rows.map((p) => ({
      id: String(p.id),
      date: p.date,
      method: p.method === 'bank' ? 'bank' : p.method === 'mobile_money' ? 'mobile' : 'credit',
      accountId: null,
      reference: p.reference ?? '',
      amount: money(p.amount).toFixed(2),
      recordedBy: 'owner',
      matched: true,
    })),
    activity: [],
  }
}
