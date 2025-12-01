import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  )
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-5', className)}>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

export function ProviderCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-5', className)}>
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
        >
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

export function AccountListSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      <div className="px-5 py-3 border-b border-border bg-muted/30">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton }
