import { createContext, useContext } from 'react'
import type { Session, User } from '@/types/domain'
import { can, type Permission } from './permissions'

export interface SessionContextValue {
  user: User | null
  signIn: (session: Session) => void
  signOut: () => void
  /** Shortcut for can(user.role, permission). */
  can: (p: Permission) => boolean
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}

export const canFor = (user: User | null) => (p: Permission) => can(user?.role, p)
