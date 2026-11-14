import { AlertTriangle, ArrowRight, Languages, Plus, Printer, TrendingUp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button, IconButton } from '@/components/ui/Button'
import { buttonForced, buttonVariants, type ButtonVariant } from '@/components/ui/button-styles'
import { DataTable } from '@/components/ui/DataTable'
import { Alert, Toast } from '@/components/ui/Feedback'
import { Checkbox, Segmented, SelectField, Switch, TextAreaField, TextField } from '@/components/ui/Field'
import { FilterTabs, SearchInput } from '@/components/ui/Filters'
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Layout'
import { Dialog, Drawer } from '@/components/ui/Overlay'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge, type DocumentStatus } from '@/components/ui/StatusBadge'
import { columnHelper } from '@/components/ui/table-features'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n-context'

/** Phase 4 deliverable: every component, every state, English + Arabic. */

interface Row {
  no: string
  customer: string
  due: string
  amount: string
  status: DocumentStatus
}
const ROWS: Row[] = [
  { no: 'INV-3108', customer: 'Sahel Wholesale', due: '28 Nov 2026', amount: '1120', status: 'draft' },
  { no: 'INV-3107', customer: 'Al-Noor Trading', due: '28 Nov 2026', amount: '2480', status: 'sent' },
  { no: 'INV-3106', customer: 'Crescent Foods Ltd.', due: '27 Nov 2026', amount: '0', status: 'paid' },
  { no: 'INV-3105', customer: 'Horizon Mini Market', due: '26 Nov 2026', amount: '1955', status: 'partial' },
  {
    no: 'INV-3103',
    customer: 'Green Valley Grocers',
    due: '11 Nov 2026',
    amount: '4105.20',
    status: 'overdue',
  },
  { no: 'INV-3099', customer: 'Blue Coast Supplies', due: '2 Nov 2026', amount: '0', status: 'void' },
]
type Filter = 'all' | 'unpaid' | 'overdue' | 'paid'
const match: Record<Filter, (r: Row) => boolean> = {
  all: () => true,
  unpaid: (r) => ['sent', 'partial', 'overdue'].includes(r.status),
  overdue: (r) => r.status === 'overdue',
  paid: (r) => r.status === 'paid',
}
const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'quiet']
const STATES = ['state.default', 'state.hover', 'state.pressed', 'state.focus', 'state.disabled'] as const

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {note && <p className="text-ink-muted mt-1 max-w-3xl text-sm">{note}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

export function DesignSystemPage() {
  const { t, locale, setLocale } = useLocale()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [method, setMethod] = useState<'bank' | 'mobile' | 'credit'>('mobile')
  const [reminders, setReminders] = useState(true)
  const [drawer, setDrawer] = useState(false)
  const [dialog, setDialog] = useState(false)

  const columns = useMemo(() => {
    const col = columnHelper<Row>()
    return col.columns([
      col.accessor('no', { header: t('table.no'), cell: (c) => <bdi dir="ltr">{c.getValue()}</bdi> }),
      col.accessor('customer', { header: t('table.customer') }),
      col.accessor('due', { header: t('table.due'), meta: { hideOnPhone: true } }),
      col.accessor((r) => Number(r.amount), {
        id: 'amount',
        header: t('table.amount'),
        meta: { numeric: true },
        cell: (c) => <Amount value={c.row.original.amount} className="font-semibold" />,
      }),
      col.accessor('status', {
        header: t('table.status'),
        enableSorting: false,
        cell: (c) => <StatusBadge status={c.getValue()} />,
      }),
    ])
  }, [t])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ROWS.filter((r) => match[filter](r) && (!q || `${r.no} ${r.customer}`.toLowerCase().includes(q)))
  }, [filter, query])
  const count = (f: Filter) => ROWS.filter(match[f]).length

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <nav lang="en" className="flex flex-wrap gap-4 text-sm font-semibold" aria-label="Phases">
          <Link to="/direction" className="text-slate">
            Phase 2 · Direction
          </Link>
          <Link to="/wireframes" className="text-slate">
            Phase 3 · Wireframes
          </Link>
        </nav>
        <Button
          variant="secondary"
          lang={locale === 'en' ? 'ar' : 'en'}
          aria-label={t('app.switchLabel')}
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          icon={<Languages aria-hidden className="size-4" />}
        >
          {t('app.switch')}
        </Button>
      </header>

      <section className="fog rounded-panel shadow-card">
        <div className="flex max-w-xl flex-col gap-2 p-8 pb-20 sm:p-10">
          <p className="text-slate text-sm font-semibold">{t('ds.eyebrow')}</p>
          <PageHeader title={t('ds.title')} description={t('ds.intro')} />
        </div>
      </section>

      {/* Buttons */}
      <Section title={t('ds.buttons')} note={t('ds.buttonsNote')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="text-ink-muted text-xs">
                <th scope="col" className="w-28" />
                {STATES.map((s) => (
                  <th key={s} scope="col" className="text-start font-semibold">
                    {t(s)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VARIANTS.map((v) => (
                <tr key={v}>
                  <th scope="row" className="text-start font-bold">
                    {t(`btn.type.${v}`)}
                  </th>
                  <td>
                    <Button variant={v}>{t('btn.primary')}</Button>
                  </td>
                  <td>
                    <Button
                      variant={v}
                      tabIndex={-1}
                      className={cn(buttonVariants[v], buttonForced[v].hover)}
                    >
                      {t('btn.primary')}
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant={v}
                      tabIndex={-1}
                      className={cn(buttonVariants[v], buttonForced[v].pressed)}
                    >
                      {t('btn.primary')}
                    </Button>
                  </td>
                  <td>
                    <Button variant={v} tabIndex={-1} className="outline-slate outline-2 outline-offset-2">
                      {t('btn.primary')}
                    </Button>
                  </td>
                  <td>
                    <Button variant={v} disabled>
                      {t('btn.primary')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-line mt-4 flex flex-wrap items-center gap-3 border-t pt-5">
          <Button icon={<Plus aria-hidden className="size-4" />}>{t('btn.newInvoice')}</Button>
          <Button loading>{t('state.loading')}</Button>
          <Button size="sm" variant="secondary">
            {t('btn.cancel')}
          </Button>
          <Button variant="quiet">
            {t('btn.quiet')} <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
          </Button>
          <IconButton label={t('btn.print')}>
            <Printer aria-hidden className="size-5" />
          </IconButton>
          <Button icon={<AlertTriangle aria-hidden className="size-4" />} onClick={() => setDialog(true)}>
            {t('btn.openDialog')}
          </Button>
        </div>
      </Section>

      {/* Forms */}
      <Section title={t('ds.forms')}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label={t('field.customer')} placeholder={t('field.customerPh')} />
          <TextField label={t('f.amount')} defaultValue="2,480.00" numeric />
          <TextField label={t('field.due')} defaultValue="31 Feb 2026" error={t('field.dueError')} />
          <TextField label={t('f.invoiceNo')} defaultValue="INV-3107" disabled hint={t('f.autoNumber')} />
          <SelectField label={t('f.account')} defaultValue="m1">
            <option value="bank">{t('f.bankMain')}</option>
            <option value="m1">{t('f.mobile1')}</option>
            <option value="m2">{t('f.mobile2')}</option>
          </SelectField>
          <TextField
            label={t('f.reference')}
            defaultValue="MP-7720-1934"
            dir="ltr"
            hint={t('f.referenceHint')}
          />
          <TextAreaField label={t('f.note')} optionalLabel={t('f.optional')} placeholder={t('f.notePh')} />
          <Segmented
            label={t('f.method')}
            value={method}
            onChange={setMethod}
            options={[
              { value: 'bank', label: t('f.bank') },
              { value: 'mobile', label: t('f.mobile') },
              { value: 'credit', label: t('f.credit') },
            ]}
          />
          <div className="flex flex-col justify-center">
            <Checkbox label={t('f.receiveStock')} defaultChecked />
            <Checkbox label={t('f.receiveStock')} disabled />
            <Switch label={t('f.reminders')} checked={reminders} onChange={setReminders} />
          </div>
        </div>
      </Section>

      {/* Badges + messages */}
      <Section title={t('ds.feedback')} note={t('ds.feedbackNote')}>
        <p className="text-ink-muted mb-2 text-xs font-bold tracking-wide uppercase">{t('ds.badges')}</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {(['draft', 'sent', 'partial', 'paid', 'overdue', 'void'] as const).map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Alert
            tone="info"
            title={t('msg.infoTitle')}
            action={
              <Button size="sm" variant="secondary">
                {t('btn.review')}
              </Button>
            }
          >
            {t('msg.infoBody')}
          </Alert>
          <Alert tone="success" title={t('msg.successTitle')}>
            {t('msg.successBody')}
          </Alert>
          <Alert tone="attention" title={t('msg.attentionTitle')}>
            {t('msg.attentionBody')}
          </Alert>
          <Alert tone="error" title={t('msg.errorTitle')}>
            {t('msg.errorBody')}
          </Alert>
        </div>
        <div className="mt-5 flex justify-center">
          <Toast
            closeLabel={t('btn.close')}
            onClose={() => undefined}
            action={
              <button type="button" className="text-mist rounded-md px-2 py-1 font-bold hover:bg-white/10">
                {t('btn.undo')}
              </button>
            }
          >
            {t('msg.toast')}
          </Toast>
        </div>
      </Section>

      {/* Data */}
      <Section title={t('ds.data')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            variant="featured"
            label={t('kpi.revenue')}
            value={<Amount value="48325.90" />}
            footnote={
              <span className="flex items-center gap-1.5">
                <TrendingUp aria-hidden className="text-slate size-4" />
                <span className="text-slate font-bold">+8.4%</span> {t('kpi.revenueNote')}
              </span>
            }
          />
          <StatCard label={t('kpi.owed')} value={<Amount value="32242.03" />} footnote={t('kpi.owedNote')} />
          <StatCard
            variant="overdue"
            label={t('kpi.overdue')}
            value={<Amount value="17321.63" />}
            footnote={t('kpi.overdueNote')}
          />
          <StatCard label={t('kpi.bank')} value={<Amount value="75775.90" />} footnote={t('kpi.bankNote')} />
        </div>
        <Card className="mt-5 overflow-hidden">
          <CardHeader title={t('table.title')} />
          <div className="flex flex-col gap-3 p-5 xl:flex-row xl:items-center xl:justify-between">
            <FilterTabs
              label={t('filter.label')}
              value={filter}
              onChange={setFilter}
              options={(['all', 'unpaid', 'overdue', 'paid'] as const).map((f) => ({
                value: f,
                label: t(`filter.${f}`),
                count: count(f),
              }))}
            />
            <SearchInput
              label={t('search.label')}
              value={query}
              onChange={setQuery}
              placeholder={t('search.ph')}
            />
          </div>
          <DataTable
            caption={t('table.title')}
            columns={columns}
            data={rows}
            onOpen={() => setDrawer(true)}
            empty={<EmptyState title={t('empty.filtered')} />}
          />
        </Card>
      </Section>

      {/* Overlays */}
      <Section title={t('ds.overlays')}>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setDrawer(true)}>{t('btn.openDrawer')}</Button>
          <Button
            variant="secondary"
            icon={<AlertTriangle aria-hidden className="size-4" />}
            onClick={() => setDialog(true)}
          >
            {t('btn.openDialog')}
          </Button>
        </div>
      </Section>

      {/* States */}
      <Section title={t('ds.states')}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <Skeleton label={t('loading')} />
          </Card>
          <Card>
            <EmptyState
              title={t('empty.title')}
              hint={t('empty.hint')}
              action={<Button icon={<Plus aria-hidden className="size-4" />}>{t('btn.newInvoice')}</Button>}
            />
          </Card>
          <Card>
            <ErrorState
              title={t('error.title')}
              hint={t('error.hint')}
              onRetry={() => undefined}
              retryLabel={t('btn.tryAgain')}
            />
          </Card>
        </div>
      </Section>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title={t('btn.openDrawer')}
        description={t('drawer.subtitle')}
        closeLabel={t('btn.close')}
        footer={
          <>
            <Button variant="quiet" onClick={() => setDrawer(false)}>
              {t('btn.cancel')}
            </Button>
            <Button onClick={() => setDrawer(false)}>{t('btn.openDrawer')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextField label={t('f.amount')} defaultValue="2,480.00" numeric />
          <Segmented
            label={t('f.method')}
            value={method}
            onChange={setMethod}
            options={[
              { value: 'bank', label: t('f.bank') },
              { value: 'mobile', label: t('f.mobile') },
              { value: 'credit', label: t('f.credit') },
            ]}
          />
          <SelectField label={t('f.account')} defaultValue="m1">
            <option value="bank">{t('f.bankMain')}</option>
            <option value="m1">{t('f.mobile1')}</option>
            <option value="m2">{t('f.mobile2')}</option>
          </SelectField>
          <TextField
            label={t('f.reference')}
            defaultValue="MP-7720-1934"
            dir="ltr"
            hint={t('f.referenceHint')}
          />
          <Alert tone="success" title={t('drawer.result')} />
        </div>
      </Drawer>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title={t('dialog.title')}
        description={t('dialog.body')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialog(false)}>
              {t('btn.cancel')}
            </Button>
            <Button icon={<AlertTriangle aria-hidden className="size-4" />} onClick={() => setDialog(false)}>
              {t('btn.void')}
            </Button>
          </>
        }
      >
        <TextAreaField label={t('f.voidReason')} rows={2} />
      </Dialog>
    </div>
  )
}
