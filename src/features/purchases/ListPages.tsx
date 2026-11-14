import { FileInput, FileText, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button, ButtonLink } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Alert } from '@/components/ui/Feedback'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { columnHelper } from '@/components/ui/table-features'
import { formatDate } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { useSession } from '@/lib/session-context'
import { money, sum } from '@/lib/money'
import type { PurchaseOrder, Quote, ReceivedPayment, Vendor } from '@/types/domain'
import { useConvertQuote, useOrders, usePayments, useQuotes, useVendors } from './api'
import { OrderStatusBadge, QuoteStatusBadge } from './badges'

/** Shared frame for the simple list screens: header, search, loading/error/empty, table. */
function ListFrame({
  title,
  summary,
  actions,
  filters,
  query,
  onQuery,
  loading,
  error,
  onRetry,
  errorTitle,
  children,
}: {
  title: string
  summary?: React.ReactNode
  actions?: React.ReactNode
  filters?: React.ReactNode
  query: string
  onQuery: (q: string) => void
  loading: boolean
  error: boolean
  onRetry: () => void
  errorTitle: string
  children: React.ReactNode
}) {
  const { t } = useLocale()
  return (
    <>
      <PageHeader title={title} description={!loading && !error ? summary : undefined} actions={actions} />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          {filters ?? <span />}
          <SearchInput
            label={t('search.label')}
            value={query}
            onChange={onQuery}
            placeholder={t('search.ph')}
          />
        </div>
        {loading && (
          <div className="px-5 pb-5">
            <Skeleton label={t('loading')} />
          </div>
        )}
        {error && (
          <ErrorState
            title={errorTitle}
            hint={t('error.hint')}
            onRetry={onRetry}
            retryLabel={t('btn.tryAgain')}
          />
        )}
        {!loading && !error && children}
      </Card>
    </>
  )
}

const has = (q: string, ...parts: string[]) =>
  !q.trim() || parts.join(' ').toLowerCase().includes(q.trim().toLowerCase())

// ── Vendors ─────────────────────────────────────────────
const EV: Vendor[] = []
export function VendorsPage() {
  const { t } = useLocale()
  const { data = EV, isPending, isError, refetch } = useVendors()
  const [query, setQuery] = useState('')
  const columns = useMemo(() => {
    const col = columnHelper<Vendor>()
    return col.columns([
      col.accessor('name', {
        header: t('bills.vendor'),
        cell: (c) => <span className="font-semibold">{c.getValue()}</span>,
      }),
      col.accessor('phone', {
        header: t('cust.phone'),
        meta: { hideOnPhone: true },
        cell: (c) => <bdi dir="ltr">{c.getValue()}</bdi>,
      }),
      col.accessor('openBills', { header: t('vend.openBills'), meta: { numeric: true } }),
      col.accessor((r) => Number(r.overdue), {
        id: 'overdue',
        header: t('cust.overdue'),
        meta: { numeric: true },
        cell: (c) =>
          money(c.row.original.overdue).isZero() ? (
            <span className="text-ink-subtle">—</span>
          ) : (
            <Amount value={c.row.original.overdue} className="text-alert font-bold" />
          ),
      }),
      col.accessor((r) => Number(r.owed), {
        id: 'owed',
        header: t('vend.weOwe'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.owed} className="font-semibold" />,
      }),
    ])
  }, [t])
  const rows = data.filter((v) => has(query, v.name, v.phone))
  return (
    <ListFrame
      title={t('nav.vendors')}
      summary={
        <span>
          {data.length} {t('vend.count')} ·{' '}
          <Amount value={sum(data.map((v) => v.owed))} className="text-ink font-semibold" /> {t('vend.owed')}
        </span>
      }
      query={query}
      onQuery={setQuery}
      loading={isPending}
      error={isError}
      onRetry={() => refetch()}
      errorTitle={t('vend.loadError')}
    >
      <DataTable
        caption={t('nav.vendors')}
        columns={columns}
        data={rows}
        empty={<EmptyState title={t('vend.empty')} />}
      />
    </ListFrame>
  )
}

