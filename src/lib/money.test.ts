import { describe, expect, it } from 'vitest'
import { formatCurrency, money, sum } from './money'

describe('money', () => {
  it('adds decimals exactly', () => {
    expect(money('0.1').plus('0.2').toString()).toBe('0.3')
    expect(sum(['10.10', '20.20', '30.30']).toFixed(2)).toBe('60.60')
  })

  it('formats with separators and accounting brackets', () => {
    expect(formatCurrency('1234567.891')).toBe('$1,234,567.89')
    expect(formatCurrency('-1234.5')).toBe('($1,234.50)')
  })
})
