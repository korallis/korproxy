import { useEffect } from 'react'
import { useProfileStore } from '../stores/profileStore'

/**
 * Hook to sync profile state with the system tray menu.
 * - Syncs profiles to tray on mount and when profiles change
 * - Listens for profile changes from tray menu clicks
 */
export function useTraySync(): void {
  const { 
    setActiveProfile, 
    getRoutingConfig, 
    profiles,
    activeProfileId,
  } = useProfileStore()

  // Initial sync on mount
  useEffect(() => {
    const syncInitial = async () => {
      if (typeof window === 'undefined' || !window.korproxy?.tray) {
        return
      }

      try {
        const config = getRoutingConfig()
        await window.korproxy.tray.syncProfiles(config)
      } catch (err) {
        console.error('Failed to sync profiles to tray:', err)
      }
    }

    syncInitial()
  }, [getRoutingConfig])

  // Listen for profile changes from tray
  useEffect(() => {
    if (typeof window === 'undefined' || !window.korproxy?.tray) {
      return
    }

    const unsubscribe = window.korproxy.tray.onProfileChanged((profileId: string) => {
      // Update the store when user selects profile from tray
      setActiveProfile(profileId)
    })

    return () => {
      unsubscribe()
    }
  }, [setActiveProfile])

  // Re-sync when profiles or active profile changes
  useEffect(() => {
    const syncProfiles = async () => {
      if (typeof window === 'undefined' || !window.korproxy?.tray) {
        return
      }

      try {
        const config = getRoutingConfig()
        await window.korproxy.tray.syncProfiles(config)
      } catch (err) {
        console.error('Failed to sync profiles to tray:', err)
      }
    }

    syncProfiles()
  }, [profiles, activeProfileId, getRoutingConfig])
}
