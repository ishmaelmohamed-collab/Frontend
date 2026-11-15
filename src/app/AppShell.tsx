import {
  ChevronRight,
  FileText,
  Home,
  Languages,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { IconButton } from '@/components/ui/Button'
import { useSettings } from '@/features/admin/api'
import { cn } from '@/lib/cn'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { useSession } from '@/lib/session-context'
import { NAV } from './navigation'
import { ThemeSwitcher } from './ThemeSwitcher'

function Logo({ collapsed }: { collapsed?: boolean }) {
  const { t } = useLocale()
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
      <span
        aria-hidden
        className="bg-slate text-panel grid size-9 shrink-0 place-items-center rounded-lg font-serif text-lg font-bold"
      >
        L
      </span>
      {!collapsed && <bdi className="font-serif text-base font-bold tracking-tight">{t('app.company')}</bdi>}
    </Link>
  )
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

/** Signed-in person, their role, and Sign out (bottom of the sidebar and the phone menu). */
function UserBox({ collapsed }: { collapsed?: boolean }) {
  const { t } = useLocale()
  const { user, signOut } = useSession()
  if (!user) return null
  if (collapsed) {
    return (
      <div className="border-line mt-auto flex justify-center border-t px-2 pt-4">
        <span
          aria-hidden
          className="bg-slate grid size-9 place-items-center rounded-full text-xs font-bold text-white"
        >
          {initials(user.name)}
        </span>
      </div>
    )
  }
  return (
    <div className="border-line mt-auto flex items-center gap-3 border-t px-3 pt-4">
      <span
        aria-hidden
        className="bg-slate grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
      >
        {initials(user.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <bdi className="truncate text-sm font-semibold">{user.name}</bdi>
        <span className="text-ink-muted text-xs">{t(`role.${user.role}` as MessageKey)}</span>
      </span>
      <IconButton label={t('auth.signOut')} onClick={signOut}>
        <LogOut aria-hidden className="size-4 rtl:-scale-x-100" />
      </IconButton>
    </div>
  )
}

/** Puts the company and provider names from Settings into every [placeholder]. */
function BrandSync() {
  const { setBrand } = useLocale()
  const { data } = useSettings()
  useEffect(() => {
    if (data) setBrand({ company: data.companyName, provider1: data.provider1, provider2: data.provider2 })
  }, [data, setBrand])
  return null
}

function SideNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { t } = useLocale()
  const { can } = useSession()
  const { pathname } = useLocation()
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(i.perm)) })).filter(
    (g) => g.items.length > 0,
  )

  // Expand the branch that holds the current route by default.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const g of NAV) {
      const key = g.group ?? '__top__'
      if (g.items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))) init[key] = true
    }
    return init
  })
  const toggle = (key: string) => setOpen((p) => ({ ...p, [key]: !p[key] }))

  // Collapsed: icon-only rail.
  if (collapsed) {
    return (
      <nav aria-label="Main" className="flex flex-col items-center gap-1">
        {groups
          .flatMap((g) => g.items)
          .map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={t(key)}
              className={({ isActive }) =>
                cn(
                  'grid size-10 place-items-center rounded-lg transition-colors',
                  isActive ? 'bg-mist text-slate' : 'text-ink-muted hover:bg-mist-soft hover:text-ink',
                )
              }
            >
              <Icon aria-hidden className="size-5" />
            </NavLink>
          ))}
      </nav>
    )
  }

  // Expanded: a tree — collapsible branches with indented leaves.
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {groups.map((g) => {
        const key = g.group ?? '__top__'
        const isOpen = open[key] ?? false
        return (
          <div key={key}>
            {g.group && (
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-expanded={isOpen}
                className="text-ink-subtle hover:bg-mist-soft hover:text-ink flex w-full items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-bold tracking-wider uppercase transition-colors"
              >
                <ChevronRight
                  className={cn('size-3.5 shrink-0 transition-transform', isOpen && 'rotate-90')}
                />
                {t(g.group)}
              </button>
            )}
            {(!g.group || isOpen) && (
              <ul className={cn('flex flex-col gap-0.5', g.group && 'border-line ms-3 border-s ps-2')}>
                {g.items.map(({ to, key: itemKey, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 pointer-coarse:min-h-11',
                          isActive
                            ? 'bg-mist text-slate font-bold'
                            : 'text-ink-muted hover:bg-mist-soft hover:text-ink',
                        )
                      }
                    >
                      <Icon aria-hidden className="size-4 shrink-0" />
                      <span className="flex-1">{t(itemKey)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/**
 * Page frame. Desktop (≥1024px): sidebar + top bar. Phones: top bar + bottom tab bar,
 * with the full menu in a slide-in panel. Logical sides, so it mirrors for Arabic.
 */
export function AppShell() {
  const { t, locale, setLocale } = useLocale()
  const { user, can } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const tabs = [
    { to: '/', label: t('tab.home'), Icon: Home, end: true },
    { to: '/invoices', label: t('nav.invoices'), Icon: FileText },
    { to: '/customers', label: t('nav.customers'), Icon: Users },
  ]

  return (
    <div
      className={cn(
        'bg-canvas min-h-dvh lg:grid',
        collapsed ? 'lg:grid-cols-[64px_1fr]' : 'lg:grid-cols-[256px_1fr]',
      )}
    >
      <a
        href="#main"
        className="bg-slate sr-only z-50 rounded-md px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-2 focus:top-2"
      >
        {t('shell.skip')}
      </a>

      <aside className="no-print bg-panel border-line sticky top-0 hidden h-dvh flex-col gap-6 overflow-y-auto border-e px-3 py-5 lg:flex">
        <div className={cn('px-3', collapsed && 'px-1')}>
          <Logo collapsed={collapsed} />
        </div>
        <SideNav collapsed={collapsed} />
        <UserBox collapsed={collapsed} />
      </aside>
      <BrandSync />

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('shell.menu')}
        >
          <button
            type="button"
            aria-label={t('shell.closeMenu')}
            className="absolute inset-0 bg-[#1c2430]/45"
            onClick={() => setMenuOpen(false)}
          />
          <div className="bg-panel shadow-overlay absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col gap-6 overflow-y-auto px-3 py-4">
            <div className="flex items-center justify-between px-3">
              <Logo />
              <button
                type="button"
                aria-label={t('shell.closeMenu')}
                onClick={() => setMenuOpen(false)}
                className="text-ink-muted hover:bg-mist-soft grid size-11 place-items-center rounded-lg"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <SideNav onNavigate={() => setMenuOpen(false)} />
            <UserBox />
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="no-print bg-panel/90 border-line sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? t('shell.openMenu') : t('shell.closeMenu')}
            className="border-line-input hover:bg-mist-soft rounded-control hidden size-10 place-items-center border lg:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen aria-hidden className="size-4" />
            ) : (
              <PanelLeftClose aria-hidden className="size-4" />
            )}
          </button>
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ms-auto flex items-center gap-2">
            <span className="bg-mist text-slate hidden rounded-full px-3 py-1 text-xs font-bold sm:inline">
              {t('shell.demo')}
            </span>
            <ThemeSwitcher />
            <button
              type="button"
              lang={locale === 'en' ? 'ar' : 'en'}
              aria-label={t('app.switchLabel')}
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="border-line-input hover:bg-mist-soft rounded-control inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-semibold pointer-coarse:min-h-11"
            >
              <Languages aria-hidden className="size-4" />
              {t('app.switch')}
            </button>
            {user && (
              <span className="hidden items-center gap-2 ps-2 sm:flex lg:hidden xl:flex">
                <span
                  aria-hidden
                  className="bg-slate grid size-9 place-items-center rounded-full text-xs font-bold text-white"
                >
                  {initials(user.name)}
                </span>
                <span className="text-ink-muted text-sm">
                  <bdi>{user.name}</bdi> · {t(`role.${user.role}` as MessageKey)}
                </span>
              </span>
            )}
          </div>
        </header>

        <main
          id="main"
          key={pathname}
          className="page-enter mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-10"
        >
          <Outlet />
        </main>
      </div>

      {/* Phone tab bar */}
      <nav
        aria-label={t('shell.menu')}
        className="no-print bg-panel border-line fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-center border-t px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {tabs.slice(0, 2).map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px]',
                isActive ? 'text-slate font-bold' : 'text-ink-muted',
              )
            }
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </NavLink>
        ))}
        {can('sales.edit') ? (
          <Link
            to="/invoices/new"
            aria-label={t('btn.newInvoice')}
            className={cn(
              'bg-slate shadow-card mx-auto grid size-13 place-items-center rounded-full text-white',
              pathname === '/invoices/new' && 'bg-slate-pressed',
            )}
          >
            <Plus aria-hidden className="size-6" />
          </Link>
        ) : (
          <span aria-hidden />
        )}
        {tabs.slice(2).map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px]',
                isActive ? 'text-slate font-bold' : 'text-ink-muted',
              )
            }
          >
            <Icon aria-hidden className="size-5" />
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t('shell.openMenu')}
          className="text-ink-muted flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px]"
        >
          <Menu aria-hidden className="size-5" />
          {t('shell.menu')}
        </button>
      </nav>
    </div>
  )
}
