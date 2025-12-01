import { useEffect, useRef } from 'react'
import { useSpring, useMotionValue, motion, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num))
}

export function AnimatedCounter({
  value,
  duration = 1,
  className,
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  })
  const displayValue = useTransform(springValue, (v) => formatNumber(v))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = latest
      }
    })
    return unsubscribe
  }, [displayValue])

  return (
    <motion.span
      ref={ref}
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {formatNumber(0)}
    </motion.span>
  )
}
