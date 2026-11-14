import { Check, Minus, Save, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Feedback'
import { SelectField, TextField } from '@/components/ui/Field'
import { FilterTabs } from '@/components/ui/Filters'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Drawer } from '@/components/ui/Overlay'
import { ErrorState, Skeleton } from '@/components/ui/States'
import { cn } from '@/lib/cn'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import { PERMISSIONS, ROLES, type Permission } from '@/lib/permissions'
import { useSession } from '@/lib/session-context'
import type { Role, Settings, User } from '@/types/domain'
import { errorCode } from '../books/api'
import { useInviteUser, useSettings, useUpdateSettings, useUpdateUser, useUsers } from './api'

type Tab = 'company' | 'rules' | 'users'
const TABS: Tab[] = ['company', 'rules', 'users']

export function SettingsPage() {
  const { t } = useLocale()
  const { can } = useSession()
  const [params, setParams] = useSearchParams()
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'company'
  const { data, isPending, isError, refetch } = useSettings()
  const editable = can('settings.edit')

  return (
    <>
      <PageHeader title={t('nav.settings')} description={t('set.intro')} />
      {!editable && (
        <div className="mb-4">
          <Alert tone="info" title={t('set.readOnly')} />
        </div>
      )}
      <div className="mb-5">
        <FilterTabs
          label={t('nav.settings')}
          value={tab}
          onChange={(v) => setParams(v === 'company' ? {} : { tab: v }, { replace: true })}
          options={TABS.map((v) => ({ value: v, label: t(`set.tab.${v}` as MessageKey) }))}
        />
      </div>
      {isPending && <Skeleton rows={6} label={t('loading')} />}
      {isError && (
        <ErrorState
          title={t('set.loadError')}
          hint={t('error.hint')}
          onRetry={() => refetch()}
          retryLabel={t('btn.tryAgain')}
        />
      )}
      {data && tab === 'company' && <CompanyForm s={data} editable={editable} />}
      {data && tab === 'rules' && <RulesForm s={data} editable={editable} />}
      {tab === 'users' && <Users editable={editable} />}
    </>
  )
}

// ── Company & payment providers ────────────────────────
function useSave() {
  const update = useUpdateSettings()
  const [saved, setSaved] = useState(false)
  const save = async (patch: Partial<Settings>) => {
    setSaved(false)
    try {
      await update.mutateAsync(patch)
      setSaved(true)
      return null
    } catch (e) {
      return errorCode(e)
    }
  }
  return { save, saved, pending: update.isPending, failed: update.isError && !errorCode(update.error) }
}

function CompanyForm({ s, editable }: { s: Settings; editable: boolean }) {
  const { t } = useLocale()
  const [v, setV] = useState(s)
  const [emailError, setEmailError] = useState(false)
  const { save, saved, pending, failed } = useSave()
  const field = (k: keyof Settings) => ({
    value: String(v[k]),
    disabled: !editable,
    onChange: (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value })),
  })
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const bad = !!v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())
    setEmailError(bad)
    if (bad) return
    const code = await save({
      companyName: v.companyName,
      address: v.address,
      phone: v.phone,
      email: v.email,
      provider1: v.provider1,
      provider2: v.provider2,
    })
    if (code === 'emailFormat') setEmailError(true)
  }
  return (
    <form noValidate onSubmit={submit} className="grid gap-6 xl:grid-cols-2">
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-base font-bold">{t('set.company')}</h2>
        <p className="text-ink-muted text-sm">{t('set.companyHint')}</p>
        <TextField
          label={t('set.companyName')}
          dir="auto"
          placeholder={t('app.company')}
          {...field('companyName')}
        />
        <TextField
          label={t('set.address')}
          dir="auto"
          optionalLabel={t('f.optional')}
          {...field('address')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t('set.phone')} dir="ltr" optionalLabel={t('f.optional')} {...field('phone')} />
          <TextField
            label={t('set.email')}
            type="email"
            dir="ltr"
            optionalLabel={t('f.optional')}
            error={emailError ? t('err.emailFormat') : undefined}
            {...field('email')}
          />
        </div>
        <div className="border-line rounded-card flex items-center gap-3 border border-dashed p-3">
          <span
            aria-hidden
            className="border-line-input text-ink-muted grid size-12 place-items-center rounded-xl border-2 border-dashed text-[10px]"
          >
            Logo
          </span>
          <p className="text-ink-muted text-sm">{t('set.logoNote')}</p>
        </div>
      </Card>
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-base font-bold">{t('set.providers')}</h2>
        <p className="text-ink-muted text-sm">{t('set.providersHint')}</p>
        <TextField label={t('set.provider1')} dir="auto" placeholder="[Provider 1]" {...field('provider1')} />
        <TextField label={t('set.provider2')} dir="auto" placeholder="[Provider 2]" {...field('provider2')} />
        <p className="text-ink-muted text-xs">{t('set.methodsNote')}</p>
        {editable && (
          <div className="mt-auto flex flex-col gap-3">
            {saved && <Alert tone="success" title={t('set.saved')} />}
            {failed && <Alert tone="error" title={t('set.server')} />}
            <Button
              type="submit"
              loading={pending}
              icon={<Save aria-hidden className="size-4" />}
              className="self-start"
            >
              {t('set.save')}
            </Button>
          </div>
        )}
      </Card>
    </form>
  )
}

