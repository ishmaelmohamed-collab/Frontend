import { delay, http, HttpResponse } from 'msw'
import { can, type Permission } from '@/lib/permissions'
import type {
  AccountId,
  CreateBillInput,
  CreateInvoiceInput,
  JournalInput,
  PayBillsInput,
  RecordPaymentInput,
  ReportKind,
  ResolveAction,
  Role,
  Settings,
  TransferInput,
  User,
} from '@/types/domain'
import {
  authShape,
  currentUser,
  inviteUser,
  setDemoSession,
  signIn,
  updateSettings,
  updateUser,
  users,
} from './admin'
import { reconciliation, resolveLine, syncCounts, transactions, transfer } from './banking'
import { createInvoice, customerSummaries, items } from './catalog'
import { accounts, dashboard, invoices, recordPayment, settings, ValidationError } from './db'
import {
  createJournal,
  journal,
  ledger,
  lockMonth,
  monthClose,
  recordStockCount,
  reopenMonth,
} from './ledger'
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
import { report } from './reports'

type Ctx = { request: Request; params: Record<string, string | readonly string[] | undefined> }
type Body = Record<string, unknown>

const fail = (e: unknown) => {
  const code = e instanceof ValidationError ? e.code : 'unknown'
  const status = code === 'notFound' ? 404 : code === 'signedOut' ? 401 : code === 'forbidden' ? 403 : 422
  return HttpResponse.json({ code }, { status })
}

/**
 * One route: checks who is signed in and that their role may do this, waits a little
 * (so loading states are honest), then runs the action. Mirrors what the real API must do.
 */
const route =
  <T>(
    perm: Permission | null,
    ms: number,
    fn: (c: Ctx & { user: User; role: Role }) => T | Promise<T>,
    status = 200,
  ) =>
  async (c: Ctx) => {
    await delay(ms)
    try {
      const user = currentUser()
      if (!user) throw new ValidationError('signedOut')
      if (perm && !can(user.role, perm)) throw new ValidationError('forbidden')
      return HttpResponse.json((await fn({ ...c, user, role: user.role })) as object, { status })
    } catch (e) {
      return fail(e)
    }
  }

const body = async <T>(r: Request) => (await r.json()) as T
const id = (c: Ctx, k = 'id') => String(c.params[k])

const authHandlers = [
  // Same paths and answers as the real backend (backend/src/routes/auth.ts).
  http.post('*/api/auth/login', async ({ request }) => {
    await delay(500)
    try {
      const b = await body<{ username?: string; password?: string }>(request)
      const u = signIn(String(b.username ?? ''), String(b.password ?? ''))
      setDemoSession(u.id)
      return HttpResponse.json(authShape(u))
    } catch (e) {
      const code = e instanceof ValidationError ? e.code : 'unknown'
      return HttpResponse.json({ code, error: 'Invalid username or password' }, { status: 401 })
    }
  }),
  http.get('*/api/auth/me', async () => {
    await delay(100)
    const u = currentUser()
    return u
      ? HttpResponse.json(authShape(u))
      : HttpResponse.json({ code: 'signedOut', error: 'Not authenticated' }, { status: 401 })
  }),
  http.post('*/api/auth/logout', () => {
    setDemoSession(null)
    return HttpResponse.json({ ok: true })
  }),
  // Company name & provider names are shown everywhere, so every signed-in user may read them.
  http.get(
    '*/api/settings',
    route(null, 150, () => settings),
  ),
  http.put(
    '*/api/settings',
    route('settings.edit', 400, async ({ request, role }) =>
      updateSettings(await body<Partial<Settings>>(request), role),
    ),
  ),
  http.get(
    '*/api/users',
    route('settings.view', 200, () => users),
  ),
  http.post(
    '*/api/users',
    route(
      'settings.edit',
      400,
      async ({ request, role }) =>
        inviteUser(await body<{ name: string; email: string; role: Role }>(request), role),
      201,
    ),
  ),
  http.patch(
    '*/api/users/:id',
    route('settings.edit', 300, async (c) =>
      updateUser(id(c), await body<{ role?: Role; active?: boolean }>(c.request), c.role),
    ),
  ),
  http.get(
    '*/api/reports/:kind',
    route('reports.view', 300, ({ params, request }) => {
      const q = new URL(request.url).searchParams
      return report(String(params.kind) as ReportKind, q.get('from'), q.get('to'))
    }),
  ),
]

