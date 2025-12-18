import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import * as Dialog from '@radix-ui/react-dialog'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { X, Loader2, AlertCircle, Bug, Lightbulb, MessageSquare, Check, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import type { FeedbackCategory } from '../../../electron/common/ipc-types'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORIES: { value: FeedbackCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'bug', label: 'Bug Report', icon: <Bug className="w-4 h-4" /> },
  { value: 'feature', label: 'Feature Request', icon: <Lightbulb className="w-4 h-4" /> },
  { value: 'general', label: 'General Feedback', icon: <MessageSquare className="w-4 h-4" /> },
]

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { toast } = useToast()
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [message, setMessage] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!message.trim()) {
      setError('Please enter your feedback message')
      return
    }

    if (message.length > 5000) {
      setError('Message must be 5000 characters or less')
      return
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await window.korproxy.feedback.submit({
        category,
        message: message.trim(),
        contactEmail: contactEmail.trim() || undefined,
        includeDiagnostics,
      })

      if (result.success) {
        toast('Thank you for your feedback!', 'success')
        onOpenChange(false)
        setMessage('')
        setContactEmail('')
        setCategory('general')
        setIncludeDiagnostics(true)
      } else {
        setError(result.error || 'Failed to submit feedback')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const charactersRemaining = 5000 - message.length

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-[480px] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-semibold">
                Send Feedback
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium mb-3">
                  Category
                </label>
                <RadioGroup.Root
                  value={category}
                  onValueChange={(value: string) => setCategory(value as FeedbackCategory)}
                  className="flex gap-2"
                >
                  {CATEGORIES.map((cat) => (
                    <RadioGroup.Item
                      key={cat.value}
                      value={cat.value}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        category === cat.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted hover:bg-muted/80'
                      )}
                    >
                      {cat.icon}
                      <span className="text-sm font-medium">{cat.label}</span>
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Message <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === 'bug'
                      ? 'Describe the issue you encountered...'
                      : category === 'feature'
                        ? 'Describe the feature you would like to see...'
                        : 'Share your thoughts with us...'
                  }
                  rows={5}
                  maxLength={5000}
                  required
                  className={cn(
                    'w-full px-4 py-3 rounded-lg resize-none',
                    'bg-muted border border-border',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    'placeholder:text-muted-foreground/60'
                  )}
                />
                <div className="flex justify-end mt-1">
                  <span
                    className={cn(
                      'text-xs',
                      charactersRemaining < 100
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {charactersRemaining.toLocaleString()} characters remaining
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Email <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg',
                    'bg-muted border border-border',
                    'focus:outline-none focus:ring-2 focus:ring-ring'
                  )}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll only use this to follow up on your feedback
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={includeDiagnostics}
                      onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 transition-colors flex items-center justify-center',
                        includeDiagnostics
                          ? 'bg-primary border-primary'
                          : 'bg-background border-border'
                      )}
                    >
                      {includeDiagnostics && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">Include diagnostic information</span>
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Includes app version, platform, OS, and recent error/warning logs (last 24h). 
                      Secrets and tokens are automatically redacted.
                    </p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className={cn(
                  'w-full py-2.5 rounded-lg font-medium transition-colors',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Feedback'
                )}
              </button>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
