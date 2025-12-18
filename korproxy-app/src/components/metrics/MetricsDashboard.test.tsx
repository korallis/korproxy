import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MetricsDashboard } from './MetricsDashboard'
import type { MetricsDashboardResponse } from '../../../electron/common/ipc-types'

const mockMetricsData: MetricsDashboardResponse = {
  summary: {
    totalRequests: 1000,
    totalFailures: 50,
    avgLatencyMs: 250,
    successRate: 95,
  },
  byProvider: [
    {
      provider: 'claude',
      requests: 500,
      failures: 20,
      errorRate: 4,
      p50Ms: 200,
      p90Ms: 400,
      p99Ms: 800,
    },
    {
      provider: 'codex',
      requests: 300,
      failures: 20,
      errorRate: 6.67,
      p50Ms: 250,
      p90Ms: 500,
      p99Ms: 1000,
    },
    {
      provider: 'gemini',
      requests: 200,
      failures: 10,
      errorRate: 5,
      p50Ms: 180,
      p90Ms: 350,
      p99Ms: 600,
    },
  ],
  timeRange: '7d',
}

const emptyMetricsData: MetricsDashboardResponse = {
  summary: {
    totalRequests: 0,
    totalFailures: 0,
    avgLatencyMs: 0,
    successRate: 0,
  },
  byProvider: [],
  timeRange: '7d',
}

describe('MetricsDashboard', () => {
  let mockGetMetricsSummary: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockGetMetricsSummary = vi.fn().mockResolvedValue(mockMetricsData)

    Object.defineProperty(window, 'korproxy', {
      value: {
        ...window.korproxy,
        metrics: {
          getSummary: mockGetMetricsSummary,
        },
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders requests per provider chart', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Requests by Provider')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getAllByText('Claude').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Codex').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Gemini').length).toBeGreaterThan(0)
    })
  })

  it('renders error rates by provider', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Error Rates')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('4.00%')).toBeInTheDocument()
    })
  })

  it('renders P50/P90/P99 latency display', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Latency Percentiles')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('P50')).toBeInTheDocument()
      expect(screen.getByText('P90')).toBeInTheDocument()
      expect(screen.getByText('P99')).toBeInTheDocument()
    })
  })

  it('time range selector works (1d, 7d)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument()
    })

    const oneDayButton = screen.getByRole('button', { name: '24 Hours' })
    await user.click(oneDayButton)

    await waitFor(() => {
      expect(mockGetMetricsSummary).toHaveBeenCalledWith('1d')
    })

    const sevenDayButton = screen.getByRole('button', { name: '7 Days' })
    await user.click(sevenDayButton)

    await waitFor(() => {
      expect(mockGetMetricsSummary).toHaveBeenCalledWith('7d')
    })
  })

  it('handles empty metrics gracefully', async () => {
    mockGetMetricsSummary.mockResolvedValue(emptyMetricsData)

    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  it('displays summary statistics', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument()
      expect(screen.getByText('Total Requests')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('95.0%')).toBeInTheDocument()
      expect(screen.getByText('Success Rate')).toBeInTheDocument()
    })
  })

  it('auto-refreshes every 30 seconds', async () => {
    render(<MetricsDashboard />)

    await waitFor(() => {
      expect(mockGetMetricsSummary).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      vi.advanceTimersByTime(30000)
    })

    await waitFor(() => {
      expect(mockGetMetricsSummary).toHaveBeenCalledTimes(2)
    })
  })

  it('shows loading state initially', async () => {
    mockGetMetricsSummary.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockMetricsData), 100))
    )

    render(<MetricsDashboard />)

    expect(screen.getByText('Loading metrics...')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    await waitFor(() => {
      expect(screen.queryByText('Loading metrics...')).not.toBeInTheDocument()
    })
  })
})
