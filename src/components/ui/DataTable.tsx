import { useTable, type ColumnDef, type RowData } from '@tanstack/react-table'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { features } from './table-features'

interface DataTableProps<T extends RowData> {
  /** Read by screen readers. */
  caption: string
  columns: ColumnDef<typeof features, T, any>[]
  data: T[]
  /** Called when a row is opened (click, Enter, or tap on phone). */
  onOpen?: (row: T) => void
  empty: ReactNode
}

/**
 * Sortable table. Tablet & desktop: a real <table>. Phones: each row becomes a card,
 * so the page never scrolls sideways. Every cell is wrapped in <bdi> so English names
 * and punctuation stay correct inside Arabic layout.
 */
export function DataTable<T extends RowData>({ caption, columns, data, onOpen, empty }: DataTableProps<T>) {
  const table = useTable({ features, columns, data })
  const rows = table.getRowModel().rows
  if (rows.length === 0) return <>{empty}</>

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-mist-soft">
            {table.getHeaderGroups().map((g) => (
              <tr key={g.id}>
                {g.headers.map((h) => {
                  const numeric = h.column.columnDef.meta?.numeric
                  const sorted = h.column.getIsSorted()
                  const Icon = sorted === 'asc' ? ChevronUp : sorted === 'desc' ? ChevronDown : ChevronsUpDown
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={
                        sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                      }
                      className={cn(
                        'border-line text-ink-muted border-y px-4 py-2.5 text-xs font-semibold first:ps-5 last:pe-5',
                        numeric ? 'text-end' : 'text-start',
                      )}
                    >
                      {h.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={h.column.getToggleSortingHandler()}
                          className={cn(
                            'hover:text-ink inline-flex items-center gap-1',
                            numeric && 'flex-row-reverse',
                          )}
                        >
                          <table.FlexRender header={h} />
                          <Icon aria-hidden className={cn('size-3.5', !sorted && 'opacity-40')} />
                        </button>
                      ) : (
                        <table.FlexRender header={h} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={onOpen ? 0 : undefined}
                onClick={onOpen ? () => onOpen(row.original) : undefined}
                onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen(row.original) : undefined}
                className={cn(
                  'border-line border-b last:border-b-0',
                  onOpen && 'hover:bg-mist-soft focus-visible:bg-mist cursor-pointer',
                )}
              >
                {row.getAllCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      'px-4 py-3 first:ps-5 last:pe-5',
                      cell.column.columnDef.meta?.numeric && 'num',
                    )}
                  >
                    <bdi>
                      <table.FlexRender cell={cell} />
                    </bdi>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-line divide-y md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const cells = row.getAllCells().filter((c) => {
            const meta = c.column.columnDef.meta
            return !meta?.hideOnPhone && !meta?.hideOnPhoneWhen?.(row.original)
          })
          const [first, ...rest] = cells
          const body = (
            <>
              <div className="font-semibold [overflow-wrap:anywhere]">
                <bdi>
                  <table.FlexRender cell={first} />
                </bdi>
              </div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {rest.map((cell) => (
                  <div key={cell.id} className="contents">
                    <dt className="text-ink-subtle">{String(cell.column.columnDef.header ?? '')}</dt>
                    <dd className="text-end [overflow-wrap:anywhere] tabular-nums">
                      <bdi>
                        <table.FlexRender cell={cell} />
                      </bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )
          return (
            <li key={row.id}>
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => onOpen(row.original)}
                  className="active:bg-mist-soft block w-full px-5 py-4 text-start"
                >
                  {body}
                </button>
              ) : (
                <div className="px-5 py-4">{body}</div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
