import { AlertTriangle, Check } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Amount } from '@/components/ui/Amount'
import { DataTable } from '@/components/ui/DataTable'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { columnHelper } from '@/components/ui/table-features'
import { useLocale } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import type { Item } from '@/types/domain'
import { useItems } from './api'

type Filter = 'all' | 'low'
const EMPTY: Item[] = []
const isLow = (i: Item) => i.stock <= i.reorderLevel
const value = (i: Item) => money(i.unitPrice).times(i.stock)

export function ItemsPage() {
  const { t } = useLocale()
  const { data = EMPTY, isPending, isError, refetch } = useItems()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const columns = useMemo(() => {
    const col = columnHelper<Item>()
    return col.columns([
      col.accessor('name', {
        header: t('lines.item'),
        cell: (c) => <span className="font-semibold">{c.getValue()}</span>,
      }),
      col.accessor((r) => Number(r.unitPrice), {
        id: 'price',
        header: t('lines.price'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.unitPrice} />,
      }),
      col.accessor('stock', { header: t('lines.inStock'), meta: { numeric: true } }),
      col.accessor('reorderLevel', {
        header: t('items.reorder'),
        meta: { numeric: true, hideOnPhone: true },
      }),
      col.accessor((r) => value(r).toNumber(), {
        id: 'value',
        header: t('items.value'),
        meta: { numeric: true, hideOnPhone: true },
        cell: (c) => <Amount value={value(c.row.original)} />,
      }),
      col.display({
        id: 'status',
        header: t('items.status'),
        cell: (c) =>
          isLow(c.row.original) ? (
            <span className="border-slate text-slate inline-flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-xs font-bold">
              <AlertTriangle aria-hidden className="size-3.5" />
              {t('lines.low')}
            </span>
          ) : (
            <span className="bg-mist-soft text-slate inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
              <Check aria-hidden className="size-3.5" />
              {t('items.ok')}
            </span>
          ),
      }),
    ])
  }, [t])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.filter((i) => (filter === 'all' || isLow(i)) && (!q || i.name.toLowerCase().includes(q)))
  }, [data, filter, query])

  return (
    <>
      <PageHeader
        title={t('nav.items')}
        description={
          !isPending && !isError ? (
            <span>
              {data.length} {t('items.count')} ·{' '}
              <Amount value={sum(data.map(value))} className="text-ink font-semibold" />{' '}
              {t('items.stockValue')}
            </span>
          ) : undefined
        }
      />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <FilterTabs
            label={t('items.search')}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: t('filter.all'), count: data.length },
              { value: 'low', label: t('items.filterLow'), count: data.filter(isLow).length },
            ]}
          />
          <SearchInput
            label={t('items.search')}
            value={query}
            onChange={setQuery}
            placeholder={t('items.searchPh')}
          />
        </div>
        {isPending && (
          <div className="px-5 pb-5">
            <Skeleton label={t('loading')} />
          </div>
        )}
        {isError && (
          <ErrorState
            title={t('items.loadError')}
            hint={t('error.hint')}
            onRetry={() => refetch()}
            retryLabel={t('btn.tryAgain')}
          />
        )}
        {!isPending && !isError && (
          <DataTable
            caption={t('nav.items')}
            columns={columns}
            data={rows}
            empty={<EmptyState title={t('items.empty')} />}
          />
        )}
      </Card>
    </>
  )
}
