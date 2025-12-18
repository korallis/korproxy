import { motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'

const tools = [
  { id: 'cline', name: 'Cline', description: 'AI coding assistant for VS Code', icon: '🤖' },
  { id: 'continue', name: 'Continue.dev', description: 'Open-source AI code assistant', icon: '▶️' },
  { id: 'cursor', name: 'Cursor', description: 'AI-first code editor', icon: '⌨️' },
  { id: 'amp', name: 'Amp', description: 'AI coding assistant', icon: '⚡' },
  { id: 'factory', name: 'Factory', description: 'Autonomous coding agent', icon: '🏭' },
]

export function ToolsStep() {
  const { selectedTools, setTools, nextStep, prevStep } = useOnboardingStore()

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setTools(selectedTools.filter((t) => t !== toolId))
    } else {
      setTools([...selectedTools, toolId])
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Your Tools</h2>
        <p className="text-muted-foreground">
          Which AI coding tools would you like to use with KorProxy?
        </p>
      </div>

      <div className="grid gap-3 mb-8">
        {tools.map((tool, index) => {
          const isSelected = selectedTools.includes(tool.id)
          return (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleTool(tool.id)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                {tool.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{tool.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  isSelected
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                )}
              >
                {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
            </motion.button>
          )
        })}
      </div>

      <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
        <ExternalLink className="w-3 h-3" />
        Setup guides will be available after onboarding
      </p>

      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={prevStep}
          className={cn(
            'flex items-center gap-2 py-3 px-6 rounded-xl',
            'bg-muted text-muted-foreground',
            'font-medium',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={nextStep}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
            'bg-primary text-primary-foreground',
            'font-semibold',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}
