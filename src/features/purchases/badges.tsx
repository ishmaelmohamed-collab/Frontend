import {
  AlertTriangle,
  Check,
  CircleDashed,
  Clock,
  FilePen,
  PackageCheck,
  PackageOpen,
  Send,
  ShieldAlert,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLocale, type MessageKey } from '@/lib/i18n-context'
import type { BillStatus, OrderStatus, QuoteStatus } from '@/types/domain'

type Look = 'outline' | 'soft' | 'mist' | 'strong' | 'alert' | 'muted'
const looks: Record<Look, string> = {
  outline: 'text-ink-muted bg-mist-soft',
  soft: 'bg-mist-soft text-slate',
  mist: 'bg-mist text-slate',
  strong: 'border border-slate text-slate bg-panel',
  alert: 'bg-alert-soft text-alert',
  muted: 'bg-canvas text-ink-subtle',
}

/** Status chip: two calm colours + red only for overdue; always icon + word. */
function Pill({ look, Icon, label }: { look: Look; Icon: typeof Check; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        looks[look],
      )}
    >
      <Icon aria-hidden className="size-3.5" strokeWidth={2} />
      {label}
    </span>
  )
}

const bill: Record<BillStatus, [Look, typeof Check]> = {
  approval: ['strong', ShieldAlert],
  unpaid: ['soft', Clock],
  partial: ['mist', CircleDashed],
  overdue: ['alert', AlertTriangle],
  paid: ['outline', Check],
}
export function BillStatusBadge({ status }: { status: BillStatus }) {
  const { t } = useLocale()
  const [look, Icon] = bill[status]
  return <Pill look={look} Icon={Icon} label={t(`bstatus.${status}` as MessageKey)} />
}

const order: Record<OrderStatus, [Look, typeof Check]> = {
  open: ['soft', PackageOpen],
  partial: ['mist', CircleDashed],
  received: ['outline', PackageCheck],
}
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLocale()
  const [look, Icon] = order[status]
  return <Pill look={look} Icon={Icon} label={t(`ostatus.${status}` as MessageKey)} />
}

const quote: Record<QuoteStatus, [Look, typeof Check]> = {
  draft: ['outline', FilePen],
  sent: ['soft', Send],
  accepted: ['strong', Check],
  expired: ['muted', X],
  converted: ['mist', Check],
}
export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const { t } = useLocale()
  const [look, Icon] = quote[status]
  return <Pill look={look} Icon={Icon} label={t(`qstatus.${status}` as MessageKey)} />
}
