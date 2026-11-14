import type { Role, User } from '@/types/domain'

/** Map our backend's roles onto the frontend's role set. */
export function mapRole(role: string): Role {
  if (role === 'admin') return 'owner'
  if (role === 'accountant') return 'accountant'
  return 'cashier' // viewer → a limited role for now
}

/** Build the frontend's User shape from a backend username + role. */
export function toUser(username: string, role: string): User {
  return {
    id: username,
    name: username,
    email: `${username}@accounting.local`,
    role: mapRole(role),
    active: true,
  }
}
