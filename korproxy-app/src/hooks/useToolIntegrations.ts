import { useEffect, useState, useCallback } from 'react'
import type { ToolIntegration } from '../types/electron'

export function useToolIntegrations() {
  const [integrations, setIntegrations] = useState<ToolIntegration[]>([])
  const [loading, setLoading] = useState(true)

  const loadIntegrations = useCallback(async () => {
    if (!window.korproxy?.tools) {
      setLoading(false)
      return
    }

    try {
      const result = await window.korproxy.tools.list()
      setIntegrations(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  const refresh = async () => {
    if (!window.korproxy?.tools) return
    setLoading(true)
    const result = await window.korproxy.tools.list()
    setIntegrations(result)
    setLoading(false)
  }

  return { integrations, loading, refresh }
}
