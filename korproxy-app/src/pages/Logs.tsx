import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Trash2, ArrowDown } from 'lucide-react'
import * as ScrollArea from '@radix-ui/react-scroll-area'
import * as Tabs from '@radix-ui/react-tabs'
import { useProxy } from '../hooks/useProxy'
import { cn } from '../lib/utils'
import type { ProxyLog } from '../types/electron'

type FilterType = 'all' | 'info' | 'error'

function LogLevelBadge({ level }: { level: ProxyLog['level'] }) {
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide',
        level === 'info' && 'bg-blue-500/10 text-blue-500',
        level === 'warn' && 'bg-yellow-500/10 text-yellow-500',
        level === 'error' && 'bg-red-500/10 text-red-500',
        level === 'debug' && 'bg-gray-500/10 text-gray-500'
      )}
    >
      {level}
    </span>
  )
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function Logs() {
  const { logs, clearLogs } = useProxy()
  const [filter, setFilter] = useState<FilterType>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true
    if (filter === 'error') return log.level === 'error' || log.level === 'warn'
    return log.level === 'info'
  })

  useEffect(() => {
    if (autoScroll && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [filteredLogs, autoScroll])

  const handleScroll = () => {
    if (!viewportRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
    setAutoScroll(isAtBottom)
  }

  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
      setAutoScroll(true)
    }
  }

  return (
    <div className="p-6 pt-12 h-full flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h1 className="text-2xl font-bold mb-1">Logs</h1>
          <p className="text-muted-foreground text-sm">
            {logs.length} log entries
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearLogs}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear Logs
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden min-h-0"
      >
        <Tabs.Root
          value={filter}
          onValueChange={(v) => setFilter(v as FilterType)}
        >
          <div className="px-4 py-2 border-b border-border bg-muted/30">
            <Tabs.List className="flex gap-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'info', label: 'Info' },
                { value: 'error', label: 'Errors' },
              ].map((tab) => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                    'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
                  )}
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </div>
        </Tabs.Root>

        <div className="flex-1 relative min-h-0">
          <ScrollArea.Root className="h-full">
            <ScrollArea.Viewport
              ref={viewportRef}
              onScroll={handleScroll}
              className="h-full w-full"
            >
              <div ref={scrollRef} className="p-4 font-mono text-sm">
                {filteredLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    No logs to display
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredLogs.map((log, index) => (
                      <div
                        key={`${log.timestamp}-${index}`}
                        className="flex items-start gap-3 py-1 px-2 rounded hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-muted-foreground text-xs shrink-0 tabular-nums">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <LogLevelBadge level={log.level} />
                        <span
                          className={cn(
                            'flex-1 break-all',
                            log.level === 'error' && 'text-red-400',
                            log.level === 'warn' && 'text-yellow-400'
                          )}
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              orientation="vertical"
              className="flex select-none touch-none p-0.5 bg-transparent transition-colors w-2.5"
            >
              <ScrollArea.Thumb className="flex-1 bg-border rounded-full relative" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          {!autoScroll && filteredLogs.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-6 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
