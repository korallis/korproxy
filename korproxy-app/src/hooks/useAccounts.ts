import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proxyApi, type Account } from '../lib/api'

export function useAccounts() {
  const queryClient = useQueryClient()

  const {
    data: accounts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Account[], Error>({
    queryKey: ['accounts'],
    queryFn: () => proxyApi.getAccounts(),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: 1,
  })

  const deleteMutation = useMutation({
    mutationFn: (filename: string) => proxyApi.deleteAccount(filename),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  const deleteAccount = async (filename: string) => {
    await deleteMutation.mutateAsync(filename)
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
