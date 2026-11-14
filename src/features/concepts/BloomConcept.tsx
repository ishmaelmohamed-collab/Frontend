import {
  AlertTriangle,
  ArrowDownRight,
  Bell,
  Check,
  CircleDot,
  FileText,
  HandCoins,
  Home,
  Landmark,
  Menu,
  Plus,
  Smartphone,
  Users,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { money } from '@/lib/money'
import { aging, detail, invoices, kpi, months, statusKey, wallets, type Status } from './data'
import { ChartTable, M, Screen } from './kit'
import { useT } from './use-t'

/*
 * C · Bloom — violet & lilac. Rounded bento cards, big numbers, big touch targets,
 * "today's focus" that says what to do next. Floating pill navigation; phone-first.
 */

function Chip({ s }: { s: Status }) {
  const { t } = useT()
  // Two colours only: overdue is the one solid violet chip (with ⚠); paid is soft lilac with a tick.
  const tone: Record<Status, string> = {
    draft: 'bg-(--surface) text-(--muted) ring-1 ring-dashed ring-(--rule-strong)',
    sent: 'bg-(--surface) text-(--brand) ring-1 ring-(--rule-strong)',
    partial: 'bg-(--surface) text-(--brand) ring-1 ring-(--brand)/50',
    paid: 'bg-(--brand-soft) text-(--brand)',
    overdue: 'bg-(--brand) text-(--on-brand) font-semibold',
  }
  const Icon = s === 'paid' ? Check : s === 'overdue' ? AlertTriangle : CircleDot
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', tone[s])}
    >
      <Icon aria-hidden className="size-3.5" />
      {t[statusKey[s]]}
    </span>
  )
}

function Btn({
  children,
  primary = false,
  big = false,
}: {
  children: ReactNode
  primary?: boolean
  big?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        'c-focus inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors',
        big ? 'min-h-13 px-6 text-base' : 'min-h-11 px-5 text-sm',
        primary
          ? 'bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)'
          : 'bg-(--surface) text-(--brand) ring-1 ring-(--rule-strong) hover:bg-(--brand-soft)',
      )}
    >
      {children}
    </button>
  )
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-(--radius) bg-(--surface) p-5', className)}>{children}</section>
}

function TopNav({ active }: { active: 'dashboard' | 'invoices' }) {
  const { t } = useT()
  return (
    <div className="flex flex-wrap items-center gap-3 px-6 pt-5">
      <span className="flex items-center gap-2 font-semibold">
        <span className="grid size-9 place-items-center rounded-full bg-(--brand) text-xs text-(--on-brand)">
          YC
        </span>
        <span className="hidden sm:inline">{t.company}</span>
      </span>
      <nav
        aria-label="Main"
        className="mx-auto flex gap-1 rounded-full bg-(--surface) p-1 shadow-[0_6px_24px_rgba(61,44,141,0.10)]"
      >
        {(['dashboard', 'invoices', 'customers', 'banking', 'reports'] as const).map((k) => (
          <span
            key={k}
            aria-current={k === active ? 'page' : undefined}
            className={cn(
              'rounded-full px-4 py-2 text-sm whitespace-nowrap',
              k === active ? 'bg-(--brand) font-medium text-(--on-brand)' : 'text-(--muted)',
              k === 'reports' && 'hidden lg:inline',
            )}
          >
            {t[k]}
          </span>
        ))}
      </nav>
      <span className="grid size-10 place-items-center rounded-full bg-(--surface) text-(--brand)">
        <Bell aria-hidden className="size-5" />
      </span>
    </div>
  )
}

