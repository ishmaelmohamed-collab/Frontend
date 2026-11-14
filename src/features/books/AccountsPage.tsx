import { Plus } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Alert } from '@/components/ui/Feedback'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { Drawer } from '@/components/ui/Overlay'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { columnHelper } from '@/components/ui/table-features'
import { formatDate } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import type { JournalEntry, LedgerAccount, LedgerType } from '@/types/domain'
import { useJournal, useLedger } from './api'
import { JournalDrawer } from './JournalDrawer'

type View = 'chart' | 'journal'
const TYPES: LedgerType[] = ['asset', 'liability', 'equity', 'income', 'expense']

export function AccountsPage() {
  const { t } = useLocale()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'journal' ? 'journal' : 'chart'
  const [newOpen, setNewOpen] = useState(false)
  const [posted, setPosted] = useState<string | null>(null)

  return (
    <>
      <PageHeader
        title={t('nav.accounts')}
        description={t('acc.intro')}
        actions={
          <Button
            icon={<Plus aria-hidden className="size-4" />}
            onClick={() => {
              setPosted(null)
              setNewOpen(true)
            }}
          >
            {t('je.new')}
          </Button>
        }
      />
      {posted && (
        <div className="mb-4">
          <Alert tone="success" title={t('je.posted')}>
            <bdi dir="ltr">{posted}</bdi>
          </Alert>
        </div>
      )}
      <div className="mb-5">
        <FilterTabs
          label={t('acc.view')}
          value={view}
          onChange={(v) => setParams(v === 'journal' ? { view: v } : {}, { replace: true })}
          options={[
            { value: 'chart', label: t('acc.chart') },
            { value: 'journal', label: t('acc.journal') },
          ]}
        />
      </div>
      {view === 'chart' ? <Chart /> : <Journal />}
      <JournalDrawer
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onPosted={(e) => {
          setNewOpen(false)
          setPosted(e.reference)
          setParams({ view: 'journal' }, { replace: true })
        }}
      />
    </>
  )
}

