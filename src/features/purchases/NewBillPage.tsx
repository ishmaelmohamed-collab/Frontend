import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { Amount } from '@/components/ui/Amount'
import { Button, IconButton } from '@/components/ui/Button'
import { buttonBase, buttonSizes, buttonVariants } from '@/components/ui/button-styles'
import { Alert } from '@/components/ui/Feedback'
import { Checkbox, SelectField, TextField } from '@/components/ui/Field'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { todayISO } from '@/lib/dates'
import { useSettings } from '@/features/admin/api'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import type { Item, PurchaseOrder, Vendor } from '@/types/domain'
import { useItems } from '../catalog/api'
import { useCreateBill, useOrders, useVendors } from './api'

const AMOUNT = /^\d+(\.\d{1,2})?$/
const EXPENSE = 'expense'

const schema = z
  .object({
    vendorId: z.string().min(1, 'err.vendorRequired'),
    vendorRef: z.string().trim().min(1, 'err.vendorRefRequired'),
    billDate: z.string().min(1, 'err.dateRequired'),
    poId: z.string(),
    receive: z.boolean(),
    lines: z
      .array(
        z.object({
          itemId: z.string(),
          description: z.string(),
          quantity: z.string().regex(/^[1-9]\d*$/, 'err.qtyPositive'),
          unitCost: z.string(),
        }),
      )
      .min(1, 'err.linesRequired'),
  })
  .superRefine((v, ctx) => {
    v.lines.forEach((l, i) => {
      if (!l.itemId)
        ctx.addIssue({ code: 'custom', path: ['lines', i, 'itemId'], message: 'err.itemRequired' })
      if (l.itemId === EXPENSE && !l.description.trim())
        ctx.addIssue({
          code: 'custom',
          path: ['lines', i, 'description'],
          message: 'err.descriptionRequired',
        })
      const c = l.unitCost.replace(/[,\s$]/g, '')
      if (!AMOUNT.test(c) || Number(c) <= 0)
        ctx.addIssue({ code: 'custom', path: ['lines', i, 'unitCost'], message: 'err.costPositive' })
    })
  })
type Values = z.infer<typeof schema>

const plus30 = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + 30)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
const control_ =
  'rounded-control bg-panel focus:border-slate focus:ring-mist min-h-10 w-full border px-3 text-base focus:ring-4 focus:outline-none sm:text-sm pointer-coarse:min-h-11'
const EV: Vendor[] = []
const EO: PurchaseOrder[] = []
const EI: Item[] = []

