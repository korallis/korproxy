import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubscriptionBadge } from '../../components/auth/SubscriptionBadge'

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, ...props }: React.ComponentProps<'div'>) => (
      <div className={className} {...props}>{children}</div>
    ),
  },
}))

describe('SubscriptionBadge', () => {
  it('renders active status', () => {
    render(<SubscriptionBadge status="active" />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders trial status', () => {
    render(<SubscriptionBadge status="trial" />)

    expect(screen.getByText('Trial')).toBeInTheDocument()
  })

  it('renders expired status', () => {
    render(<SubscriptionBadge status="expired" />)

    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('renders no_subscription status', () => {
    render(<SubscriptionBadge status="no_subscription" />)

    expect(screen.getByText('No Subscription')).toBeInTheDocument()
  })

  it('renders past_due status', () => {
    render(<SubscriptionBadge status="past_due" />)

    expect(screen.getByText('Past Due')).toBeInTheDocument()
  })

  it('renders lifetime status', () => {
    render(<SubscriptionBadge status="lifetime" />)

    expect(screen.getByText('Lifetime')).toBeInTheDocument()
  })

  it('renders canceled status', () => {
    render(<SubscriptionBadge status="canceled" />)

    expect(screen.getByText('Canceled')).toBeInTheDocument()
  })

  it('shows days left for trial status', () => {
    render(<SubscriptionBadge status="trial" daysLeft={7} />)

    expect(screen.getByText('Trial')).toBeInTheDocument()
    expect(screen.getByText('(7d left)')).toBeInTheDocument()
  })

  it('shows days left for canceled status', () => {
    render(<SubscriptionBadge status="canceled" daysLeft={14} />)

    expect(screen.getByText('Canceled')).toBeInTheDocument()
    expect(screen.getByText('(14d left)')).toBeInTheDocument()
  })

  it('does not show days left for active status', () => {
    render(<SubscriptionBadge status="active" daysLeft={30} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.queryByText(/\d+d left/)).not.toBeInTheDocument()
  })

  it('does not show days left when daysLeft is 0', () => {
    render(<SubscriptionBadge status="trial" daysLeft={0} />)

    expect(screen.getByText('Trial')).toBeInTheDocument()
    expect(screen.queryByText(/\d+d left/)).not.toBeInTheDocument()
  })

  it('does not show days left when daysLeft is undefined', () => {
    render(<SubscriptionBadge status="trial" />)

    expect(screen.getByText('Trial')).toBeInTheDocument()
    expect(screen.queryByText(/\d+d left/)).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<SubscriptionBadge status="active" className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
