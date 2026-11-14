import type Decimal from 'decimal.js'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/money'

/** Every money figure: tabular digits, brackets for negatives, always left-to-right. */
export function Amount({ value, className }: { value: Decimal.Value; className?: string }) {
  return (
    <bdi dir="ltr" className={cn('font-sans whitespace-nowrap tabular-nums', className)}>
      {formatCurrency(value)}
    </bdi>
  )
}
