import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@/types/domain'
import { setAuth } from './api'
import { canFor, SessionContext, type SessionContextValue } from './session-context'

const STORAGE_KEY = 'accounting.session'

function readSaved(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function save(s: Session | null) {
  try {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage blocked — the session lasts for this visit only */
  }
}

/**
 * Who is signed in. Demo: the token is kept in this browser so a reload keeps you signed in.
 * With the real backend this becomes an http-only cookie set by the server.
 */
export function SessionProvider({ children, initial }: { children: ReactNode; initial?: Session | null }) {
  const qc = useQueryClient()
  const [session, setSession] = useState<Session | null>(() =>
    initial !== undefined ? initial : readSaved(),
  )

  const signOut = useCallback(() => {
    setAuth(null)
    save(null)
    setSession(null)
    qc.clear() // never show the previous user's data to the next one
  }, [qc])

  // Set synchronously so the very first requests already carry the token.
  setAuth(session?.token ?? null, signOut)

  const value = useMemo<SessionContextValue>(
    () => ({
      user: session?.user ?? null,
      signIn: (s) => {
        qc.clear()
        setAuth(s.token, signOut)
        save(s)
        setSession(s)
      },
      signOut,
      can: canFor(session?.user ?? null),
    }),
    [session, signOut, qc],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
