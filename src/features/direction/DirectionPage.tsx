import { AlertTriangle, ArrowRight, Languages, Plus, TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Amount } from '@/components/ui/Amount'
import { Button } from '@/components/ui/Button'
import { StatusBadge, type DocumentStatus } from '@/components/ui/StatusBadge'
import { TextField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n-context'

/**
 * Phase 2 deliverable: the "Blue fog" design direction, in English and Arabic.
 * Built from real components so the approved look carries straight into the build.
 */

const shades = [
  { name: 'mist-soft', hex: '#EEF3F9' },
  { name: 'mist', hex: '#DCE6F2' },
  { name: 'mist-strong', hex: '#C3D1E4' },
  { name: 'slate-disabled', hex: '#A9B6C8' },
  { name: 'slate', hex: '#4A5D78' },
  { name: 'slate-hover', hex: '#3E4F66' },
  { name: 'slate-pressed', hex: '#34435A' },
]
const neutrals = [
  { name: 'canvas', hex: '#F6F8FB' },
  { name: 'line', hex: '#DDE3EA' },
  { name: 'line-input', hex: '#8A94A3' },
  { name: 'ink-subtle', hex: '#69737F' },
  { name: 'ink-muted', hex: '#4D5866' },
  { name: 'ink', hex: '#1C2430' },
]
const rows: { no: string; customer: string; due: string; amount: string; status: DocumentStatus }[] = [
  { no: 'INV-2047', customer: 'Al-Noor Trading', due: '28 Nov 2026', amount: '2480', status: 'sent' },
  { no: 'INV-2046', customer: 'Crescent Foods Ltd.', due: '27 Nov 2026', amount: '0', status: 'paid' },
  { no: 'INV-2045', customer: 'Horizon Mini Market', due: '26 Nov 2026', amount: '1955', status: 'partial' },
  {
    no: 'INV-2043',
    customer: 'Green Valley Grocers',
    due: '11 Nov 2026',
    amount: '4105.20',
    status: 'overdue',
  },
  { no: 'INV-2048', customer: 'Sahel Wholesale', due: 'â€”', amount: '1120', status: 'draft' },
]
const allStatuses: DocumentStatus[] = ['draft', 'sent', 'partial', 'paid', 'overdue', 'void']

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="bg-panel shadow-card rounded-panel border-line border p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {note && <p className="text-ink-muted mt-1 max-w-3xl text-sm">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Swatch({ name, hex, tall = false }: { name: string; hex: string; tall?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        aria-hidden
        className={cn('border-line rounded-control border', tall ? 'h-20' : 'h-12')}
        style={{ backgroundColor: hex }}
      />
      <span dir="ltr" className="text-start text-xs font-semibold">
        {name}
      </span>
      <span dir="ltr" className="text-ink-muted text-start font-mono text-xs">
        {hex}
      </span>
    </div>
  )
}

