/**
 * Batch 5: sign-in, users & roles, company settings.
 * Demo only — the real backend will hash passwords and issue real tokens.
 * Demo accounts (all use the password below) are listed in README.md.
 */
import { can, ROLES } from '@/lib/permissions'
import type { Role, Session, Settings, User } from '@/types/domain'
import { settings, toCents, toMoney, ValidationError } from './db'
import { applyApprovalLimit } from './purchases'

export const DEMO_PASSWORD = 'demo1234'

export const users: User[] = [
  { id: 'u1', name: 'Amina Yusuf', email: 'owner@demo.test', role: 'owner', active: true },
  { id: 'u2', name: 'Khalid Omar', email: 'accountant@demo.test', role: 'accountant', active: true },
  { id: 'u3', name: 'Sara Ahmed', email: 'cashier@demo.test', role: 'cashier', active: true },
  { id: 'u4', name: 'Yusuf Hassan', email: 'sales@demo.test', role: 'sales', active: true },
]

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tokenFor = (u: User) => `demo.${u.id}`

export function signIn(email: string, password: string): Session {
  const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
  // Same message for unknown email and wrong password, so it can't be used to find accounts.
  if (!u || password !== DEMO_PASSWORD) throw new ValidationError('badCredentials')
  if (!u.active) throw new ValidationError('inactive')
  return { token: tokenFor(u), user: u }
}

/** The user behind a request's token, or null when signed out / deactivated. */
export function userFromToken(header: string | null): User | null {
  const id = header?.match(/^Bearer demo\.(\w+)$/)?.[1]
  const u = users.find((x) => x.id === id)
  return u && u.active ? u : null
}

// ── users (Owner only) ─────────────────────────────────
const assertOwner = (by: Role) => {
  if (!can(by, 'settings.edit')) throw new ValidationError('ownerOnly')
}

export function inviteUser(input: { name: string; email: string; role: Role }, by: Role): User {
  assertOwner(by)
  if (!input.name.trim()) throw new ValidationError('nameRequired')
  if (!EMAIL.test(input.email.trim())) throw new ValidationError('emailFormat')
  if (users.some((u) => u.email.toLowerCase() === input.email.trim().toLowerCase()))
    throw new ValidationError('emailTaken')
  if (!ROLES.includes(input.role)) throw new ValidationError('roleRequired')
  const u: User = {
    id: `u${users.length + 1}`,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role,
    active: true,
  }
  users.push(u)
  return u
}

const activeOwners = () => users.filter((u) => u.role === 'owner' && u.active).length

export function updateUser(id: string, patch: { role?: Role; active?: boolean }, by: Role): User {
  assertOwner(by)
  const u = users.find((x) => x.id === id)
  if (!u) throw new ValidationError('notFound')
  if (patch.role && !ROLES.includes(patch.role)) throw new ValidationError('roleRequired')
  // There must always be at least one active Owner.
  const losesOwner =
    u.role === 'owner' && u.active && ((patch.role && patch.role !== 'owner') || patch.active === false)
  if (losesOwner && activeOwners() <= 1) throw new ValidationError('lastOwner')
  if (patch.role) u.role = patch.role
  if (patch.active !== undefined) u.active = patch.active
  return u
}

// ── company settings ───────────────────────────────────
export function updateSettings(patch: Partial<Settings>, by: Role): Settings {
  assertOwner(by)
  const next = { ...settings, ...patch }
  if (!/^\d+(\.\d{1,2})?$/.test(String(next.approvalLimit)) || toCents(next.approvalLimit) <= 0)
    throw new ValidationError('limitPositive')
  if (!Number.isInteger(next.reminderDay) || next.reminderDay < 1 || next.reminderDay > 28)
    throw new ValidationError('reminderDay')
  if (next.email && !EMAIL.test(next.email)) throw new ValidationError('emailFormat')
  for (const k of ['companyName', 'address', 'phone', 'email', 'provider1', 'provider2'] as const)
    next[k] = String(next[k] ?? '').trim()
  next.approvalLimit = toMoney(toCents(next.approvalLimit))
  Object.assign(settings, next)
  applyApprovalLimit()
  return settings
}
