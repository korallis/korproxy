import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Profile, ProviderGroup, RoutingConfig, SelectionStrategy, RequestType } from '../../electron/common/ipc-types'

const DEFAULT_PROFILE_COLOR = '#6366F1' // Indigo
const DEFAULT_MODEL_FAMILIES = {
  chat: ['gpt-4*', 'gpt-5*', 'claude-*', 'gemini-*-pro*', 'gemini-3-*'],
  completion: ['gpt-3.5-turbo-instruct', 'code-*', '*-codex*'],
  embedding: ['text-embedding-*', 'embed-*'],
}

interface ProfileState {
  profiles: Profile[]
  providerGroups: ProviderGroup[]
  activeProfileId: string | null
  isLoading: boolean
  error: string | null
  lastSynced: string | null
}

interface ProfileActions {
  // Profile CRUD
  createProfile: (name: string, color?: string, icon?: string) => Profile
  updateProfile: (id: string, updates: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void
  deleteProfile: (id: string) => boolean
  setActiveProfile: (id: string | null) => void
  getActiveProfile: () => Profile | null

  // Provider Group CRUD
  createProviderGroup: (name: string, accountIds?: string[], strategy?: SelectionStrategy) => ProviderGroup
  updateProviderGroup: (id: string, updates: Partial<Omit<ProviderGroup, 'id'>>) => void
  deleteProviderGroup: (id: string) => boolean
  addAccountToGroup: (groupId: string, accountId: string) => void
  removeAccountFromGroup: (groupId: string, accountId: string) => void

  // Routing Rules
  setRoutingRule: (profileId: string, requestType: RequestType, groupId: string | null) => void

  // Config sync
  syncToConfig: () => Promise<void>
  getRoutingConfig: () => RoutingConfig

  // Utility
  setError: (error: string | null) => void
  reset: () => void
}

type ProfileStore = ProfileState & ProfileActions

const DEFAULT_PROFILE: Profile = {
  id: 'default',
  name: 'Default',
  color: DEFAULT_PROFILE_COLOR,
  routingRules: {
    chat: null,
    completion: null,
    embedding: null,
    other: null,
  },
  defaultProviderGroup: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [DEFAULT_PROFILE],
      providerGroups: [],
      activeProfileId: 'default',
      isLoading: false,
      error: null,
      lastSynced: null,

      createProfile: (name, color = DEFAULT_PROFILE_COLOR, icon) => {
        const existingNames = get().profiles.map(p => p.name.toLowerCase())
        if (existingNames.includes(name.toLowerCase())) {
          throw new Error('A profile with this name already exists')
        }

        const now = new Date().toISOString()
        const profile: Profile = {
          id: uuidv4(),
          name,
          color,
          icon,
          routingRules: {
            chat: null,
            completion: null,
            embedding: null,
            other: null,
          },
          defaultProviderGroup: null,
          createdAt: now,
          updatedAt: now,
        }

        set(state => ({
          profiles: [...state.profiles, profile],
        }))

        get().syncToConfig()
        return profile
      },

      updateProfile: (id, updates) => {
        if (updates.name) {
          const existingNames = get().profiles
            .filter(p => p.id !== id)
            .map(p => p.name.toLowerCase())
          if (existingNames.includes(updates.name.toLowerCase())) {
            throw new Error('A profile with this name already exists')
          }
        }

        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }))

        get().syncToConfig()
      },

      deleteProfile: (id) => {
        if (id === 'default') {
          get().setError('Cannot delete the default profile')
          return false
        }

        const state = get()
        if (!state.profiles.some(p => p.id === id)) {
          return false
        }

        set(s => ({
          profiles: s.profiles.filter(p => p.id !== id),
          activeProfileId: s.activeProfileId === id ? 'default' : s.activeProfileId,
        }))

        get().syncToConfig()
        return true
      },

      setActiveProfile: (id) => {
        if (id !== null && !get().profiles.some(p => p.id === id)) {
          return
        }

        set({ activeProfileId: id })
        get().syncToConfig()
      },

      getActiveProfile: () => {
        const state = get()
        return state.profiles.find(p => p.id === state.activeProfileId) ?? null
      },

      createProviderGroup: (name, accountIds = [], strategy = 'round-robin') => {
        const group: ProviderGroup = {
          id: uuidv4(),
          name,
          accountIds,
          selectionStrategy: strategy,
        }

        set(state => ({
          providerGroups: [...state.providerGroups, group],
        }))

        get().syncToConfig()
        return group
      },

      updateProviderGroup: (id, updates) => {
        set(state => ({
          providerGroups: state.providerGroups.map(g =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }))

        get().syncToConfig()
      },

      deleteProviderGroup: (id) => {
        const state = get()
        if (!state.providerGroups.some(g => g.id === id)) {
          return false
        }

        // Clear references in profiles
        set(s => ({
          providerGroups: s.providerGroups.filter(g => g.id !== id),
          profiles: s.profiles.map(p => {
            const updatedRules = { ...p.routingRules }
            let changed = false

            for (const key of ['chat', 'completion', 'embedding', 'other'] as const) {
              if (updatedRules[key] === id) {
                updatedRules[key] = null
                changed = true
              }
            }

            if (p.defaultProviderGroup === id) {
              changed = true
              return {
                ...p,
                routingRules: updatedRules,
                defaultProviderGroup: null,
                updatedAt: changed ? new Date().toISOString() : p.updatedAt,
              }
            }

            return changed
              ? { ...p, routingRules: updatedRules, updatedAt: new Date().toISOString() }
              : p
          }),
        }))

        get().syncToConfig()
        return true
      },

      addAccountToGroup: (groupId, accountId) => {
        set(state => ({
          providerGroups: state.providerGroups.map(g =>
            g.id === groupId && !g.accountIds.includes(accountId)
              ? { ...g, accountIds: [...g.accountIds, accountId] }
              : g
          ),
        }))

        get().syncToConfig()
      },

      removeAccountFromGroup: (groupId, accountId) => {
        set(state => ({
          providerGroups: state.providerGroups.map(g =>
            g.id === groupId
              ? { ...g, accountIds: g.accountIds.filter(id => id !== accountId) }
              : g
          ),
        }))

        get().syncToConfig()
      },

      setRoutingRule: (profileId, requestType, groupId) => {
        set(state => ({
          profiles: state.profiles.map(p =>
            p.id === profileId
              ? {
                  ...p,
                  routingRules: { ...p.routingRules, [requestType]: groupId },
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }))

        get().syncToConfig()
      },

      syncToConfig: async () => {
        if (typeof window === 'undefined' || !window.korproxy?.config) {
          return
        }

        try {
          set({ isLoading: true, error: null })
          const config = get().getRoutingConfig()
          
          // Sync to Go backend config file
          const result = await window.korproxy.config.sync(config)
          if (result.success) {
            set({ lastSynced: new Date().toISOString() })
          } else {
            set({ error: result.error || 'Failed to sync config' })
          }
          
          // Sync profile state to tray menu
          if (window.korproxy.tray) {
            await window.korproxy.tray.syncProfiles(config)
          }
        } catch (err) {
          set({ error: err instanceof Error ? err.message : 'Failed to sync config' })
        } finally {
          set({ isLoading: false })
        }
      },

      getRoutingConfig: () => {
        const state = get()
        return {
          version: 1,
          activeProfileId: state.activeProfileId,
          profiles: state.profiles,
          providerGroups: state.providerGroups,
          modelFamilies: DEFAULT_MODEL_FAMILIES,
        }
      },

      setError: (error) => set({ error }),

      reset: () => {
        set({
          profiles: [DEFAULT_PROFILE],
          providerGroups: [],
          activeProfileId: 'default',
          error: null,
          lastSynced: null,
        })
        get().syncToConfig()
      },
    }),
    {
      name: 'korproxy-profile-storage',
      partialize: (state) => ({
        profiles: state.profiles,
        providerGroups: state.providerGroups,
        activeProfileId: state.activeProfileId,
      }),
    }
  )
)

// Export type for the hook
export type { Profile, ProviderGroup, RoutingConfig }
