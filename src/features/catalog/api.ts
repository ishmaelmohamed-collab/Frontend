import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CreateInvoiceInput, CustomerSummary, Invoice, Item } from '@/types/domain'

export const useCustomers = () =>
  useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get<CustomerSummary[]>('/customers')).data,
  })

export const useItems = () =>
  useQuery({ queryKey: ['items'], queryFn: async () => (await api.get<Item[]>('/items')).data })

/** Creates an invoice; refreshes invoices, dashboard, customers and stock. */
export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => (await api.post<Invoice>('/invoices', input)).data,
    onSuccess: () => {
      for (const key of ['invoices', 'dashboard', 'customers', 'items'])
        void qc.invalidateQueries({ queryKey: [key] })
    },
  })
}
