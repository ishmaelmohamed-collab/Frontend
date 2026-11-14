import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  Bill,
  CreateBillInput,
  Invoice,
  MoneyAccount,
  PayBillsInput,
  PurchaseOrder,
  Quote,
  ReceivedPayment,
  Vendor,
} from '@/types/domain'

const get =
  <T>(path: string) =>
  async () =>
    (await api.get<T>(path)).data

export const useAccounts = () =>
  useQuery({ queryKey: ['accounts'], queryFn: get<MoneyAccount[]>('/accounts') })
export const useVendors = () => useQuery({ queryKey: ['vendors'], queryFn: get<Vendor[]>('/vendors') })
export const useOrders = () => useQuery({ queryKey: ['orders'], queryFn: get<PurchaseOrder[]>('/orders') })
export const useBills = () => useQuery({ queryKey: ['bills'], queryFn: get<Bill[]>('/bills') })
export const useQuotes = () => useQuery({ queryKey: ['quotes'], queryFn: get<Quote[]>('/quotes') })
export const usePayments = () =>
  useQuery({ queryKey: ['payments'], queryFn: get<ReceivedPayment[]>('/payments') })

/** After any purchase change, refresh everything that shows money or stock. */
function useRefresh() {
  const qc = useQueryClient()
  return () => {
    for (const k of [
      'bills',
      'vendors',
      'orders',
      'accounts',
      'dashboard',
      'items',
      'invoices',
      'quotes',
      'transactions',
      'reconcile',
      'ledger',
      'journal',
      'close',
    ])
      void qc.invalidateQueries({ queryKey: [k] })
  }
}

export function useApproveBill() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Bill>(`/bills/${id}/approve`)).data,
    onSuccess: refresh,
  })
}

export function useCreateBill() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (input: CreateBillInput) => (await api.post<Bill>('/bills', input)).data,
    onSuccess: refresh,
  })
}

export function usePayBills() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (input: PayBillsInput) => (await api.post<Bill[]>('/bills/pay', input)).data,
    onSuccess: refresh,
  })
}

export function useConvertQuote() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Invoice>(`/quotes/${id}/convert`)).data,
    onSuccess: refresh,
  })
}
