import {
  BarChart3,
  Boxes,
  ChevronDown,
  Command,
  FileText,
  HandCoins,
  Home,
  Landmark,
  Plus,
  Receipt,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { money } from '@/lib/money'
import { aging, detail, invoices, kpi, months, statusKey, wallets, type Status } from './data'
import { ChartTable, M, Screen } from './kit'
import { useT } from './use-t'

/*
 * B · Night desk — graphite & amber. Dark, dense, built for long sessions on a big screen.
 * Icon rail + command bar, compact KPI strip, master–detail invoices, keyboard hints.
 */

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="c-num rounded border border-(--rule-strong) bg-(--surface-2) px-1.5 py-0.5 text-[10px] text-(--muted)">
      {children}
    </kbd>
  )
}

function Pill({ s }: { s: Status }) {
  const { t } = useT()
  // Two colours only: overdue is the one solid amber chip; paid is a quiet graphite outline with a tick.
  const tone: Record<Status, string> = {
    draft: 'text-(--muted) border-dashed border-(--rule-strong)',
    sent: 'text-(--ink) border-(--rule-strong)',
    partial: 'text-(--brand) border-(--brand)/60',
    paid: 'text-(--muted) border-(--rule-strong)',
    overdue: 'text-(--on-brand) bg-(--brand) border-(--brand) font-semibold',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tone[s],
      )}
    >
      {s === 'overdue' && <span aria-hidden>!</span>}
      {s === 'paid' && <span aria-hidden>✓</span>}
      {t[statusKey[s]]}
    </span>
  )
}

function Btn({ children, primary = false, kbd }: { children: ReactNode; primary?: boolean; kbd?: string }) {
  return (
    <button
      type="button"
      className={cn(
        'c-focus inline-flex min-h-9 items-center gap-2 rounded-(--radius) px-3 text-sm font-medium',
        primary
          ? 'bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)'
          : 'border border-(--rule-strong) text-(--ink) hover:bg-(--surface-2)',
      )}
    >
      {children}
      {kbd && (
        <span className={cn('c-num text-[10px] opacity-70', primary && 'text-(--on-brand)')}>{kbd}</span>
      )}
    </button>
  )
}

const RAIL = [
  [Home, 'dashboard'],
  [FileText, 'invoices'],
  [Users, 'customers'],
  [Receipt, 'bills'],
  [Landmark, 'banking'],
  [BarChart3, 'reports'],
] as const

function Frame({ active, children }: { active: string; children: ReactNode }) {
  const { t } = useT()
  return (
    <div className="flex min-h-[640px] bg-(--bg) text-(--ink)">
      <nav
        aria-label="Main"
        className="flex w-14 shrink-0 flex-col items-center gap-1 border-e border-(--rule) py-3"
      >
        <span className="mb-3 grid size-8 place-items-center rounded-md bg-(--brand) text-xs font-bold text-(--on-brand)">
          YC
        </span>
        {RAIL.map(([Icon, k]) => (
          <span
            key={k}
            title={t[k]}
            aria-label={t[k]}
            aria-current={k === active ? 'page' : undefined}
            className={cn(
              'grid size-10 place-items-center rounded-md',
              k === active ? 'bg-(--brand-soft) text-(--brand)' : 'text-(--muted) hover:bg-(--surface-2)',
            )}
          >
            <Icon aria-hidden className="size-[18px]" />
          </span>
        ))}
        <span className="mt-auto grid size-10 place-items-center text-(--muted)">
          <Settings aria-hidden className="size-[18px]" />
        </span>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-(--rule) px-4 py-2.5">
          <span className="flex min-h-9 flex-1 items-center gap-2 rounded-(--radius) border border-(--rule) bg-(--surface) px-3 text-sm text-(--muted) sm:max-w-md">
            <Search aria-hidden className="size-4" />
            {t.search}
            <span className="ms-auto inline-flex items-center gap-1">
              <Kbd>
                <Command aria-hidden className="inline size-3" />K
              </Kbd>
            </span>
          </span>
          <span className="ms-auto hidden items-center gap-1.5 text-xs text-(--muted) md:inline-flex">
            {t.shortcuts}: <Kbd>N</Kbd> {t.k_new} · <Kbd>P</Kbd> {t.k_pay} · <Kbd>/</Kbd> {t.k_search}
          </span>
          <span className="grid size-8 place-items-center rounded-full bg-(--surface-2) text-xs font-semibold">
            AY
          </span>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

function Tile({
  label,
  value,
  note,
  late = false,
}: {
  label: string
  value: ReactNode
  note: ReactNode
  late?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-(--radius) border bg-(--surface) px-4 py-3',
        late ? 'border-(--alert)/60' : 'border-(--rule)',
      )}
    >
      <p className={cn('text-xs', late ? 'font-semibold text-(--alert)' : 'text-(--muted)')}>
        {late && '! '}
        {label}
      </p>
      <p className={cn('mt-1 text-xl font-medium', late && 'text-(--alert)')}>{value}</p>
      <p className="mt-0.5 text-[11px] text-(--muted)">{note}</p>
    </div>
  )
}

