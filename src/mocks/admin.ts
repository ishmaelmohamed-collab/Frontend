/**
 * Batch 5: sign-in, users & roles, company settings.
 * Demo only — the real backend (backend/) hashes passwords and keeps a cookie session.
 * Demo accounts (all use the password below) are listed in README.md.
 */
import { can, ROLES } from '@/lib/permissions'
import type { Role, Settings, User } from '@/types/domain'
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

/**
 * Sign in with the role name as username ("owner", "cashier"…) or the full demo email.
 * Same answer for unknown user and wrong password, so it can't be used to find accounts.
 */
export function signIn(login: string, password: string): User {
  const key = login.trim().toLowerCase()
  const u = users.find((x) => x.email.toLowerCase() === key || x.email.split('@')[0] === key)
  if (!u || password !== DEMO_PASSWORD) throw new ValidationError('badCredentials')
  if (!u.active) throw new ValidationError('inactive')
  return u
}

// ── demo session (mirrors the backend's cookie session) ──
const SESSION_KEY = 'accounting.demoSession'
let current: string | null = null
try {
  current = localStorage.getItem(SESSION_KEY)
} catch {
  /* no storage (tests) — the session lasts for this visit */
}

export function setDemoSession(id: string | null) {
  current = id
  try {
    if (id) localStorage.setItem(SESSION_KEY, id)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* storage blocked */
  }
}

/** The signed-in user, or null when signed out or switched off. */
export function currentUser(): User | null {
  const u = users.find((x) => x.id === current)
  return u && u.active ? u : null
}

/** What the real backend's /auth/login and /auth/me return. */
export const authShape = (u: User) => ({
  ok: true,
  username: u.email.split('@')[0],
  role: u.role,
  name: u.name,
})

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