// ── Chart of accounts (doubles as the trial balance) ───
const EL: LedgerAccount[] = []
function Chart() {
  const { t } = useLocale()
  const { data = EL, isPending, isError, refetch } = useLedger()
  if (isPending) return <Skeleton rows={8} label={t('loading')} />
  if (isError)
    return (
      <ErrorState
        title={t('acc.loadError')}
        hint={t('error.hint')}
        onRetry={() => refetch()}
        retryLabel={t('btn.tryAgain')}
      />
    )
  const debit = sum(data.map((a) => a.debit))
  const credit = sum(data.map((a) => a.credit))
  return (
    <Card className="overflow-hidden">
      <p className="text-ink-muted px-5 pt-5 text-sm">{t('acc.autoHint')}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t('acc.chart')}</caption>
          <thead className="bg-mist-soft text-ink-muted text-xs">
            <tr>
              <th scope="col" className="border-line border-y px-4 py-2.5 ps-5 text-start font-semibold">
                {t('acc.code')}
              </th>
              <th scope="col" className="border-line border-y px-4 py-2.5 text-start font-semibold">
                {t('acc.name')}
              </th>
              <th
                scope="col"
                className="border-line hidden border-y px-4 py-2.5 text-end font-semibold md:table-cell"
              >
                {t('acc.debit')}
              </th>
              <th
                scope="col"
                className="border-line hidden border-y px-4 py-2.5 text-end font-semibold md:table-cell"
              >
                {t('acc.credit')}
              </th>
              <th scope="col" className="border-line border-y px-4 py-2.5 pe-5 text-end font-semibold">
                {t('acc.balance')}
              </th>
            </tr>
          </thead>
          <tbody>
            {TYPES.map((type) => {
              const rows = data.filter((a) => a.type === type)
              return (
                <Fragment key={type}>
                  <tr>
                    <th
                      scope="rowgroup"
                      colSpan={5}
                      className="border-line text-ink border-b px-5 pt-5 pb-2 text-start text-sm font-bold"
                    >
                      {t(`ltype.${type}` as MessageKey)}
                    </th>
                  </tr>
                  {rows.map((a) => (
                    <tr key={a.code} className="border-line border-b">
                      <td className="text-ink-muted px-4 py-2.5 ps-5 tabular-nums">{a.code}</td>
                      <td className="px-4 py-2.5">
                        <span className="flex flex-wrap items-center gap-2">
                          {t(`coa.${a.code}` as MessageKey)}
                          {a.system && (
                            <span className="bg-mist text-slate rounded-full px-2 py-0.5 text-xs font-semibold">
                              {t('acc.auto')}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-end md:table-cell">
                        <Amount value={a.debit} className="text-ink-muted" />
                      </td>
                      <td className="hidden px-4 py-2.5 text-end md:table-cell">
                        <Amount value={a.credit} className="text-ink-muted" />
                      </td>
                      <td className="px-4 py-2.5 pe-5 text-end">
                        <Amount value={a.balance} className="font-semibold" />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      colSpan={4}
                      className="text-ink-muted hidden px-4 py-2 text-end text-xs md:table-cell"
                    >
                      {t('dash.total')} · {t(`ltype.${type}` as MessageKey)}
                    </td>
                    <td colSpan={2} className="text-ink-muted px-4 py-2 text-end text-xs md:hidden">
                      {t('dash.total')}
                    </td>
                    <td className="px-4 py-2 pe-5 text-end">
                      <Amount value={sum(rows.map((a) => a.balance))} className="font-bold" />
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
          <tfoot className="bg-mist-soft">
            <tr>
              <th scope="row" colSpan={2} className="px-4 py-3 ps-5 text-start font-bold">
                {t('acc.totals')}
                <span className="text-slate ms-2 text-xs font-semibold">
                  {debit.eq(credit) ? `✓ ${t('close.balanced')}` : t('close.unbalanced')}
                </span>
              </th>
              <td className="hidden px-4 py-3 text-end md:table-cell">
                <Amount value={debit} className="font-bold" />
              </td>
              <td className="hidden px-4 py-3 text-end md:table-cell">
                <Amount value={credit} className="font-bold" />
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}

// ── Journal ────────────────────────────────────────────
const EJ: JournalEntry[] = []
type JF = 'all' | 'manual'
function Journal() {
  const { t, locale } = useLocale()
  const { data = EJ, isPending, isError, refetch } = useJournal()
  const [filter, setFilter] = useState<JF>('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<JournalEntry | null>(null)

  const columns = useMemo(() => {
    const col = columnHelper<JournalEntry>()
    return col.columns([
      col.accessor('date', { header: t('je.date'), cell: (c) => formatDate(c.getValue(), locale) }),
      col.accessor('source', {
        header: t('je.type'),
        cell: (c) => t(`jsrc.${c.getValue()}` as MessageKey),
      }),
      col.accessor('reference', {
        header: t('je.ref'),
        meta: { hideOnPhone: true },
        cell: (c) => <bdi dir="ltr">{c.getValue() || '—'}</bdi>,
      }),
      col.accessor((r) => r.memo || r.party, {
        id: 'details',
        header: t('je.details'),
        cell: (c) => <span className="block min-w-48 whitespace-normal">{c.getValue() || '—'}</span>,
      }),
      col.accessor((r) => Number(r.total), {
        id: 'total',
        header: t('je.amount'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.total} className="font-semibold" />,
      }),
      col.accessor('by', {
        header: t('je.by'),
        meta: { hideOnPhone: true },
        cell: (c) => t(`role.${c.getValue()}` as MessageKey),
      }),
    ])
  }, [t, locale])

  if (isPending) return <Skeleton rows={8} label={t('loading')} />
  if (isError)
    return (
      <ErrorState
        title={t('je.loadError')}
        hint={t('error.hint')}
        onRetry={() => refetch()}
        retryLabel={t('btn.tryAgain')}
      />
    )
  const q = query.trim().toLowerCase()
  const rows = data.filter(
    (e) =>
      (filter === 'all' || e.source === 'manual') &&
      (!q ||
        [e.reference, e.party, e.memo, t(`jsrc.${e.source}` as MessageKey)]
          .join(' ')
          .toLowerCase()
          .includes(q)),
  )
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          label={t('acc.journal')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('filter.all'), count: data.length },
            {
              value: 'manual',
              label: t('je.manual'),
              count: data.filter((e) => e.source === 'manual').length,
            },
          ]}
        />
        <SearchInput
          label={t('je.search')}
          value={query}
          onChange={setQuery}
          placeholder={t('je.searchPh')}
        />
      </div>
      <DataTable
        caption={t('acc.journal')}
        columns={columns}
        data={rows}
        onOpen={setOpen}
        empty={<EmptyState title={t('je.empty')} />}
      />
      <EntryDrawer entry={open} onClose={() => setOpen(null)} />
    </Card>
  )
}

function EntryDrawer({ entry: e, onClose }: { entry: JournalEntry | null; onClose: () => void }) {
  const { t, locale } = useLocale()
  return (
    <Drawer
      open={!!e}
      onClose={onClose}
      closeLabel={t('btn.close')}
      title={e ? `${t(`jsrc.${e.source}` as MessageKey)}${e.reference ? ` · ${e.reference}` : ''}` : ''}
      description={e ? `${formatDate(e.date, locale)} · ${t(`role.${e.by}` as MessageKey)}` : undefined}
    >
      {e && (
        <div className="flex flex-col gap-4">
          {(e.memo || e.party) && <p className="text-sm">{e.memo || e.party}</p>}
          <table className="w-full text-sm">
            <caption className="sr-only">{t('je.lines')}</caption>
            <thead className="text-ink-muted text-xs">
              <tr className="border-line border-b">
                <th scope="col" className="py-2 text-start font-semibold">
                  {t('acc.name')}
                </th>
                <th scope="col" className="py-2 text-end font-semibold">
                  {t('acc.debit')}
                </th>
                <th scope="col" className="py-2 text-end font-semibold">
                  {t('acc.credit')}
                </th>
              </tr>
            </thead>
            <tbody>
              {e.lines.map((l, i) => (
                <tr key={i} className="border-line border-b">
                  <td className="py-2 pe-2">
                    <span className="text-ink-muted tabular-nums">{l.accountCode}</span>{' '}
                    {t(`coa.${l.accountCode}` as MessageKey)}
                  </td>
                  <td className="py-2 text-end">
                    {money(l.debit).isZero() ? '' : <Amount value={l.debit} />}
                  </td>
                  <td className="py-2 text-end">
                    {money(l.credit).isZero() ? '' : <Amount value={l.credit} />}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-bold">
              <tr>
                <td className="py-2">{t('acc.totals')}</td>
                <td className="py-2 text-end">
                  <Amount value={e.total} />
                </td>
                <td className="py-2 text-end">
                  <Amount value={e.total} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Drawer>
  )
}
