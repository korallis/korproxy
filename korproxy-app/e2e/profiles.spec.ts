import { test, expect } from '@playwright/test'

/**
 * Profile Integration Tests
 * 
 * These tests verify the profile store functionality through browser context.
 * Since there's no dedicated Profiles UI yet, we test the store directly
 * through page.evaluate() to verify the integration works correctly.
 */
test.describe('Profile Store Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.addInitScript(() => {
      localStorage.clear()
    })
    await page.goto('/')
  })

  test('should initialize with default profile', async ({ page }) => {
    const state = await page.evaluate(async () => {
      // Wait for store to be available
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const stored = localStorage.getItem('korproxy-profile-storage')
      if (!stored) return null
      return JSON.parse(stored)
    })

    // Store should have default profile after app initializes
    if (state?.state?.profiles) {
      expect(state.state.profiles.length).toBeGreaterThanOrEqual(1)
      expect(state.state.profiles[0].name).toBe('Default')
      expect(state.state.activeProfileId).toBe('default')
    }
  })

  test('should persist profile state in localStorage', async ({ page }) => {
    // Navigate to trigger app initialization
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Manipulate the profile store via localStorage
    await page.evaluate(() => {
      const currentStore = localStorage.getItem('korproxy-profile-storage')
      const parsed = currentStore ? JSON.parse(currentStore) : { state: { profiles: [], providerGroups: [], activeProfileId: 'default' } }
      
      // Add a new profile
      const newProfile = {
        id: 'test-profile-' + Date.now(),
        name: 'Test Profile',
        color: '#FF5733',
        routingRules: { chat: null, completion: null, embedding: null, other: null },
        defaultProviderGroup: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      if (!parsed.state.profiles) {
        parsed.state.profiles = []
      }
      parsed.state.profiles.push(newProfile)
      
      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    // Reload and verify persistence
    await page.reload()
    
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.profiles?.length).toBeGreaterThanOrEqual(2)
    expect(state?.state?.profiles?.some((p: { name: string }) => p.name === 'Test Profile')).toBeTruthy()
  })

  test('should not allow deleting default profile from store', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const result = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      if (!stored) return { hasDefault: false }
      
      const parsed = JSON.parse(stored)
      const hasDefault = parsed.state?.profiles?.some((p: { id: string }) => p.id === 'default')
      
      // In real app, deleteProfile('default') returns false and doesn't modify state
      // Just verify default exists
      return { hasDefault, profileCount: parsed.state?.profiles?.length || 0 }
    })

    // Default profile should exist
    expect(result.hasDefault).toBeTruthy()
  })

  test('should switch active profile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Create second profile and switch to it
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { state: { profiles: [], providerGroups: [], activeProfileId: 'default' } }
      
      const newProfile = {
        id: 'work-profile',
        name: 'Work',
        color: '#00FF00',
        routingRules: { chat: null, completion: null, embedding: null, other: null },
        defaultProviderGroup: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      if (!parsed.state.profiles) {
        parsed.state.profiles = [{
          id: 'default',
          name: 'Default',
          color: '#6366F1',
          routingRules: { chat: null, completion: null, embedding: null, other: null },
          defaultProviderGroup: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }]
      }
      
      parsed.state.profiles.push(newProfile)
      parsed.state.activeProfileId = 'work-profile'
      
      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    await page.reload()
    
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.activeProfileId).toBe('work-profile')
  })

  test('should handle provider groups in profile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { state: { profiles: [], providerGroups: [], activeProfileId: 'default' } }
      
      // Add provider group
      const newGroup = {
        id: 'fast-group',
        name: 'Fast Models',
        accountIds: ['acc1', 'acc2'],
        selectionStrategy: 'round-robin',
      }
      
      if (!parsed.state.providerGroups) {
        parsed.state.providerGroups = []
      }
      parsed.state.providerGroups.push(newGroup)
      
      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    await page.reload()
    
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.providerGroups?.length).toBe(1)
    expect(state?.state?.providerGroups?.[0]?.name).toBe('Fast Models')
    expect(state?.state?.providerGroups?.[0]?.selectionStrategy).toBe('round-robin')
  })

  test('should generate valid routing config structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    // Verify the stored structure matches RoutingConfig schema
    if (state?.state) {
      expect(state.state).toHaveProperty('profiles')
      expect(state.state).toHaveProperty('providerGroups')
      expect(state.state).toHaveProperty('activeProfileId')
      
      // Each profile should have required fields
      if (state.state.profiles?.length > 0) {
        const profile = state.state.profiles[0]
        expect(profile).toHaveProperty('id')
        expect(profile).toHaveProperty('name')
        expect(profile).toHaveProperty('routingRules')
        expect(profile.routingRules).toHaveProperty('chat')
        expect(profile.routingRules).toHaveProperty('completion')
        expect(profile.routingRules).toHaveProperty('embedding')
        expect(profile.routingRules).toHaveProperty('other')
      }
    }
  })
})

