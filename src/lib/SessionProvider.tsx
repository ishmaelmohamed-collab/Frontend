import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@/types/domain'
import { api } from './api'
import { toUser, type AuthResponse } from './auth-map'
import { canFor, SessionContext, type SessionContextValue } from './session-context'

/**
 * Who is signed in. The backend (real or demo) keeps the session in an http-only cookie;
 * on load we ask /auth/me to restore the user (`ready` stays false until it answers, so a
 * reload never flashes the sign-in screen), and sign-out calls /auth/logout.
 */
export function SessionProvider({ children, initial }: { children: ReactNode; initial?: User | null }) {
  const qc = useQueryClient()
  const [user, setUser] = useState<User | null>(initial ?? null)
  const [ready, setReady] = useState(initial !== undefined)

  useEffect(() => {
    if (initial !== undefined) return
    let cancelled = false
    api
      .get<AuthResponse>('/auth/me')
      .then(({ data }) => {
        if (!cancelled && data?.username) setUser(toUser(data))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [initial])

  // Session ended on the server (expired, user switched off): back to the sign-in screen.
  useEffect(() => {
    const id = api.interceptors.response.use(undefined, (error) => {
      const url = String(error?.config?.url ?? '')
      if (isAxiosError(error) && error.response?.status === 401 && !url.startsWith('/auth/')) {
        qc.clear()
        setUser(null)
      }
      return Promise.reject(error)
    })
    return () => api.interceptors.response.eject(id)
  }, [qc])

  const signOut = useCallback(() => {
    api.post('/auth/logout').catch(() => {})
    qc.clear() // never show the previous user's data to the next one
    setUser(null)
  }, [qc])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      ready,
      signIn: (s: Session) => {
        qc.clear()
        setUser(s.user)
      },
      signOut,
      can: canFor(user),
    }),
    [user, ready, signOut, qc],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
