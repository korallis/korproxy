import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProfileStore } from '../../stores/profileStore'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.korproxy
Object.defineProperty(window, 'korproxy', {
  value: {
    config: {
      sync: vi.fn().mockResolvedValue({ success: true }),
    },
    tray: {
      syncProfiles: vi.fn().mockResolvedValue({ success: true }),
    },
  },
  writable: true,
})

describe('profileStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    useProfileStore.setState({
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
      activeProfileId: 'default',
      isLoading: false,
      error: null,
      lastSynced: null,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has a default profile', () => {
      const state = useProfileStore.getState()
      expect(state.profiles).toHaveLength(1)
      expect(state.profiles[0].name).toBe('Default')
    })

    it('has default profile as active', () => {
      const state = useProfileStore.getState()
      expect(state.activeProfileId).toBe('default')
    })

    it('has empty provider groups', () => {
      const state = useProfileStore.getState()
      expect(state.providerGroups).toEqual([])
    })
  })

  describe('createProfile', () => {
    it('creates a new profile', () => {
      const profile = useProfileStore.getState().createProfile('Work', '#FF5733')
      expect(profile.name).toBe('Work')
      expect(profile.color).toBe('#FF5733')
      expect(useProfileStore.getState().profiles).toHaveLength(2)
    })

    it('throws error for duplicate name', () => {
      expect(() => {
        useProfileStore.getState().createProfile('Default')
      }).toThrow('A profile with this name already exists')
    })

    it('throws error for case-insensitive duplicate', () => {
      expect(() => {
        useProfileStore.getState().createProfile('default')
      }).toThrow('A profile with this name already exists')
    })
  })

  describe('updateProfile', () => {
    it('updates profile name', () => {
      useProfileStore.getState().createProfile('Work')
      const profile = useProfileStore.getState().profiles.find(p => p.name === 'Work')!
      useProfileStore.getState().updateProfile(profile.id, { name: 'Office' })
      const updated = useProfileStore.getState().profiles.find(p => p.id === profile.id)
      expect(updated?.name).toBe('Office')
    })

    it('updates profile color', () => {
      useProfileStore.getState().createProfile('Work', '#FF5733')
      const profile = useProfileStore.getState().profiles.find(p => p.name === 'Work')!
      useProfileStore.getState().updateProfile(profile.id, { color: '#00FF00' })
      const updated = useProfileStore.getState().profiles.find(p => p.id === profile.id)
      expect(updated?.color).toBe('#00FF00')
    })

    it('throws error when renaming to existing name', () => {
      useProfileStore.getState().createProfile('Work')
      useProfileStore.getState().createProfile('Personal')
      const profile = useProfileStore.getState().profiles.find(p => p.name === 'Work')!
      expect(() => {
        useProfileStore.getState().updateProfile(profile.id, { name: 'Personal' })
      }).toThrow('A profile with this name already exists')
    })
  })

  describe('deleteProfile', () => {
    it('deletes a non-default profile', () => {
      useProfileStore.getState().createProfile('Work')
      const profile = useProfileStore.getState().profiles.find(p => p.name === 'Work')!
      const result = useProfileStore.getState().deleteProfile(profile.id)
      expect(result).toBe(true)
      expect(useProfileStore.getState().profiles).toHaveLength(1)
    })

    it('cannot delete default profile', () => {
      const result = useProfileStore.getState().deleteProfile('default')
      expect(result).toBe(false)
      expect(useProfileStore.getState().profiles).toHaveLength(1)
    })

    it('switches to default when active profile is deleted', () => {
      useProfileStore.getState().createProfile('Work')
      const profile = useProfileStore.getState().profiles.find(p => p.name === 'Work')!
      useProfileStore.getState().setActiveProfile(profile.id)
      useProfileStore.getState().deleteProfile(profile.id)
      expect(useProfileStore.getState().activeProfileId).toBe('default')
    })
  })

  describe('setActiveProfile', () => {
    it('sets the active profile', () => {
      useProfileStore.getState().createProfile('Work')
      const profile = useProfileStore.getState().profiles.find(p => p.name === 'Work')!
      useProfileStore.getState().setActiveProfile(profile.id)
      expect(useProfileStore.getState().activeProfileId).toBe(profile.id)
    })

    it('does nothing for non-existent profile', () => {
      useProfileStore.getState().setActiveProfile('non-existent')
      expect(useProfileStore.getState().activeProfileId).toBe('default')
    })
  })

  describe('getActiveProfile', () => {
    it('returns the active profile', () => {
      const profile = useProfileStore.getState().getActiveProfile()
      expect(profile?.name).toBe('Default')
    })

    it('returns null when active profile not found', () => {
      useProfileStore.setState({ activeProfileId: 'non-existent' })
      const profile = useProfileStore.getState().getActiveProfile()
      expect(profile).toBeNull()
    })
  })

  describe('createProviderGroup', () => {
    it('creates a new provider group', () => {
      const group = useProfileStore.getState().createProviderGroup('Fast Models')
      expect(group.name).toBe('Fast Models')
      expect(group.selectionStrategy).toBe('round-robin')
      expect(useProfileStore.getState().providerGroups).toHaveLength(1)
    })

    it('creates group with accounts', () => {
      const group = useProfileStore.getState().createProviderGroup('Test', ['acc1', 'acc2'])
      expect(group.accountIds).toEqual(['acc1', 'acc2'])
    })

    it('creates group with custom strategy', () => {
      const group = useProfileStore.getState().createProviderGroup('Priority', [], 'priority')
      expect(group.selectionStrategy).toBe('priority')
    })
  })

  describe('updateProviderGroup', () => {
    it('updates group name', () => {
      const group = useProfileStore.getState().createProviderGroup('Test')
      useProfileStore.getState().updateProviderGroup(group.id, { name: 'Updated' })
      const updated = useProfileStore.getState().providerGroups.find(g => g.id === group.id)
      expect(updated?.name).toBe('Updated')
    })
  })

  describe('deleteProviderGroup', () => {
    it('deletes a provider group', () => {
      const group = useProfileStore.getState().createProviderGroup('Test')
      const result = useProfileStore.getState().deleteProviderGroup(group.id)
      expect(result).toBe(true)
      expect(useProfileStore.getState().providerGroups).toHaveLength(0)
    })

    it('clears references in profiles', () => {
      const group = useProfileStore.getState().createProviderGroup('Test')
      useProfileStore.getState().setRoutingRule('default', 'chat', group.id)
      useProfileStore.getState().deleteProviderGroup(group.id)
      const profile = useProfileStore.getState().profiles.find(p => p.id === 'default')
      expect(profile?.routingRules.chat).toBeNull()
    })
  })

  describe('addAccountToGroup', () => {
    it('adds account to group', () => {
      const group = useProfileStore.getState().createProviderGroup('Test')
      useProfileStore.getState().addAccountToGroup(group.id, 'acc1')
      const updated = useProfileStore.getState().providerGroups.find(g => g.id === group.id)
      expect(updated?.accountIds).toContain('acc1')
    })

    it('does not add duplicate account', () => {
      const group = useProfileStore.getState().createProviderGroup('Test', ['acc1'])
      useProfileStore.getState().addAccountToGroup(group.id, 'acc1')
      const updated = useProfileStore.getState().providerGroups.find(g => g.id === group.id)
      expect(updated?.accountIds).toHaveLength(1)
    })
  })

  describe('removeAccountFromGroup', () => {
    it('removes account from group', () => {
      const group = useProfileStore.getState().createProviderGroup('Test', ['acc1', 'acc2'])
      useProfileStore.getState().removeAccountFromGroup(group.id, 'acc1')
      const updated = useProfileStore.getState().providerGroups.find(g => g.id === group.id)
      expect(updated?.accountIds).toEqual(['acc2'])
    })
  })

  describe('setRoutingRule', () => {
    it('sets routing rule for profile', () => {
      const group = useProfileStore.getState().createProviderGroup('Test')
      useProfileStore.getState().setRoutingRule('default', 'chat', group.id)
      const profile = useProfileStore.getState().profiles.find(p => p.id === 'default')
      expect(profile?.routingRules.chat).toBe(group.id)
    })

    it('can clear routing rule', () => {
      const group = useProfileStore.getState().createProviderGroup('Test')
      useProfileStore.getState().setRoutingRule('default', 'chat', group.id)
      useProfileStore.getState().setRoutingRule('default', 'chat', null)
      const profile = useProfileStore.getState().profiles.find(p => p.id === 'default')
      expect(profile?.routingRules.chat).toBeNull()
    })
  })

  describe('getRoutingConfig', () => {
    it('returns valid routing config', () => {
      const config = useProfileStore.getState().getRoutingConfig()
      expect(config.version).toBe(1)
      expect(config.activeProfileId).toBe('default')
      expect(config.profiles).toHaveLength(1)
      expect(config.modelFamilies).toBeDefined()
    })
  })

  describe('reset', () => {
    it('resets to initial state', () => {
      useProfileStore.getState().createProfile('Work')
      useProfileStore.getState().createProviderGroup('Test')
      useProfileStore.getState().reset()
      
      const state = useProfileStore.getState()
      expect(state.profiles).toHaveLength(1)
      expect(state.profiles[0].name).toBe('Default')
      expect(state.providerGroups).toEqual([])
      expect(state.activeProfileId).toBe('default')
    })
  })
})