// ── Purchase orders ─────────────────────────────────────
const EO: PurchaseOrder[] = []
export function OrdersPage() {
  const { t, locale } = useLocale()
  const { can } = useSession()
  const navigate = useNavigate()
  const { data = EO, isPending, isError, refetch } = useOrders()
  const [query, setQuery] = useState('')
  const columns = useMemo(() => {
    const col = columnHelper<PurchaseOrder>()
    return col.columns([
      col.accessor('id', {
        header: t('po.number'),
        cell: (c) => (
          <bdi dir="ltr" className="font-semibold">
            {c.getValue()}
          </bdi>
        ),
      }),
      col.accessor('vendorName', { header: t('bills.vendor') }),
      col.accessor('expectedDate', {
        header: t('po.expected'),
        cell: (c) => formatDate(c.getValue(), locale),
      }),
      col.display({
        id: 'progress',
        header: t('po.received'),
        meta: { hideOnPhone: true },
        cell: (c) => {
          const o = c.row.original
          const got = o.lines.reduce((s, l) => s + l.received, 0)
          const want = o.lines.reduce((s, l) => s + l.ordered, 0)
          return (
            <span className="flex items-center gap-2">
              <span className="bg-mist-soft h-2 w-20 overflow-hidden rounded-full" aria-hidden>
                <span className="bg-slate block h-full" style={{ width: `${(got / want) * 100}%` }} />
              </span>
              <bdi dir="ltr" className="text-ink-muted text-xs tabular-nums">
                {got}/{want}
              </bdi>
            </span>
          )
        },
      }),
      col.accessor((r) => Number(r.total), {
        id: 'total',
        header: t('table.total'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.total} className="font-semibold" />,
      }),
      col.accessor('status', {
        header: t('table.status'),
        enableSorting: false,
        cell: (c) => <OrderStatusBadge status={c.getValue()} />,
      }),
      col.display({
        id: 'action',
        header: '',
        cell: (c) =>
          c.row.original.status !== 'received' && can('purchases.edit') ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<FileInput aria-hidden className="size-4" />}
              onClick={() => navigate(`/bills/new?po=${c.row.original.id}`)}
            >
              {t('po.enterBill')}
            </Button>
          ) : null,
      }),
    ])
  }, [t, locale, navigate, can])
  const rows = data.filter((o) => has(query, o.id, o.vendorName))
  return (
    <ListFrame
      title={t('nav.orders')}
      query={query}
      onQuery={setQuery}
      loading={isPending}
      error={isError}
      onRetry={() => refetch()}
      errorTitle={t('po.loadError')}
    >
      <DataTable
        caption={t('nav.orders')}
        columns={columns}
        data={rows}
        empty={<EmptyState title={t('empty.filtered')} />}
      />
    </ListFrame>
  )
}

// ── Quotes ──────────────────────────────────────────────
const EQ: Quote[] = []
export function QuotesPage() {
  const { t, locale } = useLocale()
  const { can } = useSession()
  const { data = EQ, isPending, isError, refetch } = useQuotes()
  const convert = useConvertQuote()
  const [query, setQuery] = useState('')
  const [made, setMade] = useState<string | null>(null)
  const columns = useMemo(() => {
    const col = columnHelper<Quote>()
    return col.columns([
      col.accessor('id', {
        header: t('q.number'),
        cell: (c) => (
          <bdi dir="ltr" className="font-semibold">
            {c.getValue()}
          </bdi>
        ),
      }),
      col.accessor('customerName', { header: t('field.customer') }),
      col.accessor('validUntil', {
        header: t('q.validUntil'),
        meta: { hideOnPhone: true },
        cell: (c) => formatDate(c.getValue(), locale),
      }),
      col.accessor((r) => Number(r.total), {
        id: 'total',
        header: t('table.total'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.total} className="font-semibold" />,
      }),
      col.accessor('status', {
        header: t('table.status'),
        enableSorting: false,
        cell: (c) => <QuoteStatusBadge status={c.getValue()} />,
      }),
      col.display({
        id: 'action',
        header: '',
        cell: (c) => {
          const q = c.row.original
          if (q.invoiceId)
            return (
              <Link to={`/invoices/${q.invoiceId}`} className="text-slate text-sm font-semibold underline">
                {t('q.openInvoice')}
              </Link>
            )
          if ((q.status !== 'sent' && q.status !== 'accepted') || !can('sales.edit')) return null
          return (
            <Button
              size="sm"
              variant={q.status === 'accepted' ? 'primary' : 'secondary'}
              icon={<FileText aria-hidden className="size-4" />}
              loading={convert.isPending && convert.variables === q.id}
              onClick={async () => setMade((await convert.mutateAsync(q.id)).id)}
            >
              {t('q.convert')}
            </Button>
          )
        },
      }),
    ])
  }, [t, locale, convert, can])
  const rows = data.filter((q) => has(query, q.id, q.customerName))
  return (
    <>
      {made && (
        <div className="mb-4">
          <Alert
            tone="success"
            title={t('q.converted')}
            action={
              <ButtonLink size="sm" variant="secondary" to={`/invoices/${made}`}>
                {t('q.openInvoice')}
              </ButtonLink>
            }
          />
        </div>
      )}
      <ListFrame
        title={t('nav.quotes')}
        actions={
          can('sales.edit') ? (
            <ButtonLink to="/invoices/new" variant="secondary" icon={<Plus aria-hidden className="size-4" />}>
              {t('btn.newInvoice')}
            </ButtonLink>
          ) : undefined
        }
        query={query}
        onQuery={setQuery}
        loading={isPending}
        error={isError}
        onRetry={() => refetch()}
        errorTitle={t('q.loadError')}
      >
        <DataTable
          caption={t('nav.quotes')}
          columns={columns}
          data={rows}
          empty={<EmptyState title={t('empty.filtered')} />}
        />
      </ListFrame>
    </>
  )
}

