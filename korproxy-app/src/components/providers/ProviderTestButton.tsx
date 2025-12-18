import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ProviderTestResult } from '@/types/electron'

interface ProviderTestButtonProps {
  providerId: string
  modelId?: string
  disabled?: boolean
}

export function ProviderTestButton({ providerId, modelId, disabled }: ProviderTestButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProviderTestResult | null>(null)

  const runTest = async () => {
    if (!window.korproxy?.provider) return
    
    setLoading(true)
    setResult(null)

    try {
      const testResult = await window.korproxy.provider.test(providerId, modelId)
      setResult(testResult)
    } catch (error) {
      setResult({
        providerId,
        success: false,
        errorCode: 'PROVIDER_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getErrorGuidance = (errorCode?: string) => {
    switch (errorCode) {
      case 'PROXY_NOT_RUNNING':
        return 'Start the proxy first'
      case 'TOKEN_EXPIRED':
        return 'Re-authenticate your account'
      case 'QUOTA_EXCEEDED':
        return 'Rate limit hit, try again later'
      case 'TIMEOUT':
        return 'Request timed out'
      case 'NETWORK_ERROR':
        return 'Check your internet connection'
      default:
        return undefined
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={runTest}
        disabled={disabled || loading}
        className="min-w-[80px]"
      >
        {loading ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Testing
          </span>
        ) : (
          'Run Test'
        )}
      </Button>

      {result && (
        <div className="text-sm">
          {result.success ? (
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {result.latencyMs ? formatLatency(result.latencyMs) : 'Success'}
            </span>
          ) : (
            <span className="inline-flex flex-col text-red-500">
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {result.errorMessage || 'Failed'}
              </span>
              {getErrorGuidance(result.errorCode) && (
                <span className="text-xs text-muted-foreground">
                  {getErrorGuidance(result.errorCode)}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