// ── Approvals & reminders ──────────────────────────────
function RulesForm({ s, editable }: { s: Settings; editable: boolean }) {
  const { t } = useLocale()
  const [limit, setLimit] = useState(s.approvalLimit)
  const [day, setDay] = useState(String(s.reminderDay))
  const [errors, setErrors] = useState<{ limit?: MessageKey; day?: MessageKey }>({})
  const { save, saved, pending, failed } = useSave()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!/^\d+(\.\d{1,2})?$/.test(limit.trim()) || Number(limit) <= 0) errs.limit = 'err.limitPositive'
    if (!/^\d+$/.test(day) || Number(day) < 1 || Number(day) > 28) errs.day = 'err.reminderDay'
    setErrors(errs)
    if (Object.keys(errs).length) return
    await save({ approvalLimit: limit.trim(), reminderDay: Number(day) })
  }
  return (
    <form noValidate onSubmit={submit}>
      <Card className="flex max-w-2xl flex-col gap-5 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold">{t('set.rules')}</h2>
          <p className="text-ink-muted text-sm">{t('set.rulesHint')}</p>
        </div>
        <TextField
          label={t('set.approvalLimit')}
          hint={t('set.approvalLimitHint')}
          numeric
          value={limit}
          disabled={!editable}
          onChange={(e) => setLimit(e.target.value)}
          error={errors.limit && t(errors.limit)}
        />
        <TextField
          label={t('set.reminderDay')}
          hint={t('set.reminderDayHint')}
          numeric
          value={day}
          disabled={!editable}
          onChange={(e) => setDay(e.target.value)}
          error={errors.day && t(errors.day)}
        />
        <ul className="bg-mist-soft rounded-card flex flex-col gap-1.5 p-4 text-sm">
          {(['set.fixed1', 'set.fixed2', 'set.fixed3', 'set.fixed4'] as const).map((k) => (
            <li key={k} className="flex gap-2">
              <Check aria-hidden className="text-slate mt-0.5 size-4 shrink-0" />
              {t(k)}
            </li>
          ))}
        </ul>
        {editable && (
          <div className="flex flex-col gap-3">
            {saved && <Alert tone="success" title={t('set.saved')} />}
            {failed && <Alert tone="error" title={t('set.server')} />}
            <Button
              type="submit"
              loading={pending}
              icon={<Save aria-hidden className="size-4" />}
              className="self-start"
            >
              {t('set.save')}
            </Button>
          </div>
        )}
      </Card>
    </form>
  )
}

// ── Users & roles ──────────────────────────────────────
/** What each role can do — shown to the Owner so the matrix is never a mystery. */
const MATRIX: { key: MessageKey; perm: Permission }[] = [
  { key: 'perm.sales', perm: 'sales.edit' },
  { key: 'perm.payments', perm: 'payments.record' },
  { key: 'perm.purchases', perm: 'purchases.edit' },
  { key: 'perm.payBills', perm: 'bills.pay' },
  { key: 'perm.approve', perm: 'bills.approve' },
  { key: 'perm.overLimit', perm: 'sales.overLimit' },
  { key: 'perm.money', perm: 'money.move' },
  { key: 'perm.books', perm: 'books.post' },
  { key: 'perm.lock', perm: 'close.lock' },
  { key: 'perm.reports', perm: 'reports.view' },
  { key: 'perm.export', perm: 'export' },
  { key: 'perm.settings', perm: 'settings.edit' },
]

