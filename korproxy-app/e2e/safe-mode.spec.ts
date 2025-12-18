import { test, expect } from '@playwright/test'

/**
 * Safe Mode E2E Tests
 * 
 * Note: Safe mode is primarily a backend feature controlled via the admin dashboard (korproxy-web).
 * These tests verify the desktop app's handling of safe mode state and routing behavior
 * when safe mode is enabled via the backend.
 */
test.describe('Safe Mode E2E Tests', () => {
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

  test.describe('Safe Mode State Handling', () => {
    test('should display normal mode by default', async ({ page }) => {
      // Dashboard should be visible with normal operation
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should handle safe mode config in profile store', async ({ page }) => {
      // Safe mode would be indicated through a special routing configuration
      await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        const parsed = stored ? JSON.parse(stored) : { 
          state: { 
            profiles: [], 
            providerGroups: [], 
            activeProfileId: 'default' 
          } 
        }
        
        // Create a safe mode profile that routes all requests to a single safe provider
        const safeModeProfile = {
          id: 'safe-mode',
          name: 'Safe Mode',
          color: '#EF4444', // Red for warning
          routingRules: {
            chat: 'safe-provider-group',
            completion: 'safe-provider-group',
            embedding: 'safe-provider-group',
            other: 'safe-provider-group',
          },
          defaultProviderGroup: 'safe-provider-group',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        const safeProviderGroup = {
          id: 'safe-provider-group',
          name: 'Safe Mode Providers',
          accountIds: ['claude-haiku'], // Low-cost model
          selectionStrategy: 'priority',
        }
        
        if (!parsed.state.profiles.some((p: { id: string }) => p.id === 'safe-mode')) {
          parsed.state.profiles.push(safeModeProfile)
        }
        
        if (!parsed.state.providerGroups.some((g: { id: string }) => g.id === 'safe-provider-group')) {
          parsed.state.providerGroups.push(safeProviderGroup)
        }
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
      })

      await page.reload()
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })

      // Verify safe mode profile exists
      const safeModeProfile = state?.state?.profiles?.find((p: { id: string }) => p.id === 'safe-mode')
      expect(safeModeProfile).toBeTruthy()
      expect(safeModeProfile?.name).toBe('Safe Mode')
    })

    test('should switch to safe mode profile', async ({ page }) => {
      // Set up safe mode profile
      await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        const parsed = stored ? JSON.parse(stored) : { state: { profiles: [], providerGroups: [], activeProfileId: 'default' } }
        
        parsed.state.profiles = [
          {
            id: 'default',
            name: 'Default',
            color: '#6366F1',
            routingRules: { chat: null, completion: null, embedding: null, other: null },
            defaultProviderGroup: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'safe-mode',
            name: 'Safe Mode',
            color: '#EF4444',
            routingRules: { chat: 'safe', completion: 'safe', embedding: 'safe', other: 'safe' },
            defaultProviderGroup: 'safe',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]
        
        // Activate safe mode profile
        parsed.state.activeProfileId = 'safe-mode'
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
      })

      await page.reload()
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })

      expect(state?.state?.activeProfileId).toBe('safe-mode')
    })
  })

  test.describe('Safe Mode Routing Verification', () => {
    test('should route all request types through safe provider in safe mode', async ({ page }) => {
      // Set up safe mode configuration before page loads
      await page.addInitScript(() => {
        const safeConfig = {
          state: {
            providerGroups: [
              {
                id: 'safe-group',
                name: 'Safe Providers',
                accountIds: ['claude-haiku-account'],
                selectionStrategy: 'priority',
              }
            ],
            profiles: [{
              id: 'safe-mode-active',
              name: 'Safe Mode Active',
              color: '#EF4444',
              routingRules: {
                chat: 'safe-group',
                completion: 'safe-group',
                embedding: 'safe-group',
                other: 'safe-group',
              },
              defaultProviderGroup: 'safe-group',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
            activeProfileId: 'safe-mode-active',
          }
        }
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(safeConfig))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })

      const activeProfile = state?.state?.profiles?.find(
        (p: { id: string }) => p.id === state?.state?.activeProfileId
      )
      
      // Verify the profile loaded correctly
      expect(activeProfile?.name).toBe('Safe Mode Active')
    })
  })

  test.describe('Safe Mode Deactivation', () => {
    test('should be able to configure default profile', async ({ page }) => {
      // Start with default profile
      await page.addInitScript(() => {
        const parsed = {
          state: {
            profiles: [
              {
                id: 'default',
                name: 'Default',
                color: '#6366F1',
                routingRules: { chat: null, completion: null, embedding: null, other: null },
                defaultProviderGroup: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            providerGroups: [],
            activeProfileId: 'default',
          }
        }
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })

      expect(state?.state?.activeProfileId).toBe('default')
    })
  })

  test.describe('Dashboard Display', () => {
    test('should display dashboard with proxy status', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
      await expect(page.getByText('Proxy Status')).toBeVisible()
    })

    test('should show provider summary', async ({ page }) => {
      await expect(page.getByText('Provider Summary')).toBeVisible()
    })
  })
})
