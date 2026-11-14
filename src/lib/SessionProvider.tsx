import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@/types/domain'
import { api } from './api'
import { toUser } from './auth-map'
import { canFor, SessionContext, type SessionContextValue } from './session-context'

/**
 * Who is signed in. The real backend keeps the session in an http-only cookie;
 * on load we ask /auth/me to restore the user, and sign-out calls /auth/logout.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!cancelled && data?.username) setUser(toUser(data.username, data.role))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const signOut = useCallback(() => {
    api.post('/auth/logout').catch(() => {})
    qc.clear()
    setUser(null)
  }, [qc])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      signIn: (s: Session) => {
        qc.clear()
        setUser(s.user)
      },
      signOut,
      can: canFor(user),
    }),
    [user, signOut, qc],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