function Users({ editable }: { editable: boolean }) {
  const { t } = useLocale()
  const { user: me } = useSession()
  const { data = [], isPending, isError, refetch } = useUsers()
  const update = useUpdateUser()
  const [inviting, setInviting] = useState(false)
  const [notice, setNotice] = useState<MessageKey | null>(null)

  const change = async (id: string, patch: { role?: Role; active?: boolean }) => {
    setNotice(null)
    try {
      await update.mutateAsync({ id, ...patch })
    } catch (e) {
      setNotice(errorCode(e) === 'lastOwner' ? 'err.lastOwner' : 'set.server')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden">
        <CardHeader
          title={t('set.users')}
          description={t('set.usersHint')}
          action={
            editable ? (
              <Button
                size="sm"
                icon={<UserPlus aria-hidden className="size-4" />}
                onClick={() => setInviting(true)}
              >
                {t('set.invite')}
              </Button>
            ) : undefined
          }
        />
        {notice && (
          <div className="px-5 pt-3">
            <Alert tone="error" title={t(notice)} />
          </div>
        )}
        {isPending && (
          <div className="p-5">
            <Skeleton rows={4} label={t('loading')} />
          </div>
        )}
        {isError && (
          <ErrorState
            title={t('set.loadError')}
            hint={t('error.hint')}
            onRetry={() => refetch()}
            retryLabel={t('btn.tryAgain')}
          />
        )}
        <ul className="divide-line mt-3 divide-y">
          {data.map((u: User) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
              <span className="flex min-w-48 flex-1 flex-col">
                <span className={cn('font-semibold', !u.active && 'text-ink-subtle')}>
                  <bdi>{u.name}</bdi>
                  {u.id === me?.id && <span className="text-ink-muted font-normal"> · {t('set.you')}</span>}
                </span>
                <span className="text-ink-muted text-xs">
                  <bdi dir="ltr">{u.email}</bdi>
                </span>
              </span>
              {editable && u.id !== me?.id ? (
                <div className="w-40 [&_label]:sr-only">
                  <SelectField
                    label={`${t('set.role')} · ${u.name}`}
                    className="min-h-9"
                    value={u.role}
                    disabled={update.isPending}
                    onChange={(e) => change(u.id, { role: e.target.value as Role })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {t(`role.${r}` as MessageKey)}
                      </option>
                    ))}
                  </SelectField>
                </div>
              ) : (
                <span className="bg-mist text-slate rounded-full px-2.5 py-1 text-xs font-semibold">
                  {t(`role.${u.role}` as MessageKey)}
                </span>
              )}
              <span className={cn('w-20 text-xs', u.active ? 'text-slate font-semibold' : 'text-ink-muted')}>
                {u.active ? t('set.active') : t('set.inactive')}
              </span>
              {editable && u.id !== me?.id && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={update.isPending}
                  onClick={() => change(u.id, { active: !u.active })}
                >
                  {u.active ? t('set.deactivate') : t('set.reactivate')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title={t('set.matrix')} description={t('set.matrixHint')} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('set.matrix')}</caption>
            <thead className="bg-mist-soft text-ink-muted text-xs">
              <tr>
                <th scope="col" className="border-line border-y px-4 py-2.5 ps-5 text-start font-semibold">
                  {t('set.can')}
                </th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    scope="col"
                    className="border-line border-y px-3 py-2.5 text-center font-semibold"
                  >
                    {t(`role.${r}` as MessageKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((m) => (
                <tr key={m.perm} className="border-line border-b last:border-b-0">
                  <th scope="row" className="px-4 py-2.5 ps-5 text-start font-normal">
                    {t(m.key)}
                  </th>
                  {ROLES.map((r) => {
                    const yes = PERMISSIONS[r].includes(m.perm)
                    return (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {yes ? (
                          <Check role="img" aria-label={t('set.yes')} className="text-slate mx-auto size-4" />
                        ) : (
                          <Minus
                            role="img"
                            aria-label={t('set.no')}
                            className="text-ink-subtle mx-auto size-4"
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <InviteDrawer open={inviting} onClose={() => setInviting(false)} />
    </div>
  )
}

function InviteDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLocale()
  const invite = useInviteUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('sales')
  const [errors, setErrors] = useState<{ name?: MessageKey; email?: MessageKey }>({})
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = 'err.nameRequired'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'err.emailFormat'
    setErrors(errs)
    if (Object.keys(errs).length) return
    try {
      await invite.mutateAsync({ name, email, role })
      setName('')
      setEmail('')
      onClose()
    } catch (err) {
      if (errorCode(err) === 'emailTaken') setErrors({ email: 'err.emailTaken' })
    }
  }
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('set.invite')}
      description={t('set.inviteHint')}
      closeLabel={t('btn.close')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('btn.cancel')}
          </Button>
          <Button
            type="submit"
            form="invite-form"
            loading={invite.isPending}
            icon={<UserPlus aria-hidden className="size-4" />}
          >
            {t('set.inviteBtn')}
          </Button>
        </>
      }
    >
      <form id="invite-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {invite.isError && !errorCode(invite.error) && <Alert tone="error" title={t('set.server')} />}
        <TextField
          label={t('set.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name && t(errors.name)}
        />
        <TextField
          label={t('set.email')}
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email && t(errors.email)}
        />
        <SelectField label={t('set.role')} value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {t(`role.${r}` as MessageKey)}
            </option>
          ))}
        </SelectField>
      </form>
    </Drawer>
  )
}
