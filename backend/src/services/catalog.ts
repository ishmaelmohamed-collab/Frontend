import { query } from '../db'
import { money } from '../money'
import { listPurchaseInvoices, listSaleInvoices } from './invoice-list'

export async function listItems(): Promise<any[]> {
  const r = await query(
    `SELECT i.id, i.name, i.unit_price,
            COALESCE(SUM(sm.quantity),0) AS stock
     FROM inventory_items i
     LEFT JOIN stock_movements sm ON sm.item_id = i.id
     GROUP BY i.id, i.name, i.unit_price
     ORDER BY i.name`,
  )
  return r.rows.map((i) => ({
    id: String(i.id),
    name: i.name,
    unitPrice: money(i.unit_price).toFixed(2),
    stock: Number(i.stock),
    reorderLevel: 0,
  }))
}

export async function listCustomers(): Promise<any[]> {
  const parties = (
    await query(`SELECT id, name, phone, email FROM parties WHERE type IN ('customer','both') ORDER BY name`)
  ).rows
  const invoices = await listSaleInvoices()
  const today = new Date().toISOString().slice(0, 10)
  const agg = new Map<string, { balance: any; overdue: any; openInvoices: number }>()
  for (const inv of invoices) {
    if (inv.status === 'paid') continue
    const cur = agg.get(inv.customerId) ?? { balance: money(0), overdue: money(0), openInvoices: 0 }
    cur.balance = cur.balance.plus(money(inv.due))
    if (inv.dueDate < today) cur.overdue = cur.overdue.plus(money(inv.due))
    cur.openInvoices += 1
    agg.set(inv.customerId, cur)
  }
  return parties.map((p) => {
    const a = agg.get(String(p.id)) ?? { balance: money(0), overdue: money(0), openInvoices: 0 }
    return {
      id: String(p.id),
      name: p.name,
      phone: p.phone ?? '',
      email: p.email ?? '',
      creditLimit: '0.00',
      balance: a.balance.toFixed(2),
      overdue: a.overdue.toFixed(2),
      openInvoices: a.openInvoices,
    }
  })
}

export async function listVendors(): Promise<any[]> {
  const parties = (
    await query(`SELECT id, name, phone FROM parties WHERE type IN ('vendor','both') ORDER BY name`)
  ).rows
  const invoices = await listPurchaseInvoices()
  const today = new Date().toISOString().slice(0, 10)
  const agg = new Map<string, { owed: any; overdue: any; openBills: number }>()
  for (const inv of invoices) {
    if (inv.status === 'paid') continue
    const cur = agg.get(inv.customerId) ?? { owed: money(0), overdue: money(0), openBills: 0 }
    cur.owed = cur.owed.plus(money(inv.due))
    if (inv.dueDate < today) cur.overdue = cur.overdue.plus(money(inv.due))
    cur.openBills += 1
    agg.set(inv.customerId, cur)
  }
  return parties.map((p) => {
    const a = agg.get(String(p.id)) ?? { owed: money(0), overdue: money(0), openBills: 0 }
    return {
      id: String(p.id),
      name: p.name,
      phone: p.phone ?? '',
      owed: a.owed.toFixed(2),
      overdue: a.overdue.toFixed(2),
      openBills: a.openBills,
    }
  })
}
