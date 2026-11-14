import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Amount } from './Amount'
import { Button } from './Button'
import { Segmented, Switch, TextField } from './Field'
import { Drawer } from './Overlay'

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    render(<Button loading>Save invoice</Button>)
    const b = screen.getByRole('button', { name: 'Save invoice' })
    expect(b).toBeDisabled()
    expect(b).toHaveAttribute('aria-busy', 'true')
  })
})

describe('TextField', () => {
  it('links label and error, and marks the field invalid', () => {
    render(<TextField label="Due date" error="That date doesn't exist." defaultValue="31 Feb" />)
    const input = screen.getByLabelText('Due date')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription("That date doesn't exist.")
  })

  it('describes the field with its hint when there is no error', () => {
    render(<TextField label="Invoice number" hint="Assigned automatically." />)
    expect(screen.getByLabelText('Invoice number')).toHaveAccessibleDescription('Assigned automatically.')
  })
})

describe('Switch and Segmented', () => {
  it('switch toggles and reports its state', async () => {
    function Demo() {
      const [on, setOn] = useState(false)
      return <Switch label="Send reminders" checked={on} onChange={setOn} />
    }
    render(<Demo />)
    const sw = screen.getByRole('switch', { name: 'Send reminders' })
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('segmented works as a radio group', async () => {
    function Demo() {
      const [v, setV] = useState<'bank' | 'mobile'>('bank')
      return (
        <Segmented
          label="Paid by"
          value={v}
          onChange={setV}
          options={[
            { value: 'bank', label: 'Bank transfer' },
            { value: 'mobile', label: 'Mobile money' },
          ]}
        />
      )
    }
    render(<Demo />)
    await userEvent.click(screen.getByLabelText('Mobile money'))
    expect(screen.getByRole('radio', { name: 'Mobile money' })).toBeChecked()
  })
})

describe('Amount', () => {
  it('uses accounting brackets and stays left-to-right', () => {
    render(<Amount value="-1234.5" />)
    expect(screen.getByText('($1,234.50)')).toHaveAttribute('dir', 'ltr')
  })
})

describe('Drawer', () => {
  it('focuses inside, closes on Escape, returns focus to the opener', async () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>Record payment</button>
          <Drawer open={open} onClose={() => setOpen(false)} title="Record payment">
            <TextField label="Amount received" />
          </Drawer>
        </>
      )
    }
    render(<Demo />)
    const opener = screen.getByRole('button', { name: 'Record payment' })
    await userEvent.click(opener)
    expect(screen.getByLabelText('Amount received')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
