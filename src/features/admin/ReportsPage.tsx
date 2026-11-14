import { Download, Printer } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { FilterTabs } from '@/components/ui/Filters'
import { Card, PageHeader } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { downloadCsv } from '@/lib/csv'
import { formatDate, todayISO } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money } from '@/lib/money'
import { useSession } from '@/lib/session-context'
import type { Report, ReportKind, ReportLine } from '@/types/domain'
import { useReport } from './api'

const KINDS: ReportKind[] = ['profit', 'balance', 'aging', 'sales']
type Period = 'month' | 'last' | 'year' | 'custom'
const BUCKETS: MessageKey[] = ['aging.current', 'aging.d30', 'aging.d60', 'aging.d90', 'aging.d90plus']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function range(p: Period, custom: { from: string; to: string }) {
  const now = new Date()
  if (p === 'month') return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: todayISO() }
  if (p === 'last')
    return {
      from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
  if (p === 'year') return { from: `${now.getFullYear()}-01-01`, to: todayISO() }
  return custom
}

export function ReportsPage() {
  const { t, locale } = useLocale()
  const { can } = useSession()
  const [params, setParams] = useSearchParams()
  const kind: ReportKind = KINDS.includes(params.get('r') as ReportKind)
    ? (params.get('r') as ReportKind)
    : 'profit'
  const [period, setPeriod] = useState<Period>('month')
  const [custom, setCustom] = useState(() => range('month', { from: '', to: '' }))
  const { from, to } = range(period, custom)
  const badRange = period === 'custom' && (!from || !to || from > to)
  const { data, isPending, isError, refetch, isFetching } = useReport(
    kind,
    badRange ? '' : from,
    badRange ? '' : to,
  )

  const usesPeriod = kind === 'profit' || kind === 'sales'
  const label = (l: ReportLine) => (l.labelIsKey ? t(l.label as MessageKey) : l.label)
  const subtitle = !data
    ? ''
    : data.from
      ? `${formatDate(data.from, locale)} – ${formatDate(data.to, locale)}`
      : `${t('rep.asOf')} ${formatDate(data.to, locale)}`

  const exportCsv = () => {
    if (!data) return
    const rows = data.lines.filter((l) => l.kind !== 'heading')
    if (kind === 'aging')
      downloadCsv(
        `${kind}-${data.to}.csv`,
        [t('field.customer'), ...BUCKETS.map((b) => t(b)), t('dash.total')],
        rows.map((l) => [label(l), ...(l.buckets ?? []), l.amount]),
      )
    else
      downloadCsv(
        `${kind}-${data.from ?? ''}${data.from ? '_' : ''}${data.to}.csv`,
        [t('acc.name'), t('je.amount')],
        rows.map((l) => [label(l), l.amount]),
      )
  }

  return (
    <>
      <PageHeader
        title={t('nav.reports')}
        description={t('rep.intro')}
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<Printer aria-hidden className="size-4" />}
              disabled={!data}
              onClick={() => window.print()}
            >
              {t('btn.print')}
            </Button>
            {/* Rule 3: Sales staff can't export. (They can't open Reports either.) */}
            {can('export') && (
              <Button icon={<Download aria-hidden className="size-4" />} disabled={!data} onClick={exportCsv}>
                {t('rep.export')}
              </Button>
            )}
          </div>
        }
      />

      <div className="no-print mb-4 overflow-x-auto">
        <FilterTabs
          label={t('nav.reports')}
          value={kind}
          onChange={(r) => setParams(r === 'profit' ? {} : { r }, { replace: true })}
          options={KINDS.map((k) => ({ value: k, label: t(`rep.${k}` as MessageKey) }))}
        />
      </div>

      {usesPeriod && (
        <div className="no-print mb-5 flex flex-col gap-3 lg:flex-row lg:items-end">
          <FilterTabs
            label={t('rep.period')}
            value={period}
            onChange={setPeriod}
            options={(['month', 'last', 'year', 'custom'] as const).map((p) => ({
              value: p,
              label: t(`rep.p.${p}` as MessageKey),
            }))}
          />
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
              <TextField
                label={t('rep.from')}
                type="date"
                value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                error={badRange ? t('err.dateOrder') : undefined}
              />
              <TextField
                label={t('rep.to')}
                type="date"
                value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              />
            </div>
          )}
        </div>
      )}
      {kind === 'balance' && (
        <div className="no-print mb-5 max-w-xs">
          <TextField
            label={t('rep.asOf')}
            type="date"
            value={period === 'custom' ? custom.to : todayISO()}
            onChange={(e) => {
              setPeriod('custom')
              setCustom({ from: `${e.target.value.slice(0, 4)}-01-01`, to: e.target.value })
            }}
          />
        </div>
      )}

      {isPending && !badRange && <Skeleton rows={8} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('rep.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}
      {data && !badRange && (
        <Card className={cn('overflow-hidden transition-opacity', isFetching && 'opacity-60')}>
          <div className="border-line border-b px-5 py-4 sm:px-6">
            <p className="text-ink-muted text-sm">
              <bdi>{t('app.company')}</bdi>
            </p>
            <h2 className="text-xl font-extrabold">{t(`rep.${kind}` as MessageKey)}</h2>
            <p className="text-ink-muted text-sm">{subtitle}</p>
          </div>
          <ReportBody report={data} label={label} />
          {kind === 'balance' && <BalanceCheck report={data} />}
        </Card>
      )}
    </>
  )
}

