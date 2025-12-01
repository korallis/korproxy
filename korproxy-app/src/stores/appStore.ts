import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface AppState {
  theme: Theme
  proxyAutoStart: boolean
  minimizeToTray: boolean
  port: number
  setTheme: (theme: Theme) => void
  setProxyAutoStart: (autoStart: boolean) => void
  setMinimizeToTray: (minimize: boolean) => void
  setPort: (port: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      proxyAutoStart: true,
      minimizeToTray: true,
      port: 1337,

      setTheme: (theme) => set({ theme }),
      setProxyAutoStart: (proxyAutoStart) => set({ proxyAutoStart }),
      setMinimizeToTray: (minimizeToTray) => set({ minimizeToTray }),
      setPort: (port) => set({ port }),
    }),
    {
      name: 'korproxy-app-storage',
    }
  )
)
