import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light' | 'system'

interface AppState {
  theme: Theme
  proxyAutoStart: boolean
  minimizeToTray: boolean
  port: number
  initialized: boolean
  setTheme: (theme: Theme) => void
  setProxyAutoStart: (autoStart: boolean) => void
  setMinimizeToTray: (minimize: boolean) => void
  setPort: (port: number) => void
  initFromMain: () => Promise<void>
  syncToMain: <K extends 'theme' | 'autoStart' | 'minimizeToTray' | 'port'>(
    key: K,
    value: K extends 'theme' ? Theme : K extends 'port' ? number : boolean
  ) => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      proxyAutoStart: true,
      minimizeToTray: true,
      port: 1337,
      initialized: false,

      setTheme: async (theme) => {
        set({ theme })
        await get().syncToMain('theme', theme)
      },

      setProxyAutoStart: async (proxyAutoStart) => {
        set({ proxyAutoStart })
        await get().syncToMain('autoStart', proxyAutoStart)
      },

      setMinimizeToTray: async (minimizeToTray) => {
        set({ minimizeToTray })
        await get().syncToMain('minimizeToTray', minimizeToTray)
      },

      setPort: async (port) => {
        set({ port })
        await get().syncToMain('port', port)
      },

      initFromMain: async () => {
        if (!window.korproxy || get().initialized) return
        try {
          const settings = await window.korproxy.app.getSettings()
          set({
            theme: settings.theme,
            proxyAutoStart: settings.autoStart,
            minimizeToTray: settings.minimizeToTray,
            port: settings.port,
            initialized: true,
          })
        } catch (error) {
          console.error('Failed to load settings from main process:', error)
        }
      },

      syncToMain: async (key, value) => {
        if (!window.korproxy) return
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await window.korproxy.app.setSetting(key, value as any)
        } catch (error) {
          console.error(`Failed to sync setting ${key}:`, error)
        }
      },
    }),
    {
      name: 'korproxy-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        proxyAutoStart: state.proxyAutoStart,
        minimizeToTray: state.minimizeToTray,
        port: state.port,
      }),
    }
  )
)
