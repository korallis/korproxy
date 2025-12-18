import { useCallback } from 'react'
import { convexClient } from '../lib/convex'
import { api } from '../../../korproxy-backend/convex/_generated/api'
import { useAuthStore } from '../stores/authStore'
import { useOnboardingStore } from '../stores/onboardingStore'

const ACQUISITION_SOURCE_LABELS: Record<string, string> = {
  search_engine: 'Search engine',
  blog_post: 'Blog post',
  setup_guide: 'Setup guide',
  friend_colleague: 'Friend/colleague',
  social_media: 'Social media',
  other: 'Other',
}

export function useAcquisitionSubmit() {
  const token = useAuthStore((state) => state.token)
  const { acquisitionSource, acquisitionUtm } = useOnboardingStore()

  const submitAcquisition = useCallback(async () => {
    if (!token) return

    try {
      const sourceLabel = acquisitionSource 
        ? ACQUISITION_SOURCE_LABELS[acquisitionSource] 
        : undefined

      await convexClient.mutation(api.users.setAcquisitionSource, {
        token,
        acquisitionSource: sourceLabel,
        acquisitionUtm: acquisitionUtm ? {
          source: acquisitionUtm.source,
          medium: acquisitionUtm.medium,
          campaign: acquisitionUtm.campaign,
        } : undefined,
      })
    } catch (error) {
      console.error('Failed to submit acquisition data:', error)
    }
  }, [token, acquisitionSource, acquisitionUtm])

  return { submitAcquisition }
}
