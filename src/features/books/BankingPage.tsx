import { ArrowLeftRight, CheckCircle2, ListChecks } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button, ButtonLink } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Alert } from '@/components/ui/Feedback'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { columnHelper } from '@/components/ui/table-features'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import type { AccountId, BankTxn, MoneyAccount } from '@/types/domain'
import { useAccounts } from '../purchases/api'
import { useTransactions } from './api'
import { useParty } from './party'
import { TransferDrawer } from './TransferDrawer'

const ET: BankTxn[] = []
const EA: MoneyAccount[] = []
type Show = 'all' | AccountId

export function BankingPage() {
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const party = useParty()
  const { data: accounts = EA, isPending: l1 } = useAccounts()
  const { data: txns = ET, isPending: l2, isError, refetch } = useTransactions()
  const [show, setShow] = useState<Show>('all')
  const [query, setQuery] = useState('')
  const [transferOpen, setTransferOpen] = useState(false)
  const [moved, setMoved] = useState(false)

  const columns = useMemo(() => {
    const col = columnHelper<BankTxn>()
    return col.columns([
      col.accessor('date', { header: t('je.date'), cell: (c) => formatDate(c.getValue(), locale) }),
      col.accessor('party', {
        header: t('bank.details'),
        cell: (c) => {
          const x = c.row.original
          return (
            <span className="flex min-w-56 flex-col whitespace-normal">
              <span className="font-semibold">{party(x)}</span>
              <span className="text-ink-muted text-xs">
                {t(`txk.${x.kind}` as MessageKey)}
                {x.link && (
                  <>
                    {' · '}
                    <bdi dir="ltr">{x.link.id}</bdi>
                  </>
                )}
                {x.reference && x.reference !== x.link?.id && (
                  <>
                    {' · '}
                    <bdi dir="ltr">{x.reference}</bdi>
                  </>
                )}
              </span>
            </span>
          )
        },
      }),
      ...(show === 'all'
        ? [
            col.accessor('accountId', {
              header: t('pr.account'),
              meta: { hideOnPhone: true },
              cell: (c) => t(`acct.${c.getValue()}` as MessageKey),
            }),
          ]
        : []),
      col.accessor((r) => Number(r.amount), {
        id: 'in',
        header: t('bank.in'),
        meta: { numeric: true, hideOnPhoneWhen: (r) => !money(r.amount).isPositive() },
        cell: (c) =>
          money(c.row.original.amount).isPositive() ? (
            <Amount value={c.row.original.amount} className="font-semibold" />
          ) : null,
      }),
      col.accessor((r) => -Number(r.amount), {
        id: 'out',
        header: t('bank.out'),
        meta: { numeric: true, hideOnPhoneWhen: (r) => !money(r.amount).isNegative() },
        cell: (c) =>
          money(c.row.original.amount).isNegative() ? (
            <Amount value={money(c.row.original.amount).abs()} className="text-ink-muted" />
          ) : null,
      }),
      ...(show !== 'all'
        ? [
            col.accessor((r) => Number(r.balanceAfter), {
              id: 'balance',
              header: t('bank.balance'),
              meta: { numeric: true, hideOnPhone: true },
              enableSorting: false,
              cell: (c) => <Amount value={c.row.original.balanceAfter} />,
            }),
          ]
        : []),
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
  }, [t, locale, show, party])

  const q = query.trim().toLowerCase()
  const rows = txns.filter(
    (x) =>
      (show === 'all' || x.accountId === show) &&
      (!q || [party(x), x.reference, x.link?.id ?? ''].join(' ').toLowerCase().includes(q)),
  )
  const loading = l1 || l2

  return (
    <>
      <PageHeader
        title={t('nav.banking')}
        description={t('bank.intro')}
        actions={
          <>
            <ButtonLink
              to="/reconcile"
              variant="secondary"
              icon={<ListChecks aria-hidden className="size-4" />}
            >
              {t('nav.reconcile')}
            </ButtonLink>
            <Button
              icon={<ArrowLeftRight aria-hidden className="size-4" />}
              onClick={() => {
                setMoved(false)
                setTransferOpen(true)
              }}
              disabled={loading}
            >
              {t('bank.transfer')}
            </Button>
          </>
        }
      />

      {moved && (
        <div className="mb-4">
          <Alert tone="success" title={t('tr.done')} />
        </div>
      )}

      {loading && <Skeleton rows={6} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('bank.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}

      {!loading && !isError && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <section className="fog-soft border-line rounded-card shadow-card border p-5">
              <h2 className="text-ink-muted text-sm">{t('bank.total')}</h2>
              <p className="mt-1 text-2xl font-extrabold">
                <Amount value={sum(accounts.map((a) => a.balance))} />
              </p>
              <p className="text-ink-muted mt-1 text-sm">
                {t('dash.across')} {accounts.length} {t('dash.accountsWord')}
              </p>
            </section>
            {accounts.map((a) => {
              const on = show === a.id
              return (
                <section
                  key={a.id}
                  className={cn(
                    'bg-panel rounded-card shadow-card flex flex-col border p-5',
                    on ? 'border-slate border-2' : 'border-line',
                  )}
                >
                  <h2 className="text-ink-muted text-sm">{t(`acct.${a.id}` as MessageKey)}</h2>
                  <p className="mt-1 text-2xl font-extrabold">
                    <Amount value={a.balance} />
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-sm">
                    {a.unmatched > 0 ? (
                      <ButtonLink
                        to={`/reconcile?account=${a.id}`}
                        size="sm"
                        variant="quiet"
                        className="-ms-2"
                      >
                        {a.unmatched} {t('bank.toMatch')}
                      </ButtonLink>
                    ) : (
                      <span className="text-slate inline-flex items-center gap-1 font-semibold">
                        <CheckCircle2 aria-hidden className="size-4" />
                        {t('bank.allMatched')}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-pressed={on}
                      onClick={() => setShow(on ? 'all' : a.id)}
                    >
                      {t('bank.showAccount')}
                    </Button>
                  </div>
                </section>
              )
            })}
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <FilterTabs
                label={t('bank.showAccount')}
                value={show}
                onChange={setShow}
                options={[
                  { value: 'all', label: t('filter.all'), count: txns.length },
                  ...accounts.map((a) => ({
                    value: a.id,
                    label: t(`acct.${a.id}` as MessageKey),
                    count: txns.filter((x) => x.accountId === a.id).length,
                  })),
                ]}
              />
              <SearchInput
                label={t('bank.search')}
                value={query}
                onChange={setQuery}
                placeholder={t('bank.searchPh')}
              />
            </div>
            <DataTable
              caption={t('nav.banking')}
              columns={columns}
              data={rows}
              onOpen={(x) =>
                x.link && navigate(x.link.kind === 'invoice' ? `/invoices/${x.link.id}` : '/bills')
              }
              empty={<EmptyState title={t('bank.empty')} />}
            />
          </Card>
        </div>
      )}

      <TransferDrawer
        open={transferOpen}
        accounts={accounts}
        onClose={() => setTransferOpen(false)}
        onDone={() => {
          setTransferOpen(false)
          setMoved(true)
        }}
      />
    </>
  )
}
