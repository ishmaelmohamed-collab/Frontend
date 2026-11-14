import Decimal from 'decimal.js'

/** All money maths uses Decimal — plain JavaScript numbers lose cents (0.1 + 0.2 ≠ 0.3). */
export const money = (value: Decimal.Value) => new Decimal(value)

export const sum = (values: Decimal.Value[]) =>
  values.reduce<Decimal>((total, v) => total.plus(v), new Decimal(0))

const plain = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 1234.5 → "$1,234.50"; −50 → "($50.00)" (accounting brackets). */
export function formatCurrency(value: Decimal.Value): string {
  const d = new Decimal(value)
  const text = `$${plain.format(d.abs().toNumber())}`
  return d.isNegative() ? `(${text})` : text
}