function IncomeChart() {
  const { t, month } = useT()
  const max = 50000
  return (
    <section className="rounded-(--radius) border border-(--rule) bg-(--surface) p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{t.incomeExpenses}</h3>
        <span className="flex gap-3 text-[11px] text-(--muted)">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-sm bg-(--chart-1)" />
            {t.income}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-sm bg-(--chart-2)" />
            {t.expenses}
          </span>
        </span>
      </div>
      <div className="relative mt-4 h-44" aria-hidden>
        {[0, 25000, 50000].map((g) => (
          <span
            key={g}
            className="absolute inset-x-0 border-t border-dashed border-(--rule)"
            style={{ bottom: `${(g / max) * 100}%` }}
          >
            <span className="c-num absolute end-0 -top-2 bg-(--surface) ps-1 text-[10px] text-(--muted)">
              {g / 1000}k
            </span>
          </span>
        ))}
        <div className="absolute inset-0 flex items-end gap-3 pe-8">
          {months.map((x) => (
            <div key={x.m} className="group relative flex h-full flex-1 items-end justify-center gap-[2px]">
              {(['income', 'expenses'] as const).map((k) => (
                <span
                  key={k}
                  className={cn(
                    'w-full max-w-4 rounded-t-[4px]',
                    k === 'income' ? 'bg-(--chart-1)' : 'bg-(--chart-2)',
                  )}
                  style={{ height: `${(Number(x[k]) / max) * 100}%` }}
                />
              ))}
              {/* hover tooltip */}
              <span className="pointer-events-none absolute -top-12 z-10 hidden min-w-32 rounded-md border border-(--rule-strong) bg-(--surface-2) px-2 py-1.5 text-[11px] group-hover:block">
                <span className="block font-semibold">{month(x.m)}</span>
                <span className="flex justify-between gap-2">
                  {t.income} <M v={x.income} />
                </span>
                <span className="flex justify-between gap-2">
                  {t.expenses} <M v={x.expenses} />
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex gap-3 pe-8 text-center text-[11px] text-(--muted)">
        {months.map((x) => (
          <span key={x.m} className="flex-1">
            {month(x.m)}
          </span>
        ))}
      </div>
    </section>
  )
}

function Dashboard() {
  const { t } = useT()
  const maxAging = Math.max(...aging.map((a) => Number(a.amount)))
  return (
    <Frame active="dashboard">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-medium">{t.dashboard}</h2>
            <p className="text-xs text-(--muted)">{t.date}</p>
          </div>
          <Btn primary kbd="N">
            <Plus aria-hidden className="size-4" />
            {t.newInvoice}
          </Btn>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile
            label={t.revenue}
            value={<M v={kpi.revenue} />}
            note={<span className="c-num">↓ 35.3%</span>}
          />
          <Tile label={t.owed} value={<M v={kpi.owed} />} note={`${kpi.openInvoices} ${t.openInvoices}`} />
          <Tile
            late
            label={t.overdue}
            value={<M v={kpi.overdue} />}
            note={`${kpi.overdueCount} ${t.pastDue}`}
          />
          <Tile label={t.cash} value={<M v={kpi.cash} />} note={`${kpi.toMatch} ${t.toMatch}`} />
        </div>
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
          <IncomeChart />
          <section className="rounded-(--radius) border border-(--rule) bg-(--surface) p-4">
            <h3 className="text-sm font-medium">{t.agingTitle}</h3>
            <ul className="mt-3 flex flex-col gap-2.5">
              {aging.map((a) => {
                const late = a.late && !money(a.amount).isZero()
                return (
                  <li key={a.key} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
                    <span className={cn(late ? 'text-(--alert)' : 'text-(--muted)')}>{t[a.key]}</span>
                    <M v={a.amount} className={cn(money(a.amount).isZero() && 'text-(--muted)')} />
                    <span className="col-span-2 h-1.5 rounded-full bg-(--surface-2)">
                      <span
                        className={cn('block h-full rounded-full', late ? 'bg-(--brand)' : 'bg-(--chart-2)')}
                        style={{ width: `${(Number(a.amount) / maxAging) * 100}%` }}
                      />
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-(--rule) pt-3">
              {wallets.map((w) => (
                <div key={w.key} className="min-w-0">
                  <p className="truncate text-[11px] text-(--muted)">{t[w.key]}</p>
                  <M v={w.amount} className="text-sm" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Frame>
  )
}

/** Master–detail: dense list at the start, the open invoice with its payment form at the end. */
function Invoices() {
  const { t, date, day } = useT()
  const input =
    'c-focus min-h-9 w-full rounded-(--radius) border border-(--rule-strong) bg-(--bg) px-3 text-sm focus:border-(--brand) focus:outline-none'
  return (
    <Frame active="invoices">
      <div className="grid min-h-[640px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="border-e border-(--rule)">
          <div className="flex items-center justify-between gap-2 border-b border-(--rule) px-4 py-3">
            <h2 className="text-base font-medium">{t.invoices}</h2>
            <span className="inline-flex items-center gap-1 text-xs text-(--muted)">
              {t.unpaid} <ChevronDown aria-hidden className="size-3.5" />
            </span>
          </div>
          <ul>
            {invoices.map((r) => {
              const on = r.no === detail.no
              return (
                <li
                  key={r.no}
                  className={cn(
                    'grid grid-cols-[1fr_auto] gap-x-3 border-b border-(--rule) px-4 py-2.5 text-sm',
                    on ? 'border-s-2 border-s-(--brand) bg-(--surface)' : 'hover:bg-(--surface)',
                  )}
                >
                  <span className="truncate font-medium">{r.customer}</span>
                  <M v={r.left} className={money(r.left).isZero() ? 'text-(--muted)' : ''} />
                  <span className="text-xs text-(--muted)">
                    <span className="c-num">{r.no}</span> · {day(r.due)}
                  </span>
                  <span className="text-end">
                    <Pill s={r.status} />
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-lg font-medium">
                <span className="c-num">{detail.no}</span> <Pill s="partial" />
              </p>
              <p className="text-xs text-(--muted)">
                {detail.customer} · {t.dueDate} {date(detail.due)}
              </p>
            </div>
            <div className="flex gap-2">
              <Btn>{t.reminder}</Btn>
              <Btn>{t.pdf}</Btn>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--rule) text-[11px] text-(--muted)">
                <th scope="col" className="py-1.5 text-start font-normal">
                  {t.item}
                </th>
                <th scope="col" className="py-1.5 text-end font-normal">
                  {t.qty}
                </th>
                <th scope="col" className="py-1.5 text-end font-normal">
                  {t.amount}
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.lines.map((l) => (
                <tr key={l.item} className="border-b border-(--rule)">
                  <td className="py-2">{l.item}</td>
                  <td className="c-num py-2 text-end">{l.qty}</td>
                  <td className="py-2 text-end">
                    <M v={l.amount} />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="py-2 text-(--muted)">
                  {t.paidSoFar}
                </td>
                <td className="py-2 text-end text-(--muted)">
                  <M v={-Number(detail.paid)} />
                </td>
              </tr>
              <tr className="font-semibold">
                <td colSpan={2} className="py-1">
                  {t.leftToPay}
                </td>
                <td className="py-1 text-end text-(--brand)">
                  <M v={detail.left} />
                </td>
              </tr>
            </tbody>
          </table>
          <form
            className="mt-auto flex flex-col gap-3 rounded-(--radius) border border-(--brand)/40 bg-(--surface) p-4"
            onSubmit={(e) => e.preventDefault()}
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <HandCoins aria-hidden className="size-4 text-(--brand)" />
              {t.recordPayment} <Kbd>P</Kbd>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-(--muted)">
                {t.amountReceived}
                <input className={cn(input, 'c-num text-(--ink)')} defaultValue="778.00" dir="ltr" />
              </label>
              <label className="flex flex-col gap-1 text-xs text-(--muted)">
                {t.into}
                <select className={cn(input, 'text-(--ink)')} defaultValue="m1">
                  {wallets.map((w) => (
                    <option key={w.key} value={w.key}>
                      {t[w.key]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-(--muted) sm:col-span-2">
                {t.txId}
                <input className={cn(input, 'c-num text-(--ink)')} dir="ltr" defaultValue="MP-4410-2290" />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-(--muted)">{t.becomesPaid}</span>
              <Btn primary kbd="↵">
                {t.save}
              </Btn>
            </div>
          </form>
        </div>
      </div>
    </Frame>
  )
}

function Phone() {
  const { t } = useT()
  return (
    <div className="flex min-h-[720px] flex-col bg-(--bg) text-(--ink)">
      <div className="flex items-center gap-2 px-4 pt-4">
        <span className="grid size-8 place-items-center rounded-md bg-(--brand) text-xs font-bold text-(--on-brand)">
          YC
        </span>
        <span className="flex min-h-10 flex-1 items-center gap-2 rounded-(--radius) border border-(--rule) bg-(--surface) px-3 text-sm text-(--muted)">
          <Search aria-hidden className="size-4" /> {t.k_search}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4">
        <Tile label={t.owed} value={<M v={kpi.owed} />} note={`${kpi.openInvoices} ${t.openInvoices}`} />
        <Tile
          late
          label={t.overdue}
          value={<M v={kpi.overdue} />}
          note={`${kpi.overdueCount} ${t.pastDue}`}
        />
        <Tile label={t.revenue} value={<M v={kpi.revenue} />} note={<span className="c-num">↓ 35.3%</span>} />
        <Tile label={t.cash} value={<M v={kpi.cash} />} note={`${kpi.toMatch} ${t.toMatch}`} />
      </div>
      <p className="px-4 text-xs text-(--muted)">{t.recent}</p>
      <ul className="mt-1 flex-1">
        {invoices.slice(1, 6).map((r) => (
          <li
            key={r.no}
            className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-(--rule) px-4 py-2.5 text-sm"
          >
            <span className="truncate font-medium">{r.customer}</span>
            <M v={r.left} />
            <span className="c-num text-xs text-(--muted)">{r.no}</span>
            <span className="text-end">
              <Pill s={r.status} />
            </span>
          </li>
        ))}
      </ul>
      <nav
        aria-label="Main"
        className="grid grid-cols-5 items-center border-t border-(--rule) bg-(--surface) py-1.5 text-[10px]"
      >
        {[
          [Home, t.home, true],
          [FileText, t.invoices, false],
          [Plus, t.newInvoice, false],
          [Landmark, t.banking, false],
          [Boxes, t.more, false],
        ].map(([Icon, label, on], i) => {
          const I = Icon as typeof Home
          return i === 2 ? (
            <span
              key={String(label)}
              aria-label={String(label)}
              className="mx-auto grid size-11 place-items-center rounded-full bg-(--brand) text-(--on-brand)"
            >
              <I aria-hidden className="size-5" />
            </span>
          ) : (
            <span
              key={String(label)}
              className={cn(
                'flex flex-col items-center gap-0.5 py-1',
                on ? 'text-(--brand)' : 'text-(--muted)',
              )}
            >
              <I aria-hidden className="size-5" />
              {String(label)}
            </span>
          )
        })}
      </nav>
    </div>
  )
}

function Spec() {
  const { t } = useT()
  const sw: [string, string][] = [
    ['Graphite', '#13161C'],
    ['Graphite · surface', '#22262E'],
    ['Graphite · light', '#7C8594'],
    ['Graphite · text 2', '#A3A9B3'],
    ['Amber · deep', '#BF8411'],
    ['Amber', '#F0B429'],
    ['Amber · text', '#F3EBDD'],
  ]
  return (
    <div className="grid gap-8 bg-(--bg) p-6 text-(--ink) lg:grid-cols-3 lg:p-8">
      <div>
        <h3 className="text-xs text-(--muted)">Colour</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {sw.map(([n, hex]) => (
            <li key={hex} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className="size-8 rounded-md border border-(--rule-strong)"
                style={{ background: hex }}
              />
              <span>{n}</span>
              <span className="c-num text-(--muted)">{hex}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xs text-(--muted)">Type</h3>
        <p className="mt-3 text-3xl font-medium">{t.invoices}</p>
        <p className="text-base">{t.agingTitle}</p>
        <p className="mt-2 text-sm text-(--muted)">{t.txHint}</p>
        <p className="mt-2 text-2xl">
          <M v="20169.06" />
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-xs text-(--muted)">Components</h3>
        <div className="flex flex-wrap gap-2">
          <Btn primary kbd="↵">
            {t.save}
          </Btn>
          <Btn>{t.cancel}</Btn>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['paid', 'partial', 'sent', 'overdue'] as Status[]).map((s) => (
            <Pill key={s} s={s} />
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-(--muted)">
          <Kbd>N</Kbd> {t.k_new} <Kbd>P</Kbd> {t.k_pay} <Kbd>/</Kbd> {t.k_search}
        </p>
      </div>
    </div>
  )
}

export function NightConcept() {
  const { t, L } = useT()
  return (
    <div className="c-night flex flex-col gap-10">
      <Screen
        label={L('Style sheet', 'دليل الأسلوب')}
        note={L('Colour, type and components', 'الألوان والخطوط والمكونات')}
      >
        <Spec />
      </Screen>
      <Screen
        label={t.dashboard}
        note={L(
          'Desktop · icon rail, command bar, compact figures',
          'حاسوب · شريط أيقونات وشريط أوامر وأرقام مضغوطة',
        )}
      >
        <Dashboard />
      </Screen>
      <Screen
        label={`${t.invoices} · ${t.recordPayment}`}
        note={L(
          'Desktop · list and invoice side by side, payment without leaving the list',
          'حاسوب · القائمة والفاتورة جنباً إلى جنب، والدفع دون مغادرة القائمة',
        )}
      >
        <Invoices />
      </Screen>
      <Screen label={t.dashboard} note={L('Phone', 'جوال')} phone>
        <Phone />
      </Screen>
      <ChartTable
        caption={t.incomeExpenses}
        head={['', t.income, t.expenses]}
        rows={months.map((x) => [x.m, x.income, x.expenses])}
      />
    </div>
  )
}
