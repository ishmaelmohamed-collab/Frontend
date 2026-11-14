import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { ButtonLink } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Layout'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import type { Permission } from '@/lib/permissions'
import { useSession } from '@/lib/session-context'

/** Signed-out visitors go to the sign-in screen, and come back here afterwards. */
export function RequireUser({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const { pathname, search } = useLocation()
  if (!user) return <Navigate to="/sign-in" replace state={{ from: pathname + search }} />
  return children
}

/** Screen-level role check. The API refuses too — this only avoids showing a screen that can't work. */
export function Guard({ perm, children }: { perm?: Permission; children: ReactNode }) {
  const { can } = useSession()
  return !perm || can(perm) ? children : <NoAccess />
}

export function NoAccess() {
  const { t } = useLocale()
  const { user } = useSession()
  return (
    <>
      <PageHeader title={t('auth.noAccess')} />
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span
          aria-hidden
          className="fog-soft border-mist text-slate grid size-14 place-items-center rounded-full border"
        >
          <Lock className="size-6" />
        </span>
        <p className="text-ink-muted max-w-md text-sm">
          {t('auth.noAccessBody')} {user && <strong>{t(`role.${user.role}` as MessageKey)}</strong>}
        </p>
        <ButtonLink to="/" variant="secondary" className="mt-2">
          {t('soon.back')}
        </ButtonLink>
      </Card>
    </>
  )
}

export function NotFound() {
  const { t } = useLocale()
  return (
    <>
      <PageHeader title={t('notFound.title')} />
      <ButtonLink to="/">{t('soon.back')}</ButtonLink>
    </>
  )
}
