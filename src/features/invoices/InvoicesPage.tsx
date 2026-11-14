import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { ButtonLink } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { useLocale } from '@/lib/i18n-context'
import { sum } from '@/lib/money'
import type { Invoice } from '@/types/domain'
import { useInvoices } from './api'
import { invoiceColumns } from './columns'

type Filter = 'all' | 'draft' | 'unpaid' | 'overdue' | 'paid'
const match: Record<Filter, (x: Invoice) => boolean> = {
  all: () => true,
  draft: (x) => x.status === 'draft',
  unpaid: (x) => x.status === 'sent' || x.status === 'partial' || x.status === 'overdue',
  overdue: (x) => x.status === 'overdue',
  paid: (x) => x.status === 'paid',
}
const EMPTY: Invoice[] = []

export function InvoicesPage() {
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const { data = EMPTY, isPending, isError, refetch } = useInvoices()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const columns = useMemo(() => invoiceColumns(t, locale, { withIssued: true }), [t, locale])
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = data.filter(
      (x) => match[filter](x) && (!q || `${x.number} ${x.customerName}`.toLowerCase().includes(q)),
    )
    // "Unpaid" and "Overdue" put the oldest due date first — those need chasing.
    return filter === 'unpaid' || filter === 'overdue'
      ? [...list].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      : list
  }, [data, filter, query])

  return (
    <>
      <PageHeader
        title={t('inv.title')}
        description={
          !isPending && !isError ? (
            <span>
              {rows.length} {t('inv.shown')} ·{' '}
              <Amount value={sum(rows.map((r) => r.due))} className="text-ink font-semibold" />{' '}
              {t('inv.dueInView')}
            </span>
          ) : undefined
        }
        actions={
          <ButtonLink to="/invoices/new" icon={<Plus aria-hidden className="size-4" />}>
            {t('btn.newInvoice')}
          </ButtonLink>
        }
      />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            label={t('filter.label')}
            value={filter}
            onChange={setFilter}
            options={(['all', 'draft', 'unpaid', 'overdue', 'paid'] as const).map((f) => ({
              value: f,
              label: t(`filter.${f}`),
              count: data.filter(match[f]).length,
            }))}
          />
          <SearchInput
            label={t('search.label')}
            value={query}
            onChange={setQuery}
            placeholder={t('search.ph')}
          />
        </div>
        {isPending && (
          <div className="px-5 pb-5">
            <Skeleton rows={8} label={t('loading')} />
          </div>
        )}
        {isError && (
          <ErrorState
            title={t('error.title')}
            hint={t('error.hint')}
            onRetry={() => refetch()}
            retryLabel={t('btn.tryAgain')}
          />
        )}
        {!isPending && !isError && (
          <DataTable
            caption={t('inv.title')}
            columns={columns}
            data={rows}
            onOpen={(inv) => navigate(`/invoices/${inv.id}`)}
            empty={
              data.length === 0 ? (
                <EmptyState title={t('empty.title')} hint={t('empty.hint')} />
              ) : (
                <EmptyState title={t('empty.filtered')} />
              )
            }
          />
        )}
      </Card>
    </>
  )
}
