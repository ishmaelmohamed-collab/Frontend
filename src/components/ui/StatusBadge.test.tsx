import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '@/lib/LocaleProvider'
import type { Locale } from '@/lib/i18n-context'
import { StatusBadge, type DocumentStatus } from './StatusBadge'

const renderBadge = (status: DocumentStatus, locale: Locale = 'en') =>
  render(
    <LocaleProvider initial={locale}>
      <StatusBadge status={status} />
    </LocaleProvider>,
  )

describe('StatusBadge', () => {
  it('always shows a word, not just a colour', () => {
    renderBadge('overdue')
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('translates to Arabic', () => {
    renderBadge('paid', 'ar')
    expect(screen.getByText('مدفوعة')).toBeInTheDocument()
  })
})