export function DirectionPage() {
  const { t, locale, setLocale } = useLocale()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="border-line-input text-ink-muted grid size-10 place-items-center rounded-xl border-2 border-dashed text-[10px]"
          >
            Logo
          </span>
          <span className="font-bold">{t('app.company')}</span>
        </div>
        <Link to="/wireframes" lang="en" className="text-slate ms-auto text-sm font-semibold">
          Phase 3 Â· Wireframes â†’
        </Link>
        <button
          type="button"
          lang={locale === 'en' ? 'ar' : 'en'}
          aria-label={t('app.switchLabel')}
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="border-line-input bg-panel hover:bg-mist-soft rounded-control inline-flex min-h-10 items-center gap-2 border px-4 text-sm font-semibold pointer-coarse:min-h-11"
        >
          <Languages aria-hidden className="size-4" />
          {t('app.switch')}
        </button>
      </header>

      {/* Hero â€” the fog itself */}
      <section className="fog rounded-panel shadow-card overflow-hidden">
        <div className="flex min-h-72 max-w-xl flex-col justify-center gap-3 p-8 pb-24 sm:p-12">
          <p className="text-slate text-sm font-semibold">{t('dir.eyebrow')}</p>
          <h1 className="text-ink text-5xl font-extrabold tracking-tight">{t('dir.title')}</h1>
          <p className="text-ink-muted text-base">{t('dir.lead')}</p>
          <div
            dir="ltr"
            className="text-slate mt-2 flex items-center gap-3 self-start font-mono text-sm font-semibold"
          >
            <span>#DCE6F2</span>
            <ArrowRight aria-hidden className="size-4" />
            <span>#4A5D78</span>
          </div>
        </div>
      </section>

      {/* Colour */}
      <Section title={t('dir.colour')} note={t('dir.colourNote')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-line rounded-card overflow-hidden border">
            <div className="bg-mist h-28" />
            <div className="flex flex-col gap-0.5 p-4">
              <span className="font-bold">{t('dir.mist')}</span>
              <span dir="ltr" className="text-ink-muted text-start font-mono text-sm">
                #DCE6F2
              </span>
              <span className="text-ink-muted text-sm">{t('dir.mistUse')}</span>
            </div>
          </div>
          <div className="border-line rounded-card overflow-hidden border">
            <div className="bg-slate h-28" />
            <div className="flex flex-col gap-0.5 p-4">
              <span className="font-bold">{t('dir.slate')}</span>
              <span dir="ltr" className="text-ink-muted text-start font-mono text-sm">
                #4A5D78
              </span>
              <span className="text-ink-muted text-sm">{t('dir.slateUse')}</span>
            </div>
          </div>
        </div>
        <div className="fog rounded-card mt-4 h-10" aria-hidden />
        <p className="text-ink-muted mt-6 mb-2 text-xs font-bold tracking-wide uppercase">
          {t('dir.shades')}
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
          {shades.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
        <p className="text-ink-muted mt-6 mb-2 text-xs font-bold tracking-wide uppercase">
          {t('dir.neutrals')}
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {neutrals.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title={t('dir.type')} note={t('dir.typeNote')}>
        <div className="divide-line flex flex-col divide-y">
          <p className="pb-3 text-4xl font-extrabold tracking-tight">{t('greeting')}</p>
          <p className="py-3 text-2xl font-bold">{t('table.title')}</p>
          <p className="py-3 text-base font-semibold">Al-Noor Trading</p>
          <p className="text-ink-muted py-3 text-sm">{t('dir.lead')}</p>
          <p className="flex flex-wrap gap-8 pt-3 text-2xl font-bold">
            <Amount value="48325.90" />
            <Amount value="-250" />
          </p>
        </div>
      </Section>

      {/* Components */}
      <Section title={t('dir.components')}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={<Plus aria-hidden className="size-4" />}>{t('btn.primary')}</Button>
            <Button variant="secondary">{t('btn.secondary')}</Button>
            <Button variant="quiet">
              {t('btn.quiet')} <ArrowRight aria-hidden className="size-4 rtl:rotate-180" />
            </Button>
            <Button disabled>{t('btn.disabled')}</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t('field.customer')} placeholder={t('field.customerPh')} />
            <TextField label={t('field.due')} defaultValue="31 Feb 2026" error={t('field.dueError')} />
          </div>
          <div className="flex flex-wrap gap-2">
            {allStatuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </div>
      </Section>

      {/* Applied to a screen */}
      <Section title={t('dir.sample')}>
        <div className="bg-canvas rounded-card -mx-2 flex flex-col gap-5 p-4 sm:mx-0 sm:p-6">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">{t('greeting')}</p>
            <p className="text-ink-muted text-sm">{t('greetingSub')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="fog-soft border-line rounded-card shadow-card border p-5">
              <p className="text-ink-muted text-sm">{t('kpi.revenue')}</p>
              <p className="mt-1 text-2xl font-extrabold">
                <Amount value="48325.90" />
              </p>
              <p className="text-ink-muted mt-1 flex items-center gap-1.5 text-sm">
                <TrendingUp aria-hidden className="text-slate size-4" />
                <span className="text-slate font-bold">+8.4%</span> {t('kpi.revenueNote')}
              </p>
            </div>
            <div className="bg-panel border-line rounded-card shadow-card border p-5">
              <p className="text-ink-muted text-sm">{t('kpi.owed')}</p>
              <p className="mt-1 text-2xl font-extrabold">
                <Amount value="32242.03" />
              </p>
              <p className="text-ink-muted mt-1 text-sm">{t('kpi.owedNote')}</p>
            </div>
            <div className="bg-panel border-alert rounded-card shadow-card border-2 p-5">
              <p className="text-alert flex items-center gap-1.5 text-sm font-bold">
                <AlertTriangle aria-hidden className="size-4" />
                {t('kpi.overdue')}
              </p>
              <p className="text-alert mt-1 text-2xl font-extrabold">
                <Amount value="17321.63" />
              </p>
              <p className="text-ink-muted mt-1 text-sm">{t('kpi.overdueNote')}</p>
            </div>
            <div className="bg-panel border-line rounded-card shadow-card border p-5">
              <p className="text-ink-muted text-sm">{t('kpi.bank')}</p>
              <p className="mt-1 text-2xl font-extrabold">
                <Amount value="75775.90" />
              </p>
              <p className="text-ink-muted mt-1 text-sm">{t('kpi.bankNote')}</p>
            </div>
          </div>

          <div className="bg-panel border-line rounded-card shadow-card overflow-hidden border">
            <p className="px-5 py-4 font-bold">{t('table.title')}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm whitespace-nowrap">
                <caption className="sr-only">{t('table.title')}</caption>
                <thead className="bg-mist-soft text-ink-muted text-xs">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 text-start font-semibold">
                      {t('table.no')}
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                      {t('table.customer')}
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-start font-semibold">
                      {t('table.due')}
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-end font-semibold">
                      {t('table.amount')}
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-start font-semibold">
                      {t('table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.no} className="border-line hover:bg-mist-soft border-t">
                      <td className="px-5 py-3 font-semibold">
                        <bdi dir="ltr">{r.no}</bdi>
                      </td>
                      <td className="px-3 py-3">
                        <bdi>{r.customer}</bdi>
                      </td>
                      <td className="text-ink-muted px-3 py-3">
                        <bdi>{r.due}</bdi>
                      </td>
                      <td className="num px-3 py-3 font-semibold">
                        <Amount value={r.amount} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>

      {/* Decision B: warning red, for overdue and errors only */}
      <Section title={t('dir.alert')} note={t('dir.alertNote')}>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="border-line rounded-card overflow-hidden border">
            <div className="bg-alert h-20" />
            <div className="flex flex-col gap-0.5 p-4">
              <span className="font-bold">{t('dir.alertName')}</span>
              <span dir="ltr" className="text-ink-muted text-start font-mono text-sm">
                #B42318
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
            <div role="alert" className="bg-alert-soft rounded-card flex items-start gap-3 p-4">
              <AlertTriangle aria-hidden className="text-alert mt-0.5 size-5 shrink-0" />
              <div className="text-sm">
                <p className="text-alert font-bold">{t('dir.alertSampleTitle')}</p>
                <p className="text-ink-muted">{t('dir.alertSampleBody')}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
