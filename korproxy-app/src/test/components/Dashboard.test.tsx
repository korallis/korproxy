import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from '../../pages/Dashboard'
import { mockKorproxyAPI } from '../setup'
import { useAuthStore } from '../../stores/authStore'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <HashRouter>{children}</HashRouter>
    </QueryClientProvider>
  )
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockKorproxyAPI.proxy.status.mockResolvedValue({ running: false, port: 1337 })
    mockKorproxyAPI.proxy.getStatus.mockResolvedValue({ running: false, port: 1337 })
    mockKorproxyAPI.auth.listAccounts.mockResolvedValue([])
    useAuthStore.setState({
      user: null,
      token: null,
      subscriptionInfo: null,
      isLoading: false,
      error: null,
    })
  })

  it('renders the dashboard title', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('displays proxy status section', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Proxy Status')).toBeInTheDocument()
  })

  it('shows start button when proxy is stopped', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
    })
  })

  it('shows stop button when proxy is running', async () => {
    mockKorproxyAPI.proxy.status.mockResolvedValue({ running: true, port: 1337 })
    mockKorproxyAPI.proxy.getStatus.mockResolvedValue({ running: true, port: 1337 })

    render(<Dashboard />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    })
  })

  it('calls start when start button is clicked with active subscription', async () => {
    useAuthStore.setState({
      user: { id: '1', email: 'test@test.com', role: 'user', subscriptionStatus: 'active' },
      token: 'test-token',
      subscriptionInfo: { status: 'active', isActive: true },
      isLoading: false,
      error: null,
    })
    
    const user = userEvent.setup()

    render(<Dashboard />, { wrapper: createWrapper() })

    const startButton = await screen.findByRole('button', { name: /start/i })
    await user.click(startButton)

    expect(mockKorproxyAPI.proxy.start).toHaveBeenCalled()
  })

  it('opens auth modal when start clicked without login', async () => {
    const user = userEvent.setup()

    render(<Dashboard />, { wrapper: createWrapper() })

    const startButton = await screen.findByRole('button', { name: /start/i })
    await user.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    })
  })

  it('displays provider summary section', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Provider Summary')).toBeInTheDocument()
  })

  it('displays quick connect section', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })

    expect(screen.getByText('Quick Connect')).toBeInTheDocument()
  })

  it('shows provider names', async () => {
    render(<Dashboard />, { wrapper: createWrapper() })

    expect(screen.getAllByText('Gemini').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Claude').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Codex').length).toBeGreaterThan(0)
  })
})
