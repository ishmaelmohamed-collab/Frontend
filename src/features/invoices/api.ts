import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { DashboardSummary, Invoice, RecordPaymentInput } from '@/types/domain'

export const keys = {
  dashboard: ['dashboard'] as const,
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
}

export const useDashboard = () =>
  useQuery({
    queryKey: keys.dashboard,
    queryFn: async () => (await api.get<DashboardSummary>('/dashboard')).data,
  })

export const useInvoices = () =>
  useQuery({ queryKey: keys.invoices, queryFn: async () => (await api.get<Invoice[]>('/invoices')).data })

export const useInvoice = (id: string) =>
  useQuery({
    queryKey: keys.invoice(id),
    queryFn: async () => (await api.get<Invoice>(`/invoices/${encodeURIComponent(id)}`)).data,
  })

/** Records a payment, then refreshes everything that shows money owed. */
export function useRecordPayment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordPaymentInput) =>
      (await api.post<Invoice>(`/invoices/${encodeURIComponent(id)}/payments`, input)).data,
    onSuccess: (inv) => {
      qc.setQueryData(keys.invoice(id), inv)
      void qc.invalidateQueries({ queryKey: keys.invoices })
      void qc.invalidateQueries({ queryKey: keys.dashboard })
      // Money moved: bank, reconciliation and the books change too.
      for (const k of ['accounts', 'payments', 'transactions', 'reconcile', 'ledger', 'journal', 'close'])
        void qc.invalidateQueries({ queryKey: [k] })
    },
  })
}
