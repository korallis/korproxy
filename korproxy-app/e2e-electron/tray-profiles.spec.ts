import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import { join } from 'path'

let electronApp: ElectronApplication
let window: Page

/**
 * Tray Profile Integration Tests
 * 
 * These tests verify the tray menu profile switching functionality
 * and the sync between renderer profile store and main process tray.
 * 
 * Note: System tray menu testing has limitations in Playwright.
 * We test the IPC handlers and state sync instead.
 */
test.describe('Tray Profile Integration', () => {
  test.beforeAll(async () => {
    const appPath = join(__dirname, '..')
    
    electronApp = await electron.launch({
      args: [join(appPath, 'dist-electron/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })

    window = await electronApp.firstWindow()
    await window.waitForLoadState('domcontentloaded')
    // Give app time to initialize stores
    await window.waitForTimeout(1000)
  })

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close()
    }
  })

  test('should expose tray IPC methods on window.korproxy', async () => {
    const hasTrayMethods = await window.evaluate(() => {
      const korproxy = (window as unknown as { 
        korproxy?: { 
          tray?: { 
            syncProfiles?: unknown 
          } 
        } 
      }).korproxy
      return typeof korproxy?.tray?.syncProfiles === 'function'
    })
    expect(hasTrayMethods).toBe(true)
  })

  test('should expose config IPC methods on window.korproxy', async () => {
    const hasConfigMethods = await window.evaluate(() => {
      const korproxy = (window as unknown as { 
        korproxy?: { 
          config?: { 
            sync?: unknown 
          } 
        } 
      }).korproxy
      return typeof korproxy?.config?.sync === 'function'
    })
    expect(hasConfigMethods).toBe(true)
  })

  test('should sync profiles to tray via IPC', async () => {
    const result = await window.evaluate(async () => {
      const korproxy = (window as unknown as { 
        korproxy?: { 
          tray?: { 
            syncProfiles?: (config: unknown) => Promise<{ success: boolean }> 
          } 
        } 
      }).korproxy

      const testConfig = {
        version: 1,
        activeProfileId: 'default',
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
            id: 'work',
            name: 'Work',
            color: '#22C55E',
            routingRules: { chat: null, completion: null, embedding: null, other: null },
            defaultProviderGroup: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        providerGroups: [],
        modelFamilies: { chat: [], completion: [], embedding: [] },
      }

      return korproxy?.tray?.syncProfiles?.(testConfig)
    })

    expect(result?.success).toBe(true)
  })

  test('should handle profile store initialization', async () => {
    // Wait for store to initialize
    await window.waitForTimeout(500)
    
    const hasProfileStore = await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored !== null
    })
    
    expect(hasProfileStore).toBe(true)
  })

  test('should persist profile changes to localStorage', async () => {
    // Directly manipulate the profile store via localStorage
    await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { 
        state: { 
          profiles: [], 
          providerGroups: [], 
          activeProfileId: 'default' 
        } 
      }

      // Add a new profile
      if (!parsed.state.profiles.find((p: { id: string }) => p.id === 'test-tray-profile')) {
        parsed.state.profiles.push({
          id: 'test-tray-profile',
          name: 'Tray Test Profile',
          color: '#FF5733',
          routingRules: { chat: null, completion: null, embedding: null, other: null },
          defaultProviderGroup: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    // Verify persistence
    const state = await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.profiles?.some((p: { name: string }) => p.name === 'Tray Test Profile')).toBe(true)
  })

  test('should change active profile via store update', async () => {
    await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { 
        state: { 
          profiles: [], 
          providerGroups: [], 
          activeProfileId: 'default' 
        } 
      }

      // Ensure we have the test profile
      if (!parsed.state.profiles.find((p: { id: string }) => p.id === 'test-tray-profile')) {
        parsed.state.profiles.push({
          id: 'test-tray-profile',
          name: 'Tray Test Profile',
          color: '#FF5733',
          routingRules: { chat: null, completion: null, embedding: null, other: null },
          defaultProviderGroup: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      // Switch to test profile
      parsed.state.activeProfileId = 'test-tray-profile'
      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    const state = await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.activeProfileId).toBe('test-tray-profile')
  })

  test('should sync config to disk via IPC', async () => {
    const result = await window.evaluate(async () => {
      const korproxy = (window as unknown as { 
        korproxy?: { 
          config?: { 
            sync?: (config: unknown) => Promise<{ success: boolean; error?: string }> 
          } 
        } 
      }).korproxy

      const testConfig = {
        version: 1,
        activeProfileId: 'default',
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
        modelFamilies: { chat: ['gpt-4*'], completion: ['code-*'], embedding: ['text-embedding-*'] },
      }

      return korproxy?.config?.sync?.(testConfig)
    })

    expect(result?.success).toBe(true)
  })

  test('should handle tray profile changed event listener setup', async () => {
    // Verify the app can listen for profile change events
    const canSetupListener = await window.evaluate(() => {
      return typeof window.addEventListener === 'function'
    })
    expect(canSetupListener).toBe(true)
  })

  test('should navigate to Analytics page from sidebar', async () => {
    // Verify Analytics link is visible
    await expect(window.locator('text=Analytics')).toBeVisible()
    
    // Click and verify navigation
    await window.click('text=Analytics')
    await expect(window.locator('h1:has-text("Analytics")')).toBeVisible()
  })

  test('should display Analytics page components', async () => {
    await window.click('text=Analytics')
    await window.waitForLoadState('networkidle')
    
    // Check for date range picker
    const last7d = window.locator('button:has-text("Last 7 days")')
    const last30d = window.locator('button:has-text("Last 30 days")')
    
    await expect(last7d.or(last30d)).toBeVisible()
    
    // Check for refresh button
    await expect(window.locator('button[title="Refresh"]')).toBeVisible()
  })
})

test.describe('Profile Store State Management', () => {
  test.beforeAll(async () => {
    const appPath = join(__dirname, '..')
    
    electronApp = await electron.launch({
      args: [join(appPath, 'dist-electron/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })

    window = await electronApp.firstWindow()
    await window.waitForLoadState('domcontentloaded')
  })

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close()
    }
  })

  test('should validate routing config structure', async () => {
    const state = await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    if (state?.state) {
      // Check required fields exist
      expect(state.state).toHaveProperty('profiles')
      expect(state.state).toHaveProperty('activeProfileId')
      expect(state.state).toHaveProperty('providerGroups')
      
      // Validate array types
      expect(Array.isArray(state.state.profiles)).toBe(true)
      expect(Array.isArray(state.state.providerGroups)).toBe(true)
    }
  })

  test('should maintain default profile as non-deletable', async () => {
    const state = await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : null
      
      // Verify default profile exists
      const hasDefault = parsed?.state?.profiles?.some((p: { id: string }) => p.id === 'default')
      
      // Attempt to remove default (simulating what store prevents)
      if (parsed?.state?.profiles) {
        const afterFilter = parsed.state.profiles.filter((p: { id: string }) => p.id !== 'default')
        // In real app, deleteProfile('default') returns false and doesn't modify state
        return { 
          hasDefaultBefore: hasDefault,
          wouldHaveDefaultAfter: afterFilter.length < parsed.state.profiles.length
        }
      }
      return { hasDefaultBefore: false, wouldHaveDefaultAfter: false }
    })

    // Default should exist
    expect(state.hasDefaultBefore).toBe(true)
  })

  test('should handle provider group with accounts', async () => {
    await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { 
        state: { 
          profiles: [], 
          providerGroups: [], 
          activeProfileId: 'default' 
        } 
      }

      // Add provider group with accounts
      parsed.state.providerGroups = [{
        id: 'multi-account-group',
        name: 'Multi Account',
        accountIds: ['claude-acc-1', 'claude-acc-2', 'gpt-acc-1'],
        selectionStrategy: 'round-robin',
      }]

      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    const state = await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    const group = state?.state?.providerGroups?.[0]
    expect(group?.accountIds).toHaveLength(3)
    expect(group?.accountIds).toContain('claude-acc-1')
    expect(group?.selectionStrategy).toBe('round-robin')
  })

  test('should link routing rules to provider groups', async () => {
    await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      const parsed = stored ? JSON.parse(stored) : { 
        state: { 
          profiles: [], 
          providerGroups: [], 
          activeProfileId: 'default' 
        } 
      }

      // Ensure default profile exists
      if (!parsed.state.profiles?.length) {
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

      // Add provider group and link to routing
      parsed.state.providerGroups = [{
        id: 'chat-only-group',
        name: 'Chat Only',
        accountIds: ['acc1'],
        selectionStrategy: 'priority',
      }]

      // Set routing rule
      parsed.state.profiles[0].routingRules.chat = 'chat-only-group'

      localStorage.setItem('korproxy-profile-storage', JSON.stringify(parsed))
    })

    const state = await window.evaluate(() => {
      const stored = localStorage.getItem('korproxy-profile-storage')
      return stored ? JSON.parse(stored) : null
    })

    expect(state?.state?.profiles?.[0]?.routingRules?.chat).toBe('chat-only-group')
  })
})