const salesHandlers = [
  http.get(
    '*/api/dashboard',
    route(null, 350, ({ role }) => {
      syncCounts()
      const d = dashboard()
      // Bank balances are for money roles only.
      return can(role, 'money.view') ? d : { ...d, cash: '0.00', accounts: [] }
    }),
  ),
  http.get(
    '*/api/invoices',
    route('sales.view', 300, () => invoices),
  ),
  http.post(
    '*/api/invoices',
    route(
      'sales.edit',
      500,
      async ({ request, role }) => createInvoice(await body<CreateInvoiceInput>(request), role),
      201,
    ),
  ),
  http.get(
    '*/api/invoices/:id',
    route('sales.view', 250, (c) => {
      const inv = invoices.find((x) => x.id === id(c))
      if (!inv) throw new ValidationError('notFound')
      return inv
    }),
  ),
  http.post(
    '*/api/invoices/:id/payments',
    route('payments.record', 500, async (c) =>
      recordPayment(id(c), await body<RecordPaymentInput>(c.request), c.role),
    ),
  ),
  http.get('*/api/customers', route('sales.view', 250, customerSummaries)),
  http.get('*/api/items', route('items.view', 250, items)),
  http.get(
    '*/api/quotes',
    route('sales.view', 250, () => quotes),
  ),
  http.post(
    '*/api/quotes/:id/convert',
    route('sales.edit', 500, (c) => convertQuote(id(c)), 201),
  ),
  http.get('*/api/payments', route('money.view', 250, receivedPayments)),
]

const purchaseHandlers = [
  http.get(
    '*/api/accounts',
    route('money.view', 200, () => {
      syncCounts()
      return accounts
    }),
  ),
  http.get('*/api/vendors', route('purchases.view', 250, vendors)),
  http.get(
    '*/api/orders',
    route('purchases.view', 250, () => orders),
  ),
  http.get(
    '*/api/bills',
    route('purchases.view', 250, () => bills),
  ),
  http.post(
    '*/api/bills/pay',
    route('bills.pay', 500, async ({ request }) => payBills(await body<PayBillsInput>(request))),
  ),
  http.post(
    '*/api/bills/:id/approve',
    route('bills.approve', 400, (c) => approveBill(id(c))),
  ),
  http.post(
    '*/api/bills',
    route(
      'purchases.edit',
      500,
      async ({ request }) => createBill(await body<CreateBillInput>(request)),
      201,
    ),
  ),
]

const bookHandlers = [
  http.get(
    '*/api/bank/transactions',
    route('money.view', 250, ({ request }) =>
      transactions((new URL(request.url).searchParams.get('account') as AccountId) || undefined),
    ),
  ),
  http.post(
    '*/api/bank/transfer',
    route('money.move', 500, async ({ request }) => transfer(await body<TransferInput>(request))),
  ),
  http.get(
    '*/api/reconcile/:account',
    route('money.view', 300, (c) => reconciliation(id(c, 'account'))),
  ),
  http.post(
    '*/api/reconcile/:account/lines/:line',
    route('money.move', 400, async (c) =>
      resolveLine(id(c, 'account'), id(c, 'line'), (await body<{ action: ResolveAction }>(c.request)).action),
    ),
  ),
  http.get(
    '*/api/ledger',
    route('books.view', 250, () => ledger()),
  ),
  http.get('*/api/journal', route('books.view', 300, journal)),
  http.post(
    '*/api/journal',
    route(
      'books.post',
      500,
      async ({ request, role }) => createJournal(await body<JournalInput>(request), role),
      201,
    ),
  ),
  http.get('*/api/close', route('books.view', 300, monthClose)),
  http.post(
    '*/api/close/stock-count',
    route('books.post', 300, ({ role }) => recordStockCount(role)),
  ),
  http.post(
    '*/api/close/lock',
    route('close.lock', 500, async ({ request, role }) =>
      lockMonth(String((await body<Body>(request)).reason ?? ''), role),
    ),
  ),
  http.post(
    '*/api/close/reopen',
    route('close.lock', 500, async ({ request, role }) =>
      reopenMonth(String((await body<Body>(request)).reason ?? ''), role),
    ),
  ),
]

/** Fake API — each route mirrors one the real backend will provide. */
export const handlers = [...authHandlers, ...salesHandlers, ...purchaseHandlers, ...bookHandlers]
