import { AlertTriangle, Check, CircleDashed, FilePen, Send, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n-context'

export type DocumentStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'

/**
 * Statuses use the two fog colours; only "Overdue" uses the warning red (client decision B).
 * Each status also has its own icon and word — never colour alone.
 */
const styles: Record<DocumentStatus, { cls: string; Icon: typeof Check }> = {
  draft: { cls: 'border border-line text-ink-muted bg-panel', Icon: FilePen },
  sent: { cls: 'bg-mist-soft text-slate', Icon: Send },
  partial: { cls: 'bg-warning-soft text-warning', Icon: CircleDashed },
  paid: { cls: 'bg-success-soft text-success', Icon: Check },
  overdue: { cls: 'bg-alert-soft text-alert border border-alert/30', Icon: AlertTriangle },
  void: { cls: 'text-ink-subtle line-through bg-canvas', Icon: X },
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { t } = useLocale()
  const s = styles[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        s.cls,
      )}
    >
      <s.Icon aria-hidden className="size-3.5" strokeWidth={2.25} />
      {t(`status.${status}`)}
    </span>
  )
}
