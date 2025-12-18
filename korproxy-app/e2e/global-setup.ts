import { chromium, FullConfig } from '@playwright/test'

/**
 * Global setup for E2E tests.
 * Marks onboarding as complete so tests can access the app without
 * the onboarding wizard blocking the UI.
 */
async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Navigate to the app to ensure localStorage is available
  await page.goto('http://localhost:5173')

  // Set onboarding as completed in localStorage
  await page.evaluate(() => {
    const onboardingState = {
      state: {
        completed: true,
        currentStep: 7, // OnboardingStep.DONE
        selectedProviders: [],
        selectedTools: [],
        acquisitionSource: undefined,
        acquisitionUtm: undefined,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      version: 0,
    }
    localStorage.setItem('korproxy-onboarding-storage', JSON.stringify(onboardingState))
  })

  // Save storage state for reuse
  await context.storageState({ path: 'e2e/.auth/storage-state.json' })

  await browser.close()
}

export default globalSetup
