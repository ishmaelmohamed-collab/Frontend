import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import type {
  AccountId,
  BankTxn,
  JournalEntry,
  JournalInput,
  LedgerAccount,
  MonthClose,
  Reconciliation,
  ResolveAction,
  TransferInput,
} from '@/types/domain'

const get =
  <T>(path: string) =>
  async () =>
    (await api.get<T>(path)).data

export type ReconciliationView = Reconciliation & { bookOnly: BankTxn[] }

export const useTransactions = () =>
  useQuery({ queryKey: ['transactions'], queryFn: get<BankTxn[]>('/bank/transactions') })
export const useReconciliation = (account: AccountId) =>
  useQuery({ queryKey: ['reconcile', account], queryFn: get<ReconciliationView>(`/reconcile/${account}`) })
export const useLedger = () => useQuery({ queryKey: ['ledger'], queryFn: get<LedgerAccount[]>('/ledger') })
export const useJournal = () => useQuery({ queryKey: ['journal'], queryFn: get<JournalEntry[]>('/journal') })
export const useMonthClose = (enabled = true) =>
  useQuery({ queryKey: ['close'], queryFn: get<MonthClose>('/close'), enabled })

/** The server's error code ("periodLocked", "unbalanced"…), or null for network/unknown errors. */
export const errorCode = (e: unknown): string | null =>
  isAxiosError(e) && typeof e.response?.data?.code === 'string' && e.response.data.code !== 'unknown'
    ? e.response.data.code
    : null

/** Money moved or the books changed: refresh every screen that shows balances. */
function useRefresh() {
  const qc = useQueryClient()
  return () => {
    for (const k of [
      'transactions',
      'reconcile',
      'ledger',
      'journal',
      'close',
      'accounts',
      'dashboard',
      'invoices',
      'payments',
      'customers',
    ])
      void qc.invalidateQueries({ queryKey: [k] })
  }
}

export function useTransfer() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (input: TransferInput) => (await api.post<BankTxn[]>('/bank/transfer', input)).data,
    onSuccess: refresh,
  })
}

export function useResolveLine(account: AccountId) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async ({ lineId, action }: { lineId: string; action: ResolveAction }) =>
      (await api.post<ReconciliationView>(`/reconcile/${account}/lines/${lineId}`, { action })).data,
    onSuccess: refresh,
  })
}

export function useCreateJournal() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (input: JournalInput) => (await api.post<JournalEntry>('/journal', input)).data,
    onSuccess: refresh,
  })
}

export function useCloseAction() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async ({
      action,
      reason = '',
    }: {
      action: 'stock-count' | 'lock' | 'reopen'
      reason?: string
    }) => (await api.post<MonthClose>(`/close/${action}`, { reason })).data,
    onSuccess: refresh,
  })
}