function Bars() {
  const { t, month } = useT()
  const max = 50000
  return (
    <div>
      <div className="flex h-40 items-end gap-3" aria-hidden>
        {months.map((x) => (
          <div key={x.m} className="group relative flex h-full flex-1 items-end justify-center gap-1">
            {(['income', 'expenses'] as const).map((k) => (
              <span
                key={k}
                className={cn(
                  'w-full max-w-5 rounded-full',
                  k === 'income' ? 'bg-(--chart-1)' : 'bg-(--chart-2)',
                )}
                style={{ height: `${(Number(x[k]) / max) * 100}%` }}
              />
            ))}
            <span className="pointer-events-none absolute -top-14 z-10 hidden min-w-36 rounded-2xl bg-(--ink) px-3 py-2 text-xs text-white group-hover:block">
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
      <div className="mt-2 flex gap-3 text-center text-xs text-(--muted)">
        {months.map((x) => (
          <span key={x.m} className="flex-1">
            {month(x.m)}
          </span>
        ))}
      </div>
    </div>
  )
}

function Focus() {
  const { t } = useT()
  return (
    <Card>
      <h3 className="font-semibold">{t.todayFocus}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        <li className="flex items-center gap-3 rounded-2xl bg-(--alert-soft) p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--surface) text-(--alert)">
            <AlertTriangle aria-hidden className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-(--alert)">{t.chase}</span>
            <span className="text-xs text-(--muted)">{t.chaseBody}</span>
          </span>
        </li>
        <li className="flex items-center gap-3 rounded-2xl bg-(--bg) p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-(--surface) text-(--brand)">
            <Wallet aria-hidden className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold">
              {kpi.toMatch} {t.toMatch}
            </span>
            <span className="text-xs text-(--muted)">{t.matchBody}</span>
          </span>
        </li>
      </ul>
    </Card>
  )
}

function Dashboard() {
  const { t } = useT()
  const maxAging = Math.max(...aging.map((a) => Number(a.amount)))
  return (
    <div className="bg-(--bg) pb-8">
      <TopNav active="dashboard" />
      <div className="px-6 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-(--muted)">{t.date}</p>
            <h2 className="c-display text-4xl font-semibold tracking-tight">{t.hi}</h2>
          </div>
          <Btn primary big>
            <Plus aria-hidden className="size-5" />
            {t.newInvoice}
          </Btn>
        </div>
        {/* Bento grid */}
        <div className="mt-6 grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
          <section className="rounded-(--radius) bg-(--brand) p-6 text-(--on-brand) md:col-span-2 xl:row-span-2">
            <p className="text-sm opacity-90">{t.owed}</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight">
              <M v={kpi.owed} />
            </p>
            <p className="mt-1 text-sm opacity-90">
              {kpi.openInvoices} {t.openInvoices}
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {aging.map((a) => (
                <li
                  key={a.key}
                  className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_auto]"
                >
                  <span className="opacity-90">{t[a.key]}</span>
                  <span className="h-2.5 rounded-full bg-white/15">
                    <span
                      className="block h-full rounded-full bg-white"
                      style={{ width: `${(Number(a.amount) / maxAging) * 100}%` }}
                    />
                  </span>
                  <M v={a.amount} className="text-xs" />
                </li>
              ))}
            </ul>
          </section>
          <Card className="ring-2 ring-(--alert)/50">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-(--alert)">
              <AlertTriangle aria-hidden className="size-4" />
              {t.overdue}
            </p>
            <p className="mt-2 text-3xl font-semibold text-(--alert)">
              <M v={kpi.overdue} />
            </p>
            <p className="text-xs text-(--muted)">
              {kpi.overdueCount} {t.pastDue}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-(--muted)">{t.revenue}</p>
            <p className="mt-2 text-3xl font-semibold">
              <M v={kpi.revenue} />
            </p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-(--bg) px-2 py-0.5 text-xs text-(--muted)">
              <ArrowDownRight aria-hidden className="size-3.5" />
              <span className="c-num">35.3%</span> {t.vsLast}
            </p>
          </Card>
          <div className="md:col-span-2">
            <Focus />
          </div>
          <Card className="md:col-span-2 xl:col-span-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">{t.incomeExpenses}</h3>
              <span className="flex gap-3 text-xs text-(--muted)">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-full bg-(--chart-1)" />
                  {t.income}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-full bg-(--chart-2)" />
                  {t.expenses}
                </span>
              </span>
            </div>
            <div className="mt-6">
              <Bars />
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold">{t.banking}</h3>
            <p className="mt-1 text-2xl font-semibold">
              <M v={kpi.cash} />
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {wallets.map((w) => (
                <li key={w.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--bg) text-(--brand)">
                      {w.key === 'bank' ? (
                        <Landmark aria-hidden className="size-4" />
                      ) : (
                        <Smartphone aria-hidden className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 text-xs leading-tight">{t[w.key]}</span>
                  </span>
                  <M v={w.amount} className="font-medium" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return (
    <span
      aria-hidden
      className="grid size-11 shrink-0 place-items-center rounded-full bg-(--brand-soft) text-sm font-semibold text-(--brand)"
    >
      {initials}
    </span>
  )
}

function Invoices() {
  const { t, day } = useT()
  return (
    <div className="bg-(--bg) pb-8">
      <TopNav active="invoices" />
      <div className="px-6 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="c-display text-4xl font-semibold tracking-tight">{t.invoices}</h2>
          <Btn primary big>
            <Plus aria-hidden className="size-5" />
            {t.newInvoice}
          </Btn>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[t.all, t.unpaid, t.overdueS, t.paid, t.draft].map((x, i) => (
            <span
              key={x}
              className={cn(
                'rounded-full px-4 py-2 text-sm',
                i === 0 ? 'bg-(--ink) text-white' : 'bg-(--surface) text-(--muted)',
              )}
            >
              {x}
            </span>
          ))}
        </div>
        <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {invoices.map((r) => (
            <li key={r.no}>
              <Card
                className={cn(
                  'flex h-full flex-col gap-4',
                  r.status === 'overdue' && 'ring-2 ring-(--alert)/40',
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={r.customer} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">{r.customer}</span>
                    <span className="c-num text-xs text-(--muted)">{r.no}</span>
                  </span>
                </div>
                <div>
                  <p className="text-xs text-(--muted)">{t.leftToPay}</p>
                  <p className="text-2xl font-semibold">
                    <M v={r.left} className={money(r.left).isZero() ? 'text-(--muted)' : ''} />
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <Chip s={r.status} />
                  <span
                    className={cn(
                      'text-xs',
                      r.status === 'overdue' ? 'font-semibold text-(--alert)' : 'text-(--muted)',
                    )}
                  >
                    {t.dueDate} {day(r.due)}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function InvoiceDetail() {
  const { t, date } = useT()
  const steps = [
    [t.act_sent, true],
    [t.act_viewed, true],
    [t.partial, true],
    [t.paid, false],
  ] as const
  return (
    <div className="relative bg-(--bg) pb-8">
      <TopNav active="invoices" />
      <div className="grid gap-4 px-6 pt-8 xl:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={detail.customer} />
              <span className="flex flex-col">
                <span className="font-semibold">{detail.customer}</span>
                <span className="text-xs text-(--muted)">
                  <span className="c-num">{detail.no}</span> · {t.dueDate} {date(detail.due)}
                </span>
              </span>
              <span className="ms-auto">
                <Chip s="partial" />
              </span>
            </div>
            <p className="mt-6 text-sm text-(--muted)">{t.leftToPay}</p>
            <p className="text-5xl font-semibold tracking-tight">
              <M v={detail.left} />
            </p>
            <div className="mt-4 h-3 rounded-full bg-(--bg)">
              <span className="block h-full w-1/2 rounded-full bg-(--brand)" />
            </div>
            <p className="mt-1 text-xs text-(--muted)">
              <M v={detail.paid} /> / <M v={detail.total} /> {t.paidSoFar}
            </p>
            <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
              {steps.map(([label, done], i) => (
                <li key={i} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'grid size-8 place-items-center rounded-full',
                      done
                        ? 'bg-(--brand) text-(--on-brand)'
                        : 'border-2 border-dashed border-(--rule-strong) text-(--muted)',
                    )}
                  >
                    {done ? <Check aria-hidden className="size-4" /> : <span className="c-num">{i + 1}</span>}
                  </span>
                  <span className={done ? 'text-(--ink)' : 'text-(--muted)'}>{label}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card>
            <ul className="flex flex-col divide-y divide-(--rule)">
              {detail.lines.map((l) => (
                <li key={l.item} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    {l.item}
                    <span className="c-num ms-2 text-xs text-(--muted)">× {l.qty}</span>
                  </span>
                  <M v={l.amount} className="font-medium" />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Record payment: a big, friendly sheet */}
        <section
          aria-label={t.recordPayment}
          className="rounded-[28px] bg-(--surface) p-6 shadow-[0_20px_60px_rgba(61,44,141,0.18)]"
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <HandCoins aria-hidden className="size-5 text-(--brand)" />
            {t.recordPayment}
          </h3>
          <label className="mt-5 flex flex-col gap-1 text-sm text-(--muted)">
            {t.amountReceived}
            <input
              className="c-focus c-num rounded-2xl bg-(--bg) px-4 py-3 text-4xl font-semibold text-(--ink) focus:outline-none"
              defaultValue="$778.00"
              dir="ltr"
            />
          </label>
          <fieldset className="mt-4">
            <legend className="text-sm text-(--muted)">{t.paidBy}</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                [Landmark, t.bankT, false],
                [Smartphone, t.mobile, true],
                [Users, t.credit, false],
              ].map(([Icon, label, on]) => {
                const I = Icon as typeof Landmark
                return (
                  <span
                    key={String(label)}
                    className={cn(
                      'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center text-xs',
                      on ? 'bg-(--brand) text-(--on-brand)' : 'bg-(--bg) text-(--ink)',
                    )}
                  >
                    <I aria-hidden className="size-5" />
                    {String(label)}
                  </span>
                )
              })}
            </div>
          </fieldset>
          <label className="mt-4 flex flex-col gap-1 text-sm text-(--muted)">
            {t.txId}
            <input
              className="c-focus c-num rounded-2xl bg-(--bg) px-4 py-3 text-base text-(--ink) focus:outline-none"
              defaultValue="MP-4410-2290"
              dir="ltr"
            />
            <span className="text-xs">{t.txHint}</span>
          </label>
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-(--brand-soft) p-3 text-sm text-(--brand)">
            <Check aria-hidden className="size-4 shrink-0" />
            {t.becomesPaid}
          </p>
          <div className="mt-5 grid gap-2">
            <Btn primary big>
              {t.save}
            </Btn>
          </div>
        </section>
      </div>
    </div>
  )
}

function Phone() {
  const { t } = useT()
  return (
    <div className="flex min-h-[720px] flex-col bg-(--bg)">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="grid size-10 place-items-center rounded-full bg-(--surface) text-(--brand)">
          <Menu aria-hidden className="size-5" />
        </span>
        <span className="grid size-10 place-items-center rounded-full bg-(--brand) text-xs font-semibold text-(--on-brand)">
          AY
        </span>
      </div>
      <div className="flex-1 px-5 pt-4">
        <p className="text-sm text-(--muted)">{t.date}</p>
        <h2 className="text-3xl font-semibold tracking-tight">{t.hi}</h2>
        <section className="mt-4 rounded-(--radius) bg-(--brand) p-5 text-(--on-brand)">
          <p className="text-sm opacity-90">{t.owed}</p>
          <p className="mt-1 text-4xl font-semibold">
            <M v={kpi.owed} />
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-(--alert)">
            <AlertTriangle aria-hidden className="size-3.5" />
            <M v={kpi.overdue} /> {t.overdue}
          </p>
        </section>
        <div className="mt-4">
          <Focus />
        </div>
      </div>
      <nav
        aria-label="Main"
        className="m-4 grid grid-cols-5 items-center rounded-full bg-(--surface) p-1.5 shadow-[0_6px_24px_rgba(61,44,141,0.12)]"
      >
        {[
          [Home, true],
          [FileText, false],
          [Plus, false],
          [Users, false],
          [Landmark, false],
        ].map(([Icon, on], i) => {
          const I = Icon as typeof Home
          return (
            <span
              key={i}
              className={cn(
                'mx-auto grid place-items-center rounded-full',
                i === 2 ? 'size-12 bg-(--brand) text-(--on-brand)' : 'size-11',
                on ? 'bg-(--brand-soft) text-(--brand)' : i !== 2 && 'text-(--muted)',
              )}
            >
              <I aria-hidden className="size-5" />
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
    ['Lilac · white', '#FFFFFF'],
    ['Lilac', '#F1EDFA'],
    ['Lilac · deeper', '#E4DCF7'],
    ['Violet · tint', '#A08BEA'],
    ['Violet · mid', '#5B44C9'],
    ['Violet', '#3D2C8D'],
    ['Violet · text', '#1F1838'],
  ]
  return (
    <div className="grid gap-8 bg-(--bg) p-6 lg:grid-cols-3 lg:p-8">
      <div>
        <h3 className="text-sm font-semibold text-(--muted)">Colour</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {sw.map(([n, hex]) => (
            <li key={hex} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className="size-9 rounded-full ring-1 ring-(--rule-strong)"
                style={{ background: hex }}
              />
              <span className="font-medium">{n}</span>
              <span className="c-num text-(--muted)">{hex}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-(--muted)">Type</h3>
        <p className="mt-3 text-4xl font-semibold tracking-tight">{t.invoices}</p>
        <p className="text-lg font-medium">{t.agingTitle}</p>
        <p className="mt-2 text-sm text-(--muted)">{t.txHint}</p>
        <p className="mt-2 text-3xl font-semibold">
          <M v="20169.06" />
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-(--muted)">Components</h3>
        <div className="flex flex-wrap gap-2">
          <Btn primary>{t.save}</Btn>
          <Btn>{t.cancel}</Btn>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['paid', 'partial', 'sent', 'overdue'] as Status[]).map((s) => (
            <Chip key={s} s={s} />
          ))}
        </div>
        <input
          className="c-focus rounded-2xl bg-(--surface) px-4 py-3 text-base ring-1 ring-(--rule-strong) focus:outline-none"
          defaultValue="MP-4410-2290"
          dir="ltr"
        />
      </div>
    </div>
  )
}

export function BloomConcept() {
  const { t, L } = useT()
  return (
    <div className="c-bloom flex flex-col gap-10">
      <Screen
        label={L('Style sheet', 'دليل الأسلوب')}
        note={L('Colour, type and components', 'الألوان والخطوط والمكونات')}
      >
        <Spec />
      </Screen>
      <Screen
        label={t.dashboard}
        note={L('Desktop · bento cards and today’s focus', 'حاسوب · بطاقات بنتو وأولويات اليوم')}
      >
        <Dashboard />
      </Screen>
      <Screen label={t.invoices} note={L('Desktop · one card per invoice', 'حاسوب · بطاقة لكل فاتورة')}>
        <Invoices />
      </Screen>
      <Screen
        label={`${detail.no} · ${t.recordPayment}`}
        note={L('Desktop · progress and a big payment sheet', 'حاسوب · مؤشر التقدم ولوحة دفع كبيرة')}
      >
        <InvoiceDetail />
      </Screen>
      <Screen
        label={t.dashboard}
        note={L('Phone · the main way to use it', 'جوال · الطريقة الأساسية للاستخدام')}
        phone
      >
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
