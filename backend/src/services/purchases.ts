import { query } from '../db'
import { money } from '../money'

function mapMethod(m: string): string {
  if (m === 'bank') return 'bank'
  if (m === 'mobile_money') return 'mobile'
  return 'credit'
}

export async function listBills(): Promise<any[]> {
  const today = new Date().toISOString().slice(0, 10)
  const r = await query(
    `SELECT i.id, i.invoice_number, i.party_id, p.name AS vendor_name,
            i.issue_date::text AS bill_date, i.due_date::text AS due_date,
            i.total, i.status,
            COALESCE(SUM(ip.amount),0) AS paid
     FROM invoices i
     JOIN parties p ON p.id = i.party_id
     LEFT JOIN invoice_payments ip ON ip.invoice_id = i.id
     WHERE i.invoice_type = 'purchase' AND i.status <> 'void'
     GROUP BY i.id, p.name
     ORDER BY i.issue_date DESC, i.id DESC`,
  )
  return r.rows.map((i) => {
    const total = money(i.total)
    const paid = money(i.paid)
    const due = total.minus(paid)
    let status: string
    if (i.status === 'paid') status = 'paid'
    else if (i.due_date < today) status = 'overdue'
    else if (paid.greaterThan(0)) status = 'partial'
    else status = 'unpaid'
    return {
      id: String(i.id),
      vendorId: String(i.party_id),
      vendorName: i.vendor_name,
      vendorRef: '',
      billDate: i.bill_date,
      dueDate: i.due_date,
      poId: null,
      lines: [],
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      due: due.toFixed(2),
      needsApproval: false,
      approved: true,
      status,
    }
  })
}

export async function listOrders(): Promise<any[]> {
  const orders = await query(
    `SELECT o.id, o.party_id, p.name AS vendor_name,
            o.order_date::text AS order_date, o.expected_date::text AS expected_date,
            o.total, o.status
     FROM orders o
     JOIN parties p ON p.id = o.party_id
     WHERE o.order_type = 'purchase' AND o.status <> 'cancelled'
     ORDER BY o.order_date DESC, o.id DESC`,
  )
  const lines = await query(`SELECT order_id, description, quantity, unit_price FROM order_lines`)
  const byOrder = new Map<number, any[]>()
  for (const l of lines.rows) {
    const arr = byOrder.get(Number(l.order_id)) ?? []
    arr.push({
      itemId: null,
      description: l.description,
      ordered: Number(l.quantity),
      received: 0,
      unitCost: money(l.unit_price).toFixed(2),
    })
    byOrder.set(Number(l.order_id), arr)
  }
  return orders.rows.map((o) => ({
    id: String(o.id),
    vendorId: String(o.party_id),
    vendorName: o.vendor_name,
    orderDate: o.order_date,
    expectedDate: o.expected_date ?? o.order_date,
    lines: byOrder.get(Number(o.id)) ?? [],
    total: money(o.total).toFixed(2),
    status: o.status === 'billed' ? 'received' : 'open',
  }))
}

export async function listPayments(): Promise<any[]> {
  const r = await query(
    `SELECT pa.id, pa.payment_date::text AS date, pa.amount, pa.method, pa.reference,
            (SELECT i.id::text FROM invoice_payments ip JOIN invoices i ON i.id = ip.invoice_id WHERE ip.payment_id = pa.id LIMIT 1) AS invoice_id,
            (SELECT i.invoice_number FROM invoice_payments ip JOIN invoices i ON i.id = ip.invoice_id WHERE ip.payment_id = pa.id LIMIT 1) AS invoice_number,
            (SELECT p.name FROM invoice_payments ip JOIN invoices i ON i.id = ip.invoice_id JOIN parties p ON p.id = i.party_id WHERE ip.payment_id = pa.id LIMIT 1) AS customer_name
     FROM payments pa
     WHERE pa.direction = 'incoming'
     ORDER BY pa.payment_date DESC, pa.id DESC`,
  )
  return r.rows.map((pa) => ({
    id: String(pa.id),
    date: pa.date,
    method: mapMethod(pa.method),
    accountId: null,
    reference: pa.reference ?? '',
    amount: money(pa.amount).toFixed(2),
    recordedBy: 'owner',
    matched: pa.invoice_id != null,
    invoiceId: pa.invoice_id ?? '',
    invoiceNumber: pa.invoice_number ?? '',
    customerName: pa.customer_name ?? '',
  }))
}
