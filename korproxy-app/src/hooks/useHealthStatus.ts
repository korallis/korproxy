import { useEffect, useState } from 'react'
import type { HealthStatus } from '../types/electron'

const DEFAULT_STATUS: HealthStatus = {
  state: 'stopped',
  lastCheck: null,
  consecutiveFailures: 0,
  restartAttempts: 0,
}

export function useHealthStatus(): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>(DEFAULT_STATUS)

  useEffect(() => {
    if (!window.korproxy?.health) return

    window.korproxy.health.getStatus().then(setStatus)

    const unsubscribe = window.korproxy.health.onStateChange((newStatus) => {
      setStatus(newStatus)
    })

    return unsubscribe
  }, [])

  return status
}
