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

export interface NavItem {
  to: string
  key: MessageKey
  icon: LucideIcon
  /** Batch in which the screen is built; undefined = available now. */
  batch?: number
}

/** Sidebar grouped the way the work flows: sell, buy, stock, money, books. */
export const NAV: { group?: MessageKey; items: NavItem[] }[] = [
  { items: [{ to: '/', key: 'nav.dashboard', icon: LayoutDashboard }] },
  {
    group: 'group.sales',
    items: [
      { to: '/invoices', key: 'nav.invoices', icon: FileText },
      { to: '/quotes', key: 'nav.quotes', icon: FileSignature },
      { to: '/customers', key: 'nav.customers', icon: Users },
      { to: '/payments', key: 'nav.payments', icon: HandCoins },
    ],
  },
  {
    group: 'group.purchases',
    items: [
      { to: '/bills', key: 'nav.bills', icon: Receipt },
      { to: '/orders', key: 'nav.orders', icon: ShoppingCart },
      { to: '/vendors', key: 'nav.vendors', icon: Truck },
    ],
  },
  { group: 'group.inventory', items: [{ to: '/items', key: 'nav.items', icon: Boxes }] },
  {
    group: 'group.money',
    items: [
      { to: '/banking', key: 'nav.banking', icon: Landmark },
      { to: '/reconcile', key: 'nav.reconcile', icon: ListChecks },
    ],
  },
  {
    group: 'group.accounting',
    items: [
      { to: '/accounts', key: 'nav.accounts', icon: BookOpenText },
      { to: '/close', key: 'nav.close', icon: CalendarCheck },
      { to: '/reports', key: 'nav.reports', icon: BarChart3, batch: 5 },
    ],
  },
  {
    group: 'group.project',
    items: [
      { to: '/settings', key: 'nav.settings', icon: Settings, batch: 5 },
      { to: '/wireframes', key: 'nav.design', icon: Palette },
    ],
  },
]

export const PLANNED = NAV.flatMap((g) => g.items).filter((i) => i.batch)
