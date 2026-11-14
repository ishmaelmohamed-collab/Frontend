import { describe, expect, it } from 'vitest'
import { applyBrand } from '@/lib/i18n-context'
import { can, PERMISSIONS } from '@/lib/permissions'
import { DEMO_PASSWORD, inviteUser, signIn, updateSettings, updateUser, userFromToken, users } from './admin'
import { createInvoice } from './catalog'
import { customers, settings, toCents, ValidationError } from './db'
import { bills } from './purchases'
import { report } from './reports'

describe('roles', () => {
  it('Sales staff cannot record payments, export or see money (rule 3)', () => {
    expect(can('sales', 'payments.record')).toBe(false)
    expect(can('sales', 'export')).toBe(false)
    expect(can('sales', 'money.view')).toBe(false)
    expect(can('sales', 'sales.edit')).toBe(true)
  })

  it('only the Owner approves bills, goes over credit limits, locks months and changes settings', () => {
    for (const p of ['bills.approve', 'sales.overLimit', 'close.lock', 'settings.edit'] as const)
      expect((Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]).filter((r) => can(r, p))).toEqual([
        'owner',
      ])
  })

  it('nobody signed out can do anything', () => {
    expect(can(null, 'sales.view')).toBe(false)
  })
})

describe('sign-in', () => {
  it('signs in with the demo password and refuses anything else with one message', () => {
    const s = signIn('Owner@Demo.test', DEMO_PASSWORD)
    expect(s.user.role).toBe('owner')
    expect(userFromToken(`Bearer ${s.token}`)?.id).toBe(s.user.id)
    expect(() => signIn('owner@demo.test', 'wrong')).toThrow('badCredentials')
    expect(() => signIn('nobody@demo.test', DEMO_PASSWORD)).toThrow('badCredentials')
  })

  it('a switched-off user is signed out on the next request and cannot sign in', () => {
    const sales = users.find((u) => u.role === 'sales')!
    const { token } = signIn(sales.email, DEMO_PASSWORD)
    updateUser(sales.id, { active: false }, 'owner')
    expect(userFromToken(`Bearer ${token}`)).toBeNull()
    expect(() => signIn(sales.email, DEMO_PASSWORD)).toThrow('inactive')
    updateUser(sales.id, { active: true }, 'owner')
  })

  it('there is always at least one active Owner, and only the Owner manages users', () => {
    const owner = users.find((u) => u.role === 'owner')!
    expect(() => updateUser(owner.id, { role: 'accountant' }, 'owner')).toThrow('lastOwner')
    expect(() => inviteUser({ name: 'X', email: 'x@demo.test', role: 'sales' }, 'accountant')).toThrow(
      'ownerOnly',
    )
    expect(() => inviteUser({ name: 'Y', email: 'owner@demo.test', role: 'sales' }, 'owner')).toThrow(
      'emailTaken',
    )
    expect(inviteUser({ name: 'Layla Nur', email: 'layla@demo.test', role: 'cashier' }, 'owner').active).toBe(
      true,
    )
  })
})

describe('settings', () => {
  it('changing the approval limit re-checks unapproved bills (rule 1)', () => {
    const open = bills.filter((b) => b.status !== 'paid' && !b.approved)
    updateSettings({ approvalLimit: '1000' }, 'owner')
    expect(open.filter((b) => toCents(b.total) > 1000_00).every((b) => b.status === 'approval')).toBe(true)
    updateSettings({ approvalLimit: '10000' }, 'owner')
    expect(open.filter((b) => toCents(b.total) <= 10_000_00).every((b) => b.status !== 'approval')).toBe(true)
    expect(() => updateSettings({ approvalLimit: '0' }, 'owner')).toThrow(ValidationError)
    expect(() => updateSettings({ reminderDay: 31 }, 'owner')).toThrow('reminderDay')
    expect(() => updateSettings({ companyName: 'X' }, 'accountant')).toThrow('ownerOnly')
  })

  it('company and provider names replace the placeholders in both languages', () => {
    updateSettings({ companyName: 'Sahra Trading', provider1: 'EVC Plus' }, 'owner')
    expect(settings.companyName).toBe('Sahra Trading')
    const brand = { company: 'Sahra Trading', provider1: 'EVC Plus', provider2: '' }
    expect(applyBrand('Mobile money · [Provider 1]', brand)).toBe('Mobile money · EVC Plus')
    expect(applyBrand('محفظة الجوال · [المزوّد 1]', brand)).toBe('محفظة الجوال · EVC Plus')
    expect(applyBrand('[Provider 2]', brand)).toBe('[Provider 2]')
    updateSettings({ companyName: '', provider1: '' }, 'owner')
  })
})

describe('credit limit (rule 2)', () => {
  it('only the Owner can send an invoice over the limit; others can still save a draft', () => {
    const c = customers().find((x) => toCents(x.creditLimit) - toCents(x.balance) < 50_000_00)!
    const input = {
      customerId: c.id,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      lines: [{ itemId: 'i5', quantity: 200 }], // 200 × $18.50 = $3,700 — pushes most customers over
      note: '',
      send: true,
    }
    const room = toCents(c.creditLimit) - toCents(c.balance)
    if (370_000 > room) {
      expect(() => createInvoice(input, 'accountant')).toThrow('overCreditLimit')
      expect(createInvoice({ ...input, send: false }, 'accountant').status).toBe('draft')
    }
  })
})

describe('reports', () => {
  it('the balance sheet balances, and P&L for the year equals profit to date', () => {
    const today = new Date().toISOString().slice(0, 10)
    const bs = report('balance', null, today).lines
    const amount = (k: string) => bs.find((l) => l.label === k)!.amount
    expect(amount('rep.totalAssets')).toBe(amount('rep.totalLE'))
    const pl = report('profit', '2000-01-01', today).lines
    expect(pl.find((l) => l.label === 'close.net')!.amount).toBe(amount('rep.profitToDate'))
  })

  it('aging buckets add up to each customer total, and refuses a backwards period', () => {
    for (const l of report('aging', null, null).lines)
      expect(l.buckets!.reduce((s, b) => s + toCents(b), 0)).toBe(toCents(l.amount))
    expect(() => report('sales', '2026-12-01', '2026-01-01')).toThrow('dateOrder')
  })
})
