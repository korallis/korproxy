import { useState, useEffect } from 'react'
import { Minus, Square, X, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const platform = window.korproxy?.app?.platform ?? 'darwin'
  const isMac = platform === 'darwin'
  const isWindows = platform === 'win32'

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.korproxy?.app?.isMaximized) {
        const maximized = await window.korproxy.app.isMaximized()
        setIsMaximized(maximized)
      }
    }
    checkMaximized()

    const interval = setInterval(checkMaximized, 500)
    return () => clearInterval(interval)
  }, [])

  const handleMinimize = () => {
    window.korproxy?.app?.minimize()
  }

  const handleMaximize = async () => {
    await window.korproxy?.app?.maximize()
    const maximized = await window.korproxy?.app?.isMaximized()
    setIsMaximized(maximized ?? false)
  }

  const handleClose = () => {
    window.korproxy?.app?.close()
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center bg-background/80 backdrop-blur-sm border-b border-border/50',
        isMac ? 'h-8' : 'h-10'
      )}
    >
      <div
        className="flex-1 h-full flex items-center"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {isMac && (
          <div className="flex items-center gap-2 pl-20">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">KorProxy</span>
          </div>
        )}
        {!isMac && (
          <div className="flex items-center gap-2 pl-4">
            <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-sm font-medium">KorProxy</span>
          </div>
        )}
      </div>

      {isWindows && (
        <div
          className="flex items-center h-full"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="h-full px-4 hover:bg-secondary/80 transition-colors flex items-center justify-center"
            aria-label="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="h-full px-4 hover:bg-secondary/80 transition-colors flex items-center justify-center"
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 5v8h8V5H3zm7 7H4V6h6v6z" />
                <path d="M5 5h1V4h7v7h-1v1h2V3H5v2z" />
              </svg>
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="h-full px-4 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {platform === 'linux' && (
        <div
          className="flex items-center h-full gap-1 pr-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="w-8 h-8 rounded hover:bg-secondary/80 transition-colors flex items-center justify-center"
            aria-label="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 rounded hover:bg-secondary/80 transition-colors flex items-center justify-center"
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
