import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import { AppShell } from './components/layout/AppShell'
import { ToastContainer } from './components/shared/Toast'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { TooltipProvider } from './components/ui/tooltip'
import { OnboardingWizard } from './components/onboarding/OnboardingWizard'
import { useAppStore } from './stores/appStore'
import { useOnboardingStore } from './stores/onboardingStore'
import { useDeepLinkAttribution } from './hooks/useDeepLinkAttribution'
import Dashboard from './pages/Dashboard'
import Providers from './pages/Providers'
import Accounts from './pages/Accounts'
import Analytics from './pages/Analytics'
import Logs from './pages/Logs'
import Settings from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  return <div className={theme}>{children}</div>
}

export default function App() {
  const { completed } = useOnboardingStore()
  useDeepLinkAttribution()

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <HashRouter>
            <ErrorBoundary>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/providers" element={<Providers />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Routes>
            </ErrorBoundary>
          </HashRouter>
          <ToastContainer />
          <AnimatePresence>
            {!completed && <OnboardingWizard />}
          </AnimatePresence>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
