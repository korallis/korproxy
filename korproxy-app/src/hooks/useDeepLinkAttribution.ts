import { useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'

export function useDeepLinkAttribution() {
  const { setAcquisitionUtm, acquisitionUtm } = useOnboardingStore()

  useEffect(() => {
    async function checkDeepLinkUtm() {
      if (acquisitionUtm) return

      try {
        const utm = await window.korproxy.deeplink.getUtm()
        if (utm && (utm.source || utm.medium || utm.campaign)) {
          setAcquisitionUtm(utm)
          await window.korproxy.deeplink.clearUtm()
        }
      } catch (error) {
        console.error('Failed to get deep link UTM:', error)
      }
    }

    checkDeepLinkUtm()
  }, [setAcquisitionUtm, acquisitionUtm])
}
