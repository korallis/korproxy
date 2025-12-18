import { useEffect, useRef, useCallback } from 'react'
import { convexClient } from '../lib/convex'
import { api } from '../../../korproxy-backend/convex/_generated/api'
import { useAuthStore } from '../stores/authStore'

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000

export function useDeviceSync() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = !!token && !!user
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deviceIdRef = useRef<string | null>(null)

  const registerDevice = useCallback(async () => {
    if (!token || typeof window === 'undefined' || !window.korproxy?.device) {
      return
    }

    try {
      const deviceInfo = await window.korproxy.device.register()
      deviceIdRef.current = deviceInfo.deviceId

      const result = await convexClient.mutation(api.devices.register, {
        token,
        deviceInfo: {
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion,
        },
      })

      if (!result.success) {
        console.error('Device registration failed:', result.error)
      }
    } catch (error) {
      console.error('Device registration error:', error)
    }
  }, [token])

  const updateLastSeen = useCallback(async () => {
    if (!token || !deviceIdRef.current) {
      return
    }

    try {
      await convexClient.mutation(api.devices.updateLastSeen, {
        token,
        deviceId: deviceIdRef.current,
      })
    } catch (error) {
      console.error('Heartbeat update failed:', error)
    }
  }, [token])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      deviceIdRef.current = null
      return
    }

    // Use void to indicate we're intentionally not awaiting
    void registerDevice()

    heartbeatRef.current = setInterval(updateLastSeen, HEARTBEAT_INTERVAL_MS)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
    }
  }, [isAuthenticated, token, registerDevice, updateLastSeen])

  // Return a getter function instead of state to avoid lint issues with refs
  const getDeviceId = useCallback(() => deviceIdRef.current, [])

  return {
    registerDevice,
    updateLastSeen,
    getDeviceId,
  }
}
