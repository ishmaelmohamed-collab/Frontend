import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  type CellData,
  type RowData,
  type TableFeatures,
} from '@tanstack/react-table'

/** Per-column display options, set with `meta` on a column definition. */
declare module '@tanstack/react-table' {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  > {
    /** Money and counts: aligned to the end, tabular digits. */
    numeric?: boolean
    /** Left out of the phone card layout. */
    hideOnPhone?: boolean
    /** Left out of a phone card when it has nothing to show for that row (e.g. "Money out" on money in). */
    hideOnPhoneWhen?: (row: TData) => boolean
  }
}

/** Table features used app-wide; module scope keeps them stable between renders. */
export const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

export const columnHelper = <T extends RowData>() => createColumnHelper<typeof features, T>()
