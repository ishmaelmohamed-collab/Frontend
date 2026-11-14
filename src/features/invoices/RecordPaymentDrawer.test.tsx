import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LocaleProvider } from '@/lib/LocaleProvider'
import type { Invoice } from '@/types/domain'
import { RecordPaymentDrawer } from './RecordPaymentDrawer'

const invoice: Invoice = {
  id: 'INV-1',
  number: 'INV-1',
  customerId: 'c1',
  customerName: 'Al-Noor Trading',
  issueDate: '2026-11-01',
  dueDate: '2026-11-15',
  lines: [],
  total: '2480.00',
  paid: '0.00',
  due: '2480.00',
  status: 'sent',
  payments: [],
  activity: [],
}

function setup() {
  const onRecorded = vi.fn()
  render(
    <LocaleProvider initial="en">
      <QueryClientProvider client={new QueryClient()}>
        <RecordPaymentDrawer invoice={invoice} open onClose={() => {}} onRecorded={onRecorded} />
      </QueryClientProvider>
    </LocaleProvider>,
  )
  return { onRecorded }
}

describe('Record payment form', () => {
  it('blocks saving without a transaction ID and explains why next to the field', async () => {
    const { onRecorded } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Record payment' }))
    const ref = await screen.findByLabelText('Transaction ID')
    expect(ref).toHaveAttribute('aria-invalid', 'true')
    expect(ref).toHaveAccessibleDescription(/needed to match the statement/)
    expect(onRecorded).not.toHaveBeenCalled()
  })

  it('previews a part payment before saving', async () => {
    setup()
    const amount = screen.getByLabelText('Amount received')
    await userEvent.clear(amount)
    await userEvent.type(amount, '1000')
    expect(screen.getByText('$1,480.00')).toBeInTheDocument() // left to pay
    expect(screen.getAllByText('Partly paid').length).toBeGreaterThan(0)
  })

  it('does not ask for a transaction ID when paying from customer credit', async () => {
    setup()
    await userEvent.click(screen.getByLabelText('Customer credit'))
    expect(screen.queryByLabelText('Transaction ID')).not.toBeInTheDocument()
  })
})
