import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { Segmented, SelectField, TextField } from '@/components/ui/Field'
import { Drawer } from '@/components/ui/Overlay'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { todayISO } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money } from '@/lib/money'
import type { Invoice } from '@/types/domain'
import { useRecordPayment } from './api'

const AMOUNT = /^\d+(\.\d{1,2})?$/
const clean = (s: string) => s.replace(/[,\s$]/g, '')

/** Same rules the API enforces — checked here first so mistakes show next to the field. Messages are i18n keys. */
const schema = z
  .object({
    amount: z.string(),
    date: z.string().min(1, 'err.dateRequired'),
    method: z.enum(['bank', 'mobile', 'credit']),
    accountId: z.string(),
    reference: z.string(),
  })
  .superRefine((v, ctx) => {
    const a = clean(v.amount)
    if (!AMOUNT.test(a)) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'err.amountFormat' })
    else if (Number(a) <= 0) ctx.addIssue({ code: 'custom', path: ['amount'], message: 'err.amountPositive' })
    if (v.method !== 'credit') {
      if (!v.reference.trim())
        ctx.addIssue({ code: 'custom', path: ['reference'], message: 'err.referenceRequired' })
      if (!v.accountId) ctx.addIssue({ code: 'custom', path: ['accountId'], message: 'err.accountRequired' })
    }
  })
type Values = z.infer<typeof schema>

export function RecordPaymentDrawer({
  invoice,
  open,
  onClose,
  onRecorded,
}: {
  invoice: Invoice
  open: boolean
  onClose: () => void
  onRecorded: (inv: Invoice) => void
}) {
  const { t } = useLocale()
  const mutation = useRecordPayment(invoice.id)
  const { register, control, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: invoice.due,
      date: todayISO(),
      method: 'mobile',
      accountId: 'mobile-1',
      reference: '',
    },
  })
  const [amount, method] = useWatch({ control, name: ['amount', 'method'] })
  const err = (k?: string) => (k ? t(k as MessageKey) : undefined)

  const entered = AMOUNT.test(clean(amount)) ? money(clean(amount)) : money(0)
  const left = money(invoice.due).minus(entered)
  const preview = left.lte(0) ? 'paid' : entered.gt(0) ? 'partial' : invoice.status

  const close = () => {
    reset()
    mutation.reset()
    onClose()
  }
  const submit = handleSubmit(async (v) => {
    const inv = await mutation.mutateAsync({
      amount: clean(v.amount),
      date: v.date,
      method: v.method,
      accountId: v.method === 'credit' ? null : v.accountId,
      reference: v.reference,
    })
    reset()
    onRecorded(inv)
  })

  return (
    <Drawer
      open={open}
      onClose={close}
      title={t('btn.openDrawer')}
      description={`${invoice.number} · ${invoice.customerName}`}
      closeLabel={t('btn.close')}
      footer={
        <>
          <Button variant="quiet" onClick={close}>
            {t('btn.cancel')}
          </Button>
          <Button type="submit" form="record-payment" loading={mutation.isPending}>
            {t('btn.openDrawer')}
          </Button>
        </>
      }
    >
      <form id="record-payment" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {mutation.isError && <Alert tone="error" title={t('err.server')} />}
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={t('f.amount')}
            numeric
            error={err(formState.errors.amount?.message)}
            {...register('amount')}
          />
          <TextField
            label={t('pay.date')}
            type="date"
            error={err(formState.errors.date?.message)}
            {...register('date')}
          />
        </div>
        <Controller
          control={control}
          name="method"
          render={({ field }) => (
            <Segmented
              label={t('f.method')}
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'bank', label: t('f.bank') },
                { value: 'mobile', label: t('f.mobile') },
                { value: 'credit', label: t('f.credit') },
              ]}
            />
          )}
        />
        {method === 'credit' ? (
          <Alert tone="info" title={t('pay.creditNote')} />
        ) : (
          <>
            <SelectField
              label={t('f.account')}
              error={err(formState.errors.accountId?.message)}
              {...register('accountId')}
            >
              <option value="bank-main">{t('acct.bank-main')}</option>
              <option value="mobile-1">{t('acct.mobile-1')}</option>
              <option value="mobile-2">{t('acct.mobile-2')}</option>
            </SelectField>
            <TextField
              label={t('f.reference')}
              dir="ltr"
              autoComplete="off"
              hint={t('f.referenceHint')}
              error={err(formState.errors.reference?.message)}
              {...register('reference')}
            />
          </>
        )}

        <div className="fog-soft border-mist rounded-card flex flex-col gap-2 border p-4 text-sm">
          <div className="flex justify-between">
            <span>{t('det.amountDue')}</span>
            <Amount value={invoice.due} />
          </div>
          <div className="flex justify-between">
            <span>{t('pay.thisPayment')}</span>
            <Amount value={entered.neg()} />
          </div>
          <div className="border-mist-strong flex justify-between border-t pt-2 font-bold">
            <span>{t('pay.leftToPay')}</span>
            <Amount value={left.isNegative() ? 0 : left} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {t('pay.becomes')} <StatusBadge status={preview} />
          </div>
          {left.isNegative() && <p className="text-ink-muted text-xs">{t('pay.extraCredit')}</p>}
        </div>
      </form>
    </Drawer>
  )
}