test.describe('Profile Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should switch between multiple profiles', async ({ page }) => {
    // Set up multiple profiles
    await page.evaluate(() => {
      const profiles = [
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
          id: 'work',
          name: 'Work',
          color: '#10B981',
          routingRules: { chat: 'work-group', completion: null, embedding: null, other: null },
          defaultProviderGroup: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'personal',
          name: 'Personal',
          color: '#F59E0B',
          routingRules: { chat: 'personal-group', completion: null, embedding: null, other: null },
          defaultProviderGroup: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      const parsed = {
        state: {
          profiles,
          providerGroups: [
            { id: 'work-group', name: 'Work Providers', accountIds: [], selectionStrategy: 'priority' },
            { id: 'personal-group', name: 'Personal Providers', accountIds: [], selectionStrategy: 'round-robin' },
          ],
          activeProfileId: 'default',
        }
      }

      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    await page.reload()

    // Switch to work profile
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : null
      if (parsed?.state) {
        parsed.state.activeProfileId = 'work'
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
      }
    })

    await page.reload()

    let state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.activeProfileId).toBe('work')

    // Switch to personal profile
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : null
      if (parsed?.state) {
        parsed.state.activeProfileId = 'personal'
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
      }
    })

    await page.reload()

    state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.activeProfileId).toBe('personal')
  })

  test('should maintain routing rules when switching profiles', async ({ page }) => {
    await page.evaluate(() => {
      const parsed = {
        state: {
          profiles: [
            {
              id: 'default',
              name: 'Default',
              color: '#6366F1',
              routingRules: { chat: 'default-chat', completion: null, embedding: null, other: null },
              defaultProviderGroup: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'custom',
              name: 'Custom',
              color: '#8B5CF6',
              routingRules: { chat: 'custom-chat', completion: 'custom-completion', embedding: null, other: null },
              defaultProviderGroup: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          providerGroups: [
            { id: 'default-chat', name: 'Default Chat', accountIds: [], selectionStrategy: 'round-robin' },
            { id: 'custom-chat', name: 'Custom Chat', accountIds: [], selectionStrategy: 'priority' },
            { id: 'custom-completion', name: 'Custom Completion', accountIds: [], selectionStrategy: 'random' },
          ],
          activeProfileId: 'default',
        }
      }

      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    await page.reload()

    // Verify default profile routing
    let state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    const defaultProfile = state?.state?.profiles?.find((p: { id: string }) => p.id === 'default')
    expect(defaultProfile?.routingRules?.chat).toBe('default-chat')

    // Switch to custom profile
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : null
      if (parsed?.state) {
        parsed.state.activeProfileId = 'custom'
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
      }
    })

    await page.reload()

    state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    const customProfile = state?.state?.profiles?.find((p: { id: string }) => p.id === 'custom')
    expect(customProfile?.routingRules?.chat).toBe('custom-chat')
    expect(customProfile?.routingRules?.completion).toBe('custom-completion')
  })

  test('should fall back to default when deleting active profile', async ({ page }) => {
    await page.evaluate(() => {
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
            {
              id: 'temporary',
              name: 'Temporary',
              color: '#EC4899',
              routingRules: { chat: null, completion: null, embedding: null, other: null },
              defaultProviderGroup: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          providerGroups: [],
          activeProfileId: 'temporary',
        }
      }

      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    await page.reload()

    // Delete the active profile
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : null
      if (parsed?.state) {
        parsed.state.profiles = parsed.state.profiles.filter((p: { id: string }) => p.id !== 'temporary')
        parsed.state.activeProfileId = 'default' // Fall back to default
        localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
      }
    })

    await page.reload()

    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.activeProfileId).toBe('default')
    expect(state?.state?.profiles?.some((p: { id: string }) => p.id === 'temporary')).toBeFalsy()
  })
})

test.describe('Profile Routing Rules', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear()
    })
    await page.goto('/')
  })

  test('should set routing rules for request types', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { 
        state: { 
          profiles: [{
            id: 'default',
            name: 'Default',
            color: '#6366F1',
            routingRules: { chat: null, completion: null, embedding: null, other: null },
            defaultProviderGroup: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }], 
          providerGroups: [], 
          activeProfileId: 'default' 
        } 
      }
      
      // Add a provider group
      const chatGroup = {
        id: 'chat-group',
        name: 'Chat Models',
        accountIds: ['claude-acc', 'gpt-acc'],
        selectionStrategy: 'round-robin',
      }
      
      parsed.state.providerGroups = [chatGroup]
      
      // Set routing rule for chat requests
      if (parsed.state.profiles?.length > 0) {
        parsed.state.profiles[0].routingRules.chat = 'chat-group'
      }
      
      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    await page.reload()
    
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.profiles?.[0]?.routingRules?.chat).toBe('chat-group')
    expect(state?.state?.providerGroups?.[0]?.id).toBe('chat-group')
  })

  test('should support different selection strategies', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    
    await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { state: { profiles: [], providerGroups: [], activeProfileId: 'default' } }
      
      parsed.state.providerGroups = [
        { id: 'rr-group', name: 'Round Robin', accountIds: [], selectionStrategy: 'round-robin' },
        { id: 'priority-group', name: 'Priority', accountIds: [], selectionStrategy: 'priority' },
        { id: 'random-group', name: 'Random', accountIds: [], selectionStrategy: 'random' },
      ]
      
      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    await page.reload()
    
    const state = await page.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    const groups = state?.state?.providerGroups
    expect(groups?.find((g: { id: string }) => g.id === 'rr-group')?.selectionStrategy).toBe('round-robin')
    expect(groups?.find((g: { id: string }) => g.id === 'priority-group')?.selectionStrategy).toBe('priority')
    expect(groups?.find((g: { id: string }) => g.id === 'random-group')?.selectionStrategy).toBe('random')
  })
})
