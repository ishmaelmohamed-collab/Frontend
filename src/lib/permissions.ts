import type { Role } from '@/types/domain'

/**
 * Who may do what — one table shared by the screens (hide / disable) and the API (refuse).
 * The real backend must enforce the same table; the UI alone is never security.
 */
export type Permission =
  | 'sales.view' // invoices, quotes, customers
  | 'sales.edit' // create invoices, convert quotes
  | 'sales.overLimit' // send an invoice beyond the customer's credit limit (rule 2)
  | 'payments.record'
  | 'items.view'
  | 'purchases.view' // bills, orders, vendors
  | 'purchases.edit' // enter bills
  | 'bills.pay'
  | 'bills.approve' // over the approval limit (rule 1)
  | 'money.view' // bank & wallets, reconciliation, payments received
  | 'money.move' // transfers, reconciliation fixes
  | 'books.view' // accounts & journal, close month
  | 'books.post' // manual journal entries, stock count
  | 'close.lock' // lock / reopen a month (rule 4)
  | 'reports.view'
  | 'export' // rule 3: not for Sales
  | 'settings.view'
  | 'settings.edit'

const ALL: Permission[] = [
  'sales.view',
  'sales.edit',
  'sales.overLimit',
  'payments.record',
  'items.view',
  'purchases.view',
  'purchases.edit',
  'bills.pay',
  'bills.approve',
  'money.view',
  'money.move',
  'books.view',
  'books.post',
  'close.lock',
  'reports.view',
  'export',
  'settings.view',
  'settings.edit',
]

const OWNER_ONLY: Permission[] = ['sales.overLimit', 'bills.approve', 'close.lock', 'settings.edit']

export const PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL,
  accountant: ALL.filter((p) => !OWNER_ONLY.includes(p)),
  cashier: [
    'sales.view',
    'payments.record',
    'items.view',
    'purchases.view',
    'bills.pay',
    'money.view',
    'money.move',
    'export',
  ],
  sales: ['sales.view', 'sales.edit', 'items.view'],
}

export const can = (role: Role | null | undefined, p: Permission) => !!role && PERMISSIONS[role].includes(p)

export const ROLES: Role[] = ['owner', 'accountant', 'cashier', 'sales']
