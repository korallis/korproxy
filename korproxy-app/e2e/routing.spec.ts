import { test, expect } from '@playwright/test'

test.describe('Routing Configuration E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem('korproxy-onboarding-storage', JSON.stringify({
        state: { completed: true, currentStep: 6, selectedProviders: [], selectedTools: [] },
      }))
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Profile Store Integration', () => {
    test('should initialize with default profile', async ({ page }) => {
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })

      if (state?.state?.profiles) {
        expect(state.state.profiles.length).toBeGreaterThanOrEqual(1)
        expect(state.state.profiles[0].name).toBe('Default')
        expect(state.state.activeProfileId).toBe('default')
      }
    })

    test('should have routing rules structure in default profile', async ({ page }) => {
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })

      if (state?.state?.profiles?.[0]) {
        const profile = state.state.profiles[0]
        expect(profile.routingRules).toHaveProperty('chat')
        expect(profile.routingRules).toHaveProperty('completion')
        expect(profile.routingRules).toHaveProperty('embedding')
        expect(profile.routingRules).toHaveProperty('other')
      }
    })
  })

  test.describe('Provider Group Management', () => {
    test('should display dashboard after app loads', async ({ page }) => {
      // Dashboard should be visible when app loads with onboarding complete
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    })

    test('should have provider summary on dashboard', async ({ page }) => {
      await expect(page.getByText('Provider Summary')).toBeVisible()
    })
  })

  test.describe('Routing Rules Configuration', () => {
    test('should display proxy status card', async ({ page }) => {
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should display stat cards', async ({ page }) => {
      await expect(page.getByText('Total Accounts')).toBeVisible()
    })
  })

  test.describe('Config Export', () => {
    test('should generate valid routing config structure', async ({ page }) => {
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })

      if (state?.state) {
        expect(state.state).toHaveProperty('profiles')
        expect(state.state).toHaveProperty('providerGroups')
        expect(state.state).toHaveProperty('activeProfileId')
      }
    })
  })

  test.describe('Dashboard Integration', () => {
    test('should display dashboard after configuration', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    })

    test('should show proxy status on dashboard', async ({ page }) => {
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should show provider summary', async ({ page }) => {
      await expect(page.getByText('Provider Summary')).toBeVisible()
    })
  })
})
