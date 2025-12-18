import { motion } from 'motion/react'
import { PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { RequestType, TypeMetrics } from '../../../electron/common/ipc-types'

const TYPE_COLORS: Record<RequestType, string> = {
  chat: '#3B82F6',
  completion: '#10B981',
  embedding: '#F97316',
  other: '#8B5CF6',
}

const TYPE_LABELS: Record<RequestType, string> = {
  chat: 'Chat',
  completion: 'Completion',
  embedding: 'Embedding',
  other: 'Other',
}

interface RequestTypeChartProps {
  data: Record<RequestType, TypeMetrics> | undefined
  isLoading?: boolean
}

export function RequestTypeChart({ data, isLoading }: RequestTypeChartProps) {
  const chartData = data
    ? Object.entries(data)
        .filter(([, metrics]) => metrics.requests > 0)
        .map(([type, metrics]) => ({
          name: TYPE_LABELS[type as RequestType] || type,
          key: type,
          value: metrics.requests,
          failures: metrics.failures,
        }))
    : []

  const totalRequests = chartData.reduce((sum, item) => sum + item.value, 0)

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-muted">
            <PieChartIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Requests by Type</h3>
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
        <div className="p-2 rounded-lg bg-purple-500/10">
          <PieChartIcon className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">Requests by Type</h3>
          <p className="text-xs text-muted-foreground">Distribution of request types</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={TYPE_COLORS[entry.key as RequestType] || 'hsl(var(--primary))'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value) => [
                  `${Number(value).toLocaleString()} (${((Number(value) / totalRequests) * 100).toFixed(1)}%)`,
                  'Requests',
                ]}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{ paddingLeft: '20px' }}
                formatter={(value: string) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  )
}
