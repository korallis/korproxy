import { motion } from 'motion/react'
import { Search, FileText, BookOpen, Users, Share2, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import type { AcquisitionSource } from '@/types/electron'

const sourceOptions: { value: AcquisitionSource; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'search_engine', label: 'Search engine', icon: Search },
  { value: 'blog_post', label: 'Blog post', icon: FileText },
  { value: 'setup_guide', label: 'Setup guide', icon: BookOpen },
  { value: 'friend_colleague', label: 'Friend/colleague', icon: Users },
  { value: 'social_media', label: 'Social media', icon: Share2 },
  { value: 'other', label: 'Other', icon: HelpCircle },
]

export function AcquisitionStep() {
  const { acquisitionSource, setAcquisitionSource, nextStep, prevStep } = useOnboardingStore()

  const handleSelect = (value: AcquisitionSource) => {
    setAcquisitionSource(value)
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-bold mb-2">How did you hear about us?</h2>
        <p className="text-muted-foreground">
          Help us understand how you found KorProxy
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {sourceOptions.map((option, index) => {
          const Icon = option.icon
          const isSelected = acquisitionSource === option.value
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl text-left',
                'border-2 transition-all',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                isSelected ? 'bg-primary/20' : 'bg-muted'
              )}>
                <Icon className={cn(
                  'w-5 h-5',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'font-medium',
                isSelected ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {option.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        <button
          onClick={prevStep}
          className={cn(
            'flex-1 py-3 px-6 rounded-xl',
            'bg-muted text-muted-foreground',
            'font-semibold',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          Back
        </button>
        <button
          onClick={nextStep}
          className={cn(
            'flex-1 py-3 px-6 rounded-xl',
            'bg-primary text-primary-foreground',
            'font-semibold',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          Continue
        </button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground mt-4"
      >
        This is optional and helps us improve our product
      </motion.p>
    </div>
  )
}