function ReportBody({ report, label }: { report: Report; label: (l: ReportLine) => string }) {
  const { t } = useLocale()
  if (report.lines.filter((l) => l.kind === 'row').length === 0) return <EmptyState title={t('rep.empty')} />

  if (report.kind === 'aging')
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{t('rep.aging')}</caption>
          <thead className="bg-mist-soft text-ink-muted text-xs">
            <tr>
              <th scope="col" className="px-4 py-2.5 ps-5 text-start font-semibold">
                {t('field.customer')}
              </th>
              {BUCKETS.map((b) => (
                <th key={b} scope="col" className="px-3 py-2.5 text-end font-semibold whitespace-nowrap">
                  {t(b)}
                </th>
              ))}
              <th scope="col" className="px-4 py-2.5 pe-5 text-end font-semibold">
                {t('dash.total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {report.lines.map((l) => (
              <tr
                key={l.label}
                className={cn('border-line border-b', l.kind === 'total' && 'bg-mist-soft font-bold')}
              >
                <th
                  scope="row"
                  className="px-4 py-2.5 ps-5 text-start [font-weight:inherit] whitespace-nowrap"
                >
                  <bdi>{label(l)}</bdi>
                </th>
                {l.buckets!.map((b, i) => (
                  <td key={i} className="px-3 py-2.5 text-end">
                    {money(b).isZero() ? (
                      <span className="text-ink-subtle">—</span>
                    ) : (
                      <Amount
                        value={b}
                        className={i >= 2 && l.kind !== 'total' ? 'text-alert font-semibold' : undefined}
                      />
                    )}
                  </td>
                ))}
                <td className="px-4 py-2.5 pe-5 text-end">
                  <Amount value={l.amount} className="font-semibold" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )

  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{t(`rep.${report.kind}` as MessageKey)}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{t('acc.name')}</th>
          <th scope="col">{t('je.amount')}</th>
        </tr>
      </thead>
      <tbody>
        {report.lines.map((l, i) =>
          l.kind === 'heading' ? (
            <tr key={i}>
              <th colSpan={2} scope="rowgroup" className="px-5 pt-5 pb-1.5 text-start font-bold sm:px-6">
                {label(l)}
              </th>
            </tr>
          ) : (
            <tr
              key={i}
              className={cn(
                l.kind === 'subtotal' && 'border-line border-t font-semibold',
                l.kind === 'total' && 'bg-mist-soft border-slate border-t-2 text-base font-extrabold',
              )}
            >
              <th
                scope="row"
                className={cn(
                  'px-5 py-2 text-start [font-weight:inherit] sm:px-6',
                  l.kind === 'row' && 'ps-8 sm:ps-10',
                )}
              >
                {l.code && <span className="text-ink-subtle me-2 text-xs tabular-nums">{l.code}</span>}
                <bdi>{label(l)}</bdi>
              </th>
              <td className="px-5 py-2 text-end sm:px-6">
                <Amount value={l.amount} />
              </td>
            </tr>
          ),
        )}
      </tbody>
    </table>
  )
}

/** Assets must equal liabilities + equity — shown, not assumed. */
function BalanceCheck({ report }: { report: Report }) {
  const { t } = useLocale()
  const a = report.lines.find((l) => l.label === 'rep.totalAssets')?.amount ?? '0'
  const le = report.lines.find((l) => l.label === 'rep.totalLE')?.amount ?? '0'
  const ok = money(a).eq(le)
  return (
    <p
      className={cn(
        'border-line border-t px-5 py-3 text-sm font-semibold sm:px-6',
        ok ? 'text-slate' : 'text-alert',
      )}
    >
      {ok ? `✓ ${t('rep.balanced')}` : t('rep.unbalanced')}
    </p>
  )
}
