import { ArrowLeftRight, CheckCircle2, FileUp, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { FilterTabs } from '@/components/ui/Filters'
import { Card, CardHeader, PageHeader, StatCard } from '@/components/ui/Layout'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { formatDate, formatDayMonth } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { money } from '@/lib/money'
import type { AccountId, BankTxn, MoneyAccount, ResolveAction, StatementLine } from '@/types/domain'
import { useAccounts } from '../purchases/api'
import { useReconciliation, useResolveLine, useTransactions } from './api'
import { useParty } from './party'

const EA: MoneyAccount[] = []
const ET: BankTxn[] = []
const IDS: AccountId[] = ['bank-main', 'mobile-1', 'mobile-2']

const ACTION: Record<
  Exclude<StatementLine['state'], 'matched'>,
  { action: ResolveAction; label: MessageKey }
> = {
  suggested: { action: 'match', label: 'rec.match' },
  missing: { action: 'record', label: 'rec.record' },
  fee: { action: 'fee', label: 'rec.addFee' },
  unknown: { action: 'hold', label: 'rec.hold' },
}

export function ReconcilePage() {
  const { t, locale } = useLocale()
  const [params, setParams] = useSearchParams()
  const { data: accounts = EA } = useAccounts()
  const fromUrl = params.get('account') as AccountId | null
  const account: AccountId =
    fromUrl && IDS.includes(fromUrl) ? fromUrl : (accounts.find((a) => a.unmatched > 0)?.id ?? 'bank-main')
  const { data: r, isPending, isError, refetch } = useReconciliation(account)
  const { data: txns = ET } = useTransactions()
  const resolve = useResolveLine(account)
  const [importNote, setImportNote] = useState(false)

  const open = r?.lines.filter((l) => l.state !== 'matched') ?? []
  const done = r?.lines.filter((l) => l.state === 'matched') ?? []
  const settled = r && open.length === 0 && money(r.difference).isZero()

  return (
    <>
      <PageHeader
        title={t('nav.reconcile')}
        description={t('rec.intro')}
        actions={
          <Button
            variant="secondary"
            icon={<FileUp aria-hidden className="size-4" />}
            onClick={() => setImportNote(true)}
          >
            {t('rec.import')}
          </Button>
        }
      />
      {importNote && (
        <div className="mb-4">
          <Alert tone="info" title={t('rec.import')}>
            {t('rec.importNote')}
          </Alert>
        </div>
      )}

      <div className="mb-5 overflow-x-auto">
        <FilterTabs
          label={t('nav.reconcile')}
          value={account}
          onChange={(id) => setParams({ account: id }, { replace: true })}
          options={IDS.map((id) => {
            const a = accounts.find((x) => x.id === id)
            const n = a?.unmatched ?? 0
            return {
              value: id,
              label: `${t(`acct.${id}` as MessageKey)}${a && n === 0 ? ' ✓' : ''}`,
              count: a && n > 0 ? n : undefined,
            }
          })}
        />
      </div>

      {isPending && <Skeleton rows={6} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('rec.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}

      {r && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t('rec.statementBal')}
              value={<Amount value={r.statementBalance} />}
              footnote={`${t('rec.statementTo')} ${formatDate(r.statementDate, locale)}`}
            />
            <StatCard label={t('rec.books')} value={<Amount value={r.bookBalance} />} />
            <StatCard
              variant="featured"
              label={t('rec.diff')}
              value={
                <span className="inline-flex items-center gap-2">
                  <Amount value={r.difference} />
                  {money(r.difference).isZero() && <CheckCircle2 aria-hidden className="text-slate size-6" />}
                </span>
              }
            />
            <StatCard
              label={t('rec.progress')}
              value={
                <span className="text-base font-bold">
                  {r.matchedBefore + done.length} {t('rec.matchedCount')}
                </span>
              }
              footnote={`${open.filter((l) => l.state === 'suggested').length} ${t('rec.suggestedCount')} · ${
                open.filter((l) => l.state !== 'suggested').length
              } ${t('rec.openCount')}`}
            />
          </div>

          {settled && <Alert tone="success" title={t('rec.reconciled')} />}
          {resolve.isError && <Alert tone="error" title={t('rec.server')} />}

          {open.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader title={`${t('rec.toResolve')} · ${open.length}`} />
              <div className="text-ink-muted mt-3 hidden grid-cols-[1.2fr_auto_1.2fr_1fr_auto] gap-4 px-5 text-xs font-semibold lg:grid">
                <span>{t('rec.onStatement')}</span>
                <span className="w-5" />
                <span>{t('rec.inBooks')}</span>
                <span>{t('rec.why')}</span>
                <span className="w-36" />
              </div>
              <ul className="divide-line mt-2 divide-y">
                {open.map((l) => (
                  <LineRow
                    key={l.id}
                    line={l}
                    txns={txns}
                    busy={resolve.isPending && resolve.variables?.lineId === l.id}
                    disabled={resolve.isPending}
                    onResolve={(action) => resolve.mutate({ lineId: l.id, action })}
                  />
                ))}
              </ul>
            </Card>
          )}

          {r.bookOnly.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader title={t('rec.bookOnly')} description={t('rec.bookOnlyHint')} />
              <ul className="divide-line mt-3 divide-y">
                {r.bookOnly.map((x) => (
                  <BookOnlyRow key={x.id} txn={x} />
                ))}
              </ul>
            </Card>
          )}

          {done.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader title={`${t('rec.resolved')} · ${done.length}`} />
              <ul className="divide-line mt-3 divide-y">
                {done.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                    <CheckCircle2 aria-hidden className="text-slate size-4 shrink-0" />
                    <span className="text-ink-muted w-14 shrink-0">{formatDayMonth(l.date, locale)}</span>
                    <span className="min-w-0 flex-1">
                      <bdi>{l.text}</bdi>
                    </span>
                    <span className="text-slate text-xs font-semibold">
                      {t(`rec.res.${l.resolution ?? 'matched'}` as MessageKey)}
                    </span>
                    <Amount value={l.amount} className="w-28 text-end font-semibold" />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  )
}

function LineRow({
  line: l,
  txns,
  busy,
  disabled,
  onResolve,
}: {
  line: StatementLine
  txns: BankTxn[]
  busy: boolean
  disabled: boolean
  onResolve: (a: ResolveAction) => void
}) {
  const { t, locale } = useLocale()
  const act = ACTION[l.state as keyof typeof ACTION]
  const book = txns.find((x) => x.id === l.bookTxnId)
  const why =
    l.state === 'suggested' ? (`rec.why.${l.why}` as MessageKey) : (`rec.why.${l.state}` as MessageKey)
  const certain = l.state === 'suggested' || l.state === 'missing'

  return (
    <li className="grid gap-x-4 gap-y-2 px-5 py-4 text-sm lg:grid-cols-[1.2fr_auto_1.2fr_1fr_auto] lg:items-center">
      <div className="flex flex-col">
        <span className="flex items-baseline gap-2">
          <span className="text-ink-muted">{formatDayMonth(l.date, locale)}</span>
          <Amount
            value={l.amount}
            className={cn('font-bold', money(l.amount).isNegative() && 'text-ink-muted')}
          />
        </span>
        <span className="font-semibold">
          <bdi>{l.text}</bdi>
        </span>
        {l.reference && (
          <span className="text-ink-muted text-xs">
            <bdi dir="ltr">{l.reference}</bdi>
          </span>
        )}
      </div>
      <span aria-hidden className="text-ink-subtle hidden lg:block">
        {certain ? <ArrowLeftRight className="size-5" /> : <HelpCircle className="size-5" />}
      </span>
      <div className="flex flex-col">
        <span className="text-ink-muted text-xs lg:hidden">{t('rec.inBooks')}</span>
        {l.state === 'suggested' && book ? (
          <span>
            {t('rec.paymentFor')}{' '}
            {book.link && (
              <Link to={`/invoices/${book.link.id}`} className="text-slate font-semibold underline">
                <bdi dir="ltr">{book.link.id}</bdi>
              </Link>
            )}{' '}
            · <bdi>{book.party}</bdi>
          </span>
        ) : l.state === 'missing' && l.invoiceId ? (
          <span>
            {t('rec.openInvoice')}{' '}
            <Link to={`/invoices/${l.invoiceId}`} className="text-slate font-semibold underline">
              <bdi dir="ltr">{l.invoiceId}</bdi>
            </Link>
          </span>
        ) : (
          <span className="text-ink-muted">{t(l.state === 'fee' ? 'rec.nothing' : 'rec.noMatch')}</span>
        )}
      </div>
      <p className="text-ink-muted text-xs">{t(why)}</p>
      <div className="lg:w-36 lg:text-end">
        <Button
          size="sm"
          variant={l.state === 'suggested' ? 'primary' : 'secondary'}
          loading={busy}
          disabled={disabled && !busy}
          onClick={() => onResolve(act.action)}
          className="w-full lg:w-auto"
        >
          {t(act.label)}
        </Button>
      </div>
    </li>
  )
}

function BookOnlyRow({ txn: x }: { txn: BankTxn }) {
  const { t, locale } = useLocale()
  const party = useParty()
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
      <span className="text-ink-muted w-14 shrink-0">{formatDayMonth(x.date, locale)}</span>
      <span className="min-w-0 flex-1">
        <bdi className="font-semibold">{party(x)}</bdi>
        <span className="text-ink-muted"> · {t(`txk.${x.kind}` as MessageKey)}</span>
      </span>
      <Amount value={x.amount} className="w-28 text-end font-semibold" />
    </li>
  )
}
