import { motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import type { Provider } from '@/types/electron'

const providers: { id: Provider; name: string; color: string; description: string }[] = [
  { id: 'gemini', name: 'Google Gemini', color: 'from-blue-500 to-cyan-500', description: 'Google AI Studio subscription' },
  { id: 'claude', name: 'Anthropic Claude', color: 'from-orange-500 to-amber-500', description: 'Claude Pro subscription' },
  { id: 'codex', name: 'OpenAI Codex', color: 'from-emerald-500 to-green-500', description: 'ChatGPT Plus subscription' },
  { id: 'qwen', name: 'Qwen', color: 'from-purple-500 to-violet-500', description: 'Alibaba Qwen API' },
  { id: 'iflow', name: 'iFlow', color: 'from-pink-500 to-rose-500', description: 'iFlow AI subscription' },
]

export function ProvidersStep() {
  const { selectedProviders, setProviders, nextStep, prevStep } = useOnboardingStore()

  const toggleProvider = (providerId: Provider) => {
    if (selectedProviders.includes(providerId)) {
      setProviders(selectedProviders.filter((p) => p !== providerId))
    } else {
      setProviders([...selectedProviders, providerId])
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Your AI Providers</h2>
        <p className="text-muted-foreground">
          Choose which AI services you have subscriptions for
        </p>
      </div>

      <div className="grid gap-3 mb-8">
        {providers.map((provider, index) => {
          const isSelected = selectedProviders.includes(provider.id)
          return (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleProvider(provider.id)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold',
                  provider.color
                )}
              >
                {provider.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{provider.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {provider.description}
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
          disabled={selectedProviders.length === 0}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
            'bg-primary text-primary-foreground',
            'font-semibold',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}
