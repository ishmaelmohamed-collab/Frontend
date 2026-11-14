import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { money } from '@/lib/money'
import { aging, detail, invoices, kpi, months, statusKey, wallets, type Row, type Status } from './data'
import { ChartTable, M, Screen } from './kit'
import { useT } from './use-t'

/*
 * A · Ledger — paper & ink green. No cards or shadows: ruled lines, generous margins,
 * serif display type, numbers that read like a printed statement. Top navigation.
 */

const NAV = ['dashboard', 'invoices', 'customers', 'bills', 'banking', 'reports'] as const

function Status({ s }: { s: Status }) {
  const { t } = useT()
  // Two colours only: overdue is the one solid (inverted) mark, with ▲ and the word.
  if (s === 'overdue')
    return (
      <span className="inline-flex items-center gap-1 bg-(--brand) px-1.5 py-0.5 text-[11px] font-bold tracking-[0.12em] text-(--on-brand) uppercase">
        <span aria-hidden>▲</span>
        {t[statusKey[s]]}
      </span>
    )
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase',
        s === 'paid' ? 'text-(--brand)' : 'text-(--muted)',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 rounded-full border',
          s === 'paid' && 'border-(--brand) bg-(--brand)',
          s === 'partial' && 'border-(--brand) bg-[linear-gradient(90deg,var(--brand)_50%,transparent_50%)]',
          (s === 'sent' || s === 'draft') && 'border-(--muted)',
        )}
      />
      {t[statusKey[s]]}
    </span>
  )
}

function Btn({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'c-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-(--radius) px-4 text-sm font-semibold transition-colors',
        primary
          ? 'bg-(--brand) text-(--on-brand) hover:bg-(--brand-hover)'
          : 'border border-(--rule-strong) text-(--ink) hover:bg-(--brand-soft)',
      )}
    >
      {children}
    </button>
  )
}

function TopBar({ active }: { active: (typeof NAV)[number] }) {
  const { t } = useT()
  return (
    <div className="border-b border-(--rule-strong) bg-(--bg)">
      <div className="flex items-center gap-6 px-6 pt-4">
        <span className="c-display text-xl font-semibold">{t.company}</span>
        <span className="ms-auto inline-flex items-center gap-2 text-sm text-(--muted)">
          <Search aria-hidden className="size-4" />
          <span className="hidden sm:inline">{t.search}</span>
        </span>
        <span className="grid size-8 place-items-center rounded-full border border-(--rule-strong) text-xs font-bold">
          AY
        </span>
      </div>
      <nav aria-label="Main" className="flex gap-6 overflow-x-auto px-6 pt-3 text-sm">
        {NAV.map((k) => (
          <a
            key={k}
            href="#"
            onClick={(e) => e.preventDefault()}
            aria-current={k === active ? 'page' : undefined}
            className={cn(
              'c-focus border-b-2 pb-2 whitespace-nowrap',
              k === active
                ? 'border-(--brand) font-bold text-(--brand)'
                : 'border-transparent text-(--muted)',
            )}
          >
            {t[k]}
          </a>
        ))}
      </nav>
    </div>
  )
}

/** Small caps label over a figure, separated by vertical rules. */
function Figure({
  label,
  value,
  note,
  late = false,
}: {
  label: string
  value: ReactNode
  note: string
  late?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-1 px-5 py-4 first:ps-0', late && 'bg-(--brand-soft) first:ps-5')}>
      <span
        className={cn(
          'text-[11px] font-bold tracking-[0.14em] uppercase',
          late ? 'text-(--alert)' : 'text-(--muted)',
        )}
      >
        {late && '▲ '}
        {label}
      </span>
      <span className={cn('c-display text-[28px] leading-tight font-medium', late && 'text-(--alert)')}>
        {value}
      </span>
      <span className="text-xs text-(--muted)">{note}</span>
    </div>
  )
}

