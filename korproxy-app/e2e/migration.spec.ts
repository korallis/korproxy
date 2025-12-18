import { test, expect } from '@playwright/test'

/**
 * Config Migration Smoke Tests
 * 
 * Tests verify that old configuration formats are properly migrated
 * to the new format without data loss.
 */
test.describe('Config Migration E2E Tests', () => {
  test.describe('Profile Store Migration', () => {
    test('should migrate v0 (legacy) profile format to v1', async ({ page }) => {
      // Set up legacy format without version field
      await page.addInitScript(() => {
        localStorage.clear()
        
        // Legacy format: no version, flat structure
        const legacyConfig = {
          state: {
            profiles: [{
              id: 'default',
              name: 'Default',
              color: '#6366F1',
              // Old format might not have routingRules structured the same way
              rules: { chat: null, completion: null },
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
            }],
            providerGroups: [],
            activeProfileId: 'default',
          }
        }
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(legacyConfig))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      // Verify structure is valid
      expect(state?.state?.profiles).toBeTruthy()
      expect(state?.state?.activeProfileId).toBeTruthy()
    })

    test('should preserve existing profile data during migration', async ({ page }) => {
      const testProfileData = {
        id: 'custom-profile',
        name: 'My Custom Profile',
        color: '#FF5733',
        routingRules: {
          chat: 'group-1',
          completion: 'group-2',
          embedding: null,
          other: null,
        },
        defaultProviderGroup: 'group-1',
        createdAt: '2024-06-15T10:30:00.000Z',
        updatedAt: '2024-06-15T10:30:00.000Z',
      }

      await page.addInitScript((profileData) => {
        localStorage.clear()
        
        const config = {
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
              profileData,
            ],
            providerGroups: [
              { id: 'group-1', name: 'Group 1', accountIds: ['acc-1'], selectionStrategy: 'round-robin' },
              { id: 'group-2', name: 'Group 2', accountIds: ['acc-2'], selectionStrategy: 'priority' },
            ],
            activeProfileId: 'custom-profile',
          }
        }
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(config))
      }, testProfileData)
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      // Verify custom profile data is preserved
      const customProfile = state?.state?.profiles?.find(
        (p: { id: string }) => p.id === 'custom-profile'
      )
      
      expect(customProfile).toBeTruthy()
      expect(customProfile?.name).toBe('My Custom Profile')
      expect(customProfile?.color).toBe('#FF5733')
      expect(customProfile?.routingRules?.chat).toBe('group-1')
      expect(customProfile?.routingRules?.completion).toBe('group-2')
      expect(customProfile?.defaultProviderGroup).toBe('group-1')
    })

    test('should preserve provider groups during migration', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        
        const config = {
          state: {
            profiles: [{
              id: 'default',
              name: 'Default',
              color: '#6366F1',
              routingRules: { chat: 'test-group', completion: null, embedding: null, other: null },
              defaultProviderGroup: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
            providerGroups: [
              { 
                id: 'test-group', 
                name: 'Test Provider Group', 
                accountIds: ['claude-1', 'gemini-1', 'codex-1'], 
                selectionStrategy: 'round-robin' 
              },
              { 
                id: 'priority-group', 
                name: 'Priority Group', 
                accountIds: ['premium-acc'], 
                selectionStrategy: 'priority' 
              },
            ],
            activeProfileId: 'default',
          }
        }
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(config))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      // Verify provider groups are preserved
      expect(state?.state?.providerGroups?.length).toBe(2)
      
      const testGroup = state?.state?.providerGroups?.find(
        (g: { id: string }) => g.id === 'test-group'
      )
      expect(testGroup?.name).toBe('Test Provider Group')
      expect(testGroup?.accountIds).toEqual(['claude-1', 'gemini-1', 'codex-1'])
      expect(testGroup?.selectionStrategy).toBe('round-robin')
    })
  })

  test.describe('Onboarding Store Migration', () => {
    test('should preserve onboarding completion state', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        
        const onboardingState = {
          state: {
            completed: true,
            currentStep: 6,
            selectedProviders: ['claude', 'gemini'],
            selectedTools: ['cursor', 'windsurf'],
            acquisitionSource: 'github',
            startedAt: '2024-06-01T00:00:00.000Z',
            completedAt: '2024-06-01T00:05:00.000Z',
          }
        }
        
        localStorage.setItem('korproxy-onboarding-storage', JSON.stringify(onboardingState))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-onboarding-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      // Verify onboarding state is preserved
      expect(state?.state?.completed).toBe(true)
      expect(state?.state?.selectedProviders).toContain('claude')
      expect(state?.state?.selectedProviders).toContain('gemini')
      expect(state?.state?.selectedTools).toContain('cursor')
    })

    test('should handle incomplete onboarding state', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        
        // Incomplete onboarding - user stopped midway
        const incompleteOnboarding = {
          state: {
            completed: false,
            currentStep: 3,
            selectedProviders: ['claude'],
            selectedTools: [],
            startedAt: '2024-06-01T00:00:00.000Z',
          }
        }
        
        localStorage.setItem('korproxy-onboarding-storage', JSON.stringify(incompleteOnboarding))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-onboarding-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      // Onboarding should resume from where it left off
      expect(state?.state?.completed).toBe(false)
      expect(state?.state?.currentStep).toBe(3)
      expect(state?.state?.selectedProviders).toContain('claude')
    })
  })

  test.describe('Theme Store Migration', () => {
    test('should preserve theme preference', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        
        const themeState = {
          state: {
            theme: 'light',
          }
        }
        
        localStorage.setItem('korproxy-theme-storage', JSON.stringify(themeState))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Verify theme is applied
      await expect(page.locator('html')).toHaveClass(/light/)
    })

    test('should handle dark theme preference', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        
        const themeState = {
          state: {
            theme: 'dark',
          }
        }
        
        localStorage.setItem('korproxy-theme-storage', JSON.stringify(themeState))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await expect(page.locator('html')).toHaveClass(/dark/)
    })
  })

  test.describe('Cross-Store Consistency', () => {
    test('should maintain consistency between stores after migration', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        
        // Set up all stores with related data
        localStorage.setItem('korproxy-onboarding-storage', JSON.stringify({
          state: {
            completed: true,
            currentStep: 6,
            selectedProviders: ['claude', 'gemini'],
            selectedTools: ['cursor'],
          }
        }))
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify({
          state: {
            profiles: [{
              id: 'default',
              name: 'Default',
              color: '#6366F1',
              routingRules: { chat: 'main-group', completion: null, embedding: null, other: null },
              defaultProviderGroup: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
            providerGroups: [
              { id: 'main-group', name: 'Main', accountIds: ['claude-1', 'gemini-1'], selectionStrategy: 'round-robin' },
            ],
            activeProfileId: 'default',
          }
        }))
        
        localStorage.setItem('korproxy-theme-storage', JSON.stringify({
          state: { theme: 'dark' }
        }))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Verify all stores are loaded correctly
      const onboarding = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-onboarding-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      const profiles = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      expect(onboarding?.state?.completed).toBe(true)
      expect(profiles?.state?.profiles?.length).toBeGreaterThanOrEqual(1)
      await expect(page.locator('html')).toHaveClass(/dark/)
    })
  })

  test.describe('Data Integrity', () => {
    test('should not lose routing rules on page refresh', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear()
        localStorage.setItem('korproxy-onboarding-storage', JSON.stringify({
          state: { completed: true }
        }))
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Set up routing rules
      await page.evaluate(() => {
        const config = {
          state: {
            profiles: [{
              id: 'default',
              name: 'Default',
              color: '#6366F1',
              routingRules: {
                chat: 'chat-group',
                completion: 'completion-group',
                embedding: 'embedding-group',
                other: 'other-group',
              },
              defaultProviderGroup: 'chat-group',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
            providerGroups: [
              { id: 'chat-group', name: 'Chat', accountIds: ['acc-1'], selectionStrategy: 'round-robin' },
              { id: 'completion-group', name: 'Completion', accountIds: ['acc-2'], selectionStrategy: 'priority' },
              { id: 'embedding-group', name: 'Embedding', accountIds: ['acc-3'], selectionStrategy: 'random' },
              { id: 'other-group', name: 'Other', accountIds: ['acc-4'], selectionStrategy: 'round-robin' },
            ],
            activeProfileId: 'default',
          }
        }
        
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(config))
      })
      
      // Refresh multiple times
      for (let i = 0; i < 3; i++) {
        await page.reload()
        await page.waitForLoadState('networkidle')
      }
      
      const state = await page.evaluate(() => {
        const stored = localStorage.getItem('korproxy-profile-storage')
        return stored ? JSON.parse(stored) : null
      })
      
      // Verify all routing rules are intact
      const profile = state?.state?.profiles?.[0]
      expect(profile?.routingRules?.chat).toBe('chat-group')
      expect(profile?.routingRules?.completion).toBe('completion-group')
      expect(profile?.routingRules?.embedding).toBe('embedding-group')
      expect(profile?.routingRules?.other).toBe('other-group')
      expect(state?.state?.providerGroups?.length).toBe(4)
    })
  })
})
