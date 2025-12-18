import { motion, AnimatePresence } from 'motion/react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useThemeStore } from '../../stores/themeStore'

interface ThemeToggleProps {
  showSystemOption?: boolean
  className?: string
}

export function ThemeToggle({ showSystemOption = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useThemeStore()

  const options = showSystemOption
    ? (['light', 'dark', 'system'] as const)
    : (['light', 'dark'] as const)

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg bg-muted',
        className
      )}
    >
      {options.map((option) => {
        const isActive = theme === option
        const Icon = option === 'light' ? Sun : option === 'dark' ? Moon : Monitor

        return (
          <motion.button
            key={option}
            onClick={() => setTheme(option)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative p-2 rounded-md transition-colors',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.div
                  layoutId="theme-toggle-bg"
                  className="absolute inset-0 rounded-md bg-primary"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </AnimatePresence>
            <motion.div
              className="relative z-10"
              initial={false}
              animate={{
                rotate: isActive ? 0 : -15,
                scale: isActive ? 1 : 0.9,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
            >
              <Icon className="w-4 h-4" />
            </motion.div>
          </motion.button>
        )
      })}
    </div>
  )
}

export function ThemeToggleCompact({ className }: { className?: string }) {
  const { theme, setTheme } = useThemeStore()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const isDark = theme === 'dark' || (theme === 'system' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors overflow-hidden',
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'moon' : 'sun'}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-foreground" />
          ) : (
            <Sun className="w-5 h-5 text-foreground" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  )
}
