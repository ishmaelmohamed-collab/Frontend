import { isAxiosError } from 'axios'
import { Eye, EyeOff, LogIn } from 'lucide-react'
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

/**
 * Demo mode (no backend): the in-browser mock API accepts these test accounts, also listed in README.md.
 * With the real backend nothing is shown here — real accounts are created by the Owner.
 */
const DEMO = import.meta.env.VITE_USE_MOCKS !== 'false'
const DEMO_PASSWORD = 'demo1234'
const DEMO_ACCOUNTS = ROLES.map((role) => ({ username: role, role }))

export function SignInPage() {
  const { t, locale, setLocale } = useLocale()
  const { user, signIn } = useSession()
  const navigate = useNavigate()
  const next = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const mutation = useSignIn()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<{ email?: MessageKey; password?: MessageKey }>({})

  if (user) return <Navigate to={next} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!username.trim()) errs.email = 'err.usernameRequired'
    if (!password) errs.password = 'err.passwordRequired'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      signIn(await mutation.mutateAsync({ username: username.trim(), password }))
      navigate(next, { replace: true })
    } catch {
      /* shown below */
    }
  }

  // The real backend answers a wrong password with 401 and no code; the demo API with code "badCredentials".
  const code = !mutation.isError
    ? null
    : (errorCode(mutation.error) ??
      (isAxiosError(mutation.error) && mutation.error.response?.status === 401 ? 'badCredentials' : null))

  return (
    <div className="bg-canvas flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
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

      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 sm:pt-12">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="brand-gradient px-6 py-7 text-white">
              <h1 className="text-xl font-bold tracking-tight">{t('auth.title')}</h1>
              <p className="mt-1 text-sm text-white/75">{t('auth.sub')}</p>
            </div>
            <form noValidate onSubmit={submit} className="flex flex-col gap-4 p-6">
              {code === 'badCredentials' && <Alert tone="error" title={t('err.badCredentials')} />}
              {code === 'inactive' && <Alert tone="error" title={t('err.inactive')} />}
              {mutation.isError && !code && <Alert tone="error" title={t('err.signInServer')} />}
              <TextField
                label={t('auth.username')}
                type="text"
                autoComplete="username"
                dir="ltr"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
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
                  className="text-ink-muted hover:text-ink absolute end-1 top-7 grid size-10 place-items-center pointer-coarse:size-11"
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

          {DEMO && (
            <Card className="p-5">
              <h2 className="text-sm font-bold">{t('auth.demoTitle')}</h2>
              <p className="text-ink-muted mt-1 text-xs">{t('auth.demoOnly')}</p>
              <p className="text-ink-muted mt-1 text-xs">
                {t('auth.demoHint')}{' '}
                <bdi dir="ltr" className="text-ink font-semibold">
                  {DEMO_PASSWORD}
                </bdi>
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <li key={a.username}>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(a.username)
                        setPassword(DEMO_PASSWORD)
                        setErrors({})
                      }}
                      className="border-line-input hover:bg-mist-soft rounded-control flex min-h-11 w-full flex-col items-start border px-3 py-2 text-start"
                    >
                      <span className="text-sm font-semibold">{t(`role.${a.role}` as MessageKey)}</span>
                      <bdi dir="ltr" className="text-ink-muted text-xs">
                        {a.username}
                      </bdi>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
