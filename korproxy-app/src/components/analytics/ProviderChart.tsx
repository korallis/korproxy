import { motion } from 'motion/react'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { ProviderMetrics } from '../../../electron/common/ipc-types'

const PROVIDER_COLORS: Record<string, string> = {
  claude: '#F97316',
  codex: '#10B981',
  gemini: '#3B82F6',
  qwen: '#8B5CF6',
  iflow: '#EC4899',
}

interface ProviderChartProps {
  data: Record<string, ProviderMetrics> | undefined
  isLoading?: boolean
}

export function ProviderChart({ data, isLoading }: ProviderChartProps) {
  const chartData = data
    ? Object.entries(data).map(([provider, metrics]) => ({
        name: provider.charAt(0).toUpperCase() + provider.slice(1),
        key: provider,
        requests: metrics.requests,
        failures: metrics.failures,
        p50: metrics.p50Ms,
        p90: metrics.p90Ms,
      }))
    : []

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Requests by Provider</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <BarChart3 className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold">Requests by Provider</h3>
          <p className="text-xs text-muted-foreground">Total requests per AI provider</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                formatter={(value, name) => {
                  if (name === 'requests') return [Number(value).toLocaleString(), 'Requests']
                  if (name === 'failures') return [Number(value).toLocaleString(), 'Failures']
                  return [String(value), name]
                }}
              />
              <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={PROVIDER_COLORS[entry.key] || 'hsl(var(--primary))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
