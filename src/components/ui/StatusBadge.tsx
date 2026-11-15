import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n-context'

export type DocumentStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'

/**
 * A soft pill: a small coloured dot plus the word. Statuses use the two calm colours;
 * only "Overdue" uses the warning red (client decision B). The word is what tells
 * status apart, never the colour alone.
 */
const styles: Record<DocumentStatus, { cls: string; dot: string }> = {
  draft: { cls: 'text-ink-muted bg-mist-soft', dot: 'bg-ink-subtle' },
  sent: { cls: 'bg-mist-soft text-slate', dot: 'bg-slate' },
  partial: { cls: 'bg-mist text-slate', dot: 'bg-slate' },
  paid: { cls: 'bg-mist-soft text-slate', dot: 'bg-slate' },
  overdue: { cls: 'bg-alert-soft text-alert', dot: 'bg-alert' },
  void: { cls: 'text-ink-subtle line-through bg-canvas', dot: 'bg-ink-subtle' },
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
      <span aria-hidden className={cn('size-1.5 rounded-full', s.dot)} />
      {t(`status.${status}`)}
    </span>
  )
}
