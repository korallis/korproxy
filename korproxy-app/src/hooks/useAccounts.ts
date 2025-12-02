import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Account } from '@/types/electron'

export function useAccounts() {
  const queryClient = useQueryClient()

  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Account[], Error>({
    queryKey: ['accounts'],
    queryFn: async () => {
      if (!window.korproxy?.auth) {
        return []
      }
      return window.korproxy.auth.listAccounts()
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: 1,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!window.korproxy?.auth) {
        throw new Error('App not initialized')
      }
      const result = await window.korproxy.auth.removeAccount(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const deleteAccount = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  return {
    accounts,
    isLoading,
    error,
    refetch,
    deleteAccount,
    isDeleting: deleteMutation.isPending,
  }
}
