import { ArrowRight } from 'lucide-react'
import { Navigate, useLocation } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { useLocale } from '@/lib/i18n-context'
import { useSession } from '@/lib/session-context'

/**
 * A calm cover page before Sign in — not a marketing site. Signed-out visitors land
 * here first (RequireUser redirects them); the "from" they were headed to carries
 * through to Sign in, so the trip continues once they're in.
 */
export function WelcomePage() {
  const { t, locale, setLocale } = useLocale()
  const { user } = useSession()
  const from = (useLocation().state as { from?: string } | null)?.from

  if (user) return <Navigate to="/" replace />

  return (
    <div className="bg-canvas flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-5 sm:px-8">
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="border-line-input text-ink-muted rounded-control grid size-9 place-items-center border border-dashed text-[9px]"
          >
            Logo
          </span>
          <bdi className="text-base font-bold tracking-tight">{t('app.company')}</bdi>
        </span>
        <button
          type="button"
          lang={locale === 'en' ? 'ar' : 'en'}
          aria-label={t('app.switchLabel')}
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="border-line-input hover:bg-mist-soft rounded-control min-h-10 border px-3 text-sm font-semibold"
        >
          {t('app.switch')}
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="border-line shadow-card rounded-panel w-full max-w-lg border bg-white p-10">
          <bdi className="block text-2xl font-bold tracking-tight sm:text-3xl">{t('app.company')}</bdi>
          <p className="text-slate mt-3 text-base font-semibold">{t('welcome.tagline')}</p>
          <p className="text-ink-muted mt-4 text-sm">{t('welcome.body')}</p>
          <div className="mt-8">
            <ButtonLink
              to="/sign-in"
              state={from ? { from } : undefined}
              icon={<ArrowRight aria-hidden className="size-4 rtl:rotate-180" />}
              className="w-full sm:w-auto"
            >
              {t('welcome.cta')}
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  )
}
