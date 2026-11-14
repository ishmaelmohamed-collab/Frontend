import { ArrowLeft, HandCoins, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextField } from '@/components/ui/Field'
import { Card, PageHeader } from '@/components/ui/Layout'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatDate, todayISO } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money, sum } from '@/lib/money'
import type { Bill, MoneyAccount } from '@/types/domain'
import { useAccounts, useBills, usePayBills } from './api'
import { BillStatusBadge } from './badges'

const EB: Bill[] = []
const EA: MoneyAccount[] = []

export function PayBillsPage() {
  const { t, locale } = useLocale()
  const { data: bills = EB, isPending: l1, isError, refetch } = useBills()
  const { data: accounts = EA, isPending: l2 } = useAccounts()
  const pay = usePayBills()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [accountId, setAccountId] = useState('bank-main')
  const [date, setDate] = useState(todayISO())
  const [paid, setPaid] = useState<Bill[] | null>(null)

  const open = useMemo(
    () => bills.filter((b) => b.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [bills],
  )
  const chosen = open.filter((b) => selected.has(b.id))
  const total = sum(chosen.map((b) => b.due))
  const account = accounts.find((a) => a.id === accountId)
  const after = account ? money(account.balance).minus(total) : null
  const short = after?.isNegative() ?? false

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const submit = async () => {
    const result = await pay.mutateAsync({ billIds: [...selected], accountId, date })
    setPaid(result)
    setSelected(new Set())
  }

  return (
    <>
      <Link
        to="/bills"
        className="text-ink-muted hover:text-ink mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
        {t('nav.bills')}
      </Link>
      <PageHeader title={t('bills.pay')} description={t('pb.intro')} />

      {paid && (
        <div className="mb-4">
          <Alert tone="success" title={`${t('pb.done')} · ${paid.length} · `}>
            <Amount value={sum(paid.map((b) => b.total))} className="text-ink font-semibold" />
          </Alert>
        </div>
      )}
      {pay.isError && (
        <div className="mb-4">
          <Alert tone="error" title={t('pb.server')} />
        </div>
      )}
      {(l1 || l2) && <Skeleton rows={6} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('bills.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}

      {!l1 && !l2 && !isError && (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden">
            {open.length === 0 ? (
              <EmptyState title={t('pb.none')} />
            ) : (
              <ul className="divide-line divide-y">
                {open.map((b) => {
                  const blocked = b.status === 'approval'
                  const on = selected.has(b.id)
                  return (
                    <li key={b.id}>
                      <label
                        className={cn(
                          'flex items-center gap-4 px-5 py-4',
                          blocked ? 'cursor-not-allowed opacity-70' : 'hover:bg-mist-soft cursor-pointer',
                          on && 'bg-mist-soft',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="accent-slate size-5 shrink-0"
                          checked={on}
                          disabled={blocked}
                          aria-label={`${t('pb.selectBill')} ${b.id}`}
                          onChange={() => toggle(b.id)}
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{b.vendorName}</span>
                            <BillStatusBadge status={b.status} />
                          </span>
                          <span className="text-ink-muted text-xs">
                            <bdi dir="ltr">{b.id}</bdi> · <bdi dir="ltr">{b.vendorRef}</bdi> ·{' '}
                            {t('bills.due')} {formatDate(b.dueDate, locale)}
                          </span>
                          {blocked && (
                            <span className="text-slate inline-flex items-center gap-1 text-xs font-semibold">
                              <ShieldAlert aria-hidden className="size-3.5" />
                              {t('pb.needsApproval')}
                            </span>
                          )}
                        </span>
                        <Amount value={b.due} className="font-bold" />
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card className="fog-soft flex flex-col gap-4 p-5 xl:sticky xl:top-20 xl:self-start">
            <SelectField
              label={t('pb.from')}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {t(`acct.${a.id}` as MessageKey)}
                </option>
              ))}
            </SelectField>
            <TextField
              label={t('pay.date')}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <span>{t('pb.balance')}</span>
                {account && <Amount value={account.balance} />}
              </div>
              <div className="flex justify-between">
                <span>
                  {chosen.length} {t('pb.selected')}
                </span>
                <Amount value={total.neg()} />
              </div>
              <div className="border-mist-strong flex justify-between border-t pt-2 font-bold">
                <span>{t('pb.after')}</span>
                {after && <Amount value={after} className={short ? 'text-alert' : undefined} />}
              </div>
            </div>
            {short && <Alert tone="error" title={t('pb.insufficient')} />}
            <Button
              icon={<HandCoins aria-hidden className="size-4" />}
              disabled={chosen.length === 0 || short}
              loading={pay.isPending}
              onClick={submit}
            >
              {t('pb.payBtn')} {chosen.length > 0 && <Amount value={total} />}
            </Button>
          </Card>
        </div>
      )}
    </>
  )
}
