import { useMemo, useState } from 'react'
import { Amount } from '@/components/ui/Amount'
import { DataTable } from '@/components/ui/DataTable'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { columnHelper } from '@/components/ui/table-features'
import { useLocale } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import type { CustomerSummary } from '@/types/domain'
import { useCustomers } from './api'

type Filter = 'all' | 'overdue'
const EMPTY: CustomerSummary[] = []

export function CustomersPage() {
  const { t } = useLocale()
  const { data = EMPTY, isPending, isError, refetch } = useCustomers()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const columns = useMemo(() => {
    const col = columnHelper<CustomerSummary>()
    return col.columns([
      col.accessor('name', {
        header: t('field.customer'),
        cell: (c) => (
          <span className="flex flex-col">
            <span className="font-semibold">{c.getValue()}</span>
            <span dir="ltr" className="text-ink-muted text-start text-xs">
              {c.row.original.email}
            </span>
          </span>
        ),
      }),
      col.accessor('phone', {
        header: t('cust.phone'),
        meta: { hideOnPhone: true },
        cell: (c) => <bdi dir="ltr">{c.getValue()}</bdi>,
      }),
      col.accessor('openInvoices', { header: t('cust.open'), meta: { numeric: true } }),
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
      col.accessor((r) => Number(r.balance), {
        id: 'balance',
        header: t('cust.balance'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.balance} className="font-semibold" />,
      }),
      col.accessor((r) => Number(r.creditLimit), {
        id: 'limit',
        header: t('cust.limit'),
        meta: { numeric: true, hideOnPhone: true },
        cell: (c) => <Amount value={c.row.original.creditLimit} className="text-ink-muted" />,
      }),
    ])
  }, [t])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.filter(
      (c) =>
        (filter === 'all' || money(c.overdue).gt(0)) &&
        (!q || `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q)),
    )
  }, [data, filter, query])

  return (
    <>
      <PageHeader
        title={t('nav.customers')}
        description={
          !isPending && !isError ? (
            <span>
              {data.length} {t('cust.count')} ·{' '}
              <Amount value={sum(data.map((c) => c.balance))} className="text-ink font-semibold" />{' '}
              {t('cust.owed')}
            </span>
          ) : undefined
        }
      />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            label={t('cust.search')}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: t('filter.all'), count: data.length },
              {
                value: 'overdue',
                label: t('cust.filterOverdue'),
                count: data.filter((c) => money(c.overdue).gt(0)).length,
              },
            ]}
          />
          <SearchInput
            label={t('cust.search')}
            value={query}
            onChange={setQuery}
            placeholder={t('cust.searchPh')}
          />
        </div>
        {isPending && (
          <div className="px-5 pb-5">
            <Skeleton label={t('loading')} />
          </div>
        )}
        {isError && (
          <ErrorState
            title={t('cust.loadError')}
            hint={t('error.hint')}
            onRetry={() => refetch()}
            retryLabel={t('btn.tryAgain')}
          />
        )}
        {!isPending && !isError && (
          <DataTable
            caption={t('nav.customers')}
            columns={columns}
            data={rows}
            empty={<EmptyState title={t('cust.empty')} />}
          />
        )}
      </Card>
    </>
  )
}
