import { AlertTriangle, BellRing, Check, Lock, LockOpen } from 'lucide-react'
import { useState } from 'react'
import { Amount } from '@/components/ui/Amount'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { TextAreaField } from '@/components/ui/Field'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Dialog } from '@/components/ui/Overlay'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatDate, formatMonthYear, formatTime } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money } from '@/lib/money'
import type { CloseCheck, MonthClose } from '@/types/domain'
import { useSession } from '@/lib/session-context'
import { errorCode, useCloseAction, useMonthClose } from './api'

const monthEnd = (month: string) => {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m, 0)
  return `${month}-${String(d.getDate()).padStart(2, '0')}`
}

export function CloseMonthPage() {
  const { t, locale } = useLocale()
  const { data: c, isPending, isError, refetch } = useMonthClose()
  const act = useCloseAction()
  const owner = useSession().can('close.lock')
  const [dialog, setDialog] = useState<'lock' | 'reopen' | null>(null)

  const monthName = c ? formatMonthYear(c.month, locale) : ''
  const doneCount = c?.checks.filter((x) => x.done).length ?? 0
  const allDone = !!c && doneCount === c.checks.length

  return (
    <>
      <PageHeader
        title={c ? `${t('close.title')} ${monthName}` : t('nav.close')}
        description={
          c ? (
            <span>
              {t('close.intro')}{' '}
              <span className="text-ink font-semibold">
                {doneCount} {t('close.of')} {c.checks.length} {t('close.checksDone')}
              </span>
            </span>
          ) : undefined
        }
      />

      {isPending && <Skeleton rows={6} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('close.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}

      {c && (
        <div className="flex flex-col gap-6">
          {c.reminder && (
            <Alert tone="attention" title={`${monthName} ${t('close.stillOpen')}`}>
              <span className="inline-flex items-center gap-1.5">
                <BellRing aria-hidden className="size-4" />
                {t('close.reminderBody')}
              </span>
            </Alert>
          )}
          {act.isError && !errorCode(act.error) && <Alert tone="error" title={t('close.server')} />}

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Card className="overflow-hidden">
              <CardHeader title={t('close.checklist')} />
              <ul className="divide-line mt-3 divide-y">
                {c.checks.map((x) => (
                  <CheckRow
                    key={x.id}
                    check={x}
                    locked={c.locked}
                    busy={act.isPending && act.variables?.action === 'stock-count'}
                    onCount={() => act.mutate({ action: 'stock-count' })}
                  />
                ))}
              </ul>
            </Card>

            <div className="flex flex-col gap-6">
              <Glance c={c} monthName={monthName} />
              {c.locked ? (
                <Card className="fog-soft p-5">
                  <h2 className="flex items-center gap-2 text-base font-bold">
                    <Lock aria-hidden className="text-slate size-5" />
                    {monthName} {t('close.isLocked')}
                  </h2>
                  <p className="text-ink-muted mt-2 text-sm">
                    {t('close.lockedNote')}{' '}
                    <span className="text-ink font-semibold">{formatDate(c.lockedThrough!, locale)}</span>
                  </p>
                  {owner && (
                    <Button
                      variant="secondary"
                      className="mt-4"
                      icon={<LockOpen aria-hidden className="size-4" />}
                      onClick={() => setDialog('reopen')}
                    >
                      {t('close.reopen')}
                    </Button>
                  )}
                </Card>
              ) : (
                <Card className="border-slate border-2 p-5">
                  <h2 className="text-base font-bold">{t('close.lockTitle')}</h2>
                  <p className="text-ink-muted mt-2 text-sm">
                    {t('close.lockBody')}{' '}
                    <span className="text-ink font-semibold">{formatDate(monthEnd(c.month), locale)}</span>
                  </p>
                  <Button
                    className="mt-4 w-full"
                    disabled={!allDone || !owner}
                    icon={<AlertTriangle aria-hidden className="size-4" />}
                    onClick={() => setDialog('lock')}
                  >
                    {!owner
                      ? t('err.ownerOnly')
                      : allDone
                        ? `${t('close.lockBtn')} ${monthName}…`
                        : t('close.finishFirst')}
                  </Button>
                </Card>
              )}
            </div>
          </div>

          <History c={c} />
        </div>
      )}

      {c && (
        <ReasonDialog
          key={dialog ?? 'none'}
          mode={dialog}
          monthName={monthName}
          endLabel={formatDate(monthEnd(c.month), locale)}
          onClose={() => setDialog(null)}
          busy={act.isPending}
          onConfirm={async (reason) => {
            try {
              await act.mutateAsync({ action: dialog!, reason })
              setDialog(null)
              return null
            } catch (e) {
              const code = errorCode(e)
              return code ? (`err.${code}` as MessageKey) : 'close.server'
            }
          }}
        />
      )}
    </>
  )
}

const FIX: Partial<Record<CloseCheck['id'], string>> = {
  'reconcile-bank-main': '/reconcile?account=bank-main',
  'reconcile-mobile-1': '/reconcile?account=mobile-1',
  'reconcile-mobile-2': '/reconcile?account=mobile-2',
  drafts: '/invoices',
  approvals: '/bills',
}

function CheckRow({
  check: x,
  locked,
  busy,
  onCount,
}: {
  check: CloseCheck
  locked: boolean
  busy: boolean
  onCount: () => void
}) {
  const { t } = useLocale()
  let title: string
  let detail: string
  if (x.id.startsWith('reconcile-')) {
    title = `${t(`acct.${x.id.slice(10)}` as MessageKey)} — ${t('chk.reconciled')}`
    detail = x.done ? t('chk.matchesStatement') : `${x.count} ${t('chk.linesOpen')}`
  } else if (x.id === 'drafts') {
    title = t('chk.drafts')
    detail = x.done ? t('chk.draftsDone') : `${x.count} ${t('chk.draftsOpen')}`
  } else if (x.id === 'approvals') {
    title = t('chk.approvals')
    detail = x.done ? t('chk.approvalsDone') : `${x.count} ${t('chk.approvalsOpen')}`
  } else {
    title = t('chk.stockCount')
    detail = x.done ? t('chk.stockDone') : t('chk.stockOpen')
  }
  return (
    <li className="flex items-center gap-3 px-5 py-3.5">
      <span
        role="img"
        aria-label={x.done ? t('chk.done') : t('chk.todo')}
        className={cn(
          'grid size-7 shrink-0 place-items-center rounded-full',
          x.done ? 'bg-slate text-white' : 'border-slate text-slate border-2',
        )}
      >
        {x.done ? <Check aria-hidden className="size-4" /> : <span className="text-sm font-bold">!</span>}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-ink-muted text-xs">{detail}</span>
      </span>
      {x.done ? (
        <span className="text-ink-muted text-xs">{t('chk.done')}</span>
      ) : x.id === 'stockCount' ? (
        <Button size="sm" loading={busy} disabled={locked} onClick={onCount}>
          {t('chk.markCounted')}
        </Button>
      ) : (
        <ButtonLink size="sm" to={FIX[x.id]!}>
          {t('chk.fix')}
        </ButtonLink>
      )}
    </li>
  )
}

function Glance({ c, monthName }: { c: MonthClose; monthName: string }) {
  const { t } = useLocale()
  const net = money(c.income).minus(c.expenses)
  const balanced = money(c.debits).eq(c.credits)
  return (
    <Card className="p-5">
      <h2 className="text-base font-bold">
        {monthName} · {t('close.glance')}
      </h2>
      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt>{t('close.income')}</dt>
          <dd>
            <Amount value={c.income} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>{t('close.expenses')}</dt>
          <dd>
            <Amount value={c.expenses} />
          </dd>
        </div>
        <div className="border-line flex justify-between border-t pt-2 font-bold">
          <dt>{t('close.net')}</dt>
          <dd>
            <Amount value={net} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-muted">{t('close.trial')}</dt>
          <dd className={cn('font-semibold', balanced ? 'text-slate' : 'text-alert')}>
            {balanced ? `✓ ${t('close.balanced')}` : t('close.unbalanced')}
          </dd>
        </div>
      </dl>
    </Card>
  )
}

function History({ c }: { c: MonthClose }) {
  const { t, locale } = useLocale()
  return (
    <Card className="overflow-hidden">
      <CardHeader title={t('close.history')} />
      <ul className="divide-line mt-3 divide-y">
        {c.history.map((h) => (
          <li key={h.at + h.action} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3 text-sm">
            {h.action === 'lock' ? (
              <Lock aria-hidden className="text-slate mt-0.5 size-4 shrink-0" />
            ) : (
              <LockOpen aria-hidden className="text-slate mt-0.5 size-4 shrink-0" />
            )}
            <span className="min-w-0 flex-1">
              <span className="font-semibold">
                {t(`close.hist.${h.action}`)} · {formatMonthYear(h.month, locale)}
              </span>
              <span className="text-ink-muted block">“{h.reason}”</span>
            </span>
            <span className="text-ink-muted text-xs">
              {t(`role.${h.by}` as MessageKey)} · {formatDate(h.at, locale)} {formatTime(h.at, locale)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Lock or reopen: Owner only, slate + warning icon, always a written reason (business rules 4 and 6). */
function ReasonDialog({
  mode,
  monthName,
  endLabel,
  busy,
  onClose,
  onConfirm,
}: {
  mode: 'lock' | 'reopen' | null
  monthName: string
  endLabel: string
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<MessageKey | null>
}) {
  const { t } = useLocale()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<MessageKey | null>(null)
  const lock = mode === 'lock'
  return (
    <Dialog
      open={mode !== null}
      onClose={onClose}
      title={lock ? `${t('close.lockBtn')} ${monthName}?` : `${t('close.reopenTitle')} ${monthName}?`}
      description={lock ? `${t('close.lockBody')} ${endLabel}` : t('close.reopenBody')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('btn.cancel')}
          </Button>
          <Button
            loading={busy}
            icon={
              lock ? <Lock aria-hidden className="size-4" /> : <LockOpen aria-hidden className="size-4" />
            }
            onClick={async () => {
              if (reason.trim().length < 5) return setError('err.reasonRequired')
              setError(await onConfirm(reason))
            }}
          >
            {lock ? t('close.confirmLock') : t('close.confirmReopen')}
          </Button>
        </>
      }
    >
      <TextAreaField
        label={t('close.reason')}
        value={reason}
        onChange={(e) => {
          setReason(e.target.value)
          setError(null)
        }}
        placeholder={t('close.reasonPh')}
        error={error ? t(error) : undefined}
      />
    </Dialog>
  )
}
