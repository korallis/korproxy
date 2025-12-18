import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme, withTransition = false) {
  const root = document.documentElement
  
  if (withTransition) {
    root.classList.add('theme-transition')
  }
  
  root.classList.remove('dark', 'light')
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
  root.classList.add(resolvedTheme)
  
  if (withTransition) {
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 200)
  }
  
  // Sync to Electron main process if available
  if (window.korproxy?.app?.setSetting) {
    window.korproxy.app.setSetting('theme', theme).catch(() => {
      // Ignore errors - main process sync is best-effort
    })
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyTheme(theme, true) // Enable transition for user-initiated changes
        set({ theme })
      },
    }),
    {
      name: 'korproxy-theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme, false) // No transition on initial load
        }
      },
    }
  )
)

// Listen for system theme changes when in 'system' mode
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useThemeStore.getState()
    if (theme === 'system') {
      applyTheme('system')
    }
  })
}
