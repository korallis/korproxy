import { useEffect, useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Activity, BarChart3 } from 'lucide-react'
import { useProxyStatus } from '../../hooks/useProxyStatus'
import type { ProxyStats } from '../../../electron/common/ipc-types'

export function UsageChart() {
  const { isRunning } = useProxyStatus()
  const [stats, setStats] = useState<ProxyStats | null>(null)
  const currentHour = new Date().getHours()

  const effectiveStats = useMemo(() => (isRunning ? stats : null), [isRunning, stats])

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const fetchStats = async () => {
      const data = await window.korproxy.proxy.getStats()
      setStats(data)
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [isRunning])

  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hourKey = i.toString().padStart(2, '0')
    return effectiveStats?.requestsByHour?.[hourKey] || 0
  })

  const maxValue = Math.max(...hourlyData, 1)
  const totalRequests = effectiveStats?.totalRequests || 0

  if (!isRunning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Request Activity</h3>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>
          </div>
        </div>
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          Start the proxy to see request metrics
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card p-5 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Request Activity</h3>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{totalRequests}</p>
          <p className="text-xs text-muted-foreground">total requests</p>
        </div>
      </div>

      <div className="relative h-32">
        <svg
          viewBox="0 0 480 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {hourlyData.map((value, index) => {
            const barWidth = 16
            const gap = 4
            const x = index * (barWidth + gap)
            const height = (value / maxValue) * 80
            const y = 95 - height
            const isCurrentHour = index === currentHour

            return (
              <motion.rect
                key={index}
                x={x}
                width={barWidth}
                rx={3}
                ry={3}
                fill={isCurrentHour ? 'url(#barGradientHover)' : 'url(#barGradient)'}
                initial={{ y: 95, height: 0 }}
                animate={{ y, height: Math.max(height, 2) }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: index * 0.02,
                }}
                style={{
                  filter: isCurrentHour ? 'drop-shadow(0 0 4px var(--primary))' : undefined,
                }}
              />
            )
          })}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-muted-foreground pt-1">
          <span>00:00</span>
          <span>12:00</span>
          <span>Now</span>
        </div>
      </div>
    </motion.div>
  )
}
