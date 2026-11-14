import { ArrowLeftRight } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextField } from '@/components/ui/Field'
import { Drawer } from '@/components/ui/Overlay'
import { todayISO } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { formatCurrency, money } from '@/lib/money'
import type { AccountId, MoneyAccount } from '@/types/domain'
import { errorCode, useTransfer } from './api'

type Errors = Partial<Record<'from' | 'to' | 'amount' | 'reference' | 'date', MessageKey>>
const AMOUNT = /^\d+(\.\d{1,2})?$/

/** Move money between two of our own accounts (e.g. sweep a wallet into the bank). */
export function TransferDrawer({
  open,
  accounts,
  onClose,
  onDone,
}: {
  open: boolean
  accounts: MoneyAccount[]
  onClose: () => void
  onDone: () => void
}) {
  const { t } = useLocale()
  const transfer = useTransfer()
  const [fromId, setFromId] = useState<AccountId>('mobile-1')
  const [toId, setToId] = useState<AccountId>('bank-main')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(todayISO())
  const [errors, setErrors] = useState<Errors>({})

  const clear = (k: keyof Errors) => setErrors((e) => ({ ...e, [k]: undefined }))
  const from = accounts.find((a) => a.id === fromId)
  const valid = AMOUNT.test(amount.trim())

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (fromId === toId) next.to = 'err.sameAccount'
    if (!amount.trim()) next.amount = 'err.amountPositive'
    else if (!valid) next.amount = 'err.amountFormat'
    else if (money(amount).lte(0)) next.amount = 'err.amountPositive'
    else if (from && money(amount).gt(from.balance)) next.amount = 'err.insufficientFunds'
    if (!reference.trim()) next.reference = 'err.referenceRequired'
    if (!date) next.date = 'err.dateRequired'
    setErrors(next)
    if (Object.keys(next).length) return
    try {
      await transfer.mutateAsync({ fromId, toId, amount: money(amount).toFixed(2), date, reference })
      setAmount('')
      setReference('')
      onDone()
    } catch (err) {
      const code = errorCode(err)
      if (code === 'periodLocked') setErrors({ date: 'err.periodLocked' })
      else if (code === 'insufficientFunds') setErrors({ amount: 'err.insufficientFunds' })
    }
  }

  const shownError = transfer.isError && !errorCode(transfer.error)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('tr.title')}
      description={t('tr.sub')}
      closeLabel={t('btn.close')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('btn.cancel')}
          </Button>
          <Button
            type="submit"
            form="transfer-form"
            loading={transfer.isPending}
            icon={<ArrowLeftRight aria-hidden className="size-4" />}
          >
            {t('tr.submit')}
          </Button>
        </>
      }
    >
      <form id="transfer-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {shownError && <Alert tone="error" title={t('err.transferServer')} />}
        <SelectField
          label={t('tr.from')}
          value={fromId}
          onChange={(e) => setFromId(e.target.value as AccountId)}
          hint={from ? `${t('tr.available')}: ⁦${formatCurrency(from.balance)}⁩` : undefined}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {t(`acct.${a.id}` as MessageKey)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('tr.to')}
          value={toId}
          onChange={(e) => {
            setToId(e.target.value as AccountId)
            clear('to')
          }}
          error={errors.to && t(errors.to)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {t(`acct.${a.id}` as MessageKey)}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('tr.amount')}
          numeric
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            clear('amount')
          }}
          placeholder="0.00"
          error={errors.amount && t(errors.amount)}
        />
        <TextField
          label={t('je.date')}
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            clear('date')
          }}
          error={errors.date && t(errors.date)}
        />
        <TextField
          label={t('tr.reference')}
          dir="ltr"
          value={reference}
          onChange={(e) => {
            setReference(e.target.value)
            clear('reference')
          }}
          hint={t('tr.refHint')}
          error={errors.reference && t(errors.reference)}
        />
        {from && valid && money(amount).gt(0) && (
          <div className="bg-mist-soft rounded-card flex justify-between px-4 py-3 text-sm">
            <span>
              {t('pb.after')} · {t(`acct.${from.id}` as MessageKey)}
            </span>
            <Amount
              value={money(from.balance).minus(amount)}
              className={
                money(from.balance).minus(amount).isNegative() ? 'text-alert font-bold' : 'font-bold'
              }
            />
          </div>
        )}
      </form>
    </Drawer>
  )
}