function Dashboard() {
  const { t, month } = useT()
  const max = Math.max(...months.map((x) => Number(x.income)))
  return (
    <div className="bg-(--bg)">
      <TopBar active="dashboard" />
      <div className="px-6 py-8 lg:px-10">
        <p className="text-[11px] font-bold tracking-[0.14em] text-(--muted) uppercase">{t.date}</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <h2 className="c-display text-4xl font-medium">{t.greeting}</h2>
          <Btn primary>{t.newInvoice}</Btn>
        </div>
        <div className="mt-6 grid border-y border-(--rule-strong) sm:grid-cols-2 sm:divide-x sm:divide-(--rule) xl:grid-cols-4 rtl:sm:divide-x-reverse">
          <Figure
            label={t.revenue}
            value={<M v={kpi.revenue} />}
            note={`${kpi.revenueChange}% ${t.vsLast}`}
          />
          <Figure label={t.owed} value={<M v={kpi.owed} />} note={`${kpi.openInvoices} ${t.openInvoices}`} />
          <Figure
            late
            label={t.overdue}
            value={<M v={kpi.overdue} />}
            note={`${kpi.overdueCount} ${t.pastDue}`}
          />
          <Figure
            label={t.cash}
            value={<M v={kpi.cash} />}
            note={`${t.across} · ${kpi.toMatch} ${t.toMatch}`}
          />
        </div>

        <div className="mt-10 grid gap-10 xl:grid-cols-[1.4fr_1fr]">
          <section>
            <h3 className="c-display text-xl font-medium">{t.incomeExpenses}</h3>
            <p className="text-xs text-(--muted)">{t.last6}</p>
            {/* A ledger table with inline bars: the numbers are the chart's labels. */}
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-(--rule-strong) text-[11px] tracking-[0.12em] text-(--muted) uppercase">
                  <th scope="col" className="py-2 text-start font-bold" />
                  <th scope="col" className="py-2 text-start font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-2 w-3 rounded-[1px] bg-(--chart-1)" />
                      {t.income}
                    </span>
                  </th>
                  <th scope="col" className="py-2 text-start font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="h-2 w-3 rounded-[1px] bg-(--chart-2)" />
                      {t.expenses}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((x) => (
                  <tr key={x.m} className="border-b border-(--rule)">
                    <th scope="row" className="w-14 py-2.5 text-start font-semibold">
                      {month(x.m)}
                    </th>
                    {(['income', 'expenses'] as const).map((k) => (
                      <td key={k} className="py-2.5 pe-4">
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className={cn(
                              'h-2.5 rounded-e-[3px]',
                              k === 'income' ? 'bg-(--chart-1)' : 'bg-(--chart-2)',
                            )}
                            style={{ width: `${(Number(x[k]) / max) * 55}%` }}
                          />
                          <M v={x[k]} className="text-xs" />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="c-display text-xl font-medium">{t.agingTitle}</h3>
            <ul className="mt-4 flex flex-col">
              {aging.map((a) => (
                <li key={a.key} className="flex items-baseline gap-2 border-b border-(--rule) py-2.5 text-sm">
                  <span className={cn(a.late && !money(a.amount).isZero() && 'font-semibold text-(--alert)')}>
                    {t[a.key]}
                  </span>
                  <span aria-hidden className="flex-1 border-b border-dotted border-(--rule-strong)/40" />
                  <M v={a.amount} className={money(a.amount).isZero() ? 'text-(--muted)' : ''} />
                </li>
              ))}
              <li className="flex items-baseline justify-between border-t-[3px] border-double border-(--rule-strong) py-2.5 text-sm font-bold">
                <span>{t.total}</span>
                <M v={kpi.owed} />
              </li>
            </ul>
            <h3 className="c-display mt-8 text-xl font-medium">{t.banking}</h3>
            <ul className="mt-2 flex flex-col">
              {wallets.map((w) => (
                <li
                  key={w.key}
                  className="flex items-baseline justify-between gap-3 border-b border-(--rule) py-2.5 text-sm"
                >
                  <span>{t[w.key]}</span>
                  <M v={w.amount} className="font-semibold" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

function InvoiceTable({ rows }: { rows: Row[] }) {
  const { t, date } = useT()
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-y border-(--rule-strong) text-[11px] tracking-[0.12em] text-(--muted) uppercase">
            {[t.number, t.customer, t.issued, t.dueDate].map((h) => (
              <th key={h} scope="col" className="px-2 py-2.5 text-start font-bold first:ps-0">
                {h}
              </th>
            ))}
            <th scope="col" className="px-2 py-2.5 text-end font-bold">
              {t.leftToPay}
            </th>
            <th scope="col" className="px-2 py-2.5 text-start font-bold">
              {t.status}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.no} className="border-b border-(--rule) hover:bg-(--surface)">
              <td className="c-num px-2 py-3 ps-0 font-semibold">{r.no}</td>
              <td className="px-2 py-3">{r.customer}</td>
              <td className="px-2 py-3 text-(--muted)">{date(r.issued)}</td>
              <td className={cn('px-2 py-3', r.status === 'overdue' && 'font-semibold text-(--alert)')}>
                {date(r.due)}
              </td>
              <td className="px-2 py-3 text-end">
                <M v={r.left} className={money(r.left).isZero() ? 'text-(--muted)' : 'font-semibold'} />
              </td>
              <td className="px-2 py-3">
                <Status s={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-[3px] border-double border-(--rule-strong) font-bold">
            <td colSpan={4} className="py-3">
              {t.total}
            </td>
            <td className="px-2 py-3 text-end">
              <M v={rows.reduce((s, r) => s + Number(r.left), 0)} />
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function Invoices() {
  const { t } = useT()
  const tabs = [t.all, t.draft, t.unpaid, t.overdueS, t.paid]
  return (
    <div className="bg-(--bg)">
      <TopBar active="invoices" />
      <div className="px-6 py-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="c-display text-4xl font-medium">{t.invoices}</h2>
          <Btn primary>{t.newInvoice}</Btn>
        </div>
        <div className="mt-5 flex flex-wrap gap-5 text-sm">
          {tabs.map((x, i) => (
            <span
              key={x}
              className={cn('pb-1', i === 0 ? 'border-b-2 border-(--ink) font-bold' : 'text-(--muted)')}
            >
              {x}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <InvoiceTable rows={invoices} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-bold tracking-[0.12em] text-(--muted) uppercase">{label}</span>
      {children}
      {hint && <span className="text-xs text-(--muted)">{hint}</span>}
    </label>
  )
}
const input =
  'c-focus min-h-10 border-0 border-b border-(--rule-strong) bg-transparent px-0 text-base focus:border-(--brand) focus:outline-none'

function InvoiceDetail() {
  const { t, date } = useT()
  return (
    <div className="bg-(--bg)">
      <TopBar active="invoices" />
      <div className="grid gap-8 px-6 py-8 lg:px-10 xl:grid-cols-[1fr_320px]">
        {/* The printed document */}
        <article className="bg-(--surface) p-8 shadow-[0_1px_0_var(--rule),0_0_0_1px_var(--rule)]">
          <div className="flex flex-wrap justify-between gap-6 border-b border-(--rule-strong) pb-6">
            <div>
              <p className="c-display text-2xl font-semibold">{t.company}</p>
              <p className="mt-1 text-xs text-(--muted)">{t.billTo}</p>
              <p className="font-semibold">{detail.customer}</p>
              <p className="c-num text-sm text-(--muted)">{detail.phone}</p>
            </div>
            <div className="text-end">
              <p className="c-display text-3xl font-medium">
                <span className="c-num">{detail.no}</span>
              </p>
              <Status s="partial" />
              <p className="mt-2 text-sm text-(--muted)">
                {t.issued} {date(detail.issued)} · {t.dueDate} {date(detail.due)}
              </p>
            </div>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-(--rule) text-[11px] tracking-[0.12em] text-(--muted) uppercase">
                <th scope="col" className="py-2 text-start font-bold">
                  {t.item}
                </th>
                <th scope="col" className="py-2 text-end font-bold">
                  {t.qty}
                </th>
                <th scope="col" className="py-2 text-end font-bold">
                  {t.price}
                </th>
                <th scope="col" className="py-2 text-end font-bold">
                  {t.amount}
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.lines.map((l) => (
                <tr key={l.item} className="border-b border-(--rule)">
                  <td className="py-3">{l.item}</td>
                  <td className="c-num py-3 text-end">{l.qty}</td>
                  <td className="py-3 text-end">
                    <M v={l.price} />
                  </td>
                  <td className="py-3 text-end">
                    <M v={l.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="ms-auto mt-4 flex max-w-xs flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt>{t.subtotal}</dt>
              <dd>
                <M v={detail.total} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>{t.paidSoFar}</dt>
              <dd>
                <M v={-Number(detail.paid)} />
              </dd>
            </div>
            <div className="flex justify-between border-t-[3px] border-double border-(--rule-strong) pt-2 text-lg font-bold">
              <dt>{t.leftToPay}</dt>
              <dd>
                <M v={detail.left} />
              </dd>
            </div>
          </dl>
        </article>

        {/* Record payment as a receipt slip beside the document */}
        <aside className="flex flex-col gap-4 border-t-2 border-dashed border-(--rule-strong) bg-(--surface) p-5">
          <h3 className="c-display text-xl font-medium">{t.recordPayment}</h3>
          <Field label={t.amountReceived}>
            <input className={cn(input, 'c-num text-2xl')} defaultValue="778.00" dir="ltr" />
          </Field>
          <Field label={t.paidBy}>
            <div className="flex flex-wrap gap-4 text-sm">
              {[t.bankT, t.mobile, t.credit].map((m, i) => (
                <label key={m} className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="ledger-method"
                    defaultChecked={i === 1}
                    className="accent-(--brand)"
                  />
                  {m}
                </label>
              ))}
            </div>
          </Field>
          <Field label={t.into}>
            <select className={input} defaultValue="m1">
              {wallets.map((w) => (
                <option key={w.key} value={w.key}>
                  {t[w.key]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.txId} hint={t.txHint}>
            <input className={input} dir="ltr" defaultValue="MP-4410-2290" />
          </Field>
          <p className="border-y border-(--rule) py-2 text-sm">{t.becomesPaid}</p>
          <Btn primary>{t.save}</Btn>
        </aside>
      </div>
    </div>
  )
}

function Phone() {
  const { t } = useT()
  return (
    <div className="flex min-h-[720px] flex-col bg-(--bg)">
      <div className="flex items-center justify-between border-b border-(--rule-strong) px-5 py-4">
        <span className="c-display text-lg font-semibold">{t.company}</span>
        <Search aria-hidden className="size-5 text-(--muted)" />
      </div>
      <div className="flex-1 px-5 py-6">
        <p className="text-[11px] font-bold tracking-[0.14em] text-(--muted) uppercase">{t.date}</p>
        <h2 className="c-display mt-1 text-3xl font-medium">{t.greeting}</h2>
        <dl className="mt-5 border-t border-(--rule-strong)">
          {[
            [t.owed, kpi.owed, false],
            [t.overdue, kpi.overdue, true],
            [t.cash, kpi.cash, false],
          ].map(([l, v, late]) => (
            <div
              key={String(l)}
              className="flex items-baseline justify-between border-b border-(--rule) py-3"
            >
              <dt className={cn('text-sm', late && 'font-semibold text-(--alert)')}>
                {late ? '▲ ' : ''}
                {l}
              </dt>
              <dd className={cn('c-display text-xl', late && 'text-(--alert)')}>
                <M v={String(v)} />
              </dd>
            </div>
          ))}
        </dl>
        <h3 className="c-display mt-6 text-lg font-medium">{t.recent}</h3>
        <ul className="mt-2">
          {invoices.slice(1, 5).map((r) => (
            <li key={r.no} className="flex items-center justify-between gap-3 border-b border-(--rule) py-3">
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{r.customer}</span>
                <Status s={r.status} />
              </span>
              <M v={r.left} className="text-sm font-semibold" />
            </li>
          ))}
        </ul>
      </div>
      <nav aria-label="Main" className="grid grid-cols-4 border-t border-(--rule-strong) text-center text-xs">
        {[t.home, t.invoices, t.customers, t.more].map((x, i) => (
          <span
            key={x}
            className={cn(
              'py-3',
              i === 0 ? 'font-bold text-(--brand) underline underline-offset-4' : 'text-(--muted)',
            )}
          >
            {x}
          </span>
        ))}
      </nav>
    </div>
  )
}

function Spec() {
  const { t } = useT()
  const sw: [string, string, string][] = [
    ['Paper · lightest', '#FFFDF8', 'surface'],
    ['Paper', '#F5F1E8', 'bg'],
    ['Paper · lines', '#D9D2C3', 'rule'],
    ['Ink green · tint', '#9DB59A', 'chart'],
    ['Ink green · mid', '#4A6458', 'muted'],
    ['Ink green', '#1E4636', 'brand'],
    ['Ink green · text', '#14291F', 'ink'],
  ]
  return (
    <div className="grid gap-8 bg-(--bg) p-6 lg:grid-cols-3 lg:p-8">
      <div>
        <h3 className="text-[11px] font-bold tracking-[0.14em] text-(--muted) uppercase">Colour</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {sw.map(([n, hex]) => (
            <li key={hex} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className="size-8 border border-(--rule-strong)/30"
                style={{ background: hex }}
              />
              <span className="font-semibold">{n}</span>
              <span className="c-num text-(--muted)">{hex}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-[11px] font-bold tracking-[0.14em] text-(--muted) uppercase">Type</h3>
        <p className="c-display mt-3 text-4xl font-medium">{t.invoices}</p>
        <p className="c-display text-xl">{t.agingTitle}</p>
        <p className="mt-2 text-sm">{t.txHint}</p>
        <p className="c-display mt-2 text-2xl">
          <M v="20169.06" />
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold tracking-[0.14em] text-(--muted) uppercase">Components</h3>
        <div className="flex flex-wrap gap-2">
          <Btn primary>{t.save}</Btn>
          <Btn>{t.cancel}</Btn>
        </div>
        <div className="flex flex-wrap gap-4">
          {(['paid', 'partial', 'sent', 'overdue'] as Status[]).map((s) => (
            <Status key={s} s={s} />
          ))}
        </div>
        <Field label={t.txId}>
          <input className={input} dir="ltr" defaultValue="MP-4410-2290" />
        </Field>
      </div>
    </div>
  )
}

export function LedgerConcept() {
  const { t, L } = useT()
  return (
    <div className="c-ledger flex flex-col gap-10">
      <Screen
        label={L('Style sheet', 'دليل الأسلوب')}
        note={L('Colour, type and components', 'الألوان والخطوط والمكونات')}
      >
        <Spec />
      </Screen>
      <Screen
        label={t.dashboard}
        note={L('Desktop · ruled figures, no boxes', 'حاسوب · أرقام مسطّرة بلا صناديق')}
      >
        <Dashboard />
      </Screen>
      <Screen
        label={t.invoices}
        note={L(
          'Desktop · a printed statement with a double-ruled total',
          'حاسوب · كشف مطبوع بإجمالي تحته خطان',
        )}
      >
        <Invoices />
      </Screen>
      <Screen
        label={`${detail.no} · ${t.recordPayment}`}
        note={L(
          'Desktop · the document and a payment slip side by side',
          'حاسوب · المستند وقسيمة الدفع جنباً إلى جنب',
        )}
      >
        <InvoiceDetail />
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
