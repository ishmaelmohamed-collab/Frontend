import type { Role, User } from '@/types/domain'

/**
 * Map a role from the API onto the frontend's role set. Accepts the backend's names
 * (admin, accountant, viewer) and the frontend's own (owner, accountant, cashier, sales).
 * Anything unknown gets the most limited role.
 */
export function mapRole(role: string): Role {
  switch (role) {
    case 'admin':
    case 'owner':
      return 'owner'
    case 'accountant':
      return 'accountant'
    case 'cashier':
    case 'viewer':
      return 'cashier'
    default:
      return 'sales'
  }
}

/** What /auth/login and /auth/me return. `name` is optional (the demo API sends it). */
export interface AuthResponse {
  username: string
  role: string
  name?: string
}

/** Build the frontend's User shape from the API's sign-in answer. */
export function toUser(a: AuthResponse): User {
  return {
    id: a.username,
    name: a.name || a.username,
    email: a.username,
    role: mapRole(a.role),
    active: true,
  }
}
