import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Report, ReportKind, Role, Session, Settings, User } from '@/types/domain'

export const useSettings = (enabled = true) =>
  useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Settings>('/settings')).data,
    enabled,
    staleTime: 5 * 60_000,
  })

export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: async () => (await api.get<User[]>('/users')).data })

export const useReport = (kind: ReportKind, from: string, to: string) =>
  useQuery({
    queryKey: ['report', kind, from, to],
    queryFn: async () => (await api.get<Report>(`/reports/${kind}`, { params: { from, to } })).data,
    placeholderData: keepPreviousData,
  })

export function useSignIn() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) =>
      (await api.post<Session>('/auth/sign-in', input)).data,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Settings>) => (await api.put<Settings>('/settings', patch)).data,
    onSuccess: (s) => {
      qc.setQueryData(['settings'], s)
      // The approval limit can change which bills need approval.
      for (const k of ['bills', 'close', 'dashboard']) void qc.invalidateQueries({ queryKey: [k] })
    },
  })
}

export function useInviteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; email: string; role: Role }) =>
      (await api.post<User>('/users', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; role?: Role; active?: boolean }) =>
      (await api.patch<User>(`/users/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
