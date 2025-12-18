import { motion } from 'motion/react'
import type { ReactNode } from 'react'

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0, 
    transition: { duration: 0.3, ease: 'easeOut' as const } 
  },
  exit: { 
    opacity: 0, 
    x: -20, 
    transition: { duration: 0.2, ease: 'easeIn' as const } 
  },
}

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}
