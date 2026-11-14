import { HandCoins, Plus, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Amount } from '@/components/ui/Amount'
import { Button, ButtonLink } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Alert } from '@/components/ui/Feedback'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { Dialog } from '@/components/ui/Overlay'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { columnHelper } from '@/components/ui/table-features'
import { formatDate } from '@/lib/dates'
import { useLocale } from '@/lib/i18n-context'
import { useSession } from '@/lib/session-context'
import { sum } from '@/lib/money'
import type { Bill } from '@/types/domain'
import { useApproveBill, useBills } from './api'
import { BillStatusBadge } from './badges'

type Filter = 'all' | 'open' | 'approval' | 'overdue' | 'paid'
const match: Record<Filter, (b: Bill) => boolean> = {
  all: () => true,
  open: (b) => b.status !== 'paid',
  approval: (b) => b.status === 'approval',
  overdue: (b) => b.status === 'overdue',
  paid: (b) => b.status === 'paid',
}
const EMPTY: Bill[] = []

export function BillsPage() {
  const { t, locale } = useLocale()
  const { can } = useSession()
  const { data = EMPTY, isPending, isError, refetch } = useBills()
  const approve = useApproveBill()
  const [filter, setFilter] = useState<Filter>('open')
  const [query, setQuery] = useState('')
  const [confirm, setConfirm] = useState<Bill | null>(null)
  const [approvedId, setApprovedId] = useState<string | null>(null)

  const columns = useMemo(() => {
    const col = columnHelper<Bill>()
    return col.columns([
      col.accessor('id', {
        header: t('bills.number'),
        cell: (c) => (
          <span className="flex flex-col">
            <bdi dir="ltr" className="font-semibold">
              {c.getValue()}
            </bdi>
            <bdi dir="ltr" className="text-ink-muted text-start text-xs">
              {c.row.original.vendorRef}
            </bdi>
          </span>
        ),
      }),
      col.accessor('vendorName', { header: t('bills.vendor') }),
      col.accessor('dueDate', { header: t('bills.due'), cell: (c) => formatDate(c.getValue(), locale) }),
      col.accessor((r) => Number(r.due), {
        id: 'due',
        header: t('bills.amountDue'),
        meta: { numeric: true },
        cell: (c) => (
          <Amount
            value={c.row.original.due}
            className={Number(c.row.original.due) === 0 ? 'text-ink-subtle' : 'font-semibold'}
          />
        ),
      }),
      col.accessor('status', {
        header: t('table.status'),
        enableSorting: false,
        cell: (c) => <BillStatusBadge status={c.getValue()} />,
      }),
      col.display({
        id: 'action',
        header: '',
        cell: (c) =>
          c.row.original.status === 'approval' && can('bills.approve') ? (
            <Button
              size="sm"
              icon={<ShieldCheck aria-hidden className="size-4" />}
              onClick={(e) => {
                e.stopPropagation()
                setConfirm(c.row.original)
              }}
            >
              {t('bills.approve')}
            </Button>
          ) : null,
      }),
    ])
  }, [t, locale, can])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data
      .filter(
        (b) => match[filter](b) && (!q || `${b.id} ${b.vendorRef} ${b.vendorName}`.toLowerCase().includes(q)),
      )
      .sort((a, b) =>
        filter === 'paid' ? b.billDate.localeCompare(a.billDate) : a.dueDate.localeCompare(b.dueDate),
      )
  }, [data, filter, query])

  const open = data.filter(match.open)

  return (
    <>
      <PageHeader
        title={t('nav.bills')}
        description={
          !isPending && !isError ? (
            <span>
              {open.length} {t('bills.count')} ·{' '}
              <Amount value={sum(open.map((b) => b.due))} className="text-ink font-semibold" />{' '}
              {t('bills.owed')}
            </span>
          ) : undefined
        }
        actions={
          <>
            {can('bills.pay') && (
              <ButtonLink
                to="/bills/pay"
                variant="secondary"
                icon={<HandCoins aria-hidden className="size-4" />}
              >
                {t('bills.pay')}
              </ButtonLink>
            )}
            {can('purchases.edit') && (
              <ButtonLink to="/bills/new" icon={<Plus aria-hidden className="size-4" />}>
                {t('bills.new')}
              </ButtonLink>
            )}
          </>
        }
      />
      {approvedId && (
        <div className="mb-4">
          <Alert tone="success" title={`${t('approve.done')} · ${approvedId}`} />
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            label={t('filter.label')}
            value={filter}
            onChange={setFilter}
            options={(['open', 'approval', 'overdue', 'paid', 'all'] as const).map((f) => ({
              value: f,
              label: f === 'open' ? t('bfilter.open') : f === 'all' ? t('filter.all') : t(`bstatus.${f}`),
              count: data.filter(match[f]).length,
            }))}
          />
          <SearchInput
            label={t('search.label')}
            value={query}
            onChange={setQuery}
            placeholder={t('bills.vendor')}
          />
        </div>
        {isPending && (
          <div className="px-5 pb-5">
            <Skeleton rows={6} label={t('loading')} />
          </div>
        )}
        {isError && (
          <ErrorState
            title={t('bills.loadError')}
            hint={t('error.hint')}
            onRetry={() => refetch()}
            retryLabel={t('btn.tryAgain')}
          />
        )}
        {!isPending && !isError && (
          <DataTable
            caption={t('nav.bills')}
            columns={columns}
            data={rows}
            empty={<EmptyState title={t('bills.empty')} />}
          />
        )}
      </Card>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={t('approve.title')}
        description={t('approve.body')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              {t('btn.cancel')}
            </Button>
            <Button
              loading={approve.isPending}
              icon={<ShieldCheck aria-hidden className="size-4" />}
              onClick={async () => {
                const b = await approve.mutateAsync(confirm!.id)
                setConfirm(null)
                setApprovedId(b.id)
              }}
            >
              {t('bills.approve')}
            </Button>
          </>
        }
      >
        {confirm && (
          <div className="bg-mist-soft rounded-card flex justify-between gap-3 p-3 text-sm">
            <span>
              <bdi dir="ltr" className="font-semibold">
                {confirm.id}
              </bdi>{' '}
              · {confirm.vendorName}
            </span>
            <Amount value={confirm.total} className="font-bold" />
          </div>
        )}
      </Dialog>
    </>
  )
}
