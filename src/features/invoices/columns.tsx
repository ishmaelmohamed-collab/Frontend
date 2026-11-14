import { Amount } from '@/components/ui/Amount'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { columnHelper } from '@/components/ui/table-features'
import { formatDate } from '@/lib/dates'
import type { Locale, MessageKey } from '@/lib/i18n-context'
import type { Invoice } from '@/types/domain'

/** Invoice table columns, shared by the dashboard and the invoices list. Rebuilt when the language changes. */
export function invoiceColumns(
  t: (k: MessageKey) => string,
  locale: Locale,
  opts: { withIssued?: boolean } = {},
) {
  const col = columnHelper<Invoice>()
  return col.columns([
    col.accessor('number', {
      header: t('table.no'),
      cell: (c) => (
        <bdi dir="ltr" className="font-semibold">
          {c.getValue()}
        </bdi>
      ),
    }),
    col.accessor('customerName', { header: t('table.customer') }),
    ...(opts.withIssued
      ? [
          col.accessor('issueDate', {
            header: t('table.issued'),
            meta: { hideOnPhone: true },
            cell: (c) => formatDate(c.getValue(), locale),
          }),
        ]
      : []),
    col.accessor('dueDate', { header: t('table.due'), cell: (c) => formatDate(c.getValue(), locale) }),
    col.accessor((r) => Number(r.due), {
      id: 'due',
      header: t('table.amount'),
      meta: { numeric: true },
      cell: (c) => (
        <Amount
          value={c.row.original.due}
          className={Number(c.row.original.due) === 0 ? 'text-ink-subtle' : 'font-semibold'}
        />
      ),
    }),
    col.accessor('status', {
      header: t('table.status'),
      enableSorting: false,
      cell: (c) => <StatusBadge status={c.getValue()} />,
    }),
  ])
}
