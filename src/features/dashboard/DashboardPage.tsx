import { ArrowRight, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Amount } from '@/components/ui/Amount'
import { ButtonLink } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { Alert } from '@/components/ui/Feedback'
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatLongDate, formatMonth, formatMonthYear } from '@/lib/dates'
import { useLocale } from '@/lib/i18n-context'
import { formatCurrency, money, sum } from '@/lib/money'
import { useSession } from '@/lib/session-context'
import type { DashboardSummary } from '@/types/domain'
import { useMonthClose } from '../books/api'
import { useDashboard } from '../invoices/api'
import { invoiceColumns } from '../invoices/columns'

// Chart colours mirror the Blue fog tokens (SVG attributes can't read CSS variables).
const SLATE = '#4A5D78'
const MIST_STRONG = '#C3D1E4'
const LINE = '#DDE3EA'
const INK_MUTED = '#4D5866'
const compact = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(n)

function RevenueFootnote({ d }: { d: DashboardSummary }) {
  const { t } = useLocale()
  const prev = money(d.revenueSameDaysLastMonth)
  if (prev.isZero()) return <>{t('dash.noCompare')}</>
  const change = money(d.revenueThisMonth).minus(prev).div(prev).times(100)
  const up = !change.isNegative()
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Icon aria-hidden className="text-slate size-4" />
      <bdi dir="ltr" className="text-slate font-bold">
        {up ? '+' : '−'}
        {change.abs().toFixed(1)}%
      </bdi>
      {t('dash.vsLast')}
    </span>
  )
}

function IncomeChart({ d }: { d: DashboardSummary }) {
  const { t, locale, dir } = useLocale()
  const rows = d.incomeVsExpenses.map((m) => ({
    month: formatMonth(m.month, locale),
    income: Number(m.income),
    expenses: Number(m.expenses),
  }))
  return (
    <div className="h-72" role="img" aria-label={t('dash.chartLabel')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={4}>
          <CartesianGrid stroke={LINE} vertical={false} />
          <XAxis
            dataKey="month"
            reversed={dir === 'rtl'}
            tick={{ fill: INK_MUTED, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            orientation={dir === 'rtl' ? 'right' : 'left'}
            tickFormatter={compact}
            tick={{ fill: INK_MUTED, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: '#EEF3F9' }}
            contentStyle={{ borderRadius: 10, border: `1px solid ${LINE}`, fontSize: 13 }}
            formatter={(v, name) => [
              formatCurrency(Number(v)),
              name === 'income' ? t('dash.income') : t('dash.expenses'),
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => (v === 'income' ? t('dash.income') : t('dash.expenses'))}
            wrapperStyle={{ fontSize: 13, color: INK_MUTED }}
          />
          <Bar dataKey="income" fill={SLATE} radius={[5, 5, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" fill={MIST_STRONG} radius={[5, 5, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Aging({ d }: { d: DashboardSummary }) {
  const { t } = useLocale()
  const max = Math.max(...d.aging.map((b) => Number(b.amount)), 1)
  return (
    <div className="flex flex-col gap-3.5">
      {d.aging.map((b) => {
        const late = b.bucket !== 'current'
        return (
          <div key={b.bucket} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
            <span className={late ? 'text-alert font-semibold' : 'text-ink-muted'}>
              {t(`aging.${b.bucket}`)}
            </span>
            <span className="bg-mist-soft h-3 overflow-hidden rounded-full">
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
  const charts = can('reports.view')
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
        <div className="flex flex-col gap-6">
          <div className={cn('grid gap-4 sm:grid-cols-2', showMoney ? 'xl:grid-cols-4' : 'xl:grid-cols-3')}>
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

          <div className="grid gap-6 xl:grid-cols-5">
            {charts && (
              <Card className="xl:col-span-3">
                <CardHeader title={t('dash.chartTitle')} description={t('dash.chartSub')} />
                <div className="p-5">
                  <IncomeChart d={d} />
                </div>
              </Card>
            )}
            <Card className={charts ? 'xl:col-span-2' : 'xl:col-span-5'}>
              <CardHeader title={t('dash.agingTitle')} description={t('dash.agingSub')} />
              <div className="p-5">
                <Aging d={d} />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className={cn('overflow-hidden', showMoney ? 'xl:col-span-2' : 'xl:col-span-3')}>
              <CardHeader
                title={t('table.title')}
                action={
                  <ButtonLink to="/invoices" variant="quiet" size="sm" className="-me-2">
                    {t('dash.viewAll')} <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
                  </ButtonLink>
                }
              />
              <div className="mt-3">
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
                <ul className="flex flex-col gap-3 p-5">
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
                    <Link to="/reconcile" className="text-slate text-xs font-semibold underline">
                      {t('nav.reconcile')}
                    </Link>
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
