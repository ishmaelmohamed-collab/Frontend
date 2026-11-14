import { delay, http, HttpResponse } from 'msw'
import type { CreateInvoiceInput, RecordPaymentInput } from '@/types/domain'
import { createInvoice, customerSummaries, items } from './catalog'
import { accounts, dashboard, invoices, recordPayment, ValidationError } from './db'
import {
  approveBill,
  bills,
  convertQuote,
  createBill,
  orders,
  payBills,
  quotes,
  receivedPayments,
  vendors,
} from './purchases'
import type { CreateBillInput, PayBillsInput } from '@/types/domain'

const ok = async <T>(ms: number, fn: () => T | Promise<T>, status = 200) => {
  await delay(ms)
  try {
    return HttpResponse.json((await fn()) as object, { status })
  } catch (e) {
    return fail(e)
  }
}

/** Batch 3 routes: purchases, quotes, payments received, accounts. */
const purchaseHandlers = [
  http.get('*/api/accounts', () => ok(200, () => accounts)),
  http.get('*/api/vendors', () => ok(250, vendors)),
  http.get('*/api/orders', () => ok(250, () => orders)),
  http.get('*/api/bills', () => ok(250, () => bills)),
  http.post('*/api/bills/pay', async ({ request }) =>
    ok(500, async () => payBills((await request.json()) as PayBillsInput)),
  ),
  http.post('*/api/bills/:id/approve', ({ params }) => ok(400, () => approveBill(String(params.id)))),
  http.post('*/api/bills', async ({ request }) =>
    ok(500, async () => createBill((await request.json()) as CreateBillInput), 201),
  ),
  http.get('*/api/quotes', () => ok(250, () => quotes)),
  http.post('*/api/quotes/:id/convert', ({ params }) => ok(500, () => convertQuote(String(params.id)), 201)),
  http.get('*/api/payments', () => ok(250, receivedPayments)),
]

const fail = (e: unknown) => {
  const code = e instanceof ValidationError ? e.code : 'unknown'
  return HttpResponse.json({ code }, { status: code === 'notFound' ? 404 : 422 })
}

/** Fake API — each route mirrors one the real backend will provide. Small delays keep loading states honest. */
export const handlers = [
  ...purchaseHandlers,
  http.get('*/api/dashboard', async () => {
    await delay(350)
    return HttpResponse.json(dashboard())
  }),
  http.get('*/api/invoices', async () => {
    await delay(300)
    return HttpResponse.json(invoices)
  }),
  http.post('*/api/invoices', async ({ request }) => {
    await delay(500)
    try {
      return HttpResponse.json(createInvoice((await request.json()) as CreateInvoiceInput), { status: 201 })
    } catch (e) {
      return fail(e)
    }
  }),
  http.get('*/api/invoices/:id', async ({ params }) => {
    await delay(250)
    const inv = invoices.find((x) => x.id === params.id)
    return inv ? HttpResponse.json(inv) : HttpResponse.json({ code: 'notFound' }, { status: 404 })
  }),
  http.post('*/api/invoices/:id/payments', async ({ params, request }) => {
    await delay(500)
    try {
      return HttpResponse.json(recordPayment(String(params.id), (await request.json()) as RecordPaymentInput))
    } catch (e) {
      return fail(e)
    }
  }),
  http.get('*/api/customers', async () => {
    await delay(250)
    return HttpResponse.json(customerSummaries())
  }),
  http.get('*/api/items', async () => {
    await delay(250)
    return HttpResponse.json(items())
  }),
]