export function NewBillPage() {
  const { t } = useLocale()
  const { data: settings } = useSettings()
  const limit = money(settings?.approvalLimit ?? '10000')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: vendors = EV, isPending: l1 } = useVendors()
  const { data: orders = EO, isPending: l2 } = useOrders()
  const { data: items = EI, isPending: l3 } = useItems()
  const create = useCreateBill()

  const { register, control, handleSubmit, formState, setValue } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorId: '',
      vendorRef: '',
      billDate: todayISO(),
      poId: '',
      receive: true,
      lines: [{ itemId: '', description: '', quantity: '1', unitCost: '' }],
    },
  })
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'lines' })
  const [vendorId, poId, billDate, lines] = useWatch({
    control,
    name: ['vendorId', 'poId', 'billDate', 'lines'],
  })
  const err = (k?: string) => (k ? t(k as MessageKey) : undefined)

  const openOrders = orders.filter((o) => o.vendorId === vendorId && o.status !== 'received')
  const order = orders.find((o) => o.id === poId)

  // Picking a purchase order fills in what is still to arrive, at the ordered cost.
  const fillFromOrder = (o: PurchaseOrder) =>
    replace(
      o.lines
        .filter((l) => l.received < l.ordered)
        .map((l) => ({
          itemId: l.itemId,
          description: '',
          quantity: String(l.ordered - l.received),
          unitCost: l.unitCost,
        })),
    )

  // Arriving from "Enter bill" on a purchase order (/bills/new?po=PO-0415).
  const preset = params.get('po')
  useEffect(() => {
    const o = orders.find((x) => x.id === preset)
    if (!o) return
    setValue('vendorId', o.vendorId)
    setValue('poId', o.id)
    fillFromOrder(o)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, orders.length])

  const amounts = lines.map((l) => {
    const c = l.unitCost.replace(/[,\s$]/g, '')
    return AMOUNT.test(c) && /^[1-9]\d*$/.test(l.quantity) ? money(c).times(l.quantity) : money(0)
  })
  const total = sum(amounts)
  const hasGoods = lines.some((l) => l.itemId && l.itemId !== EXPENSE)

  const save = handleSubmit(async (v) => {
    await create.mutateAsync({
      vendorId: v.vendorId,
      vendorRef: v.vendorRef,
      billDate: v.billDate,
      dueDate: plus30(v.billDate),
      poId: v.poId || null,
      lines: v.lines.map((l) => ({
        itemId: l.itemId === EXPENSE ? null : l.itemId,
        description: l.description,
        quantity: Number(l.quantity),
        unitCost: l.unitCost.replace(/[,\s$]/g, ''),
      })),
      receiveIntoStock: v.receive && hasGoods,
    })
    navigate('/bills')
  })

  if (l1 || l2 || l3) return <Skeleton rows={8} label={t('loading')} />

  return (
    <form noValidate onSubmit={save}>
      <PageHeader title={t('bills.new')} />
      {create.isError && (
        <div className="mb-4">
          <Alert tone="error" title={t('err.billServer')} />
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <SelectField
              label={t('bills.vendor')}
              error={err(formState.errors.vendorId?.message)}
              {...register('vendorId', { onChange: () => setValue('poId', '') })}
            >
              <option value="">—</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </SelectField>
            <TextField
              label={t('bills.vendorRef')}
              dir="ltr"
              error={err(formState.errors.vendorRef?.message)}
              {...register('vendorRef')}
            />
            <TextField label={t('bills.billDate')} type="date" {...register('billDate')} />
            <TextField
              label={`${t('new.dueDate')} · ${t('nb.terms')}`}
              type="date"
              value={billDate ? plus30(billDate) : ''}
              readOnly
              disabled
            />
            <div className="sm:col-span-2">
              <SelectField
                label={t('nb.fromPo')}
                disabled={!vendorId}
                {...register('poId', {
                  onChange: (e) => {
                    const o = orders.find((x) => x.id === e.target.value)
                    if (o) fillFromOrder(o)
                  },
                })}
              >
                <option value="">{t('nb.noPo')}</option>
                {openOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id}
                  </option>
                ))}
              </SelectField>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('lines.title')} />
            <div className="flex flex-col gap-3 p-5">
              {fields.map((f, i) => {
                const l = lines[i]
                const e = formState.errors.lines?.[i]
                const ol = order?.lines.find((x) => x.itemId === l?.itemId)
                return (
                  <div
                    key={f.id}
                    className="border-line grid grid-cols-2 gap-3 border-b pb-3 last:border-b-0 sm:grid-cols-[1fr_88px_120px_120px_40px] sm:items-start"
                  >
                    <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <label htmlFor={`bi-${f.id}`} className="text-ink-muted text-xs font-semibold">
                        {t('lines.item')}
                      </label>
                      <select
                        id={`bi-${f.id}`}
                        aria-invalid={e?.itemId ? true : undefined}
                        className={cn(control_, e?.itemId ? 'border-alert border-2' : 'border-line-input')}
                        {...register(`lines.${i}.itemId`)}
                      >
                        <option value="">{t('lines.chooseItem')}</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name}
                          </option>
                        ))}
                        <option value={EXPENSE}>{t('nb.expense')}</option>
                      </select>
                      {e?.itemId && (
                        <span className="text-alert text-xs font-semibold">{err(e.itemId.message)}</span>
                      )}
                      {ol && (
                        <span className="text-ink-muted text-xs">
                          {t('nb.ordered')} {ol.ordered} · {ol.received} {t('nb.receivedSoFar')}
                        </span>
                      )}
                      {l?.itemId === EXPENSE && (
                        <>
                          <label htmlFor={`bd-${f.id}`} className="sr-only">
                            {t('nb.description')}
                          </label>
                          <input
                            id={`bd-${f.id}`}
                            placeholder={t('nb.description')}
                            aria-invalid={e?.description ? true : undefined}
                            className={cn(
                              control_,
                              e?.description ? 'border-alert border-2' : 'border-line-input',
                            )}
                            {...register(`lines.${i}.description`)}
                          />
                          {e?.description && (
                            <span className="text-alert text-xs font-semibold">
                              {err(e.description.message)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`bq-${f.id}`} className="text-ink-muted text-xs font-semibold">
                        {t('lines.qty')}
                      </label>
                      <input
                        id={`bq-${f.id}`}
                        inputMode="numeric"
                        dir="ltr"
                        className={cn(
                          control_,
                          'num',
                          e?.quantity ? 'border-alert border-2' : 'border-line-input',
                        )}
                        {...register(`lines.${i}.quantity`)}
                      />
                      {e?.quantity && (
                        <span className="text-alert text-xs font-semibold">{err(e.quantity.message)}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`bc-${f.id}`} className="text-ink-muted text-xs font-semibold">
                        {t('nb.cost')}
                      </label>
                      <input
                        id={`bc-${f.id}`}
                        inputMode="decimal"
                        dir="ltr"
                        className={cn(
                          control_,
                          'num',
                          e?.unitCost ? 'border-alert border-2' : 'border-line-input',
                        )}
                        {...register(`lines.${i}.unitCost`)}
                      />
                      {e?.unitCost && (
                        <span className="text-alert text-xs font-semibold">{err(e.unitCost.message)}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-ink-muted text-xs font-semibold">{t('lines.amount')}</span>
                      <span className="num pt-2 text-sm font-bold">
                        <Amount value={amounts[i] ?? 0} />
                      </span>
                    </div>
                    <div className="flex items-end justify-end sm:pt-5">
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
                  onClick={() => append({ itemId: '', description: '', quantity: '1', unitCost: '' })}
                >
                  {t('lines.add')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:sticky xl:top-20 xl:self-start">
          <Card className="fog-soft p-5">
            <div className="border-mist-strong flex justify-between text-lg font-extrabold">
              <span>{t('table.total')}</span>
              <Amount value={total} />
            </div>
            {total.gt(limit) && (
              <div className="mt-3">
                <Alert tone="attention" title={t('nb.approvalWarn')} />
              </div>
            )}
            {hasGoods && (
              <div className="mt-3">
                <Checkbox label={t('nb.receive')} {...register('receive')} />
                <p className="text-ink-muted text-xs">{t('nb.receiveHint')}</p>
              </div>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <Button type="submit" loading={create.isPending}>
                {t('nb.save')}
              </Button>
              <Link to="/bills" className={cn(buttonBase, buttonSizes.md, buttonVariants.quiet)}>
                {t('btn.cancel')}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </form>
  )
}
