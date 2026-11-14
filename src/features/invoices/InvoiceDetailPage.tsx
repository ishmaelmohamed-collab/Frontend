import { ArrowLeft, Bell, CheckCircle2, CircleDashed, FileDown, HandCoins } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Feedback'
import { Card, CardHeader } from '@/components/ui/Layout'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatTime } from '@/lib/dates'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import type { Invoice } from '@/types/domain'
import { useInvoice } from './api'
import { RecordPaymentDrawer } from './RecordPaymentDrawer'

export function InvoiceDetailPage() {
  const { id = '' } = useParams()
  const { t, locale } = useLocale()
  const { data: inv, isPending, isError, refetch } = useInvoice(id)
  const [paying, setPaying] = useState(false)
  const [toast, setToast] = useState<Invoice | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  const payable = inv && (inv.status === 'sent' || inv.status === 'partial' || inv.status === 'overdue')

  return (
    <>
      <Link
        to="/invoices"
        className="text-ink-muted hover:text-ink mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
        {t('inv.title')}
      </Link>

      {isPending && <Skeleton rows={7} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('det.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}

      {inv && (
        <>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="flex flex-wrap items-center gap-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                <bdi dir="ltr">{inv.number}</bdi>
                <StatusBadge status={inv.status} />
              </h1>
              <p className="text-ink-muted mt-1 text-sm">
                <bdi>{inv.customerName}</bdi> · {t('det.dueDate')} {formatDate(inv.dueDate, locale)} ·{' '}
                <Amount value={inv.due} className="text-ink font-bold" /> {t('det.due')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {payable && (
                <Button variant="secondary" icon={<Bell aria-hidden className="size-4" />}>
                  {t('det.reminder')}
                </Button>
              )}
              <Button
                variant="secondary"
                icon={<FileDown aria-hidden className="size-4" />}
                onClick={() => window.print()}
              >
                {t('det.pdf')}
              </Button>
              {payable && (
                <Button icon={<HandCoins aria-hidden className="size-4" />} onClick={() => setPaying(true)}>
                  {t('btn.openDrawer')}
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* The document the customer receives */}
            <Card className="p-6 sm:p-8">
              <div className="border-line flex flex-wrap justify-between gap-6 border-b pb-6">
                <div>
                  <span
                    aria-hidden
                    className="border-line-input text-ink-muted mb-3 grid h-10 w-28 place-items-center rounded-lg border-2 border-dashed text-xs"
                  >
                    Logo
                  </span>
                  <p className="text-ink-muted text-xs font-bold tracking-wide uppercase">
                    {t('det.billTo')}
                  </p>
                  <p className="font-bold">
                    <bdi>{inv.customerName}</bdi>
                  </p>
                </div>
                <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 self-end text-sm">
                  <dt className="text-ink-muted">{t('det.issueDate')}</dt>
                  <dd className="text-end">{formatDate(inv.issueDate, locale)}</dd>
                  <dt className="text-ink-muted">{t('det.dueDate')}</dt>
                  <dd className="text-end">{formatDate(inv.dueDate, locale)}</dd>
                </dl>
              </div>

              <div className="overflow-x-auto">
                <table className="mt-4 w-full min-w-[480px] text-sm">
                  <caption className="sr-only">{t('det.item')}</caption>
                  <thead>
                    <tr className="border-line text-ink-muted border-b text-xs">
                      <th scope="col" className="py-2 text-start font-semibold">
                        {t('det.item')}
                      </th>
                      <th scope="col" className="py-2 text-end font-semibold">
                        {t('det.qty')}
                      </th>
                      <th scope="col" className="py-2 text-end font-semibold">
                        {t('det.price')}
                      </th>
                      <th scope="col" className="py-2 text-end font-semibold">
                        {t('det.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.lines.map((l, i) => (
                      <tr key={i} className="border-line border-b">
                        <td className="py-3 pe-3">
                          <bdi>{l.description}</bdi>
                        </td>
                        <td className="num py-3 ps-3">{l.quantity}</td>
                        <td className="num py-3 ps-3">
                          <Amount value={l.unitPrice} />
                        </td>
                        <td className="num py-3 ps-3 font-semibold">
                          <Amount value={l.amount} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <dl className="ms-auto mt-5 grid max-w-xs grid-cols-2 gap-y-2 text-sm">
                <dt>{t('table.total')}</dt>
                <dd className="num">
                  <Amount value={inv.total} />
                </dd>
                <dt>{t('det.paid')}</dt>
                <dd className="num">
                  <Amount value={inv.paid} />
                </dd>
                <dt className="border-line border-t pt-2 text-base font-bold">{t('det.amountDue')}</dt>
                <dd
                  className={`num border-line border-t pt-2 text-base font-bold ${inv.status === 'overdue' ? 'text-alert' : ''}`}
                >
                  <Amount value={inv.due} />
                </dd>
              </dl>
              <p className="text-ink-muted mt-8 text-xs">{t('det.payTo')}</p>
            </Card>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader title={t('det.payments')} />
                <div className="p-5">
                  {inv.payments.length === 0 ? (
                    <p className="text-ink-muted text-sm">{t('det.noPayments')}</p>
                  ) : (
                    <ul className="flex flex-col gap-4">
                      {inv.payments.map((p) => (
                        <li key={p.id} className="flex flex-col gap-0.5 text-sm">
                          <span className="flex justify-between gap-3 font-bold">
                            <span>
                              {p.accountId ? t(`acct.${p.accountId}` as MessageKey) : t('f.credit')}
                            </span>
                            <Amount value={p.amount} />
                          </span>
                          <span className="text-ink-muted text-xs">
                            {formatDate(p.date, locale)}
                            {p.reference && (
                              <>
                                {' · '}
                                <bdi dir="ltr">{p.reference}</bdi>
                              </>
                            )}
                            {' · '}
                            {t(`role.${p.recordedBy}`)}
                          </span>
                          <span className="text-slate inline-flex items-center gap-1 text-xs font-semibold">
                            {p.matched ? (
                              <CheckCircle2 aria-hidden className="size-3.5" />
                            ) : (
                              <CircleDashed aria-hidden className="size-3.5" />
                            )}
                            {p.matched ? t('pay.matched') : t('pay.unmatched')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
              <Card>
                <CardHeader title={t('det.activity')} />
                <ol className="flex flex-col gap-3 p-5">
                  {inv.activity.map((a, i) => (
                    <li key={i} className="border-mist-strong border-s-2 ps-3 text-sm">
                      <span className="font-semibold">{t(`act.${a.kind}`)}</span>
                      {a.amount && (
                        <>
                          {' · '}
                          <Amount value={a.amount} />
                        </>
                      )}
                      <span className="text-ink-muted block text-xs">
                        {formatDate(a.at, locale)} {formatTime(a.at, locale)} · {t(`role.${a.by}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>

          <RecordPaymentDrawer
            key={inv.due /* fresh form (and default amount) after every payment */}
            invoice={inv}
            open={paying}
            onClose={() => setPaying(false)}
            onRecorded={(updated) => {
              setPaying(false)
              setToast(updated)
            }}
          />

          {toast && (
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-6">
              <div className="pointer-events-auto w-full max-w-md">
                <Toast closeLabel={t('btn.close')} onClose={() => setToast(null)}>
                  {t('det.recorded')} · <bdi dir="ltr">{toast.number}</bdi> · {t('det.nowStatus')}{' '}
                  {t(`status.${toast.status}`)}
                </Toast>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
