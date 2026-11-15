import { ArrowRight, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { ButtonLink } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Alert } from '@/components/ui/Feedback'
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { formatLongDate, formatMonth, formatMonthYear } from '@/lib/dates'
import { useLocale } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import { useSession } from '@/lib/session-context'
import type { DashboardSummary } from '@/types/domain'
import { useMonthClose } from '../books/api'
import { useDashboard } from '../invoices/api'
import { invoiceColumns } from '../invoices/columns'

function RevenueFootnote({ d }: { d: DashboardSummary }) {
  const { t } = useLocale()
  const prev = money(d.revenueSameDaysLastMonth)
  if (prev.isZero()) return <>{t('dash.noCompare')}</>
  const change = money(d.revenueThisMonth).minus(prev).div(prev).times(100)
  const up = !change.isNegative()
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Icon aria-hidden className={up ? 'text-slate size-4' : 'text-ink-muted size-4'} />
      <bdi dir="ltr" className="font-semibold">
        {up ? '+' : '−'}
        {change.abs().toFixed(1)}%
      </bdi>
      {t('dash.vsLast')}
    </span>
  )
}

/**
 * Income vs expenses as a plain table of figures — easier to read at a glance than a
 * chart, and every number is there to check, not estimate from a bar's height.
 */
function IncomeExpenseTable({ d }: { d: DashboardSummary }) {
  const { t, locale } = useLocale()
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">{t('dash.chartTitle')}</caption>
      <thead>
        <tr className="text-ink-subtle text-xs">
          <th scope="col" className="pb-2 text-start font-semibold">
            {t('dash.month')}
          </th>
          <th scope="col" className="pb-2 text-end font-semibold">
            {t('dash.income')}
          </th>
          <th scope="col" className="pb-2 text-end font-semibold">
            {t('dash.expenses')}
          </th>
          <th scope="col" className="pb-2 text-end font-semibold">
            {t('dash.net')}
          </th>
        </tr>
      </thead>
      <tbody>
        {d.incomeVsExpenses.map((m) => {
          const net = money(m.income).minus(m.expenses)
          return (
            <tr key={m.month} className="border-line border-t">
              <th scope="row" className="text-ink py-2 text-start font-medium">
                {formatMonth(m.month, locale)}
              </th>
              <td className="py-2 text-end">
                <Amount value={m.income} />
              </td>
              <td className="text-ink-muted py-2 text-end">
                <Amount value={m.expenses} />
              </td>
              <td className="py-2 text-end">
                <Amount
                  value={net}
                  className={net.isNegative() ? 'text-alert font-semibold' : 'font-semibold'}
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Aging({ d }: { d: DashboardSummary }) {
  const { t } = useLocale()
  const max = Math.max(...d.aging.map((b) => Number(b.amount)), 1)
  return (
    <div className="flex flex-col gap-3">
      {d.aging.map((b) => {
        const late = b.bucket !== 'current'
        return (
          <div key={b.bucket} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
            <span className={late ? 'text-alert font-medium' : 'text-ink-muted'}>
              {t(`aging.${b.bucket}`)}
            </span>
            <span className="bg-mist-soft h-2.5 overflow-hidden rounded-full">
              <span
                className={`block h-full rounded-full ${late ? 'bg-alert' : 'bg-slate'}`}
                style={{ width: `${(Number(b.amount) / max) * 100}%` }}
              />
            </span>
            <Amount value={b.amount} className="font-semibold" />
          </div>
        )
      })}
      <div className="border-line flex justify-between border-t pt-3 text-sm font-bold">
        <span>{t('dash.total')}</span>
        <Amount value={sum(d.aging.map((b) => b.amount))} />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const { data: d, isPending, isError, refetch } = useDashboard()
  const columns = useMemo(() => invoiceColumns(t, locale), [t, locale])
  const [today] = useState(() => new Date())
  const { can } = useSession()
  const showMoney = can('money.view')
  const showFigures = can('reports.view')
  const { data: close } = useMonthClose(can('books.view'))

  return (
    <>
      <PageHeader
        title={t('dash.goodMorning')}
        description={formatLongDate(today, locale)}
        actions={
          can('sales.edit') ? (
            <ButtonLink to="/invoices/new" icon={<Plus aria-hidden className="size-4" />}>
              {t('btn.newInvoice')}
            </ButtonLink>
          ) : undefined
        }
      />

      {isPending && <Skeleton rows={8} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('dash.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}

      {close?.reminder && (
        <div className="mb-6">
          <Alert
            tone="attention"
            title={`${formatMonthYear(close.month, locale)} ${t('close.stillOpen')}`}
            action={
              <ButtonLink to="/close" size="sm" variant="secondary">
                {t('close.goClose')}
              </ButtonLink>
            }
          >
            {t('close.reminderBody')}
          </Alert>
        </div>
      )}

      {d && (
        <div className="flex flex-col gap-5">
          <div className={`grid gap-4 sm:grid-cols-2 ${showMoney ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
            <StatCard
              variant="featured"
              label={t('kpi.revenue')}
              value={<Amount value={d.revenueThisMonth} />}
              footnote={<RevenueFootnote d={d} />}
            />
            <StatCard
              label={t('kpi.owed')}
              value={<Amount value={d.receivables} />}
              footnote={`${d.openInvoices} ${t('dash.openInvoices')}`}
            />
            <StatCard
              variant="overdue"
              label={t('kpi.overdue')}
              value={<Amount value={d.overdue} />}
              footnote={`${d.overdueCount} ${t('dash.pastDue')}`}
            />
            {showMoney && (
              <StatCard
                label={t('kpi.bank')}
                value={<Amount value={d.cash} />}
                footnote={`${t('dash.across')} ${d.accounts.length} ${t('dash.accountsWord')}`}
              />
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-5">
            {showFigures && (
              <Card className="xl:col-span-3">
                <CardHeader title={t('dash.chartTitle')} description={t('dash.chartSub')} />
                <div className="p-4">
                  <IncomeExpenseTable d={d} />
                </div>
              </Card>
            )}
            <Card className={showFigures ? 'xl:col-span-2' : 'xl:col-span-5'}>
              <CardHeader title={t('dash.agingTitle')} description={t('dash.agingSub')} />
              <div className="p-4">
                <Aging d={d} />
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className={`overflow-hidden ${showMoney ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <CardHeader
                title={t('table.title')}
                action={
                  <ButtonLink to="/invoices" variant="quiet" size="sm" className="-me-2">
                    {t('dash.viewAll')} <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
                  </ButtonLink>
                }
              />
              <div className="mt-2">
                <DataTable
                  caption={t('table.title')}
                  columns={columns}
                  data={d.recentInvoices}
                  onOpen={(inv) => navigate(`/invoices/${inv.id}`)}
                  empty={<EmptyState title={t('empty.title')} hint={t('empty.hint')} />}
                />
              </div>
            </Card>
            {showMoney && (
              <Card>
                <CardHeader title={t('dash.wallets')} />
                <ul className="flex flex-col gap-3 p-4">
                  {d.accounts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{t(`acct.${a.id}`)}</span>
                      <Amount value={a.balance} className="font-semibold" />
                    </li>
                  ))}
                  <li className="border-line mt-1 flex flex-col gap-1 border-t pt-3 text-sm">
                    <span>
                      <strong className="text-slate">
                        {d.accounts.reduce((s, a) => s + a.unmatched, 0)}
                      </strong>{' '}
                      {t('dash.toMatch')}
                    </span>
                    <ButtonLink to="/reconcile" variant="quiet" size="sm" className="-ms-2 self-start">
                      {t('nav.reconcile')}
                    </ButtonLink>
                  </li>
                </ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  )
}
