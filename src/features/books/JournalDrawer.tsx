import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Amount } from '@/components/ui/Amount'
import { Button, IconButton } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextField } from '@/components/ui/Field'
import { Drawer } from '@/components/ui/Overlay'
import { cn } from '@/lib/cn'
import { todayISO } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import type { JournalEntry, LedgerType } from '@/types/domain'
import { errorCode, useCreateJournal, useLedger } from './api'

interface Line {
  key: number
  accountCode: string
  debit: string
  credit: string
}
const AMOUNT = /^\d+(\.\d{1,2})?$/
const TYPES: LedgerType[] = ['asset', 'liability', 'equity', 'income', 'expense']
let next = 3
const blank = (key: number): Line => ({ key, accountCode: '', debit: '', credit: '' })
const val = (s: string) => (AMOUNT.test(s.trim()) ? money(s.trim()) : money(0))

/** Manual journal entry: for corrections and adjustments. Debits must equal credits (checked here and by the API). */
export function JournalDrawer({
  open,
  onClose,
  onPosted,
}: {
  open: boolean
  onClose: () => void
  onPosted: (e: JournalEntry) => void
}) {
  const { t } = useLocale()
  const { data: ledger = [] } = useLedger()
  const create = useCreateJournal()
  const [date, setDate] = useState(todayISO())
  const [memo, setMemo] = useState('')
  const [lines, setLines] = useState<Line[]>([blank(1), blank(2)])
  const [errors, setErrors] = useState<{ date?: MessageKey; memo?: MessageKey; lines?: MessageKey }>({})

  const usable = ledger.filter((a) => !a.system)
  const debit = sum(lines.map((l) => val(l.debit)))
  const credit = sum(lines.map((l) => val(l.credit)))
  const diff = debit.minus(credit)

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!date) errs.date = 'err.dateRequired'
    if (!memo.trim()) errs.memo = 'err.memoRequired'
    const filled = lines.filter((l) => l.accountCode || l.debit.trim() || l.credit.trim())
    const bad = (s: string) => s.trim() !== '' && !AMOUNT.test(s.trim())
    if (filled.length < 2) errs.lines = 'err.twoLines'
    else if (filled.some((l) => !l.accountCode)) errs.lines = 'err.lineAccount'
    else if (filled.some((l) => bad(l.debit) || bad(l.credit))) errs.lines = 'err.amountFormat'
    else if (filled.some((l) => val(l.debit).gt(0) === val(l.credit).gt(0))) errs.lines = 'err.oneSide'
    else if (!diff.isZero()) errs.lines = 'err.unbalanced'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      const entry = await create.mutateAsync({
        date,
        memo,
        lines: filled.map((l) => ({
          accountCode: l.accountCode,
          debit: val(l.debit).toFixed(2),
          credit: val(l.credit).toFixed(2),
        })),
      })
      setMemo('')
      setLines([blank(++next), blank(++next)])
      onPosted(entry)
    } catch (err) {
      const code = errorCode(err)
      if (code === 'periodLocked') setErrors({ date: 'err.periodLocked' })
      else if (code) setErrors({ lines: `err.${code}` as MessageKey })
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('je.new')}
      description={t('je.sub')}
      closeLabel={t('btn.close')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('btn.cancel')}
          </Button>
          <Button type="submit" form="journal-form" loading={create.isPending}>
            {t('je.post')}
          </Button>
        </>
      }
    >
      <form id="journal-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {create.isError && !errorCode(create.error) && <Alert tone="error" title={t('err.journalServer')} />}
        <TextField
          label={t('je.date')}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date && t(errors.date)}
        />
        <TextField
          label={t('je.memo')}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={t('je.memoPh')}
          error={errors.memo && t(errors.memo)}
        />
        <p className="text-ink-muted text-xs">{t('je.systemNote')}</p>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold">{t('je.lines')}</legend>
          {lines.map((l, i) => (
            <div key={l.key} className="border-line rounded-card flex flex-col gap-3 border p-3">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <SelectField
                    label={`${t('je.line')} ${i + 1} · ${t('je.account')}`}
                    value={l.accountCode}
                    onChange={(e) => update(l.key, { accountCode: e.target.value })}
                  >
                    <option value="">{t('je.choose')}</option>
                    {TYPES.map((type) => (
                      <optgroup key={type} label={t(`ltype.${type}` as MessageKey)}>
                        {usable
                          .filter((a) => a.type === type)
                          .map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.code} · {t(`coa.${a.code}` as MessageKey)}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </SelectField>
                </div>
                <IconButton
                  label={`${t('je.removeLine')} ${i + 1}`}
                  disabled={lines.length <= 2}
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                  className="disabled:opacity-40"
                >
                  <Trash2 aria-hidden className="size-4" />
                </IconButton>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label={t('acc.debit')}
                  numeric
                  placeholder="0.00"
                  value={l.debit}
                  onChange={(e) => update(l.key, { debit: e.target.value })}
                />
                <TextField
                  label={t('acc.credit')}
                  numeric
                  placeholder="0.00"
                  value={l.credit}
                  onChange={(e) => update(l.key, { credit: e.target.value })}
                />
              </div>
            </div>
          ))}
          <Button
            variant="quiet"
            size="sm"
            className="self-start"
            icon={<Plus aria-hidden className="size-4" />}
            onClick={() => setLines((ls) => [...ls, blank(++next)])}
          >
            {t('je.addLine')}
          </Button>
        </fieldset>

        <div className="bg-mist-soft rounded-card flex flex-col gap-1.5 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span>{t('acc.debit')}</span>
            <Amount value={debit} />
          </div>
          <div className="flex justify-between">
            <span>{t('acc.credit')}</span>
            <Amount value={credit} />
          </div>
          <div className="border-mist-strong flex justify-between border-t pt-1.5 font-bold">
            <span>{t('je.difference')}</span>
            <span className={cn(diff.isZero() && debit.gt(0) ? 'text-slate' : undefined)}>
              {diff.isZero() && debit.gt(0) ? `✓ ${t('je.balanced')}` : <Amount value={diff.abs()} />}
            </span>
          </div>
        </div>
        {errors.lines && <Alert tone="error" title={t(errors.lines)} />}
      </form>
    </Drawer>
  )
}
