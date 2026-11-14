import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Send, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Amount } from '@/components/ui/Amount'
import { Button, IconButton } from '@/components/ui/Button'
import { buttonBase, buttonSizes, buttonVariants } from '@/components/ui/button-styles'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { todayISO } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { useSession } from '@/lib/session-context'
import { money, sum } from '@/lib/money'
import type { CustomerSummary, Item } from '@/types/domain'
import { useCreateInvoice, useCustomers, useItems } from '../catalog/api'

const schema = z.object({
  customerId: z.string().min(1, 'err.customerRequired'),
  issueDate: z.string().min(1, 'err.dateRequired'),
  terms: z.enum(['7', '14', '30']),
  lines: z
    .array(
      z.object({
        itemId: z.string().min(1, 'err.itemRequired'),
        quantity: z.string().regex(/^[1-9]\d*$/, 'err.qtyPositive'),
      }),
    )
    .min(1, 'err.linesRequired'),
  note: z.string(),
})
type Values = z.infer<typeof schema>

const addDays = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const EMPTY_C: CustomerSummary[] = []
const EMPTY_I: Item[] = []

export function NewInvoicePage() {
  const { t } = useLocale()
  const { can } = useSession()
  const navigate = useNavigate()
  const { data: customers = EMPTY_C, isPending: cLoading } = useCustomers()
  const { data: items = EMPTY_I, isPending: iLoading } = useItems()
  const create = useCreateInvoice()

  const { register, control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: '',
      issueDate: todayISO(),
      terms: '14',
      lines: [{ itemId: '', quantity: '1' }],
      note: '',
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' })
  const [customerId, issueDate, terms, lines] = useWatch({
    control,
    name: ['customerId', 'issueDate', 'terms', 'lines'],
  })
  const err = (k?: string) => (k ? t(k as MessageKey) : undefined)

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const customer = customers.find((c) => c.id === customerId)
  const lineAmounts = lines.map((l) => {
    const item = itemById.get(l.itemId)
    const q = /^[1-9]\d*$/.test(l.quantity) ? Number(l.quantity) : 0
    return item ? money(item.unitPrice).times(q) : money(0)
  })
  const total = sum(lineAmounts)

  // Total requested per item across all lines vs what is in stock.
  const requested = new Map<string, number>()
  lines.forEach((l) => {
    if (l.itemId && /^[1-9]\d*$/.test(l.quantity))
      requested.set(l.itemId, (requested.get(l.itemId) ?? 0) + Number(l.quantity))
  })
  const shortOf = (itemId: string) => {
    const item = itemById.get(itemId)
    return item && (requested.get(itemId) ?? 0) > item.stock ? item.stock : null
  }
  const anyShort = [...requested.keys()].some((id) => shortOf(id) !== null)

  const available = customer ? money(customer.creditLimit).minus(customer.balance).minus(total) : null
  // Rule 2: over the credit limit only the Owner may send; everyone else can save a draft.
  const overLimit = !!available?.isNegative()
  const blockedByLimit = overLimit && !can('sales.overLimit')
  const dueDate = issueDate ? addDays(issueDate, Number(terms)) : ''

  const save = (send: boolean) =>
    handleSubmit(async (v) => {
      // Not enough stock: the lines already say so in red — sending is blocked (drafts are fine).
      if (send && (anyShort || blockedByLimit)) return
      const inv = await create.mutateAsync({
        customerId: v.customerId,
        issueDate: v.issueDate,
        dueDate: addDays(v.issueDate, Number(v.terms)),
        lines: v.lines.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
        note: v.note,
        send,
      })
      navigate(`/invoices/${inv.id}`)
    })

  if (cLoading || iLoading) return <Skeleton rows={8} label={t('loading')} />

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()}>
      <PageHeader title={t('btn.newInvoice')} description={t('new.numberNote')} />

      {create.isError && (
        <div className="mb-4">
          <Alert tone="error" title={t('err.createServer')} />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <SelectField
                label={t('field.customer')}
                error={err(formState.errors.customerId?.message)}
                {...register('customerId')}
              >
                <option value="">{t('new.chooseCustomer')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField
              label={t('new.invoiceDate')}
              type="date"
              error={err(formState.errors.issueDate?.message)}
              {...register('issueDate')}
            />
            <SelectField label={t('new.terms')} {...register('terms')}>
              <option value="7">{t('new.net7')}</option>
              <option value="14">{t('new.net14')}</option>
              <option value="30">{t('new.net30')}</option>
            </SelectField>
            <TextField label={t('new.dueDate')} type="date" value={dueDate} readOnly disabled />
          </Card>

          <Card>
            <CardHeader title={t('lines.title')} />
            <div className="flex flex-col gap-3 p-5">
              {/* Column headings on wide screens; each line carries its own labels on phones */}
              <div className="text-ink-muted hidden grid-cols-[1fr_96px_120px_120px_40px] gap-3 text-xs font-semibold sm:grid">
                <span>{t('lines.item')}</span>
                <span className="text-end">{t('lines.qty')}</span>
                <span className="text-end">{t('lines.price')}</span>
                <span className="text-end">{t('lines.amount')}</span>
                <span />
              </div>
              {fields.map((f, i) => {
                const line = lines[i]
                const item = line ? itemById.get(line.itemId) : undefined
                const short = line?.itemId ? shortOf(line.itemId) : null
                const lineErr = formState.errors.lines?.[i]
                return (
                  <div
                    key={f.id}
                    className="border-line grid grid-cols-2 gap-3 border-b pb-3 last:border-b-0 sm:grid-cols-[1fr_96px_120px_120px_40px] sm:items-start"
                  >
                    <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <label
                        className="text-ink-muted text-xs font-semibold sm:sr-only"
                        htmlFor={`item-${f.id}`}
                      >
                        {t('lines.item')}
                      </label>
                      <select
                        id={`item-${f.id}`}
                        aria-invalid={lineErr?.itemId ? true : undefined}
                        className={cn(
                          'rounded-control bg-panel focus:border-slate focus:ring-mist min-h-10 w-full border px-3 text-base focus:ring-4 focus:outline-none sm:text-sm pointer-coarse:min-h-11',
                          lineErr?.itemId ? 'border-alert border-2' : 'border-line-input',
                        )}
                        {...register(`lines.${i}.itemId`)}
                      >
                        <option value="">{t('lines.chooseItem')}</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                      {lineErr?.itemId && (
                        <span className="text-alert text-xs font-semibold">
                          {err(lineErr.itemId.message)}
                        </span>
                      )}
                      {item && !short && (
                        <span
                          className={cn(
                            'text-xs',
                            item.stock <= item.reorderLevel ? 'text-slate font-semibold' : 'text-ink-muted',
                          )}
                        >
                          {item.stock <= item.reorderLevel ? t('lines.low') : t('lines.inStock')}:{' '}
                          {item.stock}
                        </span>
                      )}
                      {short !== null && (
                        <span className="text-alert text-xs font-semibold" role="alert">
                          {t('lines.onlyBefore')} {short} {t('lines.onlyAfter')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label
                        className="text-ink-muted text-xs font-semibold sm:sr-only"
                        htmlFor={`qty-${f.id}`}
                      >
                        {t('lines.qty')}
                      </label>
                      <input
                        id={`qty-${f.id}`}
                        inputMode="numeric"
                        dir="ltr"
                        aria-invalid={lineErr?.quantity || short !== null ? true : undefined}
                        className={cn(
                          'num rounded-control bg-panel focus:border-slate focus:ring-mist min-h-10 w-full border px-3 text-base focus:ring-4 focus:outline-none sm:text-sm pointer-coarse:min-h-11',
                          lineErr?.quantity || short !== null ? 'border-alert border-2' : 'border-line-input',
                        )}
                        {...register(`lines.${i}.quantity`)}
                      />
                      {lineErr?.quantity && (
                        <span className="text-alert text-xs font-semibold">
                          {err(lineErr.quantity.message)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 sm:pt-2.5">
                      <span className="text-ink-muted text-xs font-semibold sm:sr-only">
                        {t('lines.price')}
                      </span>
                      <span className="num text-sm">{item ? <Amount value={item.unitPrice} /> : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 sm:pt-2.5">
                      <span className="text-ink-muted text-xs font-semibold sm:sr-only">
                        {t('lines.amount')}
                      </span>
                      <span className="num text-sm font-bold">
                        <Amount value={lineAmounts[i] ?? 0} />
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <IconButton
                        label={t('lines.remove')}
                        disabled={fields.length === 1}
                        onClick={() => remove(i)}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </IconButton>
                    </div>
                  </div>
                )
              })}
              <div>
                <Button
                  variant="quiet"
                  icon={<Plus aria-hidden className="size-4" />}
                  onClick={() => append({ itemId: '', quantity: '1' })}
                >
                  {t('lines.add')}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <TextAreaField
              label={t('f.note')}
              optionalLabel={t('f.optional')}
              placeholder={t('f.notePh')}
              {...register('note')}
            />
          </Card>
        </div>

        {/* Side: snapshot, totals, actions — sticks while you scroll the lines */}
        <div className="flex flex-col gap-6 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader title={t('snap.title')} />
            <div className="flex flex-col gap-2 p-5 text-sm">
              {!customer ? (
                <p className="text-ink-muted">{t('snap.pick')}</p>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>{t('snap.owes')}</span>
                    <Amount value={customer.balance} />
                  </div>
                  <div className="flex justify-between">
                    <span>{t('snap.limit')}</span>
                    <Amount value={customer.creditLimit} />
                  </div>
                  <div className="border-line flex justify-between border-t pt-2 font-bold">
                    <span>{t('snap.available')}</span>
                    <Amount
                      value={available!}
                      className={available!.isNegative() ? 'text-alert' : undefined}
                    />
                  </div>
                  {money(customer.overdue).gt(0) && (
                    <p className="text-alert flex justify-between font-semibold">
                      <span>{t('snap.overdue')}</span>
                      <Amount value={customer.overdue} />
                    </p>
                  )}
                  {overLimit && (
                    <Alert
                      tone="attention"
                      title={blockedByLimit ? t('snap.overLimitBlocked') : t('snap.overLimitOwner')}
                    />
                  )}
                </>
              )}
            </div>
          </Card>

          <Card className="fog-soft p-5">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span>{t('new.subtotal')}</span>
                <Amount value={total} />
              </div>
              <div className="border-mist-strong flex justify-between border-t pt-2 text-lg font-extrabold">
                <span>{t('table.total')}</span>
                <Amount value={total} />
              </div>
            </div>
            {formState.errors.lines?.root && (
              <p className="text-alert mt-2 text-xs font-semibold">
                {err(formState.errors.lines.root.message)}
              </p>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <Button
                icon={<Send aria-hidden className="size-4 rtl:-scale-x-100" />}
                loading={create.isPending && create.variables?.send}
                disabled={create.isPending || blockedByLimit}
                onClick={save(true)}
              >
                {t('new.saveSend')}
              </Button>
              <Button variant="secondary" disabled={create.isPending} onClick={save(false)}>
                {t('btn.secondary')}
              </Button>
              <Link to="/invoices" className={cn(buttonBase, buttonSizes.md, buttonVariants.quiet)}>
                {t('btn.cancel')}
              </Link>
            </div>
            <p className="text-ink-muted mt-3 text-xs">{t('new.draftNote')}</p>
          </Card>
        </div>
      </div>
    </form>
  )
}