// ── Payments received ──────────────────────────────────
const EP: ReceivedPayment[] = []
type PF = 'all' | 'unmatched'
export function PaymentsPage() {
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const { data = EP, isPending, isError, refetch } = usePayments()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PF>('all')
  const columns = useMemo(() => {
    const col = columnHelper<ReceivedPayment>()
    return col.columns([
      col.accessor('date', { header: t('pr.date'), cell: (c) => formatDate(c.getValue(), locale) }),
      col.accessor('customerName', { header: t('field.customer') }),
      col.accessor('invoiceNumber', {
        header: t('pr.invoice'),
        cell: (c) => <bdi dir="ltr">{c.getValue()}</bdi>,
      }),
      col.accessor('accountId', {
        header: t('pr.account'),
        meta: { hideOnPhone: true },
        cell: (c) => (c.getValue() ? t(`acct.${c.getValue()}` as MessageKey) : t('f.credit')),
      }),
      col.accessor('reference', {
        header: t('f.reference'),
        meta: { hideOnPhone: true },
        cell: (c) => (
          <bdi dir="ltr" className="text-ink-muted">
            {c.getValue() || '—'}
          </bdi>
        ),
      }),
      col.accessor((r) => Number(r.amount), {
        id: 'amount',
        header: t('det.amount'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.amount} className="font-semibold" />,
      }),
      col.accessor('matched', {
        header: t('pr.matching'),
        enableSorting: false,
        cell: (c) => (
          <span className={c.getValue() ? 'text-slate text-xs font-semibold' : 'text-ink-muted text-xs'}>
            {c.getValue() ? `✓ ${t('pay.matched')}` : t('pr.unmatched')}
          </span>
        ),
      }),
    ])
  }, [t, locale])
  const rows = data.filter(
    (p) => (filter === 'all' || !p.matched) && has(query, p.customerName, p.invoiceNumber, p.reference),
  )
  return (
    <ListFrame
      title={t('nav.payments')}
      summary={
        <span>
          {data.length} {t('pr.count')} ·{' '}
          <Amount value={sum(data.map((p) => p.amount))} className="text-ink font-semibold" />{' '}
          {t('pr.received')}
        </span>
      }
      filters={
        <FilterTabs
          label={t('pr.matching')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('filter.all'), count: data.length },
            { value: 'unmatched', label: t('pr.unmatched'), count: data.filter((p) => !p.matched).length },
          ]}
        />
      }
      query={query}
      onQuery={setQuery}
      loading={isPending}
      error={isError}
      onRetry={() => refetch()}
      errorTitle={t('pr.loadError')}
    >
      <DataTable
        caption={t('nav.payments')}
        columns={columns}
        data={rows}
        onOpen={(p) => navigate(`/invoices/${p.invoiceId}`)}
        empty={<EmptyState title={t('empty.filtered')} />}
      />
    </ListFrame>
  )
}
