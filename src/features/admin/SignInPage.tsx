import { Eye, EyeOff, Languages, LogIn } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { TextField } from '@/components/ui/Field'
import { Card } from '@/components/ui/Layout'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { ROLES } from '@/lib/permissions'
import { useSession } from '@/lib/session-context'
import { errorCode } from '../books/api'
import { useSignIn } from './api'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Demo accounts (test values, also listed in README.md). Removed when the real backend arrives. */
const DEMO_PASSWORD = 'demo1234'

export function SignInPage() {
  const { t, locale, setLocale } = useLocale()
  const { user, signIn } = useSession()
  const navigate = useNavigate()
  const next = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const mutation = useSignIn()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: MessageKey; password?: MessageKey }>({})

  if (user) return <Navigate to={next} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!email.trim()) errs.email = 'err.emailRequired'
    else if (!EMAIL.test(email.trim())) errs.email = 'err.emailFormat'
    if (!password) errs.password = 'err.passwordRequired'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      signIn(await mutation.mutateAsync({ email: email.trim(), password }))
      navigate(next, { replace: true })
    } catch {
      /* shown below */
    }
  }

  const code = mutation.isError ? errorCode(mutation.error) : null

  return (
    <div className="bg-canvas flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="border-line-input text-ink-muted grid size-9 place-items-center rounded-xl border-2 border-dashed text-[9px]"
          >
            Logo
          </span>
          <bdi className="font-bold">{t('app.company')}</bdi>
        </span>
        <button
          type="button"
          lang={locale === 'en' ? 'ar' : 'en'}
          aria-label={t('app.switchLabel')}
          onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
          className="border-line-input hover:bg-mist-soft rounded-control inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-semibold pointer-coarse:min-h-11"
        >
          <Languages aria-hidden className="size-4" />
          {t('app.switch')}
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 sm:pt-12">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="fog-soft border-line border-b px-6 py-5">
              <h1 className="text-2xl font-extrabold tracking-tight">{t('auth.title')}</h1>
              <p className="text-ink-muted mt-1 text-sm">{t('auth.sub')}</p>
            </div>
            <form noValidate onSubmit={submit} className="flex flex-col gap-4 p-6">
              {code === 'badCredentials' && <Alert tone="error" title={t('err.badCredentials')} />}
              {code === 'inactive' && <Alert tone="error" title={t('err.inactive')} />}
              {mutation.isError && !code && <Alert tone="error" title={t('err.signInServer')} />}
              <TextField
                label={t('auth.email')}
                type="email"
                autoComplete="username"
                dir="ltr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErrors((x) => ({ ...x, email: undefined }))
                }}
                error={errors.email && t(errors.email)}
              />
              <div className="relative">
                <TextField
                  label={t('auth.password')}
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  dir="ltr"
                  className="pe-12"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrors((x) => ({ ...x, password: undefined }))
                  }}
                  error={errors.password && t(errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? t('auth.hide') : t('auth.show')}
                  aria-pressed={show}
                  className="text-ink-muted hover:text-ink absolute end-1 top-7 grid size-10 place-items-center rounded-md pointer-coarse:size-11"
                >
                  {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                </button>
              </div>
              <Button
                type="submit"
                loading={mutation.isPending}
                icon={<LogIn aria-hidden className="size-4 rtl:-scale-x-100" />}
              >
                {t('auth.signIn')}
              </Button>
              <p className="text-ink-muted text-xs">{t('auth.forgot')}</p>
            </form>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold">{t('auth.demoTitle')}</h2>
            <p className="text-ink-muted mt-1 text-xs">
              {t('auth.demoHint')}{' '}
              <bdi dir="ltr" className="text-ink font-semibold">
                {DEMO_PASSWORD}
              </bdi>
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {ROLES.map((role) => (
                <li key={role}>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(`${role}@demo.test`)
                      setPassword(DEMO_PASSWORD)
                      setErrors({})
                    }}
                    className="border-line-input hover:bg-mist-soft rounded-control flex min-h-11 w-full flex-col items-start px-3 py-2 text-start"
                  >
                    <span className="text-sm font-semibold">{t(`role.${role}` as MessageKey)}</span>
                    <bdi dir="ltr" className="text-ink-muted text-xs">
                      {role}@demo.test
                    </bdi>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
