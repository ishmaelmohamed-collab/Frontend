import {
  BarChart3,
  BookOpenText,
  Boxes,
  CalendarCheck,
  FileText,
  FileSignature,
  HandCoins,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Palette,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { MessageKey } from '@/lib/i18n-context'
import type { Permission } from '@/lib/permissions'

export interface NavItem {
  to: string
  key: MessageKey
  icon: LucideIcon
  /** Needed to see this screen; undefined = everyone signed in. */
  perm?: Permission
}

/** Sidebar grouped the way the work flows: sell, buy, stock, money, books. */
export const NAV: { group?: MessageKey; items: NavItem[] }[] = [
  { items: [{ to: '/', key: 'nav.dashboard', icon: LayoutDashboard }] },
  {
    group: 'group.sales',
    items: [
      { to: '/invoices', key: 'nav.invoices', icon: FileText, perm: 'sales.view' },
      { to: '/quotes', key: 'nav.quotes', icon: FileSignature, perm: 'sales.view' },
      { to: '/customers', key: 'nav.customers', icon: Users, perm: 'sales.view' },
      { to: '/payments', key: 'nav.payments', icon: HandCoins, perm: 'money.view' },
    ],
  },
  {
    group: 'group.purchases',
    items: [
      { to: '/bills', key: 'nav.bills', icon: Receipt, perm: 'purchases.view' },
      { to: '/orders', key: 'nav.orders', icon: ShoppingCart, perm: 'purchases.view' },
      { to: '/vendors', key: 'nav.vendors', icon: Truck, perm: 'purchases.view' },
    ],
  },
  { group: 'group.inventory', items: [{ to: '/items', key: 'nav.items', icon: Boxes, perm: 'items.view' }] },
  {
    group: 'group.money',
    items: [
      { to: '/banking', key: 'nav.banking', icon: Landmark, perm: 'money.view' },
      { to: '/reconcile', key: 'nav.reconcile', icon: ListChecks, perm: 'money.view' },
    ],
  },
  {
    group: 'group.accounting',
    items: [
      { to: '/accounts', key: 'nav.accounts', icon: BookOpenText, perm: 'books.view' },
      { to: '/close', key: 'nav.close', icon: CalendarCheck, perm: 'books.view' },
      { to: '/reports', key: 'nav.reports', icon: BarChart3, perm: 'reports.view' },
    ],
  },
  {
    group: 'group.project',
    items: [
      { to: '/settings', key: 'nav.settings', icon: Settings, perm: 'settings.view' },
      { to: '/wireframes', key: 'nav.design', icon: Palette },
    ],
  },
]
