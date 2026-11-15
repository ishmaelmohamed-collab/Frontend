import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { IconButton } from '@/components/ui/Button'
import { useSettings } from '@/features/admin/api'
import { cn } from '@/lib/cn'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { useSession } from '@/lib/session-context'
import { NAV, type NavItem } from './navigation'

function Logo({ onClick }: { onClick?: () => void }) {
  const { t } = useLocale()
  return (
    <Link to="/" onClick={onClick} className="flex shrink-0 items-center gap-2.5">
      <span
        aria-hidden
        className="border-line-input text-ink-muted rounded-control grid size-8 place-items-center border border-dashed text-[8px]"
      >
        Logo
      </span>
      <bdi className="hidden text-sm font-bold tracking-tight sm:inline">{t('app.company')}</bdi>
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

/** Puts the company and provider names from Settings into every [placeholder]. */
function BrandSync() {
  const { setBrand } = useLocale()
  const { data } = useSettings()
  useEffect(() => {
    if (data) setBrand({ company: data.companyName, provider1: data.provider1, provider2: data.provider2 })
  }, [data, setBrand])
  return null
}

/** One top-level group: a single item renders as a plain link; several render as a dropdown. */
function NavGroup({
  group,
  items,
  open,
  onToggle,
  onNavigate,
}: {
  group?: MessageKey
  items: NavItem[]
  open: boolean
  onToggle: () => void
  onNavigate: () => void
}) {
  const { t } = useLocale()
  const { pathname } = useLocation()
  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-control flex min-h-9 items-center gap-2 px-2.5 text-sm transition-colors',
      isActive ? 'bg-mist text-slate font-semibold' : 'text-ink-muted hover:bg-mist-soft hover:text-ink',
    )

  if (!group || items.length === 1) {
    const i = items[0]
    return (
      <NavLink to={i.to} end={i.to === '/'} onClick={onNavigate} className={linkCls}>
        <i.icon aria-hidden className="size-4" />
        {t(i.key)}
      </NavLink>
    )
  }

  const active = items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'rounded-control flex min-h-9 items-center gap-1 px-2.5 text-sm transition-colors',
          active || open
            ? 'bg-mist text-slate font-semibold'
            : 'text-ink-muted hover:bg-mist-soft hover:text-ink',
        )}
      >
        {t(group)}
        <ChevronDown aria-hidden className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          {/* Invisible backdrop: closes the menu on any outside click, with no event-timing races. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={onNavigate}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="bg-panel border-line shadow-overlay rounded-card absolute start-0 top-full z-30 mt-1 flex w-52 flex-col border py-1.5">
            {items.map((i) => (
              <NavLink
                key={i.to}
                to={i.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-10 items-center gap-2.5 px-3.5 text-sm',
                    isActive ? 'bg-mist text-slate font-semibold' : 'text-ink hover:bg-mist-soft',
                  )
                }
              >
                <i.icon aria-hidden className="size-4 shrink-0" />
                {t(i.key)}
              </NavLink>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function UserChip({ stacked = false }: { stacked?: boolean }) {
  const { t } = useLocale()
  const { user, signOut } = useSession()
  if (!user) return null
  return (
    <div className={cn('flex items-center gap-2.5', stacked && 'border-line border-t pt-4')}>
      <span className="bg-slate grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white">
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

/**
 * Page frame. One calm top bar for every screen size — dropdown menus on desktop, a
 * full-screen menu on phones. No sidebar anywhere. Logical sides, so it mirrors for Arabic.
 */
export function AppShell() {
  const { t, locale, setLocale } = useLocale()
  const { can } = useSession()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.perm || can(i.perm)) })).filter(
    (g) => g.items.length > 0,
  )

  return (
    <div className="bg-canvas min-h-dvh">
      <a
        href="#main"
        className="bg-slate sr-only z-50 rounded-md px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-2 focus:top-2"
      >
        {t('shell.skip')}
      </a>

      <header className="no-print bg-panel border-line sticky top-0 z-40 flex min-h-14 items-center gap-1 border-b px-3 sm:px-5">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-0.5 ps-3 lg:flex">
          {groups.map((g, i) => (
            <NavGroup
              key={g.group ?? i}
              group={g.group}
              items={g.items}
              open={openGroup === (g.group ?? '__top__')}
              onToggle={() =>
                setOpenGroup((k) => (k === (g.group ?? '__top__') ? null : (g.group ?? '__top__')))
              }
              onNavigate={() => setOpenGroup(null)}
            />
          ))}
        </nav>
        <BrandSync />

        <div className="ms-auto flex items-center gap-2">
          <span className="bg-mist text-slate hidden rounded-full px-3 py-1 text-xs font-semibold 2xl:inline">
            {t('shell.demo')}
          </span>
          <button
            type="button"
            lang={locale === 'en' ? 'ar' : 'en'}
            aria-label={t('app.switchLabel')}
            onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
            className="border-line-input hover:bg-mist-soft rounded-control hidden min-h-9 items-center px-2.5 text-xs font-semibold sm:inline-flex xl:px-3 xl:text-sm"
          >
            <span className="xl:hidden">{locale === 'en' ? 'AR' : 'EN'}</span>
            <span className="hidden xl:inline">{t('app.switch')}</span>
          </button>
          <div className="hidden lg:flex">
            <UserChip />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('shell.openMenu')}
            className="border-line-input rounded-control grid size-10 place-items-center border lg:hidden"
          >
            <Menu aria-hidden className="size-5" />
          </button>
        </div>
      </header>

      <main
        id="main"
        key={pathname}
        className="page-enter mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
      >
        <Outlet />
      </main>

      {/* Phone: full-screen menu, replacing the top bar's nav entirely while open. */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('shell.menu')}
          className="bg-panel fixed inset-0 z-50 flex flex-col lg:hidden"
        >
          <div className="border-line flex min-h-14 items-center gap-3 border-b px-3">
            <Logo onClick={() => setMenuOpen(false)} />
            <button
              type="button"
              aria-label={t('shell.closeMenu')}
              onClick={() => setMenuOpen(false)}
              className="text-ink-muted hover:bg-mist-soft rounded-control ms-auto grid size-10 place-items-center"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {groups.map((g, i) => (
              <div key={g.group ?? i} className="mb-5">
                {g.group && (
                  <p className="text-ink-subtle mb-1.5 text-xs font-bold tracking-wider uppercase">
                    {t(g.group)}
                  </p>
                )}
                <div className="divide-line border-line divide-y rounded-lg border">
                  {g.items.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.to === '/'}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-13 items-center gap-3 px-4 text-[15px]',
                          isActive ? 'bg-mist text-slate font-semibold' : 'text-ink',
                        )
                      }
                    >
                      <it.icon aria-hidden className="size-5 shrink-0" />
                      {t(it.key)}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              lang={locale === 'en' ? 'ar' : 'en'}
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="border-line-input rounded-control mb-5 flex min-h-11 w-full items-center justify-center border text-sm font-semibold"
            >
              {t('app.switch')}
            </button>
            <UserChip stacked />
          </div>
        </div>
      )}
    </div>
  )
}
